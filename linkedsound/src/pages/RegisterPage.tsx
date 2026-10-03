import { useState, useRef, useCallback, useEffect } from 'react'
import type { AppPage, Profile } from '../types'
import { PiXBold, PiWarningOctagonBold } from 'react-icons/pi'

const AVAILABLE_GENRES = [
  'Synthwave', 'Electronic', 'Dark Pop', 'Hip Hop', 'Indie',
  'Tech House', 'Ambient', 'Jazz', 'R&B', 'Rock', 'Drum & Bass',
  'Lo-Fi', 'Cyberpunk', 'Industrial', 'Hyperpop', 'Techno', 'Trap Metal',
]

// ── Avatar editor modal (reutilizable) ──────────────────────────────────────
const CANVAS_W = 360
const CANVAS_H = 300
const CX = CANVAS_W / 2
const CY = CANVAS_H / 2
const RADIUS = 120

export function AvatarEditorModal({
  rawImage,
  onApply,
  onCancel,
}: {
  rawImage: string
  onApply: (cropped: string) => void
  onCancel: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const panRef = useRef({ x: 0, y: 0 })
  const zoomRef = useRef(1)
  const dragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

    const z = zoomRef.current
    const pan = panRef.current
    const base = Math.max((RADIUS * 2) / img.naturalWidth, (RADIUS * 2) / img.naturalHeight)
    const scale = base * z
    const dw = img.naturalWidth * scale
    const dh = img.naturalHeight * scale
    const dx = CX + pan.x - dw / 2
    const dy = CY + pan.y - dh / 2

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
    ctx.lineWidth = 3
    ctx.stroke()
  }, [])

  useEffect(() => {
    const img = new Image()
    img.onload = () => { imgRef.current = img; draw() }
    img.src = rawImage
  }, [rawImage, draw])

  useEffect(() => { if (imgRef.current) draw() }, [zoom, draw])

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true
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
    const out = document.createElement('canvas')
    out.width = SIZE
    out.height = SIZE
    const ctx = out.getContext('2d')!
    const z = zoomRef.current
    const pan = panRef.current
    const base = Math.max(SIZE / img.naturalWidth, SIZE / img.naturalHeight)
    const s = base * z
    const dw = img.naturalWidth * s
    const dh = img.naturalHeight * s
    const dx = SIZE / 2 + pan.x - dw / 2
    const dy = SIZE / 2 + pan.y - dh / 2
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="22" y2="22" /></svg>
          <input
            type="range" min="0.5" max="4" step="0.02"
            value={zoom}
            onChange={e => handleZoom(Number(e.target.value))}
            className="ls-av-zoom-slider"
          />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="22" y2="22" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
        </div>

        <div className="ls-av-modal__actions">
          <button className="ls-av-btn ls-av-btn--cancel" onClick={onCancel}>Cancel</button>
          <button className="ls-av-btn ls-av-btn--apply" onClick={handleApply}>Apply</button>
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
  const [genreSearch, setGenreSearch] = useState('')
  const [rawImage, setRawImage] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [showPhotoActions, setShowPhotoActions] = useState(false)
  const [errorModalMsg, setErrorModalMsg] = useState<string | null>(null)
  const selectedGenres = profile?.interestGenres ?? []

  const handleFieldChange = (field: keyof Profile, value: string | string[]) => {
    onProfileChange?.(field, value)
  }

  const handleFileInput = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const res = reader.result as string
      setRawImage(res)
      setShowEditor(true)
    }
    reader.readAsDataURL(file)
  }

  const handleApply = (cropped: string) => {
    handleFieldChange('profileImage', cropped)
    setShowEditor(false)
  }

  const handleContinue = () => {
    const fn = profile?.firstName?.trim() || ''
    const ln = profile?.lastName?.trim() || ''
    const em = profile?.email?.trim() || ''
    const pw = profile?.password?.trim() || ''

    if (!fn || !ln || !em || !pw) {
      setErrorModalMsg('Por favor completa los campos obligatorios: Nombre, Apellido, Correo electrónico y Contraseña.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(em)) {
      setErrorModalMsg('Por favor ingresa un correo electrónico válido (ejemplo: usuario@dominio.com).')
      return
    }

    if (pw.length < 8 || !/[A-Z]/.test(pw) || !/[a-z]/.test(pw) || !/[0-9]/.test(pw)) {
      setErrorModalMsg('La contraseña no cumple con los requisitos de seguridad: Mínimo 8 caracteres, incluir al menos 1 letra mayúscula, 1 minúscula y 1 número.')
      return
    }

    if (selectedGenres.length < 3) {
      setErrorModalMsg('Debes seleccionar un mínimo de 3 géneros musicales según las especificaciones del SRS para continuar con el registro.')
      return
    }

    onNavigate?.('Onboarding')
  }

  const currentAvatar = profile?.profileImage ?? rawImage

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
              <small>crea tu perfil</small>
            </div>
          </div>

          <h1>Crear cuenta</h1>
          <p className="ls-auth-subtitle">Comienza a conectar con artistas y productores musicales.</p>

          <form className="ls-auth-form" onSubmit={(e) => { e.preventDefault(); handleContinue() }}>
            {/* ── Top Row: Foto de perfil + Inputs First Name & Last Name ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>

              {/* Circle preview */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button
                  type="button"
                  className="ls-av-circle"
                  onClick={() => setShowPhotoActions(prev => !prev)}
                  title="Haz clic para desplegar opciones de foto"
                >
                  {currentAvatar ? (
                    <img src={currentAvatar} alt="Avatar" className="ls-av-circle__img" />
                  ) : (
                    <div className="ls-av-circle__empty">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  )}
                </button>
                <input id="av-file-input" type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileInput(f) }} />
              </div>

              {/* Inputs First Name & Last Name al lado */}
              <div className="ls-two-col" style={{ gap: '10px' }}>
                <label>
                  Nombre *
                  <input type="text" value={profile?.firstName ?? ''} placeholder="Nombre"
                    onChange={e => handleFieldChange('firstName', e.target.value)} />
                </label>
                <label>
                  Apellido *
                  <input type="text" value={profile?.lastName ?? ''} placeholder="Apellido"
                    onChange={e => handleFieldChange('lastName', e.target.value)} />
                </label>
              </div>
            </div>

            {/* Opciones desplegables de foto al hacer clic sobre el círculo */}
            {showPhotoActions && (
              <div style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)', padding: '10px 14px', borderRadius: '12px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label className="ls-av-upload-btn" htmlFor="av-file-input" style={{ cursor: 'pointer', margin: 0 }}>
                  Elegir foto
                </label>
                {currentAvatar && rawImage && (
                  <button type="button" className="ls-av-edit-btn" onClick={() => setShowEditor(true)}>
                    Editar encuadre
                  </button>
                )}
                <span className="ls-av-hint" style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                  Formato JPG, PNG o WEBP
                </span>
              </div>
            )}

            <label>
              Nombre artístico / Apodo
              <input type="text" value={profile?.nickname ?? ''} placeholder="Nombre artístico u apodo"
                onChange={e => handleFieldChange('nickname', e.target.value)} />
            </label>

            <label>
              Correo electrónico *
              <input type="email" value={profile?.email ?? ''} placeholder="correo@ejemplo.com"
                onChange={e => handleFieldChange('email', e.target.value)} />
            </label>

            <label>
              Contraseña *
              <input type="password" value={profile?.password ?? ''} placeholder="Crea una contraseña segura"
                onChange={e => handleFieldChange('password', e.target.value)} />
              <small style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.74rem', marginTop: '4px', display: 'block' }}>
                Mínimo 8 caracteres con al menos 1 mayúscula, 1 minúscula y 1 número.
              </small>
            </label>

            <label>
              Rol en la Plataforma
              <select
                className="ls-auth-select"
                value={profile?.role ?? 'Productor y Artista'}
                onChange={e => handleFieldChange('role', e.target.value)}
              >
                <option value="Productor">Productor</option>
                <option value="Artista">Artista</option>
                <option value="Productor y Artista">Productor y Artista</option>
              </select>
            </label>

            <div className="ls-profile-field wide-field">
              <label>Géneros de Interés * (Mínimo 3)</label>
              <div style={{ marginBottom: '8px' }}>
                <input type="text" placeholder="Buscar géneros..."
                  value={genreSearch}
                  onChange={e => setGenreSearch(e.target.value)}
                  className="ls-admin-search-input"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="ls-genre-selector genre-selector">
                {AVAILABLE_GENRES.filter(g => g.toLowerCase().includes(genreSearch.toLowerCase())).length === 0 ? (
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', padding: '12px 0', textAlign: 'center', gridColumn: '1 / -1' }}>
                    No se encontraron géneros musicales que coincidan con "{genreSearch}".
                  </div>
                ) : (
                  AVAILABLE_GENRES.filter(g => g.toLowerCase().includes(genreSearch.toLowerCase())).map(genre => {
                    const isSelected = selectedGenres.includes(genre)
                    return (
                      <button key={genre} type="button"
                        className={`ls-genre-chip ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => {
                          if (isSelected) {
                            handleFieldChange('interestGenres', selectedGenres.filter(i => i !== genre))
                          } else {
                            handleFieldChange('interestGenres', [...selectedGenres, genre])
                          }
                        }}>
                        {genre}
                      </button>
                    )
                  })
                )}
              </div>
              <small className="selected-genres-info" style={{ marginTop: '8px', display: 'block', color: selectedGenres.length >= 3 ? '#34d399' : '#f87171' }}>
                Seleccionados: {selectedGenres.length} {selectedGenres.length < 3 ? '(Se requieren al menos 3)' : '(Válido)'}
              </small>
            </div>

            <button type="submit" className="ls-primary-button ls-auth-button">
              Continuar
            </button>
          </form>

          <div className="ls-auth-footer">
            <span>¿Ya tienes una cuenta?</span>
            <button type="button" className="ls-text-button" onClick={() => onNavigate?.('Login')}>
              Iniciar sesión
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Validación de Registro */}
      {errorModalMsg && (
        <div className="ls-modal-overlay" onClick={() => setErrorModalMsg(null)}>
          <div className="ls-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <button type="button" className="ls-modal-close" onClick={() => setErrorModalMsg(null)} aria-label="Cerrar">
              <PiXBold />
            </button>
            <div className="ls-report-header" style={{ marginBottom: '16px' }}>
              <div className="ls-report-badge-icon" style={{ background: 'rgba(255, 60, 110, 0.15)', color: '#ff3c6e', border: '1px solid rgba(255, 60, 110, 0.3)' }}>
                <PiWarningOctagonBold style={{ fontSize: '1.4rem' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#fff' }}>Campos Incompletos</h3>
                <p className="ls-report-subtitle" style={{ margin: '4px 0 0' }}>
                  Completa los datos requeridos
                </p>
              </div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '20px' }}>
              <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                {errorModalMsg}
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="ls-primary-button"
                onClick={() => setErrorModalMsg(null)}
                style={{ width: '100%' }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
