import Brand from './Brand'
import { navItems } from '../data/mockData'
import type { AppPage } from '../types'

type TopBarProps = {
  activePage?: AppPage
  onNavigate?: (page: AppPage) => void
  userName?: string
  userCategory?: string
  userProfileImage?: string
}

export default function TopBar({ activePage = 'Discovery', onNavigate, userName = 'Kaelen', userCategory = 'Producer', userProfileImage = '' }: TopBarProps) {
  return (
    <header className="ls-header">
      <Brand />

      <nav className="ls-main-nav" aria-label="Main navigation">
        {activePage === 'Explorer' && (
          <button className="ls-nav-search" type="button">
            Search tracks,
            <span> producers, systems...</span>
          </button>
        )}
        {navItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className={`ls-nav-item ${activePage === item.label ? 'is-active' : ''}`}
            onClick={() => onNavigate?.(item.label)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="ls-profile-mini">
        <div className="ls-mini-meta">
          <span className="ls-mini-name">{userName}</span>
          <span className="ls-mini-role">{userCategory}</span>
        </div>
        <div className="ls-avatar small" style={{ backgroundImage: userProfileImage ? `url(${userProfileImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          {!userProfileImage && 'KV'}
        </div>
      </div>
    </header>
  )
}
