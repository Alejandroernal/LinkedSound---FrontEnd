import { useState } from 'react'
import type { AppPage } from '../types'
import ForgotPasswordModal from '../components/ForgotPasswordModal'
import { PiWarningOctagonBold } from 'react-icons/pi'

type LoginPageProps = {
  onNavigate?: (page: AppPage) => void
  onLoginAsAdmin?: () => void
  onLoginAsUser?: (userEmail?: string) => void
  registeredEmail?: string
  registeredPassword?: string
}

export default function LoginPage({
  onNavigate,
  onLoginAsAdmin,
  onLoginAsUser,
  registeredEmail,
  registeredPassword,
}: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [emailError, setEmailError] = useState(false)
  const [passwordError, setPasswordError] = useState(false)

  const handleSignIn = () => {
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedPassword = password.trim()

    setEmailError(false)
    setPasswordError(false)
    setErrorMsg(null)

    // 1. Validar campos requeridos
    if (!trimmedEmail || !trimmedPassword) {
      if (!trimmedEmail) setEmailError(true)
      if (!trimmedPassword) setPasswordError(true)
      setErrorMsg('Por favor ingresa tu correo electrónico y contraseña para ingresar.')
      return
    }

    // 2. Validar formato de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setEmailError(true)
      setErrorMsg('Por favor ingresa una dirección de correo electrónico válida (ej. usuario@dominio.com).')
      return
    }

    // 3. Comprobar si son credenciales de Administrador
    const isAdminCreds =
      trimmedEmail === 'admin@linkedsound.app' &&
      (trimmedPassword === 'adminpassword123' || trimmedPassword === 'admin123')

    if (isAdminCreds) {
      onLoginAsAdmin?.()
      onNavigate?.('Admin')
      return
    }

    // 4. Comprobar si son credenciales de Usuario Normal
    const isNormalUserCreds =
      (trimmedEmail === 'kaelen@linkedsound.app' && trimmedPassword === 'password123') ||
      (registeredEmail && trimmedEmail === registeredEmail.toLowerCase() && registeredPassword && trimmedPassword === registeredPassword)

    if (isNormalUserCreds) {
      onLoginAsUser?.(trimmedEmail)
      onNavigate?.('Discovery')
      return
    }

    // 5. Credenciales incorrectas (Mensaje genérico sin revelar cuál falló)
    setEmailError(true)
    setPasswordError(true)
    setErrorMsg('El correo electrónico o la contraseña ingresados son incorrectos.')
  }

  const handleDemoUser = () => {
    setEmail('kaelen@linkedsound.app')
    setPassword('password123')
    setErrorMsg(null)
    setEmailError(false)
    setPasswordError(false)
  }

  const handleDemoAdmin = () => {
    setEmail('admin@linkedsound.app')
    setPassword('adminpassword123')
    setErrorMsg(null)
    setEmailError(false)
    setPasswordError(false)
  }

  return (
    <div className="ls-auth-shell">
      <div className="ls-auth-card">
        <div className="ls-auth-brand">
          <div className="ls-brand-mark">L</div>
          <div>
            <div className="ls-brand-name">LinkedSound</div>
            <small>conecta tu música</small>
          </div>
        </div>

        <h1>Te damos la bienvenida</h1>
        <p className="ls-auth-subtitle">Inicia sesión para continuar conectando con la comunidad musical.</p>

        <form className="ls-auth-form" onSubmit={(e) => { e.preventDefault(); handleSignIn() }}>
          <label>
            Correo electrónico *
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errorMsg) setErrorMsg(null)
                if (emailError) setEmailError(false)
              }}
              placeholder="usuario@linkedsound.app o admin@linkedsound.app"
              style={{
                borderColor: emailError ? '#ef4444' : undefined,
                background: emailError ? 'rgba(239, 68, 68, 0.05)' : undefined
              }}
            />
          </label>

          <label>
            Contraseña *
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errorMsg) setErrorMsg(null)
                if (passwordError) setPasswordError(false)
              }}
              placeholder="Ingresa tu contraseña"
              style={{
                borderColor: passwordError ? '#ef4444' : undefined,
                background: passwordError ? 'rgba(239, 68, 68, 0.05)' : undefined
              }}
            />
          </label>

          {/* Seleccion rápida de demo */}
          <div style={{
            margin: '8px 0',
            padding: '10px 12px',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '8px',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            <div style={{ fontWeight: 600, color: '#fff', marginBottom: '4px' }}>Autocompletar datos para Demo:</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={handleDemoUser}
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
                onClick={handleDemoAdmin}
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
              <span>Recordarme</span>
            </label>
            <button
              type="button"
              className="ls-text-button"
              onClick={() => setIsForgotPasswordOpen(true)}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {errorMsg && (
            <div
              style={{
                margin: '10px 0 14px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#fca5a5',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <PiWarningOctagonBold style={{ fontSize: '1.2rem', color: '#ef4444', flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="ls-primary-button ls-auth-button"
            style={{
              background: email.includes('admin') ? 'linear-gradient(135deg, #ff3c6e 0%, #a10035 100%)' : undefined
            }}
          >
            {email.includes('admin') ? 'Ingresar como Administrador' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="ls-auth-footer">
          <span>¿No tienes una cuenta?</span>
          <button type="button" className="ls-text-button" onClick={() => onNavigate?.('Register')}>
            Crear cuenta
          </button>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        initialEmail={email}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  )
}

