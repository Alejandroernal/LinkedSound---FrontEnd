import { useEffect } from 'react'
import { PiXBold, PiMusicNotesPlusBold, PiChatTeardropTextBold, PiSparkleBold } from 'react-icons/pi'
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
            <PiSparkleBold /> MATCH EN LINKEDSOUND
          </div>
          <h2>¡ES UN MATCH!</h2>
          <p>
            A ti y a <strong>{cardName}</strong> os ha gustado el perfil del otro.
          </p>
        </div>

        {/* Visual Dual Avatar Match Display */}
        <div className="ls-match-avatars-row">
          <div className="ls-match-avatar-box">
            <img src={myImage} alt="Tu Perfil" />
            <span className="ls-match-avatar-label">Tú</span>
          </div>

          <div className="ls-match-music-pulse" title="Conexión Musical">
            <PiMusicNotesPlusBold />
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
          <span className="ls-match-percent-tag">{matchedCard.match || '95%'} Match de afinidad</span>
        </div>

        {/* Modal Buttons */}
        <div className="ls-match-modal-actions">
          <button
            type="button"
            className="ls-primary-button ls-match-btn-chat"
            onClick={() => onOpenChat(matchedCard)}
          >
            <PiChatTeardropTextBold /> Enviar Mensaje
          </button>
          <button
            type="button"
            className="ls-secondary-button"
            onClick={onClose}
          >
            Seguir Descubriendo
          </button>
        </div>
      </div>
    </div>
  )
}
