import type { UserProfile, SpotifyArtist } from '../types'

export interface AffinityScore {
  score: number // 50 - 99
  percentage: string // "94%"
  percentageFormatted: string // "94%"
  commonArtists: string[]
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
      commonArtists: [],
      commonGenres: [],
      summary: 'Afinidad musical y laboral estimada.',
    }
  }

  const myGenres = (currentUser.interestGenres || []).map((g) => g.toLowerCase().trim())
  const targetGenres = (targetUser.interestGenres || []).map((g) => g.toLowerCase().trim())

  const myArtists: SpotifyArtist[] = currentUser.favoriteArtists || []
  const targetArtists: SpotifyArtist[] = targetUser.favoriteArtists || []

  // 1. Artistas de Spotify en comun
  const commonArtistsSet = new Set<string>()
  for (const ma of myArtists) {
    const maName = (ma.name || '').toLowerCase().trim()
    const match = targetArtists.find((ta) => {
      if (ma.spotifyId && ta.spotifyId && ma.spotifyId === ta.spotifyId) return true
      return maName === (ta.name || '').toLowerCase().trim()
    })
    if (match) {
      commonArtistsSet.add(ma.name)
    }
  }
  const commonArtists = Array.from(commonArtistsSet)

  // 2. Generos de interes en comun
  const commonGenresSet = new Set<string>()
  for (const mg of myGenres) {
    if (targetGenres.some((tg) => tg === mg || tg.includes(mg) || mg.includes(tg))) {
      const original = (currentUser.interestGenres || []).find((orig) => orig.toLowerCase().trim() === mg) || mg
      commonGenresSet.add(original)
    }
  }

  // 3. Generos cruzados de Spotify
  const mySpotifyGenres = new Set<string>()
  myArtists.forEach((a) => (a.genres || []).forEach((g) => mySpotifyGenres.add(g.toLowerCase().trim())))

  const targetSpotifyGenres = new Set<string>()
  targetArtists.forEach((a) => (a.genres || []).forEach((g) => targetSpotifyGenres.add(g.toLowerCase().trim())))

  let sharedSpotifyGenreCount = 0
  mySpotifyGenres.forEach((g) => {
    if (targetSpotifyGenres.has(g)) {
      sharedSpotifyGenreCount++
      commonGenresSet.add(g.charAt(0).toUpperCase() + g.slice(1))
    }
  })

  const commonGenres = Array.from(commonGenresSet)

  // 4. Calculo del puntaje ponderado
  let baseScore = 58

  // Artistas en comun aportan hasta 30 puntos
  if (commonArtists.length > 0) {
    baseScore += Math.min(30, commonArtists.length * 15)
  }

  // Generos de interes aportan hasta 22 puntos
  if (commonGenres.length > 0) {
    baseScore += Math.min(22, commonGenres.length * 7)
  }

  // Generos de Spotify aportan hasta 12 puntos
  if (sharedSpotifyGenreCount > 0) {
    baseScore += Math.min(12, sharedSpotifyGenreCount * 4)
  }

  // Sinergia de roles (hasta 8 puntos)
  const roleA = (currentUser.role || '').toLowerCase()
  const roleB = (targetUser.role || '').toLowerCase()

  if (
    (roleA.includes('productor') && roleB.includes('artista')) ||
    (roleA.includes('artista') && roleB.includes('productor')) ||
    (roleA.includes('ambos') || roleB.includes('ambos'))
  ) {
    baseScore += 8
  } else if (roleA && roleB && roleA === roleB) {
    baseScore += 5
  }

  const finalScore = Math.min(99, Math.max(55, Math.round(baseScore)))
  const percentage = `${finalScore}%`

  let summary = 'Afinidad musical y laboral en LinkedSound.'
  if (commonArtists.length > 0 && commonGenres.length > 0) {
    summary = `Coinciden en ${commonArtists[0]} y estilos de ${commonGenres[0]}.`
  } else if (commonArtists.length > 0) {
    summary = `Ambos siguen a ${commonArtists.join(' y ')} en Spotify.`
  } else if (commonGenres.length > 0) {
    summary = `Comparten interés en ${commonGenres.slice(0, 2).join(' y ')}.`
  }

  return {
    score: finalScore,
    percentage,
    percentageFormatted: percentage,
    commonArtists,
    commonGenres,
    summary,
  }
}
