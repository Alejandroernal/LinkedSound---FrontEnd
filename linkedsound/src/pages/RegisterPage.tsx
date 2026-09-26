import { useState, useRef, useCallback, useEffect } from 'react'
import type { AppPage, Profile } from '../types'

const AVAILABLE_GENRES = [
  'Synthwave', 'Electronic', 'Dark Pop', 'Hip Hop', 'Indie',
  'Tech House', 'Ambient', 'Jazz', 'R&B', 'Rock', 'Drum & Bass',
  'Lo-Fi', 'Cyberpunk', 'Industrial', 'Hyperpop', 'Techno', 'Trap Metal',
]

// ── Avatar editor modal ────────────────────────────────────────────────────
const CANVAS_W = 360
const CANVAS_H = 300
const CX = CANVAS_W / 2
const CY = CANVAS_H / 2
const RADIUS = 120

function AvatarEditorModal({
  rawImage,
  onApply,
  onCancel,
}: {
  rawImage: string
  onApply: (cropped: string) => void
  onCancel: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef    = useRef<HTMLImageElement | null>(null)
  const panRef    = useRef({ x: 0, y: 0 })
  const zoomRef   = useRef(1)
  const dragging  = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const img    = imgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

    const z     = zoomRef.current
    const pan   = panRef.current
    const base  = Math.max((RADIUS * 2) / img.naturalWidth, (RADIUS * 2) / img.naturalHeight)
    const scale = base * z
    const dw    = img.naturalWidth  * scale
    const dh    = img.naturalHeight * scale
    const dx    = CX + pan.x - dw / 2
    const dy    = CY + pan.y - dh / 2

    // 1. Image
    ctx.drawImage(img, dx, dy, dw, dh)

    // 2. Dark overlay — evenodd leaves circle transparent
    ctx.beginPath()
    ctx.rect(0, 0, CANVAS_W, CANVAS_H)
    ctx.arc(CX, CY, RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0,0,0,0.62)'
    ctx.fill('evenodd')

    // 3. White ring
    ctx.beginPath()
    ctx.arc(CX, CY, RADIUS, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.92)'
    ctx.lineWidth   = 3
    ctx.stroke()
  }, [])

  useEffect(() => {
    const img = new Image()
    img.onload = () => { imgRef.current = img; draw() }
    img.src = rawImage
  }, [rawImage, draw])

  useEffect(() => { if (imgRef.current) draw() }, [zoom, draw])

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current  = true
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return
    panRef.current = {
      x: panRef.current.x + (e.clientX - lastMouse.current.x),
      y: panRef.current.y + (e.clientY - lastMouse.current.y),
    }
    lastMouse.current = { x: e.clientX, y: e.clientY }
    draw()
  }
  const onMouseUp = () => { dragging.current = false }

  const handleZoom = (val: number) => {
    zoomRef.current = val
    setZoom(val)
  }

  const handleApply = () => {
    const img = imgRef.current
    if (!img) return
    const SIZE = 240
    const out  = document.createElement('canvas')
    out.width  = SIZE
    out.height = SIZE
    const ctx  = out.getContext('2d')!
    const z    = zoomRef.current
    const pan  = panRef.current
    const base = Math.max(SIZE / img.naturalWidth, SIZE / img.naturalHeight)
    const s    = base * z
    const dw   = img.naturalWidth  * s
    const dh   = img.naturalHeight * s
    const dx   = SIZE / 2 + pan.x - dw / 2
    const dy   = SIZE / 2 + pan.y - dh / 2
    ctx.save()
    ctx.beginPath()
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(img, dx, dy, dw, dh)
    ctx.restore()
    onApply(out.toDataURL('image/png'))
  }

  return (
    <div className="ls-av-backdrop" onClick={onCancel}>
      <div className="ls-av-modal" onClick={e => e.stopPropagation()}>

        <div className="ls-av-modal__header">
          <span>Edit image</span>
          <button className="ls-av-modal__close" onClick={onCancel}>✕</button>
        </div>

        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="ls-av-modal__canvas"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        />

        <div className="ls-av-modal__zoom-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg>
          <input
            type="range" min="0.5" max="4" step="0.02"
            value={zoom}
            onChange={e => handleZoom(Number(e.target.value))}
            className="ls-av-zoom-slider"
          />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </div>

        <div className="ls-av-modal__actions">
          <button className="ls-av-btn ls-av-btn--cancel" onClick={onCancel}>Cancel</button>
          <button className="ls-av-btn ls-av-btn--apply"  onClick={handleApply}>Apply</button>
        </div>
      </div>
    </div>
  )
}

// ── Register page ──────────────────────────────────────────────────────────
type RegisterPageProps = {
  onNavigate?: (page: AppPage) => void
  profile?: Profile
  onProfileChange?: <K extends keyof Profile>(field: K, value: Profile[K]) => void
}

