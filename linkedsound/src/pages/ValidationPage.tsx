import type { AppPage } from '../types'

type ValidationPageProps = {
  onNavigate?: (page: AppPage) => void
}

export default function ValidationPage({ onNavigate }: ValidationPageProps) {
  return (
    <div className="ls-auth-shell">
      <div className="ls-auth-card validation-card">
        <div className="ls-auth-brand">
          <div className="ls-brand-mark">L</div>
          <div>
            <div className="ls-brand-name">LinkedSound</div>
            <small>verify your profile</small>
          </div>
        </div>

        <h1>Profile validation</h1>
        <p className="ls-auth-subtitle">Add your profile links and confirm your identity before continuing.</p>

        <div className="ls-auth-form">
          <label>
            SoundCloud URL (optional)
            <input type="url" placeholder="https://soundcloud.com/your-profile" />
          </label>

          <label>
            Instagram (optional)
            <input type="text" placeholder="instagram.com/your-handle" />
          </label>

          <label>
            Spotify profile (optional)
            <input type="text" placeholder="open.spotify.com/artist/your-profile" />
          </label>

          <label>
            Location (Google Maps placeholder)
            <input type="text" defaultValue="Berlin, Germany" />
          </label>

          <div className="ls-validation-box">
            <span className="ls-status-indicator" />
            Verification pending review
          </div>

          <button type="button" className="ls-primary-button ls-auth-button" onClick={() => onNavigate?.('Discovery')}>
            Validate profile
          </button>
        </div>
      </div>
    </div>
  )
}
