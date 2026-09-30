import { useState } from 'react'
import type { AppPage } from '../types'

type LoginPageProps = {
  onNavigate?: (page: AppPage) => void
  onLoginAsAdmin?: () => void
}

export default function LoginPage({ onNavigate, onLoginAsAdmin }: LoginPageProps) {
  const [email, setEmail] = useState('kaelen@linkedsound.app')
  const [password, setPassword] = useState('********')

  const handleSignIn = () => {
    // Si el correo contiene 'admin', se redirige al sistema de Admin aislado
    if (email.toLowerCase().includes('admin')) {
      onLoginAsAdmin?.()
      onNavigate?.('Admin')
    } else {
      onNavigate?.('Discovery')
    }
  }

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

        <form className="ls-auth-form" onSubmit={(e) => { e.preventDefault(); handleSignIn() }}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@linkedsound.app o admin@linkedsound.app"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {/* Quick Demo Role Selector Hint */}
          <div style={{
            margin: '8px 0',
            padding: '10px 12px',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '8px',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            <div style={{ fontWeight: 600, color: '#fff', marginBottom: '4px' }}>Selección rápida de demo:</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setEmail('kaelen@linkedsound.app')}
                style={{
                  background: !email.includes('admin') ? 'rgba(0,229,255,0.2)' : 'transparent',
                  border: '1px solid rgba(0,229,255,0.4)',
                  color: '#00e5ff',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                Usuario Normal
              </button>
              <button
                type="button"
                onClick={() => setEmail('admin@linkedsound.app')}
                style={{
                  background: email.includes('admin') ? 'rgba(255,60,110,0.2)' : 'transparent',
                  border: '1px solid rgba(255,60,110,0.4)',
                  color: '#ff3c6e',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600
                }}
              >
                Administrador
              </button>
            </div>
          </div>

          <div className="ls-auth-row">
            <label className="ls-check-line">
              <input type="checkbox" defaultChecked />
              <span>Remember me</span>
            </label>
            <button type="button" className="ls-text-button">Forgot password?</button>
          </div>

          <button
            type="submit"
            className="ls-primary-button ls-auth-button"
            style={{
              background: email.includes('admin') ? 'linear-gradient(135deg, #ff3c6e 0%, #a10035 100%)' : undefined
            }}
          >
            {email.includes('admin') ? 'Sign in as Admin' : 'Sign in'}
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
