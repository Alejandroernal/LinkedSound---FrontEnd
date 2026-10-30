import { useState, useRef, useEffect, useMemo } from 'react'
import {
  PiPlayFill,
  PiPauseFill,
  PiSpeakerHighBold,
  PiSpeakerSlashBold,
  PiMusicNotesFill,
  PiDownloadSimpleBold,
  PiWarningBold,
} from 'react-icons/pi'

interface ChatAudioPlayerProps {
  url: string
  name: string
  format?: string
  size?: string
  sender?: 'me' | 'them'
}

function formatAudioTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

export default function ChatAudioPlayer({
  url,
  name,
  format,
  size,
  sender = 'them',
}: ChatAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const waveformRef = useRef<HTMLDivElement | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1)
  const [hasError, setHasError] = useState(false)
  const [isHoveringWaveform, setIsHoveringWaveform] = useState(false)

  // Generar alturas deterministas basadas en el nombre del archivo para un espectro visual realista
  const waveformBars = useMemo(() => {
    const totalBars = 26
    const heights: number[] = []
    let seed = 42
    for (let i = 0; i < name.length; i++) {
      seed = (seed * 31 + name.charCodeAt(i)) % 99991
    }
    for (let i = 0; i < totalBars; i++) {
      seed = (seed * 9301 + 49297) % 233280
      const rand = seed / 233280
      // Variacion armonica entre 25% y 95%
      const height = Math.round(25 + rand * 70)
      heights.push(height)
    }
    return heights
  }, [name])

  const displayFormat = useMemo(() => {
    if (format) return format.toUpperCase().replace('.', '')
    if (name && name.includes('.')) {
      const ext = name.split('.').pop()
      if (ext && ext.length <= 5) return ext.toUpperCase()
    }
    return 'AUDIO'
  }, [format, name])

  // Sincronizar velocidad con el elemento audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed
    }
  }, [playbackSpeed])

  // Pausar audio cuando el componente se desmonte
  useEffect(() => {
    const currentAudio = audioRef.current
    return () => {
      if (currentAudio) {
        currentAudio.pause()
      }
    }
  }, [])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(() => {
        // Manejar bloqueo de reproduccion automatica del navegador
      })
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformRef.current || !duration || isNaN(duration)) return
    const rect = waveformRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, clickX / rect.width))
    const target = percent * duration
    if (audioRef.current) {
      audioRef.current.currentTime = target
    }
    setCurrentTime(target)
  }

  const toggleSpeed = () => {
    const speeds = [1, 1.5, 2]
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length
    const nextSpeed = speeds[nextIdx]
    setPlaybackSpeed(nextSpeed)
  }

  const toggleMute = () => {
    if (!audioRef.current) return
    const nextMuted = !isMuted
    audioRef.current.muted = nextMuted
    setIsMuted(nextMuted)
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  if (hasError) {
    return (
      <div className={`ls-chat-audio-player is-error sender-${sender}`}>
        <div className="ls-chat-audio-header">
          <div className="ls-chat-audio-info">
            <div className="ls-chat-audio-icon-box error">
              <PiWarningBold />
            </div>
            <div className="ls-chat-audio-details">
              <span className="ls-chat-audio-title" title={name}>
                {name || 'Archivo de audio'}
              </span>
              <span className="ls-chat-audio-meta error-text">
                No se pudo decodificar el audio
              </span>
            </div>
          </div>
          <a
            href={url}
            download={name}
            className="ls-chat-audio-download-btn"
            title="Descargar archivo"
          >
            <PiDownloadSimpleBold />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`ls-chat-audio-player sender-${sender} ${isPlaying ? 'is-playing' : ''}`}
    >
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime)
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration)
        }}
        onDurationChange={() => {
          if (audioRef.current) setDuration(audioRef.current.duration)
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false)
          setCurrentTime(0)
        }}
        onError={() => setHasError(true)}
      />

      {/* Cabecera con metadatos del archivo */}
      <div className="ls-chat-audio-header">
        <div className="ls-chat-audio-info">
          <div className={`ls-chat-audio-icon-box ${isPlaying ? 'glow' : ''}`}>
            <PiMusicNotesFill />
          </div>
          <div className="ls-chat-audio-details">
            <span className="ls-chat-audio-title" title={name}>
              {name || 'Pista de audio'}
            </span>
            <div className="ls-chat-audio-meta-row">
              {displayFormat && <span className="ls-chat-audio-badge">{displayFormat}</span>}
              {size && <span className="ls-chat-audio-size">{size}</span>}
            </div>
          </div>
        </div>

        <div className="ls-chat-audio-actions">
          <button
            type="button"
            className="ls-chat-audio-speed-btn"
            onClick={toggleSpeed}
            title="Cambiar velocidad de reproduccion"
          >
            {playbackSpeed}x
          </button>
          <a
            href={url}
            download={name}
            className="ls-chat-audio-download-btn"
            title="Descargar archivo de audio"
          >
            <PiDownloadSimpleBold />
          </a>
        </div>
      </div>

      {/* Cuerpo principal: Boton Play circular + Espectro interactivo */}
      <div className="ls-chat-audio-main">
        <button
          type="button"
          className="ls-chat-audio-play-btn"
          onClick={togglePlay}
          title={isPlaying ? 'Pausar' : 'Reproducir'}
        >
          {isPlaying ? (
            <PiPauseFill />
          ) : (
            <PiPlayFill style={{ marginLeft: '2px' }} />
          )}
        </button>

        <div
          ref={waveformRef}
          className="ls-chat-audio-waveform-wrapper"
          onClick={handleSeek}
          onMouseEnter={() => setIsHoveringWaveform(true)}
          onMouseLeave={() => setIsHoveringWaveform(false)}
          title="Haz clic en cualquier punto para avanzar o retroceder"
        >
          {/* Espectrograma de barras */}
          <div className="ls-chat-audio-bars">
            {waveformBars.map((barHeight, idx) => {
              const barProgress = (idx / waveformBars.length) * 100
              const isPassed = progressPercent >= barProgress
              return (
                <div
                  key={idx}
                  className={`ls-chat-audio-bar ${isPassed ? 'is-passed' : ''} ${
                    isPlaying ? 'is-dancing' : ''
                  }`}
                  style={{
                    height: `${barHeight}%`,
                    animationDelay: `${(idx % 6) * 0.12}s`,
                  }}
                />
              )
            })}
          </div>

          {/* Linea fina de progreso suave subyacente */}
          <div className="ls-chat-audio-progress-track">
            <div
              className="ls-chat-audio-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
            {isHoveringWaveform && (
              <div
                className="ls-chat-audio-progress-indicator"
                style={{ left: `${progressPercent}%` }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Pie del reproductor: Duracion transcurrida y Mute */}
      <div className="ls-chat-audio-footer">
        <span className="ls-chat-audio-time">
          {formatAudioTime(currentTime)} / {duration > 0 ? formatAudioTime(duration) : '--:--'}
        </span>

        {isPlaying && (
          <div className="ls-chat-audio-live-pill">
            <span className="ls-chat-audio-pulse-dot" />
            <span>Reproduciendo</span>
          </div>
        )}

        <button
          type="button"
          className="ls-chat-audio-mute-btn"
          onClick={toggleMute}
          title={isMuted ? 'Activar sonido' : 'Silenciar'}
        >
          {isMuted ? <PiSpeakerSlashBold /> : <PiSpeakerHighBold />}
        </button>
      </div>
    </div>
  )
}
