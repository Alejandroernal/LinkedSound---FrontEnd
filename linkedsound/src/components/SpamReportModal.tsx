import { useEffect } from 'react'
import { PiXBold, PiWarningCircleBold } from 'react-icons/pi'

type SpamReportModalProps = {
  isOpen: boolean
  targetName: string
  onClose: () => void
  onConfirmReport: () => void
}

export default function SpamReportModal({
  isOpen,
  targetName,
  onClose,
  onConfirmReport,
}: SpamReportModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="ls-modal-overlay" onClick={onClose}>
      <div
        className="ls-modal-content"
        style={{ maxWidth: '440px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="ls-modal-close" onClick={onClose} title="Cerrar modal">
          <PiXBold />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#ef4444' }}>
          <PiWarningCircleBold style={{ fontSize: '1.8rem' }} />
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>Reportar como Spam</h3>
        </div>

        <p style={{ color: 'rgba(255, 255, 255, 0.78)', lineHeight: '1.5', marginBottom: '24px', fontSize: '0.94rem' }}>
          ¿Estás seguro de que deseas reportar a <strong style={{ color: '#fff' }}>{targetName}</strong> como spam? Esta acción eliminará la conexión de tus nuevos matches y notificará al equipo de moderación.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button type="button" className="ls-secondary-button" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="ls-danger-button"
            onClick={() => {
              onConfirmReport()
              onClose()
            }}
          >
            Reportar y Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
