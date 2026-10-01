import { useState } from 'react'
import { PiXBold, PiUserMinusBold, PiCheckCircleBold } from 'react-icons/pi'

type RejectMatchModalProps = {
  isOpen: boolean
  targetName: string
  onClose: () => void
  onConfirmReject: () => void
}

export default function RejectMatchModal({
  isOpen,
  targetName,
  onClose,
  onConfirmReject,
}: RejectMatchModalProps) {
  const [confirmed, setConfirmed] = useState(false)

  if (!isOpen) return null

  const handleConfirm = () => {
    setConfirmed(true)
    onConfirmReject()
  }

  const handleClose = () => {
    setConfirmed(false)
    onClose()
  }

  return (
    <div className="ls-modal-overlay" onClick={handleClose}>
      <div className="ls-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <button type="button" className="ls-modal-close" onClick={handleClose} aria-label="Cerrar">
          <PiXBold />
        </button>

        {confirmed ? (
          <div className="ls-report-success">
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#f87171',
                fontSize: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <PiCheckCircleBold />
            </div>
            <h3>Match Descartado</h3>
            <p>
              Has rechazado la solicitud de match de <strong>{targetName}</strong>. Este perfil ya no aparecerá en tus conexiones pendientes.
            </p>
            <button type="button" className="ls-primary-button" onClick={handleClose}>
              Entendido
            </button>
          </div>
        ) : (
          <div className="ls-report-form">
            <div className="ls-report-header">
              <div
                className="ls-report-badge-icon"
                style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}
              >
                <PiUserMinusBold />
              </div>
              <div>
                <h3 style={{ margin: 0 }}>Rechazar / Descartar Match</h3>
                <p className="ls-report-subtitle">
                  Perfil: <strong>{targetName}</strong>
                </p>
              </div>
            </div>

            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', lineHeight: '1.5', margin: '1rem 0' }}>
              ¿Estás seguro de que deseas descartar o rechazar la conexión con <strong>{targetName}</strong>? Esta acción removerá la solicitud de tus sugerencias.
            </p>

            <div className="ls-modal-actions" style={{ marginTop: '1.5rem' }}>
              <button type="button" className="ls-secondary-button" onClick={handleClose}>
                Cancelar
              </button>
              <button type="button" className="ls-danger-button" onClick={handleConfirm}>
                <PiUserMinusBold /> Rechazar Match
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
