import { useState } from 'react'
import { PiXBold, PiTrashBold, PiWarningBold, PiClockBold } from 'react-icons/pi'
import type { ProfileCard } from '../data/mockData'

type DeleteEventModalProps = {
  isOpen: boolean
  event: ProfileCard | null
  onClose: () => void
  onConfirmDelete: (event: ProfileCard) => Promise<void> | void
}

export default function DeleteEventModal({
  isOpen,
  event,
  onClose,
  onConfirmDelete,
}: DeleteEventModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  if (!isOpen || !event) return null

  const eventTitle = (event as any).title || (event as any).nickname || 'Evento'
  const createdAtTime = event.createdAt ? new Date(event.createdAt).getTime() : null
  const isExpired = createdAtTime ? (Date.now() - createdAtTime) > 24 * 60 * 60 * 1000 : false
  const remainingHours = createdAtTime ? Math.max(0, 24 - (Date.now() - createdAtTime) / (1000 * 60 * 60)) : 24

  const handleConfirm = async () => {
    if (isExpired || isDeleting) return
    setIsDeleting(true)
    try {
      await onConfirmDelete(event)
      onClose()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="ls-modal-overlay" onClick={onClose}>
      <div
        className="ls-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', width: '100%', textAlign: 'left' }}
      >
        <button
          type="button"
          className="ls-modal-close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <PiXBold />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              flexShrink: 0,
            }}
          >
            <PiTrashBold />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff' }}>Eliminar Evento</h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)' }}>
              Gestión de eventos propios creados en LinkedSound
            </p>
          </div>
        </div>

        <div style={{ margin: '14px 0', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.85)' }}>
          ¿Estás seguro de que deseas eliminar permanentemente el evento{' '}
          <strong style={{ color: '#ffffff' }}>"{eventTitle}"</strong>?
        </div>

        {isExpired ? (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '18px',
            }}
          >
            <PiWarningBold size={18} style={{ flexShrink: 0, color: '#ef4444' }} />
            <span>
              El plazo de modificación y eliminación de 24 horas para este evento ha expirado. No es posible realizar cambios.
            </span>
          </div>
        ) : (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(168, 85, 247, 0.12)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              color: '#e9d5ff',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '18px',
            }}
          >
            <PiClockBold size={18} style={{ flexShrink: 0, color: '#c084fc' }} />
            <span>
              Ventana de gestión activa: restan {remainingHours.toFixed(1)} horas para poder modificar o eliminar este evento.
            </span>
          </div>
        )}

        <div className="ls-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="ls-secondary-button"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="ls-danger-button"
            onClick={handleConfirm}
            disabled={isExpired || isDeleting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isExpired || isDeleting ? 0.5 : 1,
              cursor: isExpired || isDeleting ? 'not-allowed' : 'pointer',
            }}
          >
            <PiTrashBold />
            <span>{isDeleting ? 'Eliminando...' : 'Eliminar Evento'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
