:root {
  color-scheme: dark;
  --bg: #0f172a;
  --panel: #111827;
  --panel-2: #1f2937;
  --line: #334155;
  --text: #e5e7eb;
  --muted: #94a3b8;
  --accent: #60a5fa;
  --accent-2: #93c5fd;
  --danger: #ef4444;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  background: linear-gradient(180deg, #020617, #0f172a 35%);
  color: var(--text);
}
button, input, select {
  font: inherit;
}
button {
  background: var(--accent);
  color: #08111f;
  border: none;
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 700;
}
button.secondary, .import-label.secondary {
  background: #1e293b;
  color: var(--text);
  border: 1px solid var(--line);
}
button.danger { background: var(--danger); color: white; }
input, select {
  width: 100%;
  background: #0b1220;
  color: var(--text);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 10px 12px;
}
label { display: grid; gap: 8px; color: var(--muted); font-size: 14px; }
.topbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
  border-bottom: 1px solid rgba(148,163,184,.15);
}
.topbar h1 { margin: 0 0 6px; }
.topbar p { margin: 0; color: var(--muted); max-width: 760px; }
.top-actions { display: flex; gap: 10px; align-items: flex-start; flex-wrap: wrap; }
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 16px;
  padding: 16px;
}
.main-column { display: grid; gap: 16px; }
.panel {
  background: rgba(17,24,39,.94);
  border: 1px solid rgba(148,163,184,.16);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,.25);
}
.room-grid, .controls-grid, .lp-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.controls-grid { grid-template-columns: 1.2fr 1fr 1fr auto; align-items: end; }
.button-stack { display: grid; gap: 10px; align-self: end; }
.status-row, .field-header, .panel-actions, .lp-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}
.status-row { margin-top: 14px; color: var(--muted); font-size: 14px; }
.badge {
  border: 1px solid var(--line);
  background: #0b1220;
  color: var(--accent-2);
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 13px;
}
.video-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.video-shell, .remote-board {
  position: relative;
  min-height: 420px;
  background: #020617;
  border: 1px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
}
video, canvas {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}
#overlay {
  position: absolute;
  inset: 0;
  cursor: crosshair;
}
.video-empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 24px;
  color: var(--muted);
  background: linear-gradient(180deg, rgba(2,6,23,.85), rgba(2,6,23,.65));
}
.sidebar { display: grid; gap: 16px; align-self: start; }
.search-results, .box-list, .card-details {
  display: grid;
  gap: 10px;
}
.search-results.empty, .box-list.empty, .card-details.empty {
  color: var(--muted);
}
.result-card, .box-item {
  width: 100%;
  text-align: left;
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 10px;
  padding: 10px;
  background: #0b1220;
  border: 1px solid var(--line);
  border-radius: 12px;
  color: var(--text);
}
.box-item { grid-template-columns: 1fr; }
.result-card img, .details-card img {
  width: 72px;
  height: 105px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: #020617;
}
.result-card p, .box-item p, .details-card p, .roster { margin: 4px 0 0; color: var(--muted); }
.details-card {
  display: grid;
  grid-template-columns: 92px 1fr;
  gap: 12px;
}
.details-card img { width: 92px; height: 132px; }
.box-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.box-actions { display: flex; gap: 8px; }
.small-btn { padding: 8px 10px; }
.duo { justify-content: flex-start; }
.import-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;
}
@media (max-width: 1180px) {
  .layout { grid-template-columns: 1fr; }
  .sidebar { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 860px) {
  .room-grid, .controls-grid, .lp-grid, .video-grid, .sidebar { grid-template-columns: 1fr; }
}


.remote-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