export default function RegisterPage({ onNavigate, profile, onProfileChange }: RegisterPageProps) {
  const [genreSearch,  setGenreSearch]  = useState('')
  const [rawImage,     setRawImage]     = useState<string | null>(null)
  const [showEditor,   setShowEditor]   = useState(false)
  const selectedGenres = profile?.interestGenres ?? ['Synthwave', 'Electronic', 'Dark Pop']

  const handleFieldChange = (field: keyof Profile, value: string | string[]) => {
    onProfileChange?.(field, value)
  }

  const handleFileInput = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      setRawImage(reader.result as string)
      setShowEditor(true)
    }
    reader.readAsDataURL(file)
  }

  const handleApply = (cropped: string) => {
    handleFieldChange('profileImage', cropped)
    setShowEditor(false)
  }

  return (
    <>
      {showEditor && rawImage && (
        <AvatarEditorModal
          rawImage={rawImage}
          onApply={handleApply}
          onCancel={() => setShowEditor(false)}
        />
      )}

      <div className="ls-auth-shell">
        <div className="ls-auth-card">
          <div className="ls-auth-brand">
            <div className="ls-brand-mark">L</div>
            <div>
              <div className="ls-brand-name">LinkedSound</div>
              <small>create your profile</small>
            </div>
          </div>

          <h1>Create account</h1>
          <p className="ls-auth-subtitle">Start matching with artists and producers.</p>

          <form className="ls-auth-form">
            <div className="ls-two-col">
              <label>
                First Name
                <input type="text" value={profile?.firstName ?? 'Kaelen'}
                  onChange={e => handleFieldChange('firstName', e.target.value)} />
              </label>
              <label>
                Last Name
                <input type="text" value={profile?.lastName ?? 'Voss'}
                  onChange={e => handleFieldChange('lastName', e.target.value)} />
              </label>
            </div>

            <label>
              NickName / Artistic name
              <input type="text" value={profile?.nickname ?? 'Kaelen Voss'}
                onChange={e => handleFieldChange('nickname', e.target.value)} />
            </label>

            {/* ── Profile photo ── */}
            <div className="ls-av-picker">
              <span className="ls-av-picker__label">Profile Photo</span>
              <div className="ls-av-picker__row">

                {/* Circle preview */}
                <button
                  type="button"
                  className="ls-av-circle"
                  onClick={() => document.getElementById('av-file-input')?.click()}
                  title="Click to change photo"
                >
                  {profile?.profileImage ? (
                    <img src={profile.profileImage} alt="Avatar" className="ls-av-circle__img" />
                  ) : (
                    <div className="ls-av-circle__empty">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                  )}
                </button>

                <input id="av-file-input" type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileInput(f) }} />

                {/* Aside */}
                <div className="ls-av-picker__aside">
                  <label className="ls-av-upload-btn" htmlFor="av-file-input">
                    📷 Choose photo
                  </label>
                  {profile?.profileImage ? (
                    <>
                      <button type="button" className="ls-av-edit-btn"
                        onClick={() => rawImage && setShowEditor(true)}>
                        ✏️ Edit crop
                      </button>
                      <p className="ls-av-hint">Click the circle to change · Edit to reframe</p>
                    </>
                  ) : (
                    <p className="ls-av-hint">JPG, PNG or WEBP · Max 10 MB</p>
                  )}
                </div>
              </div>
            </div>

            <label>
              Email
              <input type="email" value={profile?.email ?? 'kaelen@linkedsound.app'}
                onChange={e => handleFieldChange('email', e.target.value)} />
            </label>

            <label>
              Password
              <input type="password" value={profile?.password ?? 'password123'}
                onChange={e => handleFieldChange('password', e.target.value)} />
            </label>

            <label>
              Role
              <select value={profile?.role ?? 'Productor/Artista'}
                onChange={e => handleFieldChange('role', e.target.value)}>
                <option value="Productor">Productor</option>
                <option value="Artista">Artista</option>
                <option value="Productor/Artista">Productor/Artista</option>
              </select>
            </label>

            <div className="ls-profile-field wide-field">
              <label>Interest Genres</label>
              <div style={{ marginBottom: '8px' }}>
                <input type="text" placeholder="Buscar géneros..."
                  value={genreSearch}
                  onChange={e => setGenreSearch(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#fff' }}
                />
              </div>
              <div className="ls-genre-selector genre-selector">
                {AVAILABLE_GENRES.filter(g => g.toLowerCase().includes(genreSearch.toLowerCase())).map(genre => {
                  const isSelected = selectedGenres.includes(genre)
                  return (
                    <button key={genre} type="button"
                      className={`ls-genre-chip ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => {
                        if (isSelected) {
                          handleFieldChange('interestGenres', selectedGenres.filter(i => i !== genre))
                        } else if (selectedGenres.length < 6) {
                          handleFieldChange('interestGenres', [...selectedGenres, genre])
                        }
                      }}>
                      {genre}
                    </button>
                  )
                })}
              </div>
              {selectedGenres.length > 0 && (
                <small className="selected-genres-info">
                  Seleccionados ({selectedGenres.length}/6): {selectedGenres.join(', ')}
                </small>
              )}
            </div>

            <button type="button" className="ls-primary-button ls-auth-button"
              onClick={() => onNavigate?.('Validation')}>
              Continue
            </button>
          </form>

          <div className="ls-auth-footer">
            <span>Already have an account?</span>
            <button type="button" className="ls-text-button" onClick={() => onNavigate?.('Login')}>
              Sign in
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
