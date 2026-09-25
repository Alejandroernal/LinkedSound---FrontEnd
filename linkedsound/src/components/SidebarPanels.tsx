import { useState } from 'react'
import { queueItems, recentMatches, recentMatchesProfiles, soundFilters, type ProfileCard } from '../data/mockData'

const collaboratorOptions = ['Productor', 'Artista', 'Productor/Artista'] as const

export function RadarFilters() {
  const [selectedType, setSelectedType] = useState<(typeof collaboratorOptions)[number]>('Productor')
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Darkwave X', 'Industrial X'])

  const toggleGenre = (genre: string) => {
    setSelectedGenres((current) =>
      current.includes(genre)
        ? current.filter((item) => item !== genre)
        : [...current, genre],
    )
  }

  return (
    <div className="ls-panel">
      <div className="ls-panel-header">
        <h3>Radar Filters</h3>
        <button type="button">Reset</button>
      </div>

      <div className="ls-filter-block">
        <label>Distance Radius</label>
        <div className="ls-range-row">
          <input type="range" defaultValue={15} min={1} max={30} readOnly />
          <span>15 miles</span>
        </div>
        <div className="ls-range-scale">
          <span>In studio</span>
          <span>Worldwide</span>
        </div>
      </div>

      <div className="ls-filter-block">
        <label>Collaborator Type</label>
        <div className="ls-choice-list">
          {collaboratorOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={`ls-toggle ${selectedType === option ? 'is-selected' : ''}`}
              onClick={() => setSelectedType(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="ls-filter-block">
        <label>Genre Interests</label>
        <div className="ls-genre-selector">
          {soundFilters.map((genre) => {
            const isSelected = selectedGenres.includes(genre)

            return (
              <button
                key={genre}
                type="button"
                className={`ls-genre-chip ${isSelected ? 'is-selected' : ''}`}
                onClick={() => toggleGenre(genre)}
              >
                {genre}
              </button>
            )
          })}
        </div>
      </div>

      <div className="ls-verified-row">
        <label>Verified Crete Only</label>
        <button type="button" className="ls-switch on" aria-label="Verified creators only" />
      </div>
    </div>
  )
}

export function QueuePanel() {
  return (
    <div className="ls-panel queue-panel">
      <div className="ls-panel-header compact">
        <h3>Up Next in Queue</h3>
        <span>1/24</span>
      </div>
      <div className="ls-queue-list">
        {queueItems.map((item) => (
          <div key={item.name} className="ls-queue-item">
            <div className={`ls-avatar ${item.color}`}>{item.avatar}</div>
            <div className="ls-queue-copy">
              <strong>{item.name}</strong>
              <small>Beatmaker • Hyperpop / D...</small>
            </div>
            <span className="ls-percent">{item.percent}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

type MatchesPanelProps = {
  onSelectMatch?: (profile: ProfileCard) => void
}

export function MatchesPanel({ onSelectMatch }: MatchesPanelProps) {
  return (
    <div className="ls-panel matches-panel">
      <div className="ls-panel-header compact">
        <h3>Recent Mutual Matches</h3>
        <span>4 new</span>
      </div>
      <div className="ls-match-list">
        {recentMatches.map((match) => {
          const matchProfile = recentMatchesProfiles[match.name] ?? {
            name: match.name,
            role: 'Producer & Vocalist',
            location: 'Global',
            tags: ['Electronic', 'Vocal'],
            image: match.image,
            match: '90%',
            description: 'Collaborator and producer profile.',
            badge: 'Artist',
            isProfile: true,
            soundcloudHandle: match.name.toLowerCase().replace(/\s+/g, ''),
            soundcloudUrl: `https://soundcloud.com/search?q=${encodeURIComponent(match.name)}`,
            tracks: [
              {
                id: `m_${match.name}_1`,
                title: `${match.name} - Demo Track #1`,
                plays: '14.2k',
                duration: '3:45',
                genre: 'Electronic',
              },
            ],
          }

          return (
            <div
              key={match.name}
              className="ls-match-bubble ls-clickable-match"
              onClick={() => onSelectMatch?.(matchProfile)}
              title={`Ver trabajos en SoundCloud de ${match.name}`}
              style={{ cursor: 'pointer' }}
            >
              <img src={match.image} alt={match.name} />
              <span>{match.name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function LivePanel() {
  return (
    <div className="ls-panel live-panel">
      <div className="ls-panel-header compact">
        <h3>Live Jam Session</h3>
      </div>
      <p>Join the Los Angeles Late Night DAW jam with live synth layers and sample swaps.</p>
    </div>
  )
}
