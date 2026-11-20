import { useState, useRef, useEffect, useCallback } from 'react'
import {
  PiCheckBold,
  PiXBold,
  PiFlagBold,
  PiArrowsClockwiseBold,
  PiCompassBold,
} from 'react-icons/pi'
import type { ProfileCard } from '../data/mockData'
import { isUserProfile, type UserProfile } from '../types'

interface SwipeCardStackProps {
  cards: ProfileCard[]
  currentIndex: number
  onDecision: (liked: boolean) => void
  onPreviewProfile: (profile: ProfileCard) => void
  onReport: (targetName: string) => void
  onResetFilters: () => void
  autoResetCountdown?: number
  isResettingDeck?: boolean
  hasExhaustedCards?: boolean
  isLoading?: boolean
}

const SWIPE_THRESHOLD = 65 // pixels drag needed to trigger swipe decision

export default function SwipeCardStack({
  cards,
  currentIndex,
  onDecision,
  onPreviewProfile,
  onReport,
  onResetFilters: _onResetFilters,
  autoResetCountdown = 0,
  isResettingDeck = false,
  hasExhaustedCards: _hasExhaustedCards = false,
  isLoading = false,
}: SwipeCardStackProps) {
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null)
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const currentOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)
  const dragDistanceRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

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
    setIsDragging(false)
    const flyDistance = typeof window !== 'undefined' ? Math.max(window.innerWidth + 200, 1000) : 1000
    const targetX = direction === 'right' ? flyDistance : -flyDistance
    setOffset({ x: targetX, y: 0 })
    currentOffsetRef.current = { x: targetX, y: 0 }

    setTimeout(() => {
      onDecision(direction === 'right')
      setExitDirection(null)
      setOffset({ x: 0, y: 0 })
      currentOffsetRef.current = { x: 0, y: 0 }
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
    currentOffsetRef.current = { x: 0, y: 0 }
    dragDistanceRef.current = 0
    startTimeRef.current = Date.now()

    try {
      if (cardRef.current) {
        cardRef.current.setPointerCapture(e.pointerId)
      }
    } catch {
      // Manejo seguro en navegadores que restringen pointer capture
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || exitDirection) return
    const dx = e.clientX - startPos.current.x
    const dy = e.clientY - startPos.current.y
    dragDistanceRef.current = Math.hypot(dx, dy)
    currentOffsetRef.current = { x: dx, y: dy }
    setOffset({ x: dx, y: dy })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    setIsDragging(false)

    try {
      if (cardRef.current && cardRef.current.hasPointerCapture(e.pointerId)) {
        cardRef.current.releasePointerCapture(e.pointerId)
      }
    } catch {
      // Manejo seguro de releasePointerCapture
    }

    const finalX = currentOffsetRef.current.x
    const elapsed = Math.max(Date.now() - startTimeRef.current, 1)
    const velocityX = Math.abs(finalX) / elapsed
    const isFlick = elapsed < 350 && Math.abs(finalX) > 35 && velocityX > 0.35

    if (finalX > SWIPE_THRESHOLD || (isFlick && finalX > 0)) {
      handleSwipe('right')
    } else if (finalX < -SWIPE_THRESHOLD || (isFlick && finalX < 0)) {
      handleSwipe('left')
    } else {
      // Snap back to center
      setOffset({ x: 0, y: 0 })
      currentOffsetRef.current = { x: 0, y: 0 }
    }
  }

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false)
    try {
      if (cardRef.current && cardRef.current.hasPointerCapture(e.pointerId)) {
        cardRef.current.releasePointerCapture(e.pointerId)
      }
    } catch {
      // Manejo seguro
    }
    setOffset({ x: 0, y: 0 })
    currentOffsetRef.current = { x: 0, y: 0 }
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (exitDirection) return
    if ((e.target as HTMLElement).closest('button')) return
    if (e.touches.length !== 1) return

    const t = e.touches[0]
    setIsDragging(true)
    startPos.current = { x: t.clientX, y: t.clientY }
    currentOffsetRef.current = { x: 0, y: 0 }
    dragDistanceRef.current = 0
    startTimeRef.current = Date.now()
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || exitDirection) return
    if (e.touches.length !== 1) return

    const t = e.touches[0]
    const dx = t.clientX - startPos.current.x
    const dy = t.clientY - startPos.current.y
    dragDistanceRef.current = Math.hypot(dx, dy)
    currentOffsetRef.current = { x: dx, y: dy }
    setOffset({ x: dx, y: dy })
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    const finalX = currentOffsetRef.current.x
    const elapsed = Math.max(Date.now() - startTimeRef.current, 1)
    const velocityX = Math.abs(finalX) / elapsed
    const isFlick = elapsed < 350 && Math.abs(finalX) > 35 && velocityX > 0.35

    if (finalX > SWIPE_THRESHOLD || (isFlick && finalX > 0)) {
      handleSwipe('right')
    } else if (finalX < -SWIPE_THRESHOLD || (isFlick && finalX < 0)) {
      handleSwipe('left')
    } else {
      setOffset({ x: 0, y: 0 })
      currentOffsetRef.current = { x: 0, y: 0 }
    }
  }

  const handleCardClick = (card: ProfileCard) => {
    if (dragDistanceRef.current < 8 && !exitDirection) {
      onPreviewProfile(card)
    }
  }

  if (isLoading) {
    return (
      <div className="ls-swipe-card ls-empty-card">
        <PiArrowsClockwiseBold className="ls-empty-icon is-spinning" />
        <h3>Sintonizando radar...</h3>
        <p>Buscando perfiles musicales disponibles en tu zona.</p>
      </div>
    )
  }

  if (!currentCard) {
    const mins = Math.floor(autoResetCountdown / 60)
    const secs = autoResetCountdown % 60
    const timerStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`

    return (
      <div className="ls-swipe-card ls-empty-card">
        <PiCompassBold className="ls-empty-icon" />
        <h3>No hay más perfiles cerca</h3>
        <p>
          Ampliá tu radio o ajustá tus filtros para descubrir nuevos talentos en la red.
        </p>

        <div className="ls-empty-auto-box">
          <div className="ls-empty-auto-spinner-wrap">
            <PiArrowsClockwiseBold className={`ls-empty-spin-icon ${isResettingDeck ? 'is-spinning' : ''}`} />
          </div>
          <div className="ls-empty-auto-info">
            <span className="ls-empty-auto-title">
              {isResettingDeck ? 'Reiniciando perfiles...' : 'Reinicio automático en curso'}
            </span>
            <span className="ls-empty-auto-timer">
              {isResettingDeck ? 'Cargando nuevos perfiles al radar' : `Recarga automática en ${timerStr}`}
            </span>
          </div>
        </div>
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

  const cardBorderColor = likeOpacity > 0
    ? `rgba(34, 197, 94, ${0.3 + likeOpacity * 0.7})`
    : passOpacity > 0
      ? `rgba(239, 68, 68, ${0.3 + passOpacity * 0.7})`
      : 'rgba(255, 255, 255, 0.08)'

  const cardBoxShadow = likeOpacity > 0
    ? `0 0 0 2px rgba(34, 197, 94, ${likeOpacity * 0.9}), 0 0 32px rgba(34, 197, 94, ${likeOpacity * 0.65}), 0 24px 48px rgba(10, 8, 16, 0.55)`
    : passOpacity > 0
      ? `0 0 0 2px rgba(239, 68, 68, ${passOpacity * 0.9}), 0 0 32px rgba(239, 68, 68, ${passOpacity * 0.65}), 0 24px 48px rgba(10, 8, 16, 0.55)`
      : isDragging
        ? '0 32px 64px rgba(10, 8, 16, 0.7)'
        : '0 24px 48px rgba(10, 8, 16, 0.55)'

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
          borderColor: cardBorderColor,
          boxShadow: cardBoxShadow,
          transition: isDragging
            ? 'none'
            : exitDirection
              ? 'transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.28s ease'
              : 'transform 0.32s cubic-bezier(0.175, 0.885, 0.32, 1.25), opacity 0.32s ease, border-color 0.25s ease, box-shadow 0.25s ease',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
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
                <PiFlagBold /> Reportar
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
