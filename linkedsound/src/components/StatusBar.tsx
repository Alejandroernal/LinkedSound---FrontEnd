export default function StatusBar() {
  return (
    <div className="ls-status-row">
      <div className="ls-status-tag">
        <span className="ls-dot" /> Radar discovery engine
      </div>
      <div className="ls-status-label">Pool active: 142 producers &amp; vocalists</div>
      <div className="ls-status-actions">
        <button type="button">Swipe with keys</button>
        <button type="button">Pass</button>
        <button type="button">Space</button>
        <button type="button">Play</button>
        <button type="button">Collab</button>
      </div>
    </div>
  )
}
