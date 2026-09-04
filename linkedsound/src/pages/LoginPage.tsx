import type { AppPage } from '../types'

type LoginPageProps = {
  onNavigate?: (page: AppPage) => void
}

export default function LoginPage({ onNavigate }: LoginPageProps) {
  return (
    <div className="ls-auth-shell">
      <div className="ls-auth-card">
        <div className="ls-auth-brand">
          <div className="ls-brand-mark">L</div>
          <div>
            <div className="ls-brand-name">LinkedSound</div>
            <small>connect your sound</small>
          </div>
        </div>

        <h1>Welcome back</h1>
        <p className="ls-auth-subtitle">Sign in to continue building your network.</p>

        <form className="ls-auth-form">
          <label>
            Email
            <input type="email" defaultValue="kaelen@linkedsound.app" />
          </label>

          <label>
            Password
            <input type="password" defaultValue="********" />
          </label>

          <div className="ls-auth-row">
            <label className="ls-check-line">
              <input type="checkbox" defaultChecked />
              <span>Remember me</span>
            </label>
            <button type="button" className="ls-text-button">Forgot password?</button>
          </div>

          <button type="button" className="ls-primary-button ls-auth-button" onClick={() => onNavigate?.('Discovery')}>
            Sign in
          </button>
        </form>

        <div className="ls-auth-footer">
          <span>New here?</span>
          <button type="button" className="ls-text-button" onClick={() => onNavigate?.('Register')}>
            Create account
          </button>
        </div>
      </div>
    </div>
  )
}
