import type { ProfileCard } from '../data/mockData'

export default function RecommendationCard({ item }: { item: ProfileCard }) {
  return (
    <article className="ls-recommend-card">
      <div className="ls-card-visual">
        <img src={item.profileImage} alt={item.nickname || (item as any).name || ''} />
        <span className="ls-card-badge">{item.match}</span>
      </div>
      <div className="ls-card-body">
        <div className="ls-card-head">
          <h3>{item.nickname || (item as any).name}</h3>
          <span>{item.badge}</span>
        </div>
        <p className="ls-card-role">{item.role}</p>
        <p className="ls-card-desc">{item.description}</p>
        <div className="ls-mini-tags">
          {(item.interestGenres || item.tags || []).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        <div className="ls-card-actions">
          <button type="button" className="ls-secondary">View Profile</button>
          <button type="button" className="ls-primary">Connect</button>
        </div>
      </div>
    </article>
  )
}
