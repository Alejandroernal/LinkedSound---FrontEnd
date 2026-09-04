import type { AppPage } from '../types'

type RegisterPageProps = {
  onNavigate?: (page: AppPage) => void
}

export default function RegisterPage({ onNavigate }: RegisterPageProps) {
  return (
    <div className="ls-auth-shell">
      <div className="ls-auth-card">
        <div className="ls-auth-brand">
          <div className="ls-brand-mark">L</div>
          <div>
            <div className="ls-brand-name">LinkedSound</div>
            <small>create your profile</small>
          </div>
        </div>

        <h1>Create account</h1>
        <p className="ls-auth-subtitle">Start matching with artists and producers.</p>

        <form className="ls-auth-form">
          <div className="ls-two-col">
            <label>
              First name
              <input type="text" defaultValue="Kaelen" />
            </label>

            <label>
              Last name
              <input type="text" defaultValue="Voss" />
            </label>
          </div>

          <label>
            NickName / Artistic name
            <input type="text" defaultValue="Kaelen Voss" />
          </label>

          <label>
            Email
            <input type="email" defaultValue="kaelen@linkedsound.app" />
          </label>

          <label>
            Password
            <input type="password" defaultValue="********" />
          </label>

          <label>
            Role
            <select defaultValue="Productor">
              <option value="Productor">Productor</option>
              <option value="Artista">Artista</option>
              <option value="Productor/Artista">Productor/Artista</option>
            </select>
          </label>

          <button type="button" className="ls-primary-button ls-auth-button" onClick={() => onNavigate?.('Validation')}>
            Continue
          </button>
        </form>

        <div className="ls-auth-footer">
          <span>Already have an account?</span>
          <button type="button" className="ls-text-button" onClick={() => onNavigate?.('Login')}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  )
}
