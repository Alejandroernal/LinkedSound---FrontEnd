import type { UserProfile } from '../types'

export interface AffinityScore {
  score: number // 50 - 99
  percentage: string // "94%"
  percentageFormatted: string // "94%"
  commonGenres: string[]
  summary: string
}

export function computeUserAffinity(
  currentUser?: UserProfile | null,
  targetUser?: UserProfile | null
): AffinityScore {
  if (!currentUser || !targetUser) {
    return {
      score: 85,
      percentage: '85%',
      percentageFormatted: '85%',
      commonGenres: [],
      summary: 'Afinidad musical y laboral estimada.',
    }
  }

  const myGenres = (currentUser.interestGenres || []).map((g) => g.toLowerCase().trim())
  const targetGenres = (targetUser.interestGenres || []).map((g) => g.toLowerCase().trim())

  // Generos de interes en comun
  const commonGenresSet = new Set<string>()
  for (const mg of myGenres) {
    if (targetGenres.some((tg) => tg === mg || tg.includes(mg) || mg.includes(tg))) {
      const original = (currentUser.interestGenres || []).find((orig) => orig.toLowerCase().trim() === mg) || mg
      commonGenresSet.add(original)
    }
  }

  const commonGenres = Array.from(commonGenresSet)

  // Calculo del puntaje ponderado
  let baseScore = 60

  // Generos de interes aportan hasta 30 puntos
  if (commonGenres.length > 0) {
    baseScore += Math.min(30, commonGenres.length * 10)
  }

  // Sinergia de roles (hasta 15 puntos)
  const roleA = (currentUser.role || '').toLowerCase()
  const roleB = (targetUser.role || '').toLowerCase()

  if (
    (roleA.includes('productor') && roleB.includes('artista')) ||
    (roleA.includes('artista') && roleB.includes('productor')) ||
    (roleA.includes('ambos') || roleB.includes('ambos'))
  ) {
    baseScore += 15
  } else if (roleA && roleB && roleA === roleB) {
    baseScore += 8
  }

  const finalScore = Math.min(99, Math.max(55, Math.round(baseScore)))
  const percentage = `${finalScore}%`

  let summary = 'Afinidad musical y laboral en LinkedSound.'
  if (commonGenres.length > 0) {
    summary = `Comparten interes en ${commonGenres.slice(0, 2).join(' y ')}.`
  }

  return {
    score: finalScore,
    percentage,
    percentageFormatted: percentage,
    commonGenres,
    summary,
  }
}
