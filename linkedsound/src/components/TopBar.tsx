import Brand from './Brand'
import { PiCompassBold, PiMagnifyingGlassBold, PiChatCircleBold, PiUserBold, PiShieldCheckBold } from 'react-icons/pi'
import { navItems } from '../data/mockData'
import type { AppPage, Profile } from '../types'

type TopBarProps = {
  activePage?: AppPage
  onNavigate?: (page: AppPage) => void
  profile?: Profile
  isAdminSession?: boolean
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
}: TopBarProps) {
  const userName = profile?.nickname || profile?.firstName ? (profile.nickname || `${profile.firstName} ${profile.lastName ?? ''}`.trim()) : (isAdminSession ? 'Admin User' : 'Kaelen Voss')
  const userRole = profile?.role ?? (isAdminSession ? 'Administrador' : 'Productor/Artista')
  const userProfileImage = profile?.profileImage ?? ''

  // Generar iniciales dinámicas a partir del nickname o nombre
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <header className="ls-header">
      <Brand />

      <nav className="ls-main-nav" aria-label="Main navigation">
        {navItems.map((item) => (
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

      <div
        className="ls-profile-mini"
        onClick={() => onNavigate?.('Profile')}
        style={{ cursor: 'pointer' }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onNavigate?.('Profile')
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
    </header>
  )
}
