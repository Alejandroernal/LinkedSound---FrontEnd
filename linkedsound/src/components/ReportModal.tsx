import { useState } from 'react'
import { PiFlagBold, PiXBold, PiCheckCircleBold } from 'react-icons/pi'

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
  const [details, setDetails] = useState<string>('')
  const [submitted, setSubmitted] = useState<boolean>(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    console.log(`[Reporte enviado] Target: ${targetName} (${targetType}), Reason: ${selectedReason}, Details: ${details}`)
  }

  const handleClose = () => {
    setSubmitted(false)
    setDetails('')
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
                onChange={(e) => setSelectedReason(e.target.value)}
              >
                {REPORT_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            <div className="ls-form-group">
              <label htmlFor="report-details" className="ls-form-label">
                Detalles del reporte <small>(Obligatorio/Detallar lo que sucede)</small>
              </label>
              <textarea
                id="report-details"
                className="ls-textarea-input"
                rows={4}
                placeholder="Describe con precisión qué problema observas o qué normas está incumpliendo este perfil u objeto..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                required
              />
            </div>

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
