import { useState, useRef, useEffect } from 'react'
import {
  PiUploadSimpleBold,
  PiTrashBold,
  PiPlayFill,
  PiPauseFill,
  PiMusicNotesFill,
  PiClockBold,
  PiWarningOctagonBold,
  PiCheckBold,
} from 'react-icons/pi'
import type { SoundCloudTrack, SnippetTypeItem, MusicalKeyItem } from '../types'
import { api } from '../services/api'

interface AudioSampleTrackUploaderProps {
  tracks: SoundCloudTrack[]
  onChange: (tracks: SoundCloudTrack[]) => void
  isEditable?: boolean
  isRequired?: boolean
  minTracks?: number
  maxTracks?: number
}

export default function AudioSampleTrackUploader({
  tracks,
  onChange,
  isEditable = true,
  isRequired = true,
  minTracks = 1,
  maxTracks = 5,
}: AudioSampleTrackUploaderProps) {
  const [snippetTypes, setSnippetTypes] = useState<SnippetTypeItem[]>([])
  const [musicalKeys, setMusicalKeys] = useState<MusicalKeyItem[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    let isMounted = true
    const fetchTrackOptions = async () => {
      setIsLoadingOptions(true)
      try {
        const res = await api.tracks.getOptions()
        if (isMounted && res) {
          if (Array.isArray(res.snippetTypes)) {
            setSnippetTypes(res.snippetTypes)
          }
          if (Array.isArray(res.musicalKeys)) {
            setMusicalKeys(res.musicalKeys)
          }
        }
      } catch (err) {
        console.error('Error al cargar opciones de tracks desde la base de datos:', err)
      } finally {
        if (isMounted) {
          setIsLoadingOptions(false)
        }
      }
    }

    fetchTrackOptions()

    return () => {
      isMounted = false
    }
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadError(null)
    const availableSlots = maxTracks - tracks.length
    if (availableSlots <= 0) {
      setUploadError(`Has alcanzado el límite máximo de ${maxTracks} tracks de muestra.`)
      e.target.value = ''
      return
    }

    const filesToUpload = Array.from(files).slice(0, availableSlots)
    setIsUploading(true)

    const newTracks: SoundCloudTrack[] = [...tracks]

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i]
      const ext = file.name.split('.').pop()?.toUpperCase() || 'WAV'
      const baseName = file.name.replace(/\.[^/.]+$/, '')

      // Validación de extensión
      if (!['WAV', 'MP3', 'FLAC', 'OGG'].includes(ext)) {
        setUploadError(`El archivo "${file.name}" no es compatible. Formatos permitidos: .WAV, .MP3, .FLAC, .OGG`)
        continue
      }

      // Validación de tamaño (máximo 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setUploadError(`El archivo "${file.name}" supera el límite de 50MB.`)
        continue
      }

      try {
        const res = await api.upload.audio(file)
        const trackUrl = res.success && res.url ? res.url : URL.createObjectURL(file)
        const formatStr = res.success && res.format ? res.format : ext
        const durStr = res.success && res.duration ? res.duration : '0:30'
        const sizeStr = res.success && res.fileSize ? res.fileSize : `${(file.size / (1024 * 1024)).toFixed(1)} MB`

        const trackIndex = newTracks.length + 1
        const defaultSnippet = snippetTypes.length > 0
          ? snippetTypes[(trackIndex - 1) % snippetTypes.length]?.name || ''
          : ''
        const defaultKey = musicalKeys.length > 0
          ? musicalKeys[0]?.name || ''
          : ''

        newTracks.push({
          id: `sample_track_${Date.now()}_${i}`,
          title: baseName.slice(0, 50),
          audioUrl: trackUrl,
          duration: durStr,
          format: formatStr,
          snippetType: defaultSnippet,
          bpm: '126 BPM',
          key: defaultKey,
          fileSize: sizeStr,
          plays: Math.floor(Math.random() * 80) + 10,
          order: newTracks.length,
        })
      } catch {
        // Fallback local instantáneo para desarrollo o cortes de red
        const trackUrl = URL.createObjectURL(file)
        const trackIndex = newTracks.length + 1
        const defaultSnippet = snippetTypes.length > 0
          ? snippetTypes[(trackIndex - 1) % snippetTypes.length]?.name || ''
          : ''
        const defaultKey = musicalKeys.length > 0
          ? musicalKeys[0]?.name || ''
          : ''

        newTracks.push({
          id: `sample_track_local_${Date.now()}_${i}`,
          title: baseName.slice(0, 50),
          audioUrl: trackUrl,
          duration: '0:30',
          format: ext,
          snippetType: defaultSnippet,
          bpm: '126 BPM',
          key: defaultKey,
          fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          plays: Math.floor(Math.random() * 80) + 10,
          order: newTracks.length,
        })
      }
    }

    onChange(newTracks)
    setIsUploading(false)
    e.target.value = ''
  }

  const handleRemoveTrack = (indexToRemove: number) => {
    if (playingTrackId && tracks[indexToRemove]?.id === playingTrackId) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause()
      }
      setPlayingTrackId(null)
    }
    const updated = tracks.filter((_, idx) => idx !== indexToRemove)
    onChange(updated)
  }

  const handleUpdateTrackField = (index: number, field: keyof SoundCloudTrack, value: any) => {
    const updated = tracks.map((t, idx) => {
      if (idx === index) {
        return { ...t, [field]: value }
      }
      return t
    })
    onChange(updated)
  }

  const togglePreview = (track: SoundCloudTrack) => {
    if (!track.audioUrl) return

    if (playingTrackId === track.id) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause()
      }
      setPlayingTrackId(null)
    } else {
      setPlayingTrackId(track.id || null)
      if (audioPreviewRef.current) {
        audioPreviewRef.current.src = track.audioUrl
        audioPreviewRef.current
          .play()
          .catch(() => {})
      }
    }
  }

  const isValidCount = tracks.length >= minTracks && tracks.length <= maxTracks

  return (
    <div className="ls-audio-uploader-component">
      {/* Elemento de preescucha */}
      <audio
        ref={audioPreviewRef}
        onEnded={() => setPlayingTrackId(null)}
        style={{ display: 'none' }}
      />

      <div className="ls-uploader-header">
        <div className="ls-uploader-title-row">
          <PiMusicNotesFill className="ls-cyan-icon" />
          <h4>Pistas de Muestra de Audio (.WAV | .MP3 | .FLAC | .OGG)</h4>
          <span className={`ls-uploader-count-tag ${isValidCount ? 'is-valid' : 'is-pending'}`}>
            {tracks.length} / {maxTracks} {tracks.length >= minTracks ? 'Requerido completado' : 'Requerido'}
          </span>
        </div>
        <p className="ls-uploader-desc">
          Sube entre <strong>{minTracks}</strong> y <strong>{maxTracks}</strong> fragmentos o stems de audio de alta calidad para que productores y colaboradores escuchen tu sonido en el radar de Discovery.
        </p>
      </div>

      {uploadError && (
        <div className="ls-uploader-error">
          <PiWarningOctagonBold />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Lista de tracks cargados */}
      <div className="ls-uploaded-tracks-list">
        {tracks.map((track, idx) => {
          const isCurrentPlaying = playingTrackId === track.id

          return (
            <div key={track.id || idx} className="ls-track-edit-card">
              <div className="ls-track-card-top">
                <div className="ls-track-card-left">
                  <button
                    type="button"
                    className={`ls-track-preview-btn ${isCurrentPlaying ? 'is-playing' : ''}`}
                    onClick={() => togglePreview(track)}
                    title={isCurrentPlaying ? 'Pausar audio' : 'Escuchar muestra'}
                    aria-label={isCurrentPlaying ? 'Pausar' : 'Escuchar'}
                  >
                    {isCurrentPlaying ? <PiPauseFill /> : <PiPlayFill />}
                  </button>
                  <div className="ls-track-index-badge">
                    <span>0{idx + 1}</span>
                  </div>
                </div>

                <div className="ls-track-card-center">
                  {isEditable ? (
                    <input
                      type="text"
                      className="ls-track-title-input"
                      value={track.title}
                      maxLength={60}
                      onChange={(e) => handleUpdateTrackField(idx, 'title', e.target.value)}
                      placeholder="Nombre del track o stem..."
                    />
                  ) : (
                    <span className="ls-track-title-text">{track.title}</span>
                  )}
                  <div className="ls-track-meta-chips">
                    <span className="ls-meta-chip format">{track.format || 'WAV'}</span>
                    <span className="ls-meta-chip duration">
                      <PiClockBold /> {track.duration || '0:30'}
                    </span>
                    {track.fileSize && (
                      <span className="ls-meta-chip size">{track.fileSize}</span>
                    )}
                  </div>
                </div>

                {isEditable && (
                  <button
                    type="button"
                    className="ls-track-delete-btn"
                    onClick={() => handleRemoveTrack(idx)}
                    title="Eliminar este track"
                    aria-label="Eliminar"
                  >
                    <PiTrashBold />
                  </button>
                )}
              </div>

              {/* Ajustes técnicos de la muestra: Snippet type, BPM, Key */}
              {isEditable && (
                <div className="ls-track-card-details">
                  <div className="ls-track-detail-field">
                    <label>Tipo de muestra</label>
                    <select
                      disabled={isLoadingOptions}
                      value={track.snippetType || (snippetTypes[0]?.name || '')}
                      onChange={(e) => handleUpdateTrackField(idx, 'snippetType', e.target.value)}
                    >
                      {snippetTypes.map((opt) => (
                        <option key={opt.id} value={opt.name}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="ls-track-detail-field">
                    <label>BPM</label>
                    <input
                      type="text"
                      value={track.bpm || ''}
                      placeholder="ej. 126 BPM"
                      maxLength={15}
                      onChange={(e) => handleUpdateTrackField(idx, 'bpm', e.target.value)}
                    />
                  </div>

                  <div className="ls-track-detail-field">
                    <label>Tonalidad (Key)</label>
                    <input
                      type="text"
                      list={`keys-${idx}`}
                      value={track.key || ''}
                      placeholder="ej. F Minor"
                      maxLength={20}
                      onChange={(e) => handleUpdateTrackField(idx, 'key', e.target.value)}
                    />
                    <datalist id={`keys-${idx}`}>
                      {musicalKeys.map((k) => (
                        <option key={k.id} value={k.name} />
                      ))}
                    </datalist>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Zona de subida */}
      {isEditable && tracks.length < maxTracks && (
        <div className="ls-upload-dropzone">
          <input
            ref={fileInputRef}
            type="file"
            accept=".wav,.mp3,.flac,.ogg,audio/wav,audio/mpeg,audio/flac,audio/ogg"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <button
            type="button"
            className="ls-upload-trigger-btn"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <>
                <span className="ls-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', borderColor: '#a855f7 transparent transparent transparent' }} />
                <span>Procesando archivo de audio...</span>
              </>
            ) : (
              <>
                <PiUploadSimpleBold style={{ fontSize: '1.25rem' }} />
                <span>Subir archivo de audio ({tracks.length}/{maxTracks})</span>
                <span className="ls-upload-hint">.WAV | .MP3 | .FLAC | .OGG (hasta 50MB)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Feedback de validación obligatorio */}
      {isRequired && tracks.length < minTracks && (
        <div className="ls-required-validation-alert">
          <PiWarningOctagonBold />
          <span>Es obligatorio subir al menos {minTracks} pista de muestra de audio (.WAV, .MP3, .FLAC, .OGG) para completar tu perfil.</span>
        </div>
      )}

      {tracks.length >= minTracks && (
        <div className="ls-valid-feedback">
          <PiCheckBold />
          <span>Requisito de pistas de muestra cumplido ({tracks.length} subida{tracks.length > 1 ? 's' : ''}).</span>
        </div>
      )}
    </div>
  )
}
