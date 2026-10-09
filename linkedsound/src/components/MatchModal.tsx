import { useEffect } from 'react'
import { PiXBold, PiHandshakeBold, PiChatTeardropTextBold, PiBriefcaseBold } from 'react-icons/pi'
import type { ProfileCard } from '../data/mockData'

type MatchModalProps = {
  isOpen: boolean
  matchedCard: ProfileCard | null
  userProfileImage?: string
  onClose: () => void
  onOpenChat: (card: ProfileCard) => void
}

export default function MatchModal({
  isOpen,
  matchedCard,
  userProfileImage,
  onClose,
  onOpenChat,
}: MatchModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !matchedCard) return null

  const cardName = matchedCard.nickname || ('firstName' in matchedCard ? matchedCard.firstName : '') || 'Artista'
  const isProfile = matchedCard.isProfile !== false
  const cardRole = matchedCard.role || (isProfile ? 'Creador Musical' : 'Evento Musical')
  const defaultUserImg = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
  const myImage = userProfileImage || defaultUserImg
  const targetImage = matchedCard.profileImage || defaultUserImg

  return (
    <div className="ls-modal-overlay" onClick={onClose}>
      <div
        className="ls-modal-content ls-match-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="ls-modal-close"
          onClick={onClose}
          aria-label="Cerrar modal"
        >
          <PiXBold />
        </button>

        <div className="ls-match-modal-header">
          <div className="ls-match-sparkle-badge">
            <PiBriefcaseBold /> CONEXIÓN PROFESIONAL
          </div>
          <h2>¡NUEVO MATCH PROFESIONAL!</h2>
          <p>
            Tú y <strong>{cardName}</strong> coinciden en perfil profesional y afinidad para colaborar en proyectos musicales.
          </p>
        </div>

        {/* Visual Dual Avatar Match Display */}
        <div className="ls-match-avatars-row">
          <div className="ls-match-avatar-box">
            <img src={myImage} alt="Tu Perfil" />
            <span className="ls-match-avatar-label">Tú</span>
          </div>

          <div className="ls-match-music-pulse" title="Conexión Profesional">
            <PiHandshakeBold />
          </div>

          <div className="ls-match-avatar-box">
            <img src={targetImage} alt={cardName} />
            <span className="ls-match-avatar-label">{cardName}</span>
          </div>
        </div>

        {/* Card Metadata info */}
        <div className="ls-match-info-card">
          <h4>{cardName}</h4>
          <p>{cardRole} • {matchedCard.location || 'LinkedSound Network'}</p>
          <span className="ls-match-percent-tag">{matchedCard.match || '95%'} Afinidad laboral</span>
        </div>

        {/* Modal Buttons */}
        <div className="ls-match-modal-actions">
          <button
            type="button"
            className="ls-primary-button ls-match-btn-chat"
            onClick={() => onOpenChat(matchedCard)}
          >
            <PiChatTeardropTextBold /> Iniciar Conversación
          </button>
          <button
            type="button"
            className="ls-secondary-button"
            onClick={onClose}
          >
            Continuar Explorando
          </button>
        </div>
      </div>
    </div>
  )
}

