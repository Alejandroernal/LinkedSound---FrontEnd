/**
 * Convierte cualquier fecha, timestamp o fecha ISO de la base de datos a la
 * hora local del dispositivo del usuario (ej: "21:20" o "09:20 p. m.").
 *
 * @param dateInput Fecha ISO, timestamp o string de fecha en UTC
 * @param fallback Valor de respaldo si no es posible interpretar la fecha
 */
export const formatUserLocalTime = (dateInput?: string | Date | null, fallback?: string): string => {
  if (!dateInput) return fallback || ''

  try {
    let raw: any = dateInput
    if (typeof raw === 'string') {
      // Si la fecha viene de SQL como "2026-11-21 00:20:15" sin Z ni offset,
      // la interpretamos como UTC para que el navegador la convierta a la zona local.
      if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(raw)) {
        if (!raw.endsWith('Z') && !/[+-]\d{2}(:?\d{2})?$/.test(raw)) {
          raw = raw.replace(' ', 'T') + 'Z'
        }
      }
    }

    const d = new Date(raw)
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  } catch {
    // Si falla el parsing
  }

  // Si falló y hay un fallback de fecha
  if (fallback) {
    try {
      let rawFb: any = fallback
      if (typeof rawFb === 'string' && /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(rawFb)) {
        if (!rawFb.endsWith('Z') && !/[+-]\d{2}(:?\d{2})?$/.test(rawFb)) {
          rawFb = rawFb.replace(' ', 'T') + 'Z'
        }
      }
      const d = new Date(rawFb)
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    } catch {
      // Ignorar
    }
    return fallback
  }

  return typeof dateInput === 'string' ? dateInput : ''
}
