import { useState, useRef, useEffect, useCallback } from 'react'
import { PiCheckBold, PiXBold, PiFlagBold, PiSparkleBold, PiArrowCounterClockwiseBold } from 'react-icons/pi'
import type { ProfileCard } from '../data/mockData'
import { isUserProfile, type UserProfile } from '../types'

interface SwipeCardStackProps {
  cards: ProfileCard[]
  currentIndex: number
  onDecision: (liked: boolean) => void
  onPreviewProfile: (profile: ProfileCard) => void
  onReport: (targetName: string) => void
  onResetFilters: () => void
}

const SWIPE_THRESHOLD = 90 // pixels drag needed to trigger swipe decision

export default function SwipeCardStack({
  cards,
  currentIndex,
  onDecision,
  onPreviewProfile,
  onReport,
  onResetFilters,
}: SwipeCardStackProps) {
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null)
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)
  const dragDistanceRef = useRef<number>(0)

  const currentCard = cards.length > 0 && currentIndex < cards.length
    ? cards[currentIndex % cards.length]
    : null

  const nextCard = cards.length > 1 && currentIndex + 1 < cards.length
    ? cards[(currentIndex + 1) % cards.length]
    : null

  const thirdCard = cards.length > 2 && currentIndex + 2 < cards.length
    ? cards[(currentIndex + 2) % cards.length]
    : null

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (exitDirection) return
    setExitDirection(direction)
    const targetX = direction === 'right' ? 1000 : -1000
    setOffset((prev) => ({ x: targetX, y: prev.y }))

    setTimeout(() => {
      onDecision(direction === 'right')
      setExitDirection(null)
      setOffset({ x: 0, y: 0 })
    }, 280)
  }, [exitDirection, onDecision])

  // Keyboard navigation for swipe
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      if (!currentCard || exitDirection) return

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handleSwipe('left')
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleSwipe('right')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentCard, exitDirection, handleSwipe])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (exitDirection) return
    // Ignore clicks on action buttons
    if ((e.target as HTMLElement).closest('button')) return

    setIsDragging(true)
    startPos.current = { x: e.clientX, y: e.clientY }
    dragDistanceRef.current = 0

    if (cardRef.current) {
      cardRef.current.setPointerCapture(e.pointerId)
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || exitDirection) return
    const dx = e.clientX - startPos.current.x
    const dy = e.clientY - startPos.current.y
    dragDistanceRef.current = Math.hypot(dx, dy)
    setOffset({ x: dx, y: dy })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    setIsDragging(false)

    if (cardRef.current && cardRef.current.hasPointerCapture(e.pointerId)) {
      cardRef.current.releasePointerCapture(e.pointerId)
    }

    if (offset.x > SWIPE_THRESHOLD) {
      handleSwipe('right')
    } else if (offset.x < -SWIPE_THRESHOLD) {
      handleSwipe('left')
    } else {
      // Snap back to center
      setOffset({ x: 0, y: 0 })
    }
  }

  const handleCardClick = (card: ProfileCard) => {
    if (dragDistanceRef.current < 8 && !exitDirection) {
      onPreviewProfile(card)
    }
  }

  if (!currentCard) {
    return (
      <div className="ls-swipe-card ls-empty-card">
        <PiSparkleBold className="ls-empty-icon" />
        <h3>No hay creadores coincidentes</h3>
        <p>
          No se encontraron tarjetas que coincidan con la ubicación, categoría o géneros seleccionados en el radar.
        </p>
        <button
          type="button"
          className="ls-primary-button"
          onClick={onResetFilters}
        >
          <PiArrowCounterClockwiseBold /> Restablecer Filtros
        </button>
      </div>
    )
  }

  const isProfile = isUserProfile(currentCard)
  const firstName = isProfile ? (currentCard as UserProfile).firstName : ''
  const lastName = isProfile ? (currentCard as UserProfile).lastName : ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  const greenBoxTitle = currentCard.nickname?.trim() || fullName || 'Artista'
  const redBoxFullName = isProfile ? fullName : currentCard.nickname || ''

  const rotationDeg = exitDirection
    ? (exitDirection === 'right' ? 25 : -25)
    : offset.x * 0.06

  const likeOpacity = exitDirection === 'right' ? 1 : offset.x > 10 ? Math.min(1, (offset.x - 10) / 70) : 0
  const passOpacity = exitDirection === 'left' ? 1 : offset.x < -10 ? Math.min(1, (-offset.x - 10) / 70) : 0

  return (
    <div className="ls-swipe-stack-container">
      {/* Third background card (deepest, static visualization) */}
      {thirdCard && (
        <div className="ls-swipe-card-bg ls-swipe-card-third">
          <div className="ls-swipe-image-wrap">
            <img src={thirdCard.profileImage} alt="" draggable={false} />
          </div>
        </div>
      )}

      {/* Second background card (underneath top card, static visualization) */}
      {nextCard && (
        <div className="ls-swipe-card-bg ls-swipe-card-next">
          <div className="ls-swipe-image-wrap">
            <img src={nextCard.profileImage} alt="" draggable={false} />
            <span className="ls-card-badge">{nextCard.match}</span>
            <div className="ls-swipe-overlay">
              <div>
                <h2>{nextCard.nickname || 'Artista'}</h2>
                <p>{nextCard.role}</p>
              </div>
              <span>{nextCard.location}</span>
            </div>
          </div>
          <div className="ls-swipe-body">
            <div className="ls-swipe-head">
              <span className="ls-swipe-fullname">{nextCard.nickname}</span>
              <span className="ls-swipe-score">{nextCard.match}</span>
            </div>
            <p className="ls-card-desc">{nextCard.description ?? ''}</p>
          </div>
        </div>
      )}

      {/* Active Top Card with Swipe Gesture & Keyed for Instant Refresh without entrance effect */}
      <div
        key={currentCard.id || currentIndex}
        ref={cardRef}
        className={`ls-swipe-card ls-swipe-card-active ${isDragging ? 'ls-is-dragging' : ''} ${exitDirection ? 'ls-is-exiting' : ''}`}
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0) rotate(${rotationDeg}deg)`,
          transition: isDragging || (!exitDirection && offset.x === 0 && offset.y === 0)
            ? 'none'
            : 'transform 0.32s cubic-bezier(0.175, 0.885, 0.32, 1.25), opacity 0.32s ease',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'pan-y',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={() => handleCardClick(currentCard)}
        title={`Arrastra la tarjeta o usa los botones. Clic para ver trabajos de ${greenBoxTitle}`}
      >
        {/* Swipe Stamp Badges */}
        <div
          className="ls-swipe-stamp ls-stamp-like"
          style={{ opacity: likeOpacity, transform: `scale(${0.8 + likeOpacity * 0.2}) rotate(-14deg)` }}
        >
          <PiCheckBold /> CONECTAR
        </div>

        <div
          className="ls-swipe-stamp ls-stamp-pass"
          style={{ opacity: passOpacity, transform: `scale(${0.8 + passOpacity * 0.2}) rotate(14deg)` }}
        >
          <PiXBold /> DESCARTAR
        </div>

        <div className="ls-swipe-image-wrap">
          <img src={currentCard.profileImage} alt={greenBoxTitle} draggable={false} />
          <span className="ls-card-badge">{currentCard.match}</span>
          <div className="ls-swipe-overlay">
            <div>
              <h2>{greenBoxTitle}</h2>
              <p>{currentCard.role}</p>
            </div>
            <span>{currentCard.location}</span>
          </div>

          <div className="ls-swipe-actions">
            <button
              type="button"
              className="ls-swipe-pass"
              onClick={(e) => {
                e.stopPropagation()
                handleSwipe('left')
              }}
              title="Descartar (Arrastrar a la izquierda)"
            >
              <PiXBold />
            </button>
            <button
              type="button"
              className="ls-swipe-like"
              onClick={(e) => {
                e.stopPropagation()
                handleSwipe('right')
              }}
              title="Conectar (Arrastrar a la derecha)"
            >
              <PiCheckBold />
            </button>
          </div>
        </div>

        <div className="ls-swipe-body">
          <div className="ls-swipe-head">
            <div className="ls-swipe-head-left">
              <span className="ls-swipe-fullname">
                {redBoxFullName}
              </span>
            </div>

            <div className="ls-swipe-head-right">
              <button
                type="button"
                className="ls-report-text-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onReport(greenBoxTitle)
                }}
              >
                <PiFlagBold /> Reporte
              </button>
              <span className="ls-swipe-score">{currentCard.match}</span>
            </div>
          </div>

          <p className="ls-card-desc">{currentCard.description ?? ''}</p>

          <div className="ls-profile-interest-block">
            <span className="ls-interest-label">Intereses de género</span>
            <div className="ls-mini-tags">
              {(currentCard.interestGenres ?? currentCard.tags ?? []).map((genre) => (
                <span key={genre}>{genre}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
