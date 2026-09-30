import { useState } from 'react'
import { PiFlagBold, PiXBold, PiCheckCircleBold, PiWarningBold } from 'react-icons/pi'

type ReportModalProps = {
  isOpen: boolean
  targetName: string
  targetType?: string // e.g. "Perfil", "Creador", "Objeto"
  onClose: () => void
}

const REPORT_REASONS = [
  'Contenido inapropiado o explícito',
  'Spam, estafa o publicidad engañosa',
  'Acoso, odio o lenguaje ofensivo',
  'Violación de derechos de autor / propiedad intelectual',
  'Suplantación de identidad',
  'Otro motivo',
]

export default function ReportModal({
  isOpen,
  targetName,
  targetType = 'Objeto',
  onClose,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>(REPORT_REASONS[0])
  const [customReason, setCustomReason] = useState<string>('')
  const [details, setDetails] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [submitted, setSubmitted] = useState<boolean>(false)

  if (!isOpen) return null

  const isOtherReason = selectedReason === 'Otro motivo'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isOtherReason && !customReason.trim()) {
      setError('Debes especificar cuál es el otro motivo del reporte.')
      return
    }
    if (!details.trim()) {
      setError('Completa los detalles obligatoriamente especificando lo sucedido.')
      return
    }
    setError('')
    setSubmitted(true)
    const finalReason = isOtherReason ? `Otro motivo: ${customReason.trim()}` : selectedReason
    console.log(`[Reporte enviado] Target: ${targetName} (${targetType}), Reason: ${finalReason}, Details: ${details}`)
  }

  const handleClose = () => {
    setSubmitted(false)
    setDetails('')
    setCustomReason('')
    setError('')
    setSelectedReason(REPORT_REASONS[0])
    onClose()
  }

  return (
    <div className="ls-modal-overlay" onClick={handleClose}>
      <div className="ls-modal-content" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="ls-modal-close" onClick={handleClose} aria-label="Cerrar">
          <PiXBold />
        </button>

        {submitted ? (
          <div className="ls-report-success">
            <div className="ls-report-success-icon">
              <PiCheckCircleBold />
            </div>
            <h3>¡Reporte enviado!</h3>
            <p>
              Gracias por ayudarnos a mantener la comunidad de LinkedSound segura y respetuosa. Hemos recibido tu reporte sobre <strong>{targetName}</strong> y nuestro equipo lo revisará a la brevedad.
            </p>
            <button type="button" className="ls-primary-button" onClick={handleClose}>
              Entendido
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="ls-report-form">
            <div className="ls-report-header">
              <div className="ls-report-badge-icon">
                <PiFlagBold />
              </div>
              <div>
                <h3>Reportar {targetType}</h3>
                <p className="ls-report-subtitle">
                  Estás reportando a: <strong>{targetName}</strong>
                </p>
              </div>
            </div>

            <div className="ls-form-group">
              <label htmlFor="report-reason" className="ls-form-label">
                Motivo principal del reporte
              </label>
              <select
                id="report-reason"
                className="ls-select-input"
                value={selectedReason}
                onChange={(e) => {
                  setSelectedReason(e.target.value)
                  if (error) setError('')
                }}
              >
                {REPORT_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            {isOtherReason && (
              <div className="ls-form-group">
                <label htmlFor="custom-reason" className="ls-form-label">
                  Especifica el otro motivo <small>(Obligatorio)</small>
                </label>
                <input
                  type="text"
                  id="custom-reason"
                  className="ls-select-input"
                  placeholder="Ej. Incumplimiento de términos pactados, spam no comercial, etc."
                  value={customReason}
                  onChange={(e) => {
                    setCustomReason(e.target.value)
                    if (error && e.target.value.trim()) setError('')
                  }}
                  style={{
                    borderColor: error && !customReason.trim() ? '#ef4444' : undefined,
                    boxShadow: error && !customReason.trim() ? '0 0 0 2px rgba(239, 68, 68, 0.25)' : undefined
                  }}
                />
              </div>
            )}

            <div className="ls-form-group">
              <label htmlFor="report-details" className="ls-form-label">
                Detalles del reporte <small>(Obligatorio/Detallar lo que sucede)</small>
              </label>
              <textarea
                id="report-details"
                className="ls-textarea-input"
                rows={4}
                placeholder={isOtherReason ? "Explica detalladamente las razones de este otro motivo..." : "Describe con precisión qué problema observas o qué normas está incumpliendo este perfil u objeto..."}
                value={details}
                onChange={(e) => {
                  setDetails(e.target.value)
                  if (error && e.target.value.trim()) setError('')
                }}
                style={{
                  borderColor: error && !details.trim() ? '#ef4444' : undefined,
                  boxShadow: error && !details.trim() ? '0 0 0 2px rgba(239, 68, 68, 0.25)' : undefined
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  margin: '8px 0 16px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#fca5a5',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  animation: 'fadeIn 0.2s ease-in-out'
                }}
              >
                <PiWarningBold style={{ fontSize: '1.2rem', color: '#ef4444', flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div className="ls-modal-actions">
              <button type="button" className="ls-secondary-button" onClick={handleClose}>
                Cancelar
              </button>
              <button type="submit" className="ls-danger-button">
                <PiFlagBold /> Enviar Reporte
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
