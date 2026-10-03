import { useState, useEffect } from 'react'
import {
  PiXBold,
  PiKeyBold,
  PiEnvelopeSimpleBold,
  PiCheckCircleBold,
  PiWarningBold,
  PiArrowRightBold,
  PiArrowLeftBold,
  PiEyeBold,
  PiEyeSlashBold,
  PiLockKeyBold
} from 'react-icons/pi'

type ForgotPasswordModalProps = {
  isOpen: boolean
  initialEmail?: string
  onClose: () => void
  onSuccess?: () => void
}

type Step = 'REQUEST' | 'VERIFY_CODE' | 'RESET_PASSWORD' | 'SUCCESS'

export default function ForgotPasswordModal({
  isOpen,
  initialEmail = '',
  onClose,
  onSuccess,
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<Step>('REQUEST')
  const [email, setEmail] = useState<string>(initialEmail)
  const [code, setCode] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [resendCountdown, setResendCountdown] = useState<number>(0)

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail)
      setStep('REQUEST')
      setCode('')
      setNewPassword('')
      setConfirmPassword('')
      setError('')
      setIsLoading(false)
    }
  }, [isOpen, initialEmail])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown((prev) => prev - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [resendCountdown])


  if (!isOpen) return null

  const handleClose = () => {
    setError('')
    setIsLoading(false)
    onClose()
  }

  const validateEmail = (val: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(val)
  }

  const handleRequestCode = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Por favor, ingresa tu correo electrónico.')
      return
    }
    if (!validateEmail(email.trim())) {
      setError('Por favor, ingresa un correo electrónico válido.')
      return
    }

    setError('')
    setIsLoading(true)

    // Simulación de envío de código de verificación
    setTimeout(() => {
      setIsLoading(false)
      setStep('VERIFY_CODE')
      setResendCountdown(30)
    }, 800)
  }

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCode = code.trim()
    if (!cleanCode) {
      setError('Por favor, ingresa el código de verificación de 6 dígitos enviado a tu correo.')
      return
    }
    if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      setError('El código de verificación debe contener exactamente 6 dígitos numéricos.')
      return
    }

    setError('')
    setIsLoading(true)

    // Simulación de verificación exitosa
    setTimeout(() => {
      setIsLoading(false)
      setStep('RESET_PASSWORD')
    }, 800)
  }

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword) {
      setError('Por favor, ingresa la nueva contraseña.')
      return
    }
    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError('La contraseña debe incluir al menos una letra mayúscula.')
      return
    }
    if (!/[a-z]/.test(newPassword)) {
      setError('La contraseña debe incluir al menos una letra minúscula.')
      return
    }
    if (!/[0-9]/.test(newPassword)) {
      setError('La contraseña debe incluir al menos un número.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor verifica.')
      return
    }

    setError('')
    setIsLoading(true)

    // Simulación de cambio de contraseña exitoso
    setTimeout(() => {
      setIsLoading(false)
      setStep('SUCCESS')
    }, 900)
  }

  const handleResendCode = () => {
    if (resendCountdown > 0) return
    setError('')
    setResendCountdown(30)
    // Mensaje de simulación
  }

  return (
    <div className="ls-modal-overlay" onClick={handleClose}>
      <div
        className="ls-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '460px', width: '90%' }}
      >
        <button type="button" className="ls-modal-close" onClick={handleClose} aria-label="Cerrar ventana">
          <PiXBold />
        </button>

        {step === 'REQUEST' && (
          <form onSubmit={handleRequestCode} className="ls-report-form">
            <div className="ls-report-header">
              <div className="ls-report-badge-icon" style={{ background: 'rgba(0, 229, 255, 0.15)', color: '#00e5ff' }}>
                <PiKeyBold />
              </div>
              <div>
                <h3 style={{ margin: 0 }}>¿Olvidaste tu contraseña?</h3>
                <p className="ls-report-subtitle">
                  Recupera el acceso a tu cuenta de LinkedSound.
                </p>
              </div>
            </div>

            <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.9rem', lineHeight: '1.5', margin: '1rem 0' }}>
              Ingresa la dirección de correo electrónico vinculada a tu cuenta y te enviaremos un código de seguridad para restablecer tu contraseña.
            </p>

            <div className="ls-form-group">
              <label htmlFor="forgot-email" className="ls-form-label">
                Correo Electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  id="forgot-email"
                  className="ls-select-input"
                  placeholder="ejemplo@linkedsound.app"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError('')
                  }}
                  style={{
                    paddingLeft: '38px',
                    borderColor: error ? '#ef4444' : undefined
                  }}
                />
                <PiEnvelopeSimpleBold
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '1.2rem',
                    pointerEvents: 'none'
                  }}
                />
              </div>
            </div>

            {error && (
              <div
                style={{
                  margin: '8px 0 16px',
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
                <PiWarningBold style={{ fontSize: '1.2rem', color: '#ef4444', flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div className="ls-modal-actions" style={{ marginTop: '1.5rem' }}>
              <button type="button" className="ls-secondary-button" onClick={handleClose}>
                Cancelar
              </button>
              <button type="submit" className="ls-primary-button" disabled={isLoading}>
                {isLoading ? 'Enviando...' : 'Enviar Código'} <PiArrowRightBold />
              </button>
            </div>
          </form>
        )}

        {step === 'VERIFY_CODE' && (
          <form onSubmit={handleVerifyCode} className="ls-report-form">
            <div className="ls-report-header">
              <div className="ls-report-badge-icon" style={{ background: 'rgba(0, 229, 255, 0.15)', color: '#00e5ff' }}>
                <PiEnvelopeSimpleBold />
              </div>
              <div>
                <h3 style={{ margin: 0 }}>Código de Verificación</h3>
                <p className="ls-report-subtitle">
                  Código enviado a <strong>{email}</strong>
                </p>
              </div>
            </div>

            <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.9rem', lineHeight: '1.5', margin: '1rem 0' }}>
              Ingresa el código de seguridad recibido en tu bandeja de entrada o carpeta de correo no deseado.
            </p>

            <div className="ls-form-group">
              <label htmlFor="verification-code" className="ls-form-label">
                Código de Verificación
              </label>
              <input
                type="text"
                id="verification-code"
                className="ls-select-input"
                placeholder="Ej. 748291"
                value={code}
                maxLength={6}
                onChange={(e) => {
                  setCode(e.target.value)
                  if (error) setError('')
                }}
                style={{
                  letterSpacing: '2px',
                  fontWeight: 600,
                  textAlign: 'center',
                  fontSize: '1.1rem',
                  borderColor: error ? '#ef4444' : undefined
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '6px 0 16px' }}>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                ¿No recibiste el correo?
              </span>
              <button
                type="button"
                className="ls-text-button"
                onClick={handleResendCode}
                disabled={resendCountdown > 0}
                style={{
                  fontSize: '0.8rem',
                  opacity: resendCountdown > 0 ? 0.5 : 1,
                  cursor: resendCountdown > 0 ? 'not-allowed' : 'pointer'
                }}
              >
                {resendCountdown > 0 ? `Reenviar en ${resendCountdown}s` : 'Reenviar código'}
              </button>
            </div>

            {error && (
              <div
                style={{
                  margin: '8px 0 16px',
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
                <PiWarningBold style={{ fontSize: '1.2rem', color: '#ef4444', flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div className="ls-modal-actions" style={{ marginTop: '1.5rem' }}>
              <button
                type="button"
                className="ls-secondary-button"
                onClick={() => {
                  setStep('REQUEST')
                  setError('')
                }}
              >
                <PiArrowLeftBold /> Volver
              </button>
              <button type="submit" className="ls-primary-button" disabled={isLoading}>
                {isLoading ? 'Verificando...' : 'Verificar Código'} <PiArrowRightBold />
              </button>
            </div>
          </form>
        )}

        {step === 'RESET_PASSWORD' && (
          <form onSubmit={handleResetPassword} className="ls-report-form">
            <div className="ls-report-header">
              <div className="ls-report-badge-icon" style={{ background: 'rgba(0, 229, 255, 0.15)', color: '#00e5ff' }}>
                <PiLockKeyBold />
              </div>
              <div>
                <h3 style={{ margin: 0 }}>Nueva Contraseña</h3>
                <p className="ls-report-subtitle">
                  Define tu nueva clave de acceso
                </p>
              </div>
            </div>

            <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.9rem', lineHeight: '1.5', margin: '1rem 0' }}>
              Ingresa una nueva contraseña segura para tu cuenta.
            </p>

            <div className="ls-form-group">
              <label htmlFor="new-password" className="ls-form-label">
                Nueva Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="new-password"
                  className="ls-select-input"
                  placeholder="Mín. 8 caracteres (1 mayúscula, 1 minúscula, 1 número)"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    if (error) setError('')
                  }}
                  style={{
                    paddingRight: '38px',
                    borderColor: error ? '#ef4444' : undefined
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.5)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <PiEyeSlashBold /> : <PiEyeBold />}
                </button>
              </div>
              <small style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.74rem', marginTop: '6px', display: 'block' }}>
                Mínimo 8 caracteres con al menos 1 mayúscula, 1 minúscula y 1 número.
              </small>
            </div>

            <div className="ls-form-group">
              <label htmlFor="confirm-password" className="ls-form-label">
                Confirmar Contraseña
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirm-password"
                className="ls-select-input"
                placeholder="Repite tu nueva contraseña"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (error) setError('')
                }}
                style={{
                  borderColor: error ? '#ef4444' : undefined
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  margin: '8px 0 16px',
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
                <PiWarningBold style={{ fontSize: '1.2rem', color: '#ef4444', flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div className="ls-modal-actions" style={{ marginTop: '1.5rem' }}>
              <button
                type="button"
                className="ls-secondary-button"
                onClick={() => {
                  setStep('VERIFY_CODE')
                  setError('')
                }}
              >
                <PiArrowLeftBold /> Volver
              </button>
              <button type="submit" className="ls-primary-button" disabled={isLoading}>
                {isLoading ? 'Actualizando...' : 'Restablecer Contraseña'}
              </button>
            </div>
          </form>
        )}

        {step === 'SUCCESS' && (
          <div className="ls-report-success">
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(0, 229, 255, 0.15)',
                border: '1px solid rgba(0, 229, 255, 0.35)',
                color: '#00e5ff',
                fontSize: '2.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <PiCheckCircleBold />
            </div>
            <h3 style={{ margin: '0 0 8px' }}>¡Contraseña Restablecida!</h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 20px' }}>
              Tu contraseña ha sido actualizada correctamente. Ahora puedes iniciar sesión con tus nuevas credenciales de acceso.
            </p>
            <button
              type="button"
              className="ls-primary-button"
              onClick={() => {
                handleClose()
                onSuccess?.()
              }}
              style={{ width: '100%' }}
            >
              Iniciar Sesión
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
