# YGO Remote Deployable

This is a deployment-ready version of the Yu-Gi-Oh remote play app.

## What it includes
- Browser app for two players
- WebSocket room sync
- WebRTC video between players
- Shared LP and phase tracking
- Clickable hotspot mapping for face-up cards
- Card search using YGOPRODeck with local fallback cards
- Runtime `/config` endpoint for TURN relay settings
- Render deployment file

## What it does not include yet
- Automatic card recognition from the camera
- Accounts or permanent database storage
- Spectators, judge calls, tournaments, replays
- Full mobile camera onboarding flow

## Local run
```bash
npm install
npm start
```
Then open:
```text
http://localhost:3000
```

## Deploy to Render
1. Create a new Web Service from this folder or Git repo.
2. Render should detect `render.yaml`, or you can manually set:
   - Build Command: `npm install`
   - Start Command: `npm start`
3. Set `PUBLIC_BASE_URL` to your Render URL, for example:
   `https://your-app-name.onrender.com/`
4. Deploy.

## TURN relay for reliable remote play
Without TURN, WebRTC can fail for some friends depending on NAT/firewall conditions.

Set these environment variables in Render when you have a TURN service:
- `TURN_URL`
- `TURN_USERNAME`
- `TURN_CREDENTIAL`

Example TURN URL value:
```text
turn:turn.example.com:3478?transport=udp,turn:turn.example.com:3478?transport=tcp
```

A hosted TURN provider or your own coturn server is the practical next step if you want this to work reliably across the internet.

## Test flow after deploy
1. Open the deployed site.
2. Enter a room ID.
3. Copy the room link.
4. Send the link to a friend.
5. Both players join the same room.
6. Start camera.
7. Use hotspots and card search during play.

## Files to care about
- `server.js` - Express + WebSocket server and runtime config endpoint
- `public/client.js` - UI, sync logic, WebRTC signaling
- `public/index.html` - app shell
- `render.yaml` - Render deployment manifest
- `.env.example` - environment variable template

## Honest status
This is deployable and usable, but it is still an indie MVP. The biggest reliability gap for real internet play is TURN. If you deploy it without TURN, it may work for some friend pairs and fail for others.
