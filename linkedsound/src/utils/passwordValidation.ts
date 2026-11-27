export type PasswordChecks = {
  hasMinLen: boolean
  hasUpper: boolean
  hasLower: boolean
  hasNumber: boolean
  isValid: boolean
}

export const getPasswordRequirements = (password: string): PasswordChecks => {
  const hasMinLen = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  return {
    hasMinLen,
    hasUpper,
    hasLower,
    hasNumber,
    isValid: hasMinLen && hasUpper && hasLower && hasNumber,
  }
}

export const validatePasswordStrength = (password: string): string | null => {
  if (!password) {
    return 'Por favor, ingresa la nueva contraseña.'
  }
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres.'
  }
  if (!/[A-Z]/.test(password)) {
    return 'La contraseña debe incluir al menos una letra mayúscula.'
  }
  if (!/[a-z]/.test(password)) {
    return 'La contraseña debe incluir al menos una letra minúscula.'
  }
  if (!/[0-9]/.test(password)) {
    return 'La contraseña debe incluir al menos un número.'
  }
  return null
}
