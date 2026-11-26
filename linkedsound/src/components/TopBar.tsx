import { useState, useRef, useEffect } from 'react'
import Brand from './Brand'
import {
  PiCompassBold,
  PiMagnifyingGlassBold,
  PiChatCircleBold,
  PiUserBold,
  PiShieldCheckBold,
  PiBellBold,
  PiSignOutBold,
  PiCheckCircleBold,
  PiTrashBold,
  PiHandshakeBold,
  PiCheckBold,
  PiChatCircleTextBold,
} from 'react-icons/pi'
import type { AppPage, Profile, NotificationItem } from '../types'
import { navItems } from '../types'
import { getProfileAvatarUrl, handleAvatarError } from '../utils/avatar'

type TopBarProps = {
  activePage?: AppPage
  onNavigate?: (page: AppPage) => void
  profile?: Profile
  isAdminSession?: boolean
  notifications?: NotificationItem[]
  onMarkNotificationAsRead?: (id: string) => void
  onMarkAllNotificationsAsRead?: () => void
  onClearNotifications?: () => void
  onSignOut?: () => void
  unreadMessagesCount?: number
  onAcceptMatch?: (notification: NotificationItem) => void
  onOpenMatchChat?: (notification: NotificationItem) => void
}

const navIcons: Record<string, React.ReactNode> = {
  Discovery: <PiCompassBold />,
  Explorer: <PiMagnifyingGlassBold />,
  Messages: <PiChatCircleBold />,
  Profile: <PiUserBold />,
  Admin: <PiShieldCheckBold />,
}

