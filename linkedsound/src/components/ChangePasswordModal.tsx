import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { getPasswordRequirements, validatePasswordStrength } from '../utils/passwordValidation'
import {
  PiXBold,
  PiLockKeyBold,
  PiEyeBold,
  PiEyeSlashBold,
  PiWarningBold,
  PiCheckCircleBold,
} from 'react-icons/pi'

type ChangePasswordModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowCurrent(false)
      setShowNew(false)
      setShowConfirm(false)
      setError('')
      setIsLoading(false)
      setIsSuccess(false)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const checks = getPasswordRequirements(newPassword)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword) {
      setError('Por favor, ingresa tu contraseña actual.')
      return
    }

    const strengthError = validatePasswordStrength(newPassword)
    if (strengthError) {
      setError(strengthError)
      return
    }

    if (newPassword === currentPassword) {
      setError('La nueva contraseña debe ser diferente a tu contraseña actual.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden. Por favor verifica.')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const res = await api.auth.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      })

      if (res.success) {
        setIsSuccess(true)
      } else {
        setError(res.message || 'No se pudo actualizar la contraseña.')
      }
    } catch (err: any) {
      setError(err?.message || 'Error de conexión con el servidor al cambiar la contraseña.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="ls-modal-overlay" onClick={onClose}>
      <div
        className="ls-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '460px', width: '92%' }}
      >
        <button type="button" className="ls-modal-close" onClick={onClose} aria-label="Cerrar ventana">
          <PiXBold />
        </button>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="ls-report-form" noValidate>
            <div className="ls-report-header">
              <div className="ls-report-badge-icon" style={{ background: 'rgba(168, 85, 247, 0.16)', color: '#c084fc' }}>
                <PiLockKeyBold />
              </div>
              <div>
                <h3 style={{ margin: 0 }}>Cambiar Contraseña</h3>
                <p className="ls-report-subtitle">
                  Actualiza tu clave de acceso de forma segura
                </p>
              </div>
            </div>

            <div className="ls-form-group" style={{ marginTop: '14px' }}>
              <label htmlFor="change-current-password" className="ls-form-label">
                Contraseña actual <span className="ls-required-asterisk">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  id="change-current-password"
                  className="ls-select-input"
                  placeholder="Ingresa tu contraseña actual"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value)
                    if (error) setError('')
                  }}
                  style={{ paddingRight: '38px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((prev) => !prev)}
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
                    padding: 0,
                  }}
                  aria-label={showCurrent ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'}
                >
                  {showCurrent ? <PiEyeSlashBold /> : <PiEyeBold />}
                </button>
              </div>
            </div>

            <div className="ls-form-group">
              <label htmlFor="change-new-password" className="ls-form-label">
                Nueva contraseña <span className="ls-required-asterisk">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNew ? 'text' : 'password'}
                  id="change-new-password"
                  className="ls-select-input"
                  placeholder="Mín. 8 caracteres (1 mayúscula, 1 minúscula, 1 número)"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    if (error) setError('')
                  }}
                  style={{ paddingRight: '38px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((prev) => !prev)}
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
                    padding: 0,
                  }}
                  aria-label={showNew ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
                >
                  {showNew ? <PiEyeSlashBold /> : <PiEyeBold />}
                </button>
              </div>

              <small style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.74rem', marginTop: '6px', display: 'block' }}>
                Requisitos: Mínimo 8 caracteres con al menos 1 mayúscula, 1 minúscula y 1 número.
              </small>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: checks.hasMinLen ? 'rgba(39, 174, 96, 0.18)' : 'rgba(255, 255, 255, 0.06)',
                    color: checks.hasMinLen ? '#34d399' : 'rgba(255, 255, 255, 0.45)',
                    border: `1px solid ${checks.hasMinLen ? 'rgba(52, 211, 153, 0.35)' : 'rgba(255, 255, 255, 0.1)'}`,
                  }}
                >
                  8+ caracteres
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: checks.hasUpper ? 'rgba(39, 174, 96, 0.18)' : 'rgba(255, 255, 255, 0.06)',
                    color: checks.hasUpper ? '#34d399' : 'rgba(255, 255, 255, 0.45)',
                    border: `1px solid ${checks.hasUpper ? 'rgba(52, 211, 153, 0.35)' : 'rgba(255, 255, 255, 0.1)'}`,
                  }}
                >
                  1 Mayúscula
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: checks.hasLower ? 'rgba(39, 174, 96, 0.18)' : 'rgba(255, 255, 255, 0.06)',
                    color: checks.hasLower ? '#34d399' : 'rgba(255, 255, 255, 0.45)',
                    border: `1px solid ${checks.hasLower ? 'rgba(52, 211, 153, 0.35)' : 'rgba(255, 255, 255, 0.1)'}`,
                  }}
                >
                  1 Minúscula
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: checks.hasNumber ? 'rgba(39, 174, 96, 0.18)' : 'rgba(255, 255, 255, 0.06)',
                    color: checks.hasNumber ? '#34d399' : 'rgba(255, 255, 255, 0.45)',
                    border: `1px solid ${checks.hasNumber ? 'rgba(52, 211, 153, 0.35)' : 'rgba(255, 255, 255, 0.1)'}`,
                  }}
                >
                  1 Número
                </span>
              </div>
            </div>

            <div className="ls-form-group">
              <label htmlFor="change-confirm-password" className="ls-form-label">
                Confirmar nueva contraseña <span className="ls-required-asterisk">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  id="change-confirm-password"
                  className="ls-select-input"
                  placeholder="Repite tu nueva contraseña"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (error) setError('')
                  }}
                  style={{ paddingRight: '38px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
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
                    padding: 0,
                  }}
                  aria-label={showConfirm ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                >
                  {showConfirm ? <PiEyeSlashBold /> : <PiEyeBold />}
                </button>
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
                  gap: '10px',
                }}
              >
                <PiWarningBold style={{ fontSize: '1.2rem', color: '#ef4444', flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div className="ls-modal-actions" style={{ marginTop: '1.25rem' }}>
              <button type="button" className="ls-secondary-button" onClick={onClose} disabled={isLoading}>
                Cancelar
              </button>
              <button type="submit" className="ls-primary-button" disabled={isLoading}>
                {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
              </button>
            </div>
          </form>
        ) : (
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
                margin: '0 auto 16px',
              }}
            >
              <PiCheckCircleBold />
            </div>
            <h3 style={{ margin: '0 0 8px' }}>Contraseña Actualizada</h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 20px' }}>
              Tu contraseña se ha actualizado correctamente. Podrás utilizarla en tu próximo inicio de sesión.
            </p>
            <button type="button" className="ls-primary-button" onClick={onClose} style={{ width: '100%' }}>
              Entendido
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
