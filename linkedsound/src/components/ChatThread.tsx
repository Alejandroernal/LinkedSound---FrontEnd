import { useState, useRef, useEffect } from 'react'
import {
  PiDotsThreeVerticalBold,
  PiBroomBold,
  PiBellSimpleSlashBold,
  PiBellBold,
  PiPushPinFill,
  PiPushPinBold,
  PiProhibitBold,
  PiUserMinusBold,
  PiPaperclipBold,
  PiMusicNotesBold,
  PiImageBold,
  PiXBold,
  PiWarningBold,
} from 'react-icons/pi'
import type { Message, Conversation } from '../data/mockData'
import ChatAudioPlayer from './ChatAudioPlayer'

const ALLOWED_AUDIO_EXT = ['.wav', '.mp3', '.flac', '.ogg']
const ALLOWED_IMAGE_EXT = ['.jpg', '.jpeg', '.png']

function ChatImageAttachment({
  url,
  name,
  onClick,
}: {
  url: string
  name: string
  onClick: () => void
}) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div
        style={{
          padding: '10px 14px',
          borderRadius: '10px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'rgba(255, 255, 255, 0.75)',
          fontSize: '0.8rem',
          maxWidth: '260px',
        }}
      >
        <PiImageBold style={{ color: '#00e5ff', fontSize: '1.2rem', flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name || 'Imagen adjunta'}
        </span>
      </div>
    )
  }

  return (
    <div
      style={{
        borderRadius: '12px',
        overflow: 'hidden',
        maxWidth: '260px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onClick={onClick}
      title="Haz clic para ver la imagen a tamano completo"
    >
      <img
        src={url}
        alt={name}
        onError={() => setHasError(true)}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
    </div>
  )
}

type ChatThreadProps = {
  conversation: Conversation
  messages: Message[]
  onSendMessage?: (text: string, attachment?: Message['attachment']) => void
  onUnmatch?: () => void
  onClearChat?: () => void
  onToggleMute?: () => void
  onTogglePin?: () => void
  onToggleBlock?: () => void
  onInspectProfile?: () => void
}

export default function ChatThread({
  conversation,
  messages,
  onSendMessage,
  onUnmatch,
  onClearChat,
  onToggleMute,
  onTogglePin,
  onToggleBlock,
  onInspectProfile,
}: ChatThreadProps) {
  const [text, setText] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<{
    file: File
    name: string
    url: string
    type: 'audio' | 'image'
    format: string
    size: string
  } | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const threadEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewImageUrl) {
        setPreviewImageUrl(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [previewImageUrl])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    const isAudio = ALLOWED_AUDIO_EXT.includes(ext)
    const isImage = ALLOWED_IMAGE_EXT.includes(ext)

    if (!isAudio && !isImage) {
      setFileError('Formato no permitido. Solo se permiten audios (.WAV, .MP3, .FLAC, .OGG) e imágenes (.JPG, .JPEG, .PNG).')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setFileError(null)
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB'

    const reader = new FileReader()
    reader.onload = () => {
      const resultUrl = typeof reader.result === 'string' ? reader.result : ''
      setSelectedFile({
        file,
        name: file.name,
        url: resultUrl,
        type: isAudio ? 'audio' : 'image',
        format: ext.toUpperCase().replace('.', ''),
        size: sizeMB,
      })
    }
    reader.readAsDataURL(file)
  }

  const handleSend = () => {
    const trimmed = text.trim()
    if ((!trimmed && !selectedFile) || conversation.blocked) return

    let attachment: Message['attachment'] = undefined
    if (selectedFile) {
      attachment = {
        url: selectedFile.url,
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        format: selectedFile.format,
      }
    }

    onSendMessage?.(trimmed, attachment)
    setText('')
    setSelectedFile(null)
    setFileError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <section className="ls-chat-panel">
      <header className="ls-chat-header">
        <div
          className="ls-chat-user"
          onClick={() => onInspectProfile?.()}
          style={{ cursor: 'pointer' }}
          title={`Ver perfil de ${conversation.name}`}
        >
          {conversation.profileImage ? (
            <div className={`ls-avatar ${conversation.accent} small`} style={{ overflow: 'hidden', padding: 0 }}>
              <img
                src={conversation.profileImage}
                alt={conversation.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            </div>
          ) : (
            <div className={`ls-avatar ${conversation.accent}`}>{conversation.avatar}</div>
          )}
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {conversation.name}
              {conversation.pinned && <PiPushPinFill style={{ color: '#a855f7', fontSize: '0.9rem' }} title="Fijado" />}
              {conversation.muted && <PiBellSimpleSlashBold style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.9rem' }} title="Silenciado" />}
              {conversation.blocked && <PiProhibitBold style={{ color: '#ef4444', fontSize: '0.9rem' }} title="Bloqueado" />}
            </h3>
            <small>{conversation.role}</small>
          </div>
        </div>

        <div className="ls-chat-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
          <span className="ls-status-pill">
            {conversation.blocked ? 'Offline' : conversation.status === 'Online' ? 'Online' : 'Offline'}
          </span>

          {/* Menú de 3 puntitos */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="ls-chat-options-btn"
              style={{
                background: showMenu ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => setShowMenu((prev) => !prev)}
              title="Más opciones de chat"
            >
              <PiDotsThreeVerticalBold size={20} />
            </button>

            {showMenu && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '44px',
                  background: '#141628',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                  width: '200px',
                  zIndex: 50,
                  overflow: 'hidden',
                  padding: '6px 0',
                }}
              >
                <button
                  type="button"
                  className="ls-menu-option"
                  style={{
                    width: '100%',
                    padding: '8px 14px',
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onClick={() => {
                    onTogglePin?.()
                    setShowMenu(false)
                  }}
                >
                  {conversation.pinned ? <PiPushPinFill style={{ color: '#a855f7' }} /> : <PiPushPinBold />}
                  <span>{conversation.pinned ? 'Desfijar chat' : 'Fijar chat'}</span>
                </button>

                <button
                  type="button"
                  className="ls-menu-option"
                  style={{
                    width: '100%',
                    padding: '8px 14px',
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onClick={() => {
                    onToggleMute?.()
                    setShowMenu(false)
                  }}
                >
                  {conversation.muted ? <PiBellBold style={{ color: '#00e5ff' }} /> : <PiBellSimpleSlashBold />}
                  <span>{conversation.muted ? 'Desactivar silencio' : 'Silenciar chat'}</span>
                </button>

                <button
                  type="button"
                  className="ls-menu-option"
                  style={{
                    width: '100%',
                    padding: '8px 14px',
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onClick={() => {
                    onClearChat?.()
                    setShowMenu(false)
                  }}
                >
                  <PiBroomBold style={{ color: '#fbbf24' }} />
                  <span>Vaciar chat</span>
                </button>

                <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />

                <button
                  type="button"
                  className="ls-menu-option"
                  style={{
                    width: '100%',
                    padding: '8px 14px',
                    background: 'transparent',
                    border: 'none',
                    color: conversation.blocked ? '#34d399' : '#f87171',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onClick={() => {
                    onToggleBlock?.()
                    setShowMenu(false)
                  }}
                >
                  <PiProhibitBold />
                  <span>{conversation.blocked ? 'Desbloquear' : 'Bloquear'}</span>
                </button>

                {onUnmatch && (
                  <button
                    type="button"
                    className="ls-menu-option"
                    style={{
                      width: '100%',
                      padding: '8px 14px',
                      background: 'transparent',
                      border: 'none',
                      color: '#a855f7', // theme purple instead of red
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onClick={() => {
                      onUnmatch()
                      setShowMenu(false)
                    }}
                  >
                    <PiUserMinusBold />
                    <span>Eliminar Match</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="ls-chat-thread">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`ls-message-row ${message.sender === 'me' ? 'is-me' : 'is-them'}`}
          >
            {message.sender !== 'me' && (
              conversation.profileImage ? (
                <div
                  className={`ls-avatar ${conversation.accent} small`}
                  style={{ overflow: 'hidden', padding: 0, cursor: 'pointer' }}
                  onClick={() => onInspectProfile?.()}
                  title={`Ver perfil de ${conversation.name}`}
                >
                  <img
                    src={conversation.profileImage}
                    alt={conversation.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                </div>
              ) : (
                <div
                  className={`ls-avatar ${conversation.accent} small`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onInspectProfile?.()}
                  title={`Ver perfil de ${conversation.name}`}
                >
                  {conversation.avatar}
                </div>
              )
            )}

            <div
              className={`ls-message-bubble ${message.sender === 'me' ? 'me' : 'them'} ${
                message.attachment?.type === 'audio' ? 'has-audio' : ''
              }`}
            >
              {message.attachment && (
                <div className="ls-message-attachment" style={{ marginBottom: message.text ? '8px' : '0' }}>
                  {message.attachment.type === 'image' ? (
                    <ChatImageAttachment
                      url={message.attachment.url}
                      name={message.attachment.name}
                      onClick={() => setPreviewImageUrl(message.attachment?.url ?? null)}
                    />
                  ) : (
                    <ChatAudioPlayer
                      url={message.attachment.url}
                      name={message.attachment.name}
                      format={message.attachment.format}
                      size={message.attachment.size}
                      sender={message.sender}
                    />
                  )}
                </div>
              )}
              {message.text && <div>{message.text}</div>}
              <span className="ls-message-time">{message.time}</span>
            </div>
          </div>
        ))}
        <div ref={threadEndRef} />
      </div>

      {/* File validation error banner */}
      {fileError && (
        <div
          style={{
            padding: '6px 14px',
            background: 'rgba(239, 68, 68, 0.15)',
            borderTop: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <PiWarningBold size={16} />
          <span>{fileError}</span>
          <button
            type="button"
            onClick={() => setFileError(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
          >
            <PiXBold />
          </button>
        </div>
      )}

      {/* File preview bar before sending */}
      {selectedFile && (
        <div
          style={{
            padding: '8px 14px',
            background: 'rgba(168, 85, 247, 0.12)',
            borderTop: '1px solid rgba(168, 85, 247, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {selectedFile.type === 'image' ? (
            <PiImageBold style={{ color: '#00e5ff', fontSize: '1.3rem' }} />
          ) : (
            <PiMusicNotesBold style={{ color: '#a855f7', fontSize: '1.3rem' }} />
          )}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {selectedFile.name}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.6)' }}>
              Formato: <strong>{selectedFile.format}</strong> | Tamaño: {selectedFile.size}
            </div>
          </div>
          <button
            type="button"
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: 'none',
              color: '#f87171',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => {
              setSelectedFile(null)
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
            title="Quitar archivo"
          >
            <PiXBold size={14} />
          </button>
        </div>
      )}

      {/* Input de archivo oculto con restricción de formato */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".wav,.mp3,.flac,.ogg,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      <form
        className="ls-chat-composer"
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
      >
        <button
          type="button"
          className="ls-composer-attach"
          title="Adjuntar archivo (Audio: .WAV, .MP3, .FLAC, .OGG | Imagen: .JPG, .JPEG, .PNG)"
          onClick={() => fileInputRef.current?.click()}
          disabled={Boolean(conversation.blocked)}
        >
          <PiPaperclipBold size={18} />
        </button>
        <input
          type="text"
          placeholder={conversation.blocked ? 'Usuario bloqueado.' : `Mensaje para ${conversation.name}...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={Boolean(conversation.blocked)}
        />
        <button type="submit" className="ls-send-btn" disabled={(!text.trim() && !selectedFile) || Boolean(conversation.blocked)}>
          Enviar
        </button>
      </form>

      {/* Modal Lightbox para ampliar imágenes */}
      {previewImageUrl && (
        <div className="ls-modal-overlay" onClick={() => setPreviewImageUrl(null)}>
          <div
            className="ls-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              padding: '16px',
              background: '#141628',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.7)',
            }}
          >
            <button
              type="button"
              className="ls-modal-close"
              onClick={() => setPreviewImageUrl(null)}
              aria-label="Cerrar vista de imagen"
            >
              <PiXBold />
            </button>
            <img
              src={previewImageUrl}
              alt="Imagen adjunta a tamaño completo"
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '10px',
                display: 'block',
              }}
            />
          </div>
        </div>
      )}
    </section>
  )
}
