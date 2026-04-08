(() => {
  const els = {
    startCameraBtn: document.getElementById('startCameraBtn'),
    enableAudioBtn: document.getElementById('enableAudioBtn'),
    joinRoomBtn: document.getElementById('joinRoomBtn'),
    copyRoomBtn: document.getElementById('copyRoomBtn'),
    roomIdInput: document.getElementById('roomIdInput'),
    playerNameInput: document.getElementById('playerNameInput'),
    sideSelect: document.getElementById('sideSelect'),
    roomStatus: document.getElementById('roomStatus'),
    syncStatus: document.getElementById('syncStatus'),
    modeBadge: document.getElementById('modeBadge'),
    localBadge: document.getElementById('localBadge'),
    remoteBadge: document.getElementById('remoteBadge'),
    video: document.getElementById('video'),
    remoteVideo: document.getElementById('remoteVideo'),
    remoteOverlay: document.getElementById('remoteOverlay'),
    videoEmpty: document.getElementById('videoEmpty'),
    remoteEmpty: document.getElementById('remoteEmpty'),
    cameraSelect: document.getElementById('cameraSelect'),
    cardSearchInput: document.getElementById('cardSearchInput'),
    searchBtn: document.getElementById('searchBtn'),
    searchResults: document.getElementById('searchResults'),
    cardDetails: document.getElementById('cardDetails'),
    scanPreview: document.getElementById('scanPreview'),
    selfLpInput: document.getElementById('selfLpInput'),
    opponentLpInput: document.getElementById('opponentLpInput'),
    phaseSelect: document.getElementById('phaseSelect'),
    roster: document.getElementById('roster'),
    resultTemplate: document.getElementById('resultTemplate'),
    remoteShell: document.getElementById('remoteShell')
  };

  const state = {
    config: {
      publicBaseUrl: '',
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      hasTurn: false
    },
    socket: null,
    socketOpen: false,
    joined: false,
    roomId: '',
    playerId: `Player-${Math.floor(Math.random() * 100000)}`,
    playerName: '',
    side: 'self',
    localStream: null,
    remoteStream: null,
    peerConnection: null,
    peerTargetId: null,
    roster: [],
    latestResults: [],
    sharedState: {
      match: {
        selfLp: 8000,
        opponentLp: 8000,
        phase: 'Draw Phase'
      }
    },
    scanning: false
  };

  async function init() {
    bindEvents();
    hydrateFromUrl();
    await loadConfig();
    await loadCameras();
    updateBadges();
    updateRoster([]);
    renderResults([]);
    renderSelectedCard(null);
    resizeRemoteOverlay();
    window.addEventListener('resize', resizeRemoteOverlay);
  }

  function bindEvents() {
    els.startCameraBtn.addEventListener('click', startCamera);
    els.enableAudioBtn.addEventListener('click', enableOpponentAudio);
    els.joinRoomBtn.addEventListener('click', joinRoom);
    els.copyRoomBtn.addEventListener('click', copyRoomLink);
    els.searchBtn.addEventListener('click', onManualSearch);
    els.cardSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') onManualSearch();
    });

    els.cameraSelect.addEventListener('change', async () => {
      if (state.localStream) {
        await startCamera();
      }
    });

    els.sideSelect.addEventListener('change', () => {
      state.side = els.sideSelect.value;
      updateBadges();
    });

    els.selfLpInput.addEventListener('change', syncMatchTools);
    els.opponentLpInput.addEventListener('change', syncMatchTools);
    els.phaseSelect.addEventListener('change', syncMatchTools);

    document.querySelectorAll('[data-lp-target]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.lpTarget;
        const delta = Number(btn.dataset.lpDelta || 0);
        const input = target === 'self' ? els.selfLpInput : els.opponentLpInput;
        input.value = String(Number(input.value || 0) + delta);
        syncMatchTools();
      });
    });

    els.remoteVideo.addEventListener('loadedmetadata', () => {
      resizeRemoteOverlay();
    });

    els.remoteVideo.addEventListener('click', onRemoteVideoClick);
  }

  function hydrateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    const name = params.get('name');
    const side = params.get('side');

    if (room) els.roomIdInput.value = room;
    if (name) els.playerNameInput.value = name;
    if (side === 'self' || side === 'opponent') {
      els.sideSelect.value = side;
      state.side = side;
    }
  }

  async function loadConfig() {
    try {
      const res = await fetch('/config');
      if (!res.ok) throw new Error('Config request failed');
      const data = await res.json();
      if (data && Array.isArray(data.iceServers)) {
        state.config = data;
      }
    } catch (err) {
      console.warn('Falling back to default config:', err);
    }
  }

  async function loadCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(d => d.kind === 'videoinput');
      els.cameraSelect.innerHTML = '';

      cameras.forEach((camera, index) => {
        const option = document.createElement('option');
        option.value = camera.deviceId;
        option.textContent = camera.label || `Camera ${index + 1}`;
        els.cameraSelect.appendChild(option);
      });
    } catch (err) {
      console.warn('Could not enumerate cameras:', err);
    }
  }

  async function startCamera() {
    try {
      setSyncStatus('Starting camera...');
      const deviceId = els.cameraSelect.value;

      if (state.localStream) {
        state.localStream.getTracks().forEach(track => track.stop());
        state.localStream = null;
      }

      state.localStream = await navigator.mediaDevices.getUserMedia({
        video: deviceId
          ? {
              deviceId: { exact: deviceId },
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            }
          : {
              facingMode: 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
        audio: true
      });

      els.video.srcObject = state.localStream;
      els.videoEmpty.style.display = 'none';
      setRoomStatus(state.joined ? `Connected to room: ${state.roomId}` : 'Camera live.');
      setSyncStatus('Camera live.');

      await loadCameras();

      if (state.joined) {
        await renegotiatePeer(true);
      }
    } catch (err) {
      console.error(err);
      setSyncStatus('Camera error.');
      alert('Could not start camera/mic. Check browser permissions.');
    }
  }

  function enableOpponentAudio() {
    els.remoteVideo.muted = false;
    els.remoteVideo.volume = 1;
    els.remoteVideo.play().catch(() => {});
    els.enableAudioBtn.textContent = 'Opponent Audio Enabled';
    els.enableAudioBtn.disabled = true;
  }

  function updateBadges() {
    els.localBadge.textContent = `Local side: ${state.side === 'self' ? 'Self' : 'Opponent'}`;
  }

  function setRoomStatus(text) {
    els.roomStatus.textContent = text;
  }

  function setSyncStatus(text) {
    els.syncStatus.textContent = text;
  }

  function setMode(text) {
    els.modeBadge.textContent = text;
  }

  function getSocketUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }

  function ensureSocket() {
    return new Promise((resolve, reject) => {
      if (state.socket && state.socket.readyState === WebSocket.OPEN) {
        state.socketOpen = true;
        resolve();
        return;
      }

      state.socket = new WebSocket(getSocketUrl());

      state.socket.addEventListener('open', () => {
        state.socketOpen = true;
        setSyncStatus('Connected.');
        resolve();
      }, { once: true });

      state.socket.addEventListener('error', (err) => {
        console.error('Socket error:', err);
        state.socketOpen = false;
        setSyncStatus('Connection failed.');
        reject(new Error('Socket connection failed'));
      }, { once: true });

      state.socket.addEventListener('close', () => {
        state.socketOpen = false;
        state.joined = false;
        setRoomStatus('Socket disconnected.');
      });

      state.socket.addEventListener('message', onSocketMessage);
    });
  }

  async function joinRoom() {
    const roomId = els.roomIdInput.value.trim();
    const playerName = (els.playerNameInput.value.trim() || state.playerId).slice(0, 40);
    const side = els.sideSelect.value;

    if (!roomId) {
      alert('Enter a room ID first.');
      return;
    }

    try {
      setSyncStatus('Connecting...');
      await ensureSocket();

      state.roomId = roomId;
      state.playerName = playerName;
      state.side = side;
      updateBadges();

      sendSocket({
        type: 'join-room',
        roomId,
        playerId: state.playerId,
        name: playerName,
        side
      });

      const url = new URL(window.location.href);
      url.searchParams.set('room', roomId);
      url.searchParams.set('name', playerName);
      url.searchParams.set('side', side);
      window.history.replaceState({}, '', url.toString());

      setSyncStatus('Joining room...');
    } catch (err) {
      console.error(err);
      setSyncStatus('Connection failed.');
      alert('Could not connect to the room server.');
    }
  }

  function copyRoomLink() {
    const roomId = els.roomIdInput.value.trim();
    if (!roomId) {
      alert('Enter a room ID first.');
      return;
    }

    const base = state.config.publicBaseUrl || window.location.origin;
    const url = new URL(base);
    url.searchParams.set('room', roomId);
    url.searchParams.set('side', state.side);

    navigator.clipboard.writeText(url.toString())
      .then(() => {
        setSyncStatus('Room link copied.');
      })
      .catch(() => {
        setSyncStatus('Could not copy link.');
      });
  }

  function sendSocket(payload) {
    if (!state.socket || state.socket.readyState !== WebSocket.OPEN) return;
    state.socket.send(JSON.stringify(payload));
  }

  async function onSocketMessage(event) {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch (err) {
      console.warn('Bad socket message:', err);
      return;
    }

    switch (message.type) {
      case 'room-joined':
        state.joined = true;
        state.roomId = message.roomId;
        state.sharedState = message.sharedState || state.sharedState;
        setRoomStatus(`Connected to room: ${message.roomId}`);
        setSyncStatus('Joined room.');
        applySharedState(state.sharedState);
        updateRoster(message.roster || []);
        await attachToExistingPeer(message.roster || []);
        break;

      case 'room-roster':
        updateRoster(message.roster || []);
        break;

      case 'peer-joined':
        updatePeerBadge(message.playerId);
        await attachToKnownPeer(message.playerId, true);
        break;

      case 'peer-left':
        if (message.playerId === state.peerTargetId) {
          state.peerTargetId = null;
          els.remoteVideo.srcObject = null;
          els.remoteEmpty.style.display = 'flex';
          els.remoteBadge.textContent = 'Peer left room';
          els.enableAudioBtn.disabled = true;
          closePeerConnection();
        }
        break;

      case 'state-update':
        if (message.state) {
          state.sharedState = message.state;
          applySharedState(message.state);
        }
        break;

      case 'signal':
        await handleSignalMessage(message);
        break;

      case 'error':
        console.error(message.message);
        setSyncStatus(`Error: ${message.message}`);
        break;

      default:
        break;
    }
  }

  function updateRoster(roster) {
    state.roster = roster;
    if (!Array.isArray(roster) || roster.length === 0) {
      els.roster.textContent = 'Players: none';
      return;
    }

    const text = roster
      .map(player => `${player.name} (${player.side === 'self' ? 'Self' : 'Opponent'})`)
      .join(', ');

    els.roster.textContent = `Players: ${text}`;
  }

  function updatePeerBadge(playerId) {
    els.remoteBadge.textContent = playerId ? `Connected target: ${playerId}` : 'Waiting for peer';
  }

  async function attachToExistingPeer(roster) {
    const peer = (roster || []).find(p => p.playerId !== state.playerId);
    if (!peer) {
      updatePeerBadge(null);
      return;
    }
    await attachToKnownPeer(peer.playerId, true);
  }

  async function attachToKnownPeer(peerId, shouldOffer) {
    if (!peerId) return;
    state.peerTargetId = peerId;
    updatePeerBadge(peerId);
    await ensurePeerConnection();

    if (shouldOffer) {
      await makeOffer();
    }
  }

  async function ensurePeerConnection() {
    if (state.peerConnection) return state.peerConnection;

    const pc = new RTCPeerConnection({
      iceServers: state.config.iceServers
    });

    pc.onicecandidate = (event) => {
      if (!event.candidate || !state.peerTargetId) return;
      sendSocket({
        type: 'signal',
        targetPlayerId: state.peerTargetId,
        signal: {
          candidate: event.candidate
        }
      });
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (!stream) return;

      state.remoteStream = stream;
      els.remoteVideo.srcObject = stream;
      els.remoteVideo.muted = true;
      els.remoteVideo.play().catch(() => {});
      els.remoteEmpty.style.display = 'none';
      els.enableAudioBtn.disabled = false;
      els.remoteBadge.textContent = state.peerTargetId
        ? `Connected target: ${state.peerTargetId}`
        : 'Peer connected';
      resizeRemoteOverlay();
    };

    pc.onconnectionstatechange = () => {
      const status = pc.connectionState || 'unknown';
      if (status === 'connected') {
        setSyncStatus('Peer connected.');
      } else if (status === 'connecting') {
        setSyncStatus('Connecting peer...');
      } else if (status === 'failed') {
        setSyncStatus('Peer connection failed.');
      }
    };

    if (state.localStream) {
      state.localStream.getTracks().forEach(track => {
        pc.addTrack(track, state.localStream);
      });
    }

    state.peerConnection = pc;
    return pc;
  }

  async function renegotiatePeer(shouldOffer) {
    if (!state.joined || !state.peerTargetId) return;
    closePeerConnection();
    await ensurePeerConnection();
    if (shouldOffer) {
      await makeOffer();
    }
  }

  async function makeOffer() {
    try {
      const pc = await ensurePeerConnection();
      if (!state.peerTargetId) return;

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      await pc.setLocalDescription(offer);

      sendSocket({
        type: 'signal',
        targetPlayerId: state.peerTargetId,
        signal: {
          description: pc.localDescription
        }
      });
    } catch (err) {
      console.error('Offer failed:', err);
    }
  }

  async function handleSignalMessage(message) {
    state.peerTargetId = message.fromPlayerId || state.peerTargetId;
    updatePeerBadge(state.peerTargetId);

    const pc = await ensurePeerConnection();
    const signal = message.signal || {};

    try {
      if (signal.description) {
        const description = new RTCSessionDescription(signal.description);
        await pc.setRemoteDescription(description);

        if (description.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          sendSocket({
            type: 'signal',
            targetPlayerId: state.peerTargetId,
            signal: {
              description: pc.localDescription
            }
          });
        }
      } else if (signal.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    } catch (err) {
      console.error('Signal handling failed:', err);
    }
  }

  function closePeerConnection() {
    if (state.peerConnection) {
      state.peerConnection.ontrack = null;
      state.peerConnection.onicecandidate = null;
      state.peerConnection.close();
      state.peerConnection = null;
    }
  }

  function syncMatchTools() {
    const nextState = {
      match: {
        selfLp: Number(els.selfLpInput.value || 0),
        opponentLp: Number(els.opponentLpInput.value || 0),
        phase: els.phaseSelect.value
      }
    };

    state.sharedState = {
      ...state.sharedState,
      ...nextState
    };

    sendSocket({
      type: 'state-update',
      state: state.sharedState
    });

    setSyncStatus('Match tools synced.');
  }

  function applySharedState(shared) {
    if (!shared || !shared.match) return;
    const match = shared.match;

    els.selfLpInput.value = match.selfLp ?? 8000;
    els.opponentLpInput.value = match.opponentLp ?? 8000;
    els.phaseSelect.value = match.phase || 'Draw Phase';
  }

  async function onManualSearch() {
    const query = els.cardSearchInput.value.trim();
    if (!query) return;

    setMode('Scan: Manual Search');
    setSyncStatus('Searching cards...');
    const results = await searchCards(query);
    renderResults(results);
    setSyncStatus(results.length ? 'Search complete.' : 'No matches found.');
  }

  async function searchCards(query) {
    const cleaned = String(query || '').trim();
    if (!cleaned) return [];

    try {
      const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(cleaned)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('API search failed');
      const data = await res.json();
      const cards = Array.isArray(data.data) ? data.data.slice(0, 8) : [];
      return cards.map(normalizeCard);
    } catch (err) {
      console.warn('API search failed, using local fallback:', err);
      return searchSampleCards(cleaned);
    }
  }

  function searchSampleCards(query) {
    const haystack = Array.isArray(window.SAMPLE_CARDS) ? window.SAMPLE_CARDS : [];
    const q = query.toLowerCase();
    return haystack
      .filter(card => String(card.name || '').toLowerCase().includes(q))
      .slice(0, 8)
      .map(normalizeCard);
  }

  function normalizeCard(card) {
    return {
      id: card.id,
      name: card.name || 'Unknown Card',
      type: card.type || '',
      desc: card.desc || '',
      race: card.race || '',
      attribute: card.attribute || '',
      level: card.level || '',
      atk: card.atk ?? '',
      def: card.def ?? '',
      image: card.card_images?.[0]?.image_url || card.image || '',
      raw: card
    };
  }

  function renderResults(results) {
    state.latestResults = results;
    els.searchResults.innerHTML = '';

    if (!results.length) {
      els.searchResults.className = 'search-results empty';
      els.searchResults.textContent = 'No results found.';
      return;
    }

    els.searchResults.className = 'search-results';

    results.forEach(card => {
      const node = els.resultTemplate.content.firstElementChild.cloneNode(true);
      const img = node.querySelector('img');
      const name = node.querySelector('.name');
      const type = node.querySelector('.type');
      const desc = node.querySelector('.desc');

      img.src = card.image || '';
      img.alt = card.name;
      name.textContent = card.name;
      type.textContent = buildTypeLine(card);
      desc.textContent = truncate(card.desc, 180);

      node.addEventListener('click', () => {
        renderSelectedCard(card);
      });

      els.searchResults.appendChild(node);
    });
  }

  function renderSelectedCard(card) {
    els.cardDetails.innerHTML = '';

    if (!card) {
      els.cardDetails.className = 'card-details empty';
      els.cardDetails.textContent = 'When a card is recognized, it will appear here.';
      return;
    }

    els.cardDetails.className = 'card-details';

    const wrap = document.createElement('div');
    wrap.className = 'card-detail-wrap';

    const img = document.createElement('img');
    img.className = 'card-detail-image';
    img.src = card.image || '';
    img.alt = card.name;

    const title = document.createElement('h3');
    title.textContent = card.name;

    const meta = document.createElement('p');
    meta.className = 'card-meta';
    meta.textContent = buildTypeLine(card);

    const stats = document.createElement('p');
    stats.className = 'card-stats';
    stats.textContent = buildStatsLine(card);

    const desc = document.createElement('p');
    desc.className = 'card-description';
    desc.textContent = card.desc || '';

    wrap.appendChild(img);
    wrap.appendChild(title);
    wrap.appendChild(meta);
    if (stats.textContent) wrap.appendChild(stats);
    wrap.appendChild(desc);

    els.cardDetails.appendChild(wrap);
  }

  function buildTypeLine(card) {
    const parts = [card.type];
    if (card.attribute) parts.push(card.attribute);
    if (card.race) parts.push(card.race);
    if (card.level) parts.push(`Level ${card.level}`);
    return parts.filter(Boolean).join(' • ');
  }

  function buildStatsLine(card) {
    const parts = [];
    if (card.atk !== '' && card.atk !== null && card.atk !== undefined) parts.push(`ATK ${card.atk}`);
    if (card.def !== '' && card.def !== null && card.def !== undefined) parts.push(`DEF ${card.def}`);
    return parts.join(' • ');
  }

  function truncate(text, max) {
    const value = String(text || '');
    return value.length > max ? `${value.slice(0, max - 1)}…` : value;
  }

  function resizeRemoteOverlay() {
    if (!els.remoteOverlay || !els.remoteVideo) return;

    const rect = els.remoteVideo.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;

    els.remoteOverlay.width = Math.max(1, Math.floor(rect.width * ratio));
    els.remoteOverlay.height = Math.max(1, Math.floor(rect.height * ratio));
    els.remoteOverlay.style.width = `${rect.width}px`;
    els.remoteOverlay.style.height = `${rect.height}px`;

    const ctx = els.remoteOverlay.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
  }

  function drawScanBox(x, y, w, h) {
    resizeRemoteOverlay();
    const ctx = els.remoteOverlay.getContext('2d');
    const cssWidth = els.remoteVideo.getBoundingClientRect().width;
    const cssHeight = els.remoteVideo.getBoundingClientRect().height;

    ctx.clearRect(0, 0, cssWidth, cssHeight);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#6aa9ff';
    ctx.fillStyle = 'rgba(106, 169, 255, 0.15)';
    ctx.strokeRect(x, y, w, h);
    ctx.fillRect(x, y, w, h);
  }

  async function onRemoteVideoClick(event) {
    if (!els.remoteVideo.srcObject || !els.remoteVideo.videoWidth || !els.remoteVideo.videoHeight) {
      return;
    }

    if (state.scanning) return;
    state.scanning = true;
    setMode('Scan: Processing...');
    setSyncStatus('Scanning opponent card...');

    try {
      const rect = els.remoteVideo.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;

      const vw = els.remoteVideo.videoWidth;
      const vh = els.remoteVideo.videoHeight;

      const scaleX = vw / rect.width;
      const scaleY = vh / rect.height;

      const videoX = clickX * scaleX;
      const videoY = clickY * scaleY;

      const cropWidth = Math.max(220, Math.floor(vw * 0.18));
      const cropHeight = Math.max(320, Math.floor(vh * 0.36));

      let sx = Math.floor(videoX - cropWidth / 2);
      let sy = Math.floor(videoY - cropHeight / 2);

      sx = Math.max(0, Math.min(vw - cropWidth, sx));
      sy = Math.max(0, Math.min(vh - cropHeight, sy));

      const previewX = sx / scaleX;
      const previewY = sy / scaleY;
      const previewW = cropWidth / scaleX;
      const previewH = cropHeight / scaleY;

      drawScanBox(previewX, previewY, previewW, previewH);

      const captureCanvas = document.createElement('canvas');
      captureCanvas.width = cropWidth;
      captureCanvas.height = cropHeight;
      const captureCtx = captureCanvas.getContext('2d');
      captureCtx.drawImage(
        els.remoteVideo,
        sx,
        sy,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      showScanPreview(captureCanvas.toDataURL('image/png'));

      const ocrText = await runOcr(captureCanvas);
      const searchText = extractLikelyCardName(ocrText);

      if (!searchText) {
        setSyncStatus('Could not read card text.');
        renderResults([]);
        setMode('Scan: No Text Found');
        return;
      }

      els.cardSearchInput.value = searchText;
      const results = await searchCards(searchText);

      if (!results.length) {
        setSyncStatus(`No matches for "${searchText}".`);
        renderResults([]);
        setMode('Scan: No Match');
        return;
      }

      renderResults(results);
      renderSelectedCard(results[0]);
      setSyncStatus(`Scan complete: ${searchText}`);
      setMode(`Scan: ${truncate(searchText, 24)}`);
    } catch (err) {
      console.error('Scan failed:', err);
      setSyncStatus('Scan failed.');
      setMode('Scan: Error');
    } finally {
      state.scanning = false;
    }
  }

  function showScanPreview(dataUrl) {
    els.scanPreview.className = 'scan-preview';
    els.scanPreview.innerHTML = '';

    const img = document.createElement('img');
    img.src = dataUrl;
    img.alt = 'Scan preview';

    els.scanPreview.appendChild(img);
  }

  async function runOcr(canvas) {
    if (!window.Tesseract) {
      throw new Error('Tesseract not loaded');
    }

    const result = await window.Tesseract.recognize(canvas, 'eng', {
      logger: msg => {
        if (msg.status) {
          setSyncStatus(`OCR: ${msg.status}`);
        }
      }
    });

    return result?.data?.text || '';
  }

  function extractLikelyCardName(text) {
    if (!text) return '';

    let cleaned = String(text)
      .replace(/[\r\n]+/g, '\n')
      .replace(/[^\w\s\-':,&./]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) return '';

    const lines = String(text)
      .split('\n')
      .map(line => line.replace(/[^\w\s\-':,&./]/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    const candidates = lines
      .filter(line => line.length >= 3 && line.length <= 40)
      .sort((a, b) => a.length - b.length);

    if (candidates.length) {
      cleaned = candidates[0];
    }

    cleaned = cleaned
      .replace(/\b(ATK|DEF|SPELL|TRAP|MONSTER|EFFECT|CARD|LINK|XYZ|SYNCHRO|FUSION)\b/gi, '')
      .replace(/\b\d+\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned.slice(0, 40);
  }

  init();
})();
