import Brand from './Brand'
import { PiCompassBold, PiMagnifyingGlassBold, PiChatCircleBold, PiUserBold } from 'react-icons/pi'
import { navItems } from '../data/mockData'
import type { AppPage, Profile } from '../types'

type TopBarProps = {
  activePage?: AppPage
  onNavigate?: (page: AppPage) => void
  profile?: Profile
}

const navIcons: Record<string, React.ReactNode> = {
  Discovery: <PiCompassBold />,
  Explorer: <PiMagnifyingGlassBold />,
  Messages: <PiChatCircleBold />,
  Profile: <PiUserBold />,
}

export default function TopBar({
  activePage = 'Discovery',
  onNavigate,
  profile,
}: TopBarProps) {
  const userName = profile?.nickname ?? 'Kaelen'
  const userRole = profile?.role ?? 'Productor/Artista'
  const userProfileImage = profile?.profileImage ?? ''

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
      </nav>

      <div className="ls-profile-mini">
        <div className="ls-mini-meta">
          <span className="ls-mini-name">{userName}</span>
          <span className="ls-mini-role">{userRole}</span>
        </div>
        <div
          className="ls-avatar small"
          style={{
            backgroundImage: userProfileImage ? `url(${userProfileImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {!userProfileImage && 'KV'}
        </div>
      </div>
    </header>
  )
}
