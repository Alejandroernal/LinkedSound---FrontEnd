import { useState } from 'react'
import { soundFilters } from '../data/mockData'

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
