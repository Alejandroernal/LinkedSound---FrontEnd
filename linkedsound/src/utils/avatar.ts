import type { SyntheticEvent } from 'react'

export const DEFAULT_AVATAR_URL = '/default-avatar.svg'

export function getProfileAvatarUrl(url?: string | null): string {
  const trimmed = typeof url === 'string' ? url.trim() : ''
  return trimmed.length > 0 ? trimmed : DEFAULT_AVATAR_URL
}

export function handleAvatarError(e: SyntheticEvent<HTMLImageElement>): void {
  const img = e.currentTarget
  if (img.dataset.fallbackApplied === 'true') return
  img.dataset.fallbackApplied = 'true'
  img.src = DEFAULT_AVATAR_URL
}
