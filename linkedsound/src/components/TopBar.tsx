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
  PiTrashBold
} from 'react-icons/pi'
import { navItems } from '../data/mockData'
import type { AppPage, Profile, NotificationItem } from '../types'

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
}: TopBarProps) {
  const userName = profile?.nickname || (profile?.firstName ? `${profile.firstName} ${profile.lastName ?? ''}`.trim() : (isAdminSession ? 'Admin User' : 'Kaelen Voss'))
  const userRole = profile?.role === 'Administrador'
    ? 'Administrador'
    : (profile?.category || profile?.role || (isAdminSession ? 'Administrador' : 'Productor/Artista'))
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

  // Generar iniciales dinámicas
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

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

        <nav className="ls-main-nav" aria-label="Main navigation">
          {navItems.filter((item) => item.label !== 'Profile').map((item) => (
            <button
              key={item.label}
              type="button"
              className={`ls-nav-item ${activePage === item.label ? 'is-active' : ''}`}
              onClick={() => onNavigate?.(item.label)}
            >
              <span className="ls-nav-icon">{navIcons[item.label] ?? '•'}</span>
              <span className="ls-nav-label">{item.label}</span>
            </button>
          ))}

          {/* Pestaña visible permanentemente en la barra superior si la sesión es de Administrador */}
          {isAdminSession && (
            <button
              type="button"
              className={`ls-nav-item ls-admin-nav-pill ${activePage === 'Admin' ? 'is-active' : ''}`}
              onClick={() => onNavigate?.('Admin')}
            >
              <span className="ls-nav-icon">{navIcons['Admin']}</span>
              <span className="ls-nav-label">Admin Panel</span>
            </button>
          )}
        </nav>

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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="ls-notif-title">Notificaciones</span>
                    {unreadCount > 0 && (
                      <span className="ls-notif-count-chip">{unreadCount} nuevas</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
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
                      <p>No tienes notificaciones pendientes 🎉</p>
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        className={`ls-notif-item ${!item.read ? 'unread' : ''}`}
                        onClick={() => {
                          onMarkNotificationAsRead?.(item.id)
                          if (item.linkPage) {
                            onNavigate?.(item.linkPage)
                            setShowNotifications(false)
                          }
                        }}
                      >
                        <div className="ls-notif-item-body">
                          <div className="ls-notif-item-head">
                            <span className="ls-notif-item-title">{item.title}</span>
                            <span className="ls-notif-item-time">{item.timestamp}</span>
                          </div>
                          <p className="ls-notif-item-msg">{item.message}</p>
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
              {userProfileImage ? (
                <img
                  src={userProfileImage}
                  alt={userName}
                  className="ls-avatar small"
                  style={{ objectFit: 'cover', borderRadius: '50%' }}
                />
              ) : (
                <div
                  className="ls-avatar small"
                  style={{
                    background: isAdminSession ? '#ff3c6e' : 'linear-gradient(135deg, #b44dff, #8b5cf6)',
                    color: '#fff',
                    fontWeight: 'bold'
                  }}
                >
                  {getInitials(userName)}
                </div>
              )}
            </div>

            {/* Menú Desplegable de Perfil */}
            {showProfileMenu && (
              <div className="ls-profile-dropdown">
                <div className="ls-profile-dropdown-info">
                  <strong>{userName}</strong>
                  <small>{profile?.email || (isAdminSession ? 'admin@linkedsound.app' : 'kaelen@linkedsound.app')}</small>
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

