import { useState, useRef, useEffect, useMemo } from 'react'
import {
  PiPlayFill,
  PiPauseFill,
  PiCaretLeftBold,
  PiCaretRightBold,
  PiClockBold,
} from 'react-icons/pi'
import type { SoundCloudTrack } from '../types'
import { isLocalAudioTrack } from '../types'

interface LocalDemosPlayerProps {
  tracks: SoundCloudTrack[]
  userName?: string
  isOwner?: boolean
}

// Generador dinamico de envolvente de forma de onda segun la identidad de la pista
function generateTrackWaveform(seedStr: string, barCount: number = 48): number[] {
  let hash = 0
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i)
    hash |= 0
  }

  const bars: number[] = []
  for (let i = 0; i < barCount; i++) {
    const progress = i / barCount
    // Curva armonica de audio: intro gradual, subida ritmica, drop central y salida
    const envelope = Math.sin(progress * Math.PI)
    const harmonicA = Math.abs(Math.sin((hash + i * 13) * 0.18))
    const harmonicB = Math.abs(Math.cos((hash + i * 7) * 0.22))
    const calculatedHeight = Math.round(20 + envelope * 48 + (harmonicA * 0.6 + harmonicB * 0.4) * 30)
    bars.push(Math.min(98, Math.max(18, calculatedHeight)))
  }
  return bars
}

