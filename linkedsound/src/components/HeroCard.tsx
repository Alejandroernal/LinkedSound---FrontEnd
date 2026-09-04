import { tags } from '../data/mockData'

export default function HeroCard() {
  return (
    <div className="ls-hero-card">
      <div className="ls-hero-image">
        <div className="ls-match-badge">98% sonic match</div>
        <div className="ls-availability">● Online Now</div>
        <div className="ls-location">2 mi away • Los Angeles, CA</div>
      </div>

      <div className="ls-profile-header">
        <h1>
          Kaelen Vox <span>26</span>
        </h1>
        <p>
          Vocalist <span>•</span> Sound Designer <span>•</span> Mix &amp; Master Specialist
        </p>
      </div>

      <div className="ls-tag-list">
        {tags.map((tag) => (
          <span key={tag} className="ls-tag">
            #{tag}
          </span>
        ))}
      </div>

      <div className="ls-collab-box">
        <h3>Collaborative objective</h3>
        <p>
          Currently tracking a 5-song EP titled “Null State”. Looking for aggressive topline
          vocalists or co-producers running dark, driving reese basses and gritty modular leads
          (think Gesaffelstein meets Yoy Harold).
        </p>
      </div>

      <div className="ls-track-card">
        <div className="ls-track-main">
          <div className="ls-track-icon">◉</div>
          <div>
            <h4>Neon Descent (WIP 128BPM Dm)</h4>
            <span>Original Cut • Stem Re-Layout • SoundCloud Synced</span>
          </div>
        </div>
        <div className="ls-waveform" aria-label="Waveform representation">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="ls-track-meta">
          <div className="ls-track-swatch">01:14</div>
          <div className="ls-track-stats">
            <span>128 BPM</span>
            <span>Dm Minor</span>
            <span>Mastered 24-bit/48k</span>
          </div>
          <button type="button">View Track Stems</button>
        </div>
      </div>
    </div>
  )
}
