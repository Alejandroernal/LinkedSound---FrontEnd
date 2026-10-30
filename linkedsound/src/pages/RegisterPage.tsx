import { useState, useRef, useCallback, useEffect } from 'react'
import type { AppPage, Profile } from '../types'
import {
  PiWarningOctagonBold,
  PiEyeBold,
  PiEyeSlashBold,
  PiCaretDownBold,
  PiXBold,
} from 'react-icons/pi'

const AVAILABLE_GENRES = [
  'Synthwave', 'Electronic', 'Dark Pop', 'Hip Hop', 'Indie',
  'Tech House', 'Ambient', 'Jazz', 'R&B', 'Rock', 'Drum & Bass',
  'Lo-Fi', 'Cyberpunk', 'Industrial', 'Hyperpop', 'Techno', 'Trap Metal',
]

// ── Avatar editor modal (reutilizable) ──────────────────────────────────────
const CANVAS_W = 360
const CANVAS_H = 360
const CX = CANVAS_W / 2
const CY = CANVAS_H / 2
const CROP_BOX_SIZE = 260
const HALF_CROP = CROP_BOX_SIZE / 2

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
    const base = Math.max(CROP_BOX_SIZE / img.naturalWidth, CROP_BOX_SIZE / img.naturalHeight)
    const scale = base * z
    const dw = img.naturalWidth * scale
    const dh = img.naturalHeight * scale
    const dx = CX + pan.x - dw / 2
    const dy = CY + pan.y - dh / 2

    // 1. Dibujar imagen completa escalada y desplazada
    ctx.drawImage(img, dx, dy, dw, dh)

    // 2. Overlay oscuro dejando transparente el recorte cuadrangular
    const cropX = CX - HALF_CROP
    const cropY = CY - HALF_CROP

    ctx.save()
    ctx.fillStyle = 'rgba(10, 12, 22, 0.72)'
    // Sombras alrededor del marco cuadrado
    ctx.beginPath()
    ctx.rect(0, 0, CANVAS_W, cropY) // Top
    ctx.rect(0, cropY, cropX, CROP_BOX_SIZE) // Left
    ctx.rect(cropX + CROP_BOX_SIZE, cropY, CANVAS_W - (cropX + CROP_BOX_SIZE), CROP_BOX_SIZE) // Right
    ctx.rect(0, cropY + CROP_BOX_SIZE, CANVAS_W, CANVAS_H - (cropY + CROP_BOX_SIZE)) // Bottom
    ctx.fill()
    ctx.restore()

    // 3. Guia circular tenue para previsualizar como quedara en vistas circulares
    ctx.save()
    ctx.beginPath()
    ctx.arc(CX, CY, HALF_CROP, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([5, 5])
    ctx.stroke()
    ctx.restore()

    // 4. Marco cuadrangular principal con esquinas resaltadas
    ctx.save()
    ctx.strokeStyle = '#a855f7'
    ctx.lineWidth = 2
    ctx.strokeRect(cropX, cropY, CROP_BOX_SIZE, CROP_BOX_SIZE)

    // Esquineros estilizados
    const cornerLen = 16
    ctx.strokeStyle = '#c084fc'
    ctx.lineWidth = 3
    ctx.setLineDash([])

    // Top-left
    ctx.beginPath()
    ctx.moveTo(cropX, cropY + cornerLen)
    ctx.lineTo(cropX, cropY)
    ctx.lineTo(cropX + cornerLen, cropY)
    ctx.stroke()

    // Top-right
    ctx.beginPath()
    ctx.moveTo(cropX + CROP_BOX_SIZE - cornerLen, cropY)
    ctx.lineTo(cropX + CROP_BOX_SIZE, cropY)
    ctx.lineTo(cropX + CROP_BOX_SIZE, cropY + cornerLen)
    ctx.stroke()

    // Bottom-left
    ctx.beginPath()
    ctx.moveTo(cropX, cropY + CROP_BOX_SIZE - cornerLen)
    ctx.lineTo(cropX, cropY + CROP_BOX_SIZE)
    ctx.lineTo(cropX + cornerLen, cropY + CROP_BOX_SIZE)
    ctx.stroke()

    // Bottom-right
    ctx.beginPath()
    ctx.moveTo(cropX + CROP_BOX_SIZE - cornerLen, cropY + CROP_BOX_SIZE)
    ctx.lineTo(cropX + CROP_BOX_SIZE, cropY + CROP_BOX_SIZE)
    ctx.lineTo(cropX + CROP_BOX_SIZE, cropY + CROP_BOX_SIZE - cornerLen)
    ctx.stroke()

    ctx.restore()
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
    // Generar imagen final en proporcion cuadrada limpia 1:1 de 500x500 px
    const OUTPUT_SIZE = 500
    const out = document.createElement('canvas')
    out.width = OUTPUT_SIZE
    out.height = OUTPUT_SIZE
    const ctx = out.getContext('2d')!

    const z = zoomRef.current
    const pan = panRef.current
    const base = Math.max(CROP_BOX_SIZE / img.naturalWidth, CROP_BOX_SIZE / img.naturalHeight)
    const factor = OUTPUT_SIZE / CROP_BOX_SIZE

    const s = base * z * factor
    const dw = img.naturalWidth * s
    const dh = img.naturalHeight * s
    const dx = OUTPUT_SIZE / 2 + (pan.x * factor) - dw / 2
    const dy = OUTPUT_SIZE / 2 + (pan.y * factor) - dh / 2

    // Guardar imagen cuadrada completa sin recortar en circulo
    ctx.drawImage(img, dx, dy, dw, dh)
    onApply(out.toDataURL('image/jpeg', 0.92))
  }

  return (
    <div className="ls-av-backdrop" onClick={onCancel}>
      <div className="ls-av-modal" onClick={e => e.stopPropagation()}>

        <div className="ls-av-modal__header">
          <span>Editar foto de perfil</span>
          <button className="ls-av-modal__close" onClick={onCancel} aria-label="Cerrar"><PiXBold /></button>
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
          <button className="ls-av-btn ls-av-btn--cancel" onClick={onCancel}>Cancelar</button>
          <button className="ls-av-btn ls-av-btn--apply" onClick={handleApply}>Aplicar</button>
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
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [invalidFields, setInvalidFields] = useState<Record<string, boolean>>({})

  const selectedGenres = profile?.interestGenres ?? []

  const handleFieldChange = (field: keyof Profile, value: string | string[]) => {
    onProfileChange?.(field, value)
    if (invalidFields[field as string]) {
      setInvalidFields(prev => ({ ...prev, [field as string]: false }))
    }
    if (errorMsg) setErrorMsg(null)
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

    const errors: Record<string, boolean> = {}

    if (!fn) errors.firstName = true
    if (!ln) errors.lastName = true
    if (!em) errors.email = true
    if (!pw) errors.password = true

    if (!fn || !ln || !em || !pw) {
      setInvalidFields(errors)
      setErrorMsg('Por favor completa los campos obligatorios: Nombre, Apellido, Correo electrónico y Contraseña.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(em)) {
      setInvalidFields({ email: true })
      setErrorMsg('Por favor ingresa un correo electrónico válido (ejemplo: usuario@dominio.com).')
      return
    }

    if (pw.length < 8 || !/[A-Z]/.test(pw) || !/[a-z]/.test(pw) || !/[0-9]/.test(pw)) {
      setInvalidFields({ password: true })
      setErrorMsg('La contraseña no cumple con los requisitos de seguridad: Mínimo 8 caracteres, incluir al menos 1 letra mayúscula, 1 minúscula y 1 número.')
      return
    }

    if (selectedGenres.length < 3) {
      setInvalidFields({ genres: true })
      setErrorMsg('Debes seleccionar un mínimo de 3 géneros musicales de interés para continuar.')
      return
    }

    setInvalidFields({})
    setErrorMsg(null)
    onNavigate?.('Onboarding')
  }

  const currentAvatar = profile?.profileImage ?? rawImage

  // Requisitos de contraseña para indicadores dinámicos
  const currentPw = profile?.password ?? ''
  const pwHasMinLen = currentPw.length >= 8
  const pwHasUpper = /[A-Z]/.test(currentPw)
  const pwHasLower = /[a-z]/.test(currentPw)
  const pwHasNum = /[0-9]/.test(currentPw)

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

          <form className="ls-auth-form" autoComplete="off" onSubmit={(e) => { e.preventDefault(); handleContinue() }}>
            {/* ── Top Row: Foto de perfil + Inputs First Name & Last Name ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>

              {/* Circle preview */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <label
                  htmlFor="av-file-input"
                  className="ls-av-circle"
                  title="Haz clic para cargar foto de perfil"
                  style={{ cursor: 'pointer', display: 'flex' }}
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
                </label>
                <input
                  id="av-file-input"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) handleFileInput(f)
                    e.target.value = ''
                  }}
                />
              </div>

              {/* Inputs First Name & Last Name al lado */}
              <div className="ls-two-col" style={{ gap: '10px' }}>
                <label>
                  Nombre *
                  <input
                    type="text"
                    value={profile?.firstName ?? ''}
                    placeholder="Nombre"
                    autoComplete="off"
                    onChange={e => handleFieldChange('firstName', e.target.value)}
                    style={{
                      borderColor: invalidFields.firstName ? '#ef4444' : undefined,
                      background: invalidFields.firstName ? 'rgba(239, 68, 68, 0.05)' : undefined
                    }}
                  />
                </label>
                <label>
                  Apellido *
                  <input
                    type="text"
                    value={profile?.lastName ?? ''}
                    placeholder="Apellido"
                    autoComplete="off"
                    onChange={e => handleFieldChange('lastName', e.target.value)}
                    style={{
                      borderColor: invalidFields.lastName ? '#ef4444' : undefined,
                      background: invalidFields.lastName ? 'rgba(239, 68, 68, 0.05)' : undefined
                    }}
                  />
                </label>
              </div>
            </div>

            <label>
              Nombre artístico / Apodo
              <input
                type="text"
                value={profile?.nickname ?? ''}
                placeholder="Nombre artístico u apodo"
                autoComplete="off"
                onChange={e => handleFieldChange('nickname', e.target.value)}
              />
            </label>

            <label>
              Correo electrónico *
              <input
                type="email"
                value={profile?.email ?? ''}
                placeholder="correo@ejemplo.com"
                autoComplete="off"
                onChange={e => handleFieldChange('email', e.target.value)}
                style={{
                  borderColor: invalidFields.email ? '#ef4444' : undefined,
                  background: invalidFields.email ? 'rgba(239, 68, 68, 0.05)' : undefined
                }}
              />
            </label>

            <label>
              Contraseña *
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={profile?.password ?? ''}
                  placeholder="Crea una contraseña segura"
                  autoComplete="new-password"
                  onChange={e => handleFieldChange('password', e.target.value)}
                  style={{
                    width: '100%',
                    paddingRight: '42px',
                    borderColor: invalidFields.password ? '#ef4444' : undefined,
                    background: invalidFields.password ? 'rgba(239, 68, 68, 0.05)' : undefined
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.6)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <PiEyeSlashBold style={{ fontSize: '1.15rem' }} /> : <PiEyeBold style={{ fontSize: '1.15rem' }} />}
                </button>
              </div>
              <small style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.74rem', marginTop: '4px', display: 'block' }}>
                Requisitos: Mínimo 8 caracteres con al menos 1 mayúscula, 1 minúscula y 1 número.
              </small>

              {/* Indicadores dinámicos de contraseña */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: pwHasMinLen ? 'rgba(39, 174, 96, 0.18)' : 'rgba(255, 255, 255, 0.06)', color: pwHasMinLen ? '#34d399' : 'rgba(255, 255, 255, 0.45)', border: `1px solid ${pwHasMinLen ? 'rgba(52, 211, 153, 0.35)' : 'rgba(255, 255, 255, 0.1)'}` }}>
                  8+ caracteres
                </span>
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: pwHasUpper ? 'rgba(39, 174, 96, 0.18)' : 'rgba(255, 255, 255, 0.06)', color: pwHasUpper ? '#34d399' : 'rgba(255, 255, 255, 0.45)', border: `1px solid ${pwHasUpper ? 'rgba(52, 211, 153, 0.35)' : 'rgba(255, 255, 255, 0.1)'}` }}>
                  1 Mayúscula
                </span>
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: pwHasLower ? 'rgba(39, 174, 96, 0.18)' : 'rgba(255, 255, 255, 0.06)', color: pwHasLower ? '#34d399' : 'rgba(255, 255, 255, 0.45)', border: `1px solid ${pwHasLower ? 'rgba(52, 211, 153, 0.35)' : 'rgba(255, 255, 255, 0.1)'}` }}>
                  1 Minúscula
                </span>
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: pwHasNum ? 'rgba(39, 174, 96, 0.18)' : 'rgba(255, 255, 255, 0.06)', color: pwHasNum ? '#34d399' : 'rgba(255, 255, 255, 0.45)', border: `1px solid ${pwHasNum ? 'rgba(52, 211, 153, 0.35)' : 'rgba(255, 255, 255, 0.1)'}` }}>
                  1 Número
                </span>
              </div>
            </label>

            <label>
              Rol en la Plataforma
              <div style={{ position: 'relative', width: '100%' }}>
                <select
                  className="ls-auth-select"
                  value={profile?.role ?? 'Productor y Artista'}
                  onChange={e => handleFieldChange('role', e.target.value)}
                  style={{ width: '100%', paddingRight: '42px', appearance: 'none', WebkitAppearance: 'none' }}
                >
                  <option value="Productor">Productor</option>
                  <option value="Artista">Artista</option>
                  <option value="Productor y Artista">Productor y Artista (Ambos)</option>
                </select>
                <PiCaretDownBold
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: 'rgba(255, 255, 255, 0.75)',
                    fontSize: '1.1rem',
                  }}
                />
              </div>
            </label>

            <div className="ls-profile-field wide-field">
              <label>Géneros de Interés * (Mínimo 3)</label>
              <div style={{ marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Buscar géneros..."
                  autoComplete="off"
                  value={genreSearch}
                  onChange={e => setGenreSearch(e.target.value)}
                  className="ls-admin-search-input"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="ls-genre-selector genre-selector" style={{ borderColor: invalidFields.genres ? '#ef4444' : undefined }}>
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

            {errorMsg && (
              <div
                style={{
                  margin: '10px 0 14px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#fca5a5',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <PiWarningOctagonBold style={{ fontSize: '1.2rem', color: '#ef4444', flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

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
    </>
  )
}
