<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>YGO Remote Scan</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header class="topbar">
    <div>
      <h1>YGO Remote Scan</h1>
      <p>Remote physical Yu-Gi-Oh! with live peer video, voice, duel tools, and click-to-scan card lookup on the opponent field.</p>
    </div>
    <div class="top-actions">
      <button id="startCameraBtn">Start Camera + Mic</button>
      <button id="enableAudioBtn" class="secondary" disabled>Enable Opponent Audio</button>
    </div>
  </header>

  <main class="layout">
    <section class="main-column">
      <section class="panel">
        <div class="room-grid">
          <label>
            Room ID
            <input id="roomIdInput" type="text" placeholder="duel-room" />
          </label>
          <label>
            Display name
            <input id="playerNameInput" type="text" placeholder="Player 1" />
          </label>
          <label>
            Side
            <select id="sideSelect">
              <option value="self">Self</option>
              <option value="opponent">Opponent</option>
            </select>
          </label>
          <div class="button-stack">
            <button id="joinRoomBtn">Join Room</button>
            <button id="copyRoomBtn" class="secondary">Copy Link</button>
          </div>
        </div>
        <div class="status-row">
          <span id="roomStatus">Not connected.</span>
          <span id="syncStatus">Idle.</span>
          <span id="modeBadge">Scan: Ready</span>
        </div>
      </section>

      <section class="video-grid">
        <article class="panel field-panel">
          <div class="field-header">
            <div>
              <h2>Your Field</h2>
              <p>Your local webcam view. Position your mat clearly and keep cards well lit.</p>
            </div>
            <div class="badge" id="localBadge">Local side: Self</div>
          </div>

          <div class="video-shell">
            <video id="video" autoplay playsinline muted></video>
            <div class="video-empty" id="videoEmpty">Start camera to show your field.</div>
          </div>

          <div class="controls-grid compact-grid">
            <label>
              Camera
              <select id="cameraSelect"></select>
            </label>
            <label>
              Search card manually
              <input id="cardSearchInput" type="text" placeholder="Blue-Eyes White Dragon" />
            </label>
            <button id="searchBtn">Search</button>
          </div>
        </article>

        <article class="panel remote-panel">
          <div class="field-header">
            <div>
              <h2>Opponent View</h2>
              <p>Click directly on a face-up card on the opponent feed to scan and identify it.</p>
            </div>
            <div class="badge" id="remoteBadge">Waiting for peer</div>
          </div>

          <div class="video-shell remote-shell" id="remoteShell">
            <video id="remoteVideo" autoplay playsinline></video>
            <canvas id="remoteOverlay"></canvas>
            <div class="video-empty" id="remoteEmpty">Join the same room on another device to connect live video.</div>
          </div>
          <p class="helper-text">Tip: click near the center of the card you want. The app will try to find the card frame, OCR the name, and pull matching card data.</p>
        </article>
      </section>
    </section>

    <aside class="sidebar">
      <section class="panel">
        <h2>Match Tools</h2>
        <div class="lp-grid">
          <label>
            Your LP
            <input id="selfLpInput" type="number" value="8000" />
          </label>
          <label>
            Opponent LP
            <input id="opponentLpInput" type="number" value="8000" />
          </label>
        </div>
        <div class="lp-actions duo">
          <button data-lp-target="self" data-lp-delta="-500" class="secondary small-btn">Your -500</button>
          <button data-lp-target="self" data-lp-delta="500" class="secondary small-btn">Your +500</button>
          <button data-lp-target="opponent" data-lp-delta="-500" class="secondary small-btn">Opp -500</button>
          <button data-lp-target="opponent" data-lp-delta="500" class="secondary small-btn">Opp +500</button>
        </div>
        <label>
          Phase
          <select id="phaseSelect">
            <option>Draw Phase</option>
            <option>Standby Phase</option>
            <option>Main Phase 1</option>
            <option>Battle Phase</option>
            <option>Main Phase 2</option>
            <option>End Phase</option>
          </select>
        </label>
        <div class="roster" id="roster">Players: none</div>
      </section>

      <section class="panel">
        <h2>Scan Preview</h2>
        <div id="scanPreview" class="scan-preview empty">
          Click the opponent video to scan a card.
        </div>
      </section>

      <section class="panel">
        <h2>Recognition Results</h2>
        <div id="searchResults" class="search-results empty">No scan yet. You can also search manually from the field panel.</div>
      </section>

      <section class="panel">
        <h2>Selected Card</h2>
        <div id="cardDetails" class="card-details empty">When a card is recognized, it will appear here.</div>
      </section>
    </aside>
  </main>

  <template id="resultTemplate">
    <button class="result-card">
      <img alt="Card image" />
      <div>
        <strong class="name"></strong>
        <p class="type"></p>
        <p class="desc"></p>
      </div>
    </button>
  </template>

  <script src="sample-cards.js"></script>
  <script async src="https://docs.opencv.org/4.x/opencv.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"></script>
  <script src="client.js"></script>
</body>
</html>