export default function TopBar({
  activePage = 'Discovery',
  onNavigate,
  profile,
  isAdminSession = false,
  notifications = [],
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onClearNotifications,
  onSignOut,
  unreadMessagesCount,
  onAcceptMatch,
  onOpenMatchChat,
}: TopBarProps) {
  const userName = profile?.nickname || (profile?.firstName ? `${profile.firstName} ${profile.lastName ?? ''}`.trim() : (isAdminSession ? 'Administrador' : 'Mi Perfil'))
  const userRole = isAdminSession || profile?.accountRole === 'Administrador'
    ? 'Administrador'
    : (profile?.role || profile?.category || 'Artista')
  const userProfileImage = profile?.profileImage ?? ''

  // Control del dropdown de notificaciones
  const [showNotifications, setShowNotifications] = useState(false)
  // Control del menu desplegable de perfil
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  // Control del modal de confirmación de Sign Out
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)

  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length
  const totalUnreadMessages = unreadMessagesCount ?? 0

  // Cerrar menús al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleConfirmSignOut = () => {
    setShowSignOutConfirm(false)
    setShowProfileMenu(false)
    if (onSignOut) {
      onSignOut()
    } else {
      onNavigate?.('Login')
    }
  }

  return (
    <>
      <header className="ls-header">
        <Brand />

        {!isAdminSession && (
          <nav className="ls-main-nav" aria-label="Main navigation">
            {navItems.filter((item) => item.label !== 'Profile').map((item) => {
              const isMessages = item.label === 'Messages'
              return (
                <button
                  key={item.label}
                  type="button"
                  className={`ls-nav-item ${activePage === item.label ? 'is-active' : ''}`}
                  onClick={() => onNavigate?.(item.label)}
                  style={{ position: 'relative' }}
                >
                  <span className="ls-nav-icon">{navIcons[item.label] ?? '•'}</span>
                  <span className="ls-nav-label">{item.label}</span>
                  {isMessages && totalUnreadMessages > 0 && (
                    <span className="ls-notif-badge" style={{ top: '0px', right: '0.000010px', zIndex: 5 }}>
                      {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        )}

        <div className="ls-topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '14px', justifySelf: 'end' }}>
          {/* BOTÓN / DROPDOWN DE NOTIFICACIONES */}
          <div className="ls-notif-wrapper" ref={notifRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className={`ls-notif-bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
              onClick={() => {
                setShowNotifications((prev) => !prev)
                setShowProfileMenu(false)
              }}
              title="Notificaciones"
              aria-label="Abrir centro de notificaciones"
            >
              <PiBellBold style={{ fontSize: '1.25rem' }} />
              {unreadCount > 0 && (
                <span className="ls-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div className="ls-notif-dropdown">
                <div className="ls-notif-header">
                  <div className="ls-notif-header-left">
                    <span className="ls-notif-title">Notificaciones</span>
                    {unreadCount > 0 && (
                      <span className="ls-notif-count-chip">{unreadCount} nuevas</span>
                    )}
                  </div>
                  <div className="ls-notif-header-actions">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className="ls-notif-action-sm"
                        onClick={onMarkAllNotificationsAsRead}
                        title="Marcar todas como leídas"
                      >
                        <PiCheckCircleBold /> Marcar leídas
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        className="ls-notif-action-sm danger"
                        onClick={onClearNotifications}
                        title="Limpiar todas"
                      >
                        <PiTrashBold /> Limpiar
                      </button>
                    )}
                  </div>
                </div>

                <div className="ls-notif-list">
                  {notifications.length === 0 ? (
                    <div className="ls-notif-empty">
                      <p>No tienes notificaciones pendientes</p>
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        className={`ls-notif-item ${!item.read ? 'unread' : ''}`}
                        onClick={() => {
                          if (item.type === 'match_request') {
                            setShowNotifications(false)
                            onAcceptMatch?.(item)
                          } else if (item.type === 'match') {
                            setShowNotifications(false)
                            onOpenMatchChat?.(item)
                          } else {
                            onMarkNotificationAsRead?.(item.id)
                            if (item.linkPage) {
                              onNavigate?.(item.linkPage)
                              setShowNotifications(false)
                            }
                          }
                        }}
                      >
                        <div className="ls-notif-item-body">
                          <div className="ls-notif-item-head">
                            <span className="ls-notif-item-title">
                              {item.type === 'match_request' && (
                                <PiHandshakeBold style={{ color: '#00e5ff', marginRight: '6px', verticalAlign: 'middle', fontSize: '1rem' }} />
                              )}
                              {item.type === 'match' && (
                                <PiHandshakeBold style={{ color: '#22c55e', marginRight: '6px', verticalAlign: 'middle', fontSize: '1rem' }} />
                              )}
                              {item.title}
                            </span>
                            <span className="ls-notif-item-time">{item.timestamp}</span>
                          </div>
                          <p className="ls-notif-item-msg">{item.message}</p>
                          {item.type === 'match_request' && (
                            <div className="ls-notif-actions-row" style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <button
                                type="button"
                                className="ls-primary-button"
                                style={{
                                  padding: '5px 12px',
                                  fontSize: '0.76rem',
                                  minHeight: 'unset',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: 'linear-gradient(135deg, #00e5ff, #00b0ff)',
                                  color: '#0a0d1a',
                                  fontWeight: 700,
                                  borderRadius: '6px',
                                  border: 'none',
                                  cursor: 'pointer',
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setShowNotifications(false)
                                  onAcceptMatch?.(item)
                                }}
                              >
                                <PiCheckBold /> Aceptar Match
                              </button>
                              <button
                                type="button"
                                className="ls-secondary-button"
                                style={{
                                  padding: '5px 10px',
                                  fontSize: '0.74rem',
                                  minHeight: 'unset',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: 'rgba(255, 255, 255, 0.06)',
                                  color: 'rgba(255, 255, 255, 0.8)',
                                  border: '1px solid rgba(255, 255, 255, 0.12)',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onMarkNotificationAsRead?.(item.id)
                                  if (item.linkPage) {
                                    onNavigate?.(item.linkPage)
                                    setShowNotifications(false)
                                  }
                                }}
                              >
                                Explorar
                              </button>
                            </div>
                          )}
                          {item.type === 'match' && (
                            <div className="ls-notif-actions-row" style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <button
                                type="button"
                                className="ls-primary-button"
                                style={{
                                  padding: '5px 12px',
                                  fontSize: '0.76rem',
                                  minHeight: 'unset',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: 'linear-gradient(135deg, #9a63ff, #7e46d8)',
                                  color: '#fff',
                                  fontWeight: 700,
                                  borderRadius: '6px',
                                  border: 'none',
                                  cursor: 'pointer',
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setShowNotifications(false)
                                  onOpenMatchChat?.(item)
                                }}
                              >
                                <PiChatCircleTextBold /> Abrir Chat
                              </button>
                            </div>
                          )}
                        </div>
                        {!item.read && <span className="ls-notif-unread-dot" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* MENÚ DE PERFIL Y SING OUT */}
          <div className="ls-profile-mini-wrap" ref={profileRef} style={{ position: 'relative' }}>
            <div
              className="ls-profile-mini"
              onClick={() => setShowProfileMenu((prev) => !prev)}
              style={{ cursor: 'pointer' }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setShowProfileMenu((prev) => !prev)
                }
              }}
            >
              <div className="ls-mini-meta">
                <span className="ls-mini-name">{userName}</span>
                <span className="ls-mini-role">{userRole}</span>
              </div>
              <img
                src={getProfileAvatarUrl(userProfileImage)}
                alt={userName}
                onError={handleAvatarError}
                className="ls-avatar small"
                style={{ objectFit: 'cover', borderRadius: '50%' }}
              />
            </div>

            {/* Menú Desplegable de Perfil */}
            {showProfileMenu && (
              <div className="ls-profile-dropdown">
                <div className="ls-profile-dropdown-info">
                  <strong>{userName}</strong>
                  <small>{profile?.email || (isAdminSession ? 'admin@linkedsound.app' : 'usuario@linkedsound.app')}</small>
                </div>
                <hr className="ls-dropdown-divider" />
                <button
                  type="button"
                  className="ls-profile-dropdown-item"
                  onClick={() => {
                    setShowProfileMenu(false)
                    onNavigate?.('Profile')
                  }}
                >
                  <PiUserBold /> Mi Perfil
                </button>
                {isAdminSession && (
                  <button
                    type="button"
                    className="ls-profile-dropdown-item admin"
                    onClick={() => {
                      setShowProfileMenu(false)
                      onNavigate?.('Admin')
                    }}
                  >
                    <PiShieldCheckBold /> Panel Admin
                  </button>
                )}
                <hr className="ls-dropdown-divider" />
                <button
                  type="button"
                  className="ls-profile-dropdown-item danger"
                  onClick={() => {
                    setShowProfileMenu(false)
                    setShowSignOutConfirm(true)
                  }}
                >
                  <PiSignOutBold /> Cerrar Sesión (Sign Out)
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MODAL DE CONFIRMACIÓN DE SIGN OUT */}
      {showSignOutConfirm && (
        <div className="ls-modal-overlay">
          <div className="ls-modal-card ls-signout-modal">
            <div className="ls-modal-header">
              <h3 style={{ margin: 0, color: '#ff3c6e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PiSignOutBold /> Cerrar Sesión
              </h3>
            </div>
            <div className="ls-modal-body" style={{ margin: '16px 0' }}>
              <p style={{ color: '#fff', fontSize: '0.95rem', margin: '0 0 8px 0' }}>
                ¿Estás seguro de que deseas salir de tu cuenta?
              </p>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.82rem', margin: 0 }}>
                Serás redirigido a la pantalla de inicio de sesión de LinkedSound.
              </p>
            </div>
            <div className="ls-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="ls-secondary-button"
                onClick={() => setShowSignOutConfirm(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="ls-danger-button"
                onClick={handleConfirmSignOut}
              >
                Sí, Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