function formatSeconds(sec: number): string {
  if (isNaN(sec) || sec < 0) return '00:00'
  const mins = Math.floor(sec / 60)
  const secs = Math.floor(sec % 60)
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`
}

export default function LocalDemosPlayer({ tracks, userName = 'Artista' }: LocalDemosPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(30)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Filtrar tracks que son exclusivamente demos/muestras locales (.WAV, .MP3, .FLAC, .OGG)
  const sampleTracks = tracks && tracks.length > 0
    ? tracks.filter((t) => isLocalAudioTrack(t))
    : []

  const activeTrack = sampleTracks[currentIndex] || sampleTracks[0]

  useEffect(() => {
    // Cuando cambia el track, resetear reproducción
    setIsPlaying(false)
    setCurrentTime(0)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [currentIndex])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  if (!activeTrack) {
    return null
  }

  const totalDemos = sampleTracks.length
  const pageLabel = `${String(currentIndex + 1).padStart(2, '0')} / ${String(totalDemos).padStart(2, '0')}`

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalDemos - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < totalDemos - 1 ? prev + 1 : 0))
  }

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Si el audio no puede cargarse (URL externa o mock), simular reproducción visual
          setIsPlaying(true)
        })
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration)
      }
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const handleSeek = (indexRatio: number) => {
    const target = duration * indexRatio
    setCurrentTime(target)
    if (audioRef.current) {
      audioRef.current.currentTime = target
    }
  }

  // Simulación temporal si no hay audioUrl funcional real
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    if (isPlaying && (!activeTrack.audioUrl || audioRef.current?.error)) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false)
            return 0
          }
          return prev + 0.5
        })
      }, 500)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying, activeTrack.audioUrl, duration])

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const snippetBadge = activeTrack.snippetType || `Pista 0${currentIndex + 1}`
  const formatBadge = activeTrack.format || 'WAV 24bit'
  const bpmText = activeTrack.bpm ? `${activeTrack.bpm}` : '126 BPM'
  const keyText = activeTrack.key ? `${activeTrack.key}` : 'F Minor (Fm)'

  // Generacion dinamica de la onda sonora unica para la pista activa
  const waveformBars = useMemo(() => {
    const seed = `${activeTrack.id || ''}_${activeTrack.title || ''}_${activeTrack.bpm || ''}`
    return generateTrackWaveform(seed, 48)
  }, [activeTrack.id, activeTrack.title, activeTrack.bpm])

  return (
    <div className="ls-local-demos-container">
      {/* Audio oculto */}
      {activeTrack.audioUrl && (
        <audio
          ref={audioRef}
          src={activeTrack.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
          onEnded={handleEnded}
        />
      )}

      {/* Header de sección */}
      <div className="ls-local-demos-header">
        <div className="ls-local-demos-title-wrap">
          <div className="ls-local-demos-dot-title">
            <span className="ls-pulse-dot" />
            <h3 className="ls-local-demos-title">Demos y Fragmentos Locales</h3>
          </div>
          <p className="ls-local-demos-subtitle">
            Previsualizaciones crudas y trabajos en procesos subidos directamente por {userName}
          </p>
        </div>

        {totalDemos > 1 && (
          <div className="ls-local-demos-nav">
            <span className="ls-local-demos-counter">{pageLabel}</span>
            <div className="ls-local-demos-arrows">
              <button
                type="button"
                className="ls-demo-arrow-btn"
                onClick={handlePrev}
                title="Pista anterior"
                aria-label="Pista anterior"
              >
                <PiCaretLeftBold />
              </button>
              <button
                type="button"
                className="ls-demo-arrow-btn"
                onClick={handleNext}
                title="Siguiente pista"
                aria-label="Siguiente pista"
              >
                <PiCaretRightBold />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Card interactiva de la demo activa */}
      <div className="ls-demo-player-card">
        {/* Fila de Badges superiores */}
        <div className="ls-demo-badges-row">
          <div className="ls-demo-badges-left">
            <span className="ls-demo-badge-violet">{snippetBadge}</span>
            <span className="ls-demo-badge-outline">{formatBadge}</span>
          </div>
          <div className="ls-demo-time-badge">
            <PiClockBold />
            <span>
              {formatSeconds(currentTime)} / {formatSeconds(duration)}
            </span>
          </div>
        </div>

        {/* Título y metadatos */}
        <div className="ls-demo-track-info">
          <h4 className="ls-demo-track-title">{activeTrack.title}</h4>
          <div className="ls-demo-track-meta">
            <span className="ls-demo-meta-tag">• {bpmText}</span>
            <span className="ls-demo-meta-tag">• {keyText}</span>
            <span className="ls-demo-meta-tag">• Inédito / Stems</span>
          </div>
        </div>

        {/* Waveform Visualizer interactivo */}
        <div className="ls-demo-waveform-wrapper" title="Haz clic en cualquier punto para adelantar o retroceder">
          <div className="ls-demo-waveform-bars">
            {waveformBars.map((h, idx) => {
              const barRatio = idx / waveformBars.length
              const isPast = progressPercent / 100 >= barRatio
              return (
                <div
                  key={idx}
                  className={`ls-demo-wave-bar ${isPast ? 'is-played' : ''}`}
                  style={{ height: `${h}%` }}
                  onClick={() => handleSeek(barRatio)}
                />
              )
            })}
          </div>
          <div
            className="ls-demo-waveform-cursor"
            style={{ left: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>

        {/* Controles de reproducción */}
        <div className="ls-demo-controls-row">
          <div className="ls-demo-play-left">
            <button
              type="button"
              className={`ls-demo-play-btn ${isPlaying ? 'is-active' : ''}`}
              onClick={togglePlay}
              title={isPlaying ? 'Pausar previsualización' : 'Reproducir previsualización'}
              aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
            >
              {isPlaying ? <PiPauseFill /> : <PiPlayFill />}
            </button>
            <div className="ls-demo-play-text">
              <span className="ls-demo-status-text">
                {isPlaying ? 'Reproduciendo vista previa' : 'Pausado'}
              </span>
              <span className="ls-demo-engine-text">Audio renderizado local</span>
            </div>
          </div>


        </div>

        {/* Puntos de paginación / carrusel */}
        {totalDemos > 1 && (
          <div className="ls-demo-dots-row">
            {sampleTracks.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                className={`ls-demo-dot ${dotIdx === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(dotIdx)}
                title={`Ver demo ${dotIdx + 1}`}
                aria-label={`Ver demo ${dotIdx + 1}`}
              />
            ))}
            <span className="ls-demo-swipe-hint">desliza demos</span>
          </div>
        )}
      </div>
    </div>
  )
}
