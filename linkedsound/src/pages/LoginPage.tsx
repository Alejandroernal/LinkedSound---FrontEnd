import { useState } from 'react'
import type { AppPage } from '../types'
import ForgotPasswordModal from '../components/ForgotPasswordModal'
import { PiWarningOctagonBold, PiEyeBold, PiEyeSlashBold } from 'react-icons/pi'
import { api, setToken } from '../services/api'

type LoginPageProps = {
  onNavigate?: (page: AppPage) => void
  onLoginAsAdmin?: (adminData?: any) => void
  onLoginAsUser?: (userEmail?: string, userData?: any) => void
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
  const [email, setEmail] = useState(registeredEmail || '')
  const [password, setPassword] = useState(registeredPassword || '')
  const [showPassword, setShowPassword] = useState(false)
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [emailError, setEmailError] = useState(false)
  const [passwordError, setPasswordError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
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

    // 3. Autenticar con el Backend conectado a la base de datos de Supabase
    setIsLoading(true)
    try {
      const response = await api.auth.login({
        email: trimmedEmail,
        password: trimmedPassword,
      })

      if (response.success && response.user) {
        if (response.token) {
          setToken(response.token)
        }

        // Si el usuario registrado en la base de datos tiene rol de Administrador
        if (response.user.role === 'Administrador' || response.user.role === 'Admin') {
          onLoginAsAdmin?.(response.user)
          onNavigate?.('Admin')
          return
        }

        // Usuario normal
        onLoginAsUser?.(trimmedEmail, response.user)
        onNavigate?.('Discovery')
        return
      }

      setEmailError(true)
      setPasswordError(true)
      setErrorMsg(response.message || 'El correo electrónico o la contraseña ingresados son incorrectos.')
    } catch {
      setEmailError(true)
      setPasswordError(true)
      setErrorMsg('No se pudo establecer conexión con el servidor. Verifica que el backend esté activo.')
    } finally {
      setIsLoading(false)
    }
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
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                autoComplete="current-password"
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errorMsg) setErrorMsg(null)
                  if (passwordError) setPasswordError(false)
                }}
                placeholder="Ingresa tu contraseña"
                style={{
                  width: '100%',
                  paddingRight: '42px',
                  borderColor: passwordError ? '#ef4444' : undefined,
                  background: passwordError ? 'rgba(239, 68, 68, 0.05)' : undefined
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <PiEyeSlashBold style={{ fontSize: '1.15rem' }} /> : <PiEyeBold style={{ fontSize: '1.15rem' }} />}
              </button>
            </div>
          </label>

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
            disabled={isLoading}
            style={{
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
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

