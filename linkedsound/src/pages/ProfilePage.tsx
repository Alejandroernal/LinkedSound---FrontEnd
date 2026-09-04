import { useState } from 'react'
import TopBar from '../components/TopBar'
import Footer from '../components/Footer'
import type { AppPage } from '../types'

type ProfilePageProps = {
  activePage?: AppPage
  onNavigate?: (page: AppPage) => void
}

export default function ProfilePage({ activePage, onNavigate }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false)

  const genreOptions = [
    'Synthwave',
    'Electronic',
    'Dark Pop',
    'Hip Hop',
    'Indie',
    'Tech House',
    'Ambient',
    'Jazz',
    'R&B',
    'Rock',
    'Drum & Bass',
    'Lo-Fi',
  ]

  const [profile, setProfile] = useState({
    name: 'Kaelen Voss',
    category: 'Productor',
    role: 'Producer',
    location: 'Berlin, Germany',
    bio: 'Building cinematic soundscapes with modular synths, analog drums, and hybrid live vocals.',
    genres: 'Electronic, Dark Pop, Live Performance',
    interestGenres: ['Synthwave', 'Electronic', 'Dark Pop'],
    tags: 'Synthwave, Analog, Live, Night Drive',
    spotify: 'https://open.spotify.com/artist/kaelenvoss',
    instagram: 'https://instagram.com/kaelenvoss',
    soundcloud: 'https://soundcloud.com/kaelen-voss',
    profileImage: '',
    allowEdit: true,
    allowPostRegister: true,
    teamDecision: 'Permitir cambiar la categoría (Productor/Artista) después del alta, y si eso recalcula los matches generados por afinidad.',
    validationRule: 'Definir el formato de validación de la URL de SoundCloud cargada manualmente (ej. exigir dominio soundcloud.com) antes de aceptarla como válida.',
    eliminationPolicy: 'Definir si “eliminar perfil” implica baja total de la cuenta o una desactivación temporal reversible.',
    finalAction: 'Navegación tras confirmar la eliminación → pantalla de Login.',
  })

  const handleChange = (field: keyof typeof profile, value: string | boolean | string[]) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        handleChange('profileImage', result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="ls-app-shell">
      <TopBar activePage={activePage} onNavigate={onNavigate} userName={profile.name} userCategory={profile.category} userProfileImage={profile.profileImage} />

      <main className="ls-page-content">
        <section className="ls-panel ls-page-panel">
          <div className="ls-profile-toolbar">
            <div className="ls-profile-spotlight">
              {isEditing ? (
                <div className="ls-profile-upload-wrap">
                  <div className="ls-avatar huge" style={{ backgroundImage: profile.profileImage ? `url(${profile.profileImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    {!profile.profileImage && 'KV'}
                  </div>
                  <label className="ls-profile-upload-label">
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                    Upload Photo
                  </label>
                </div>
              ) : (
                <div className="ls-avatar huge" style={{ backgroundImage: profile.profileImage ? `url(${profile.profileImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  {!profile.profileImage && 'KV'}
                </div>
              )}
              <div>
                <span className="ls-studio-tag">{profile.category}</span>
                <h2>{profile.name}</h2>
                <p>{profile.location} · {profile.genres}</p>
              </div>
            </div>

            <button type="button" className="ls-primary-button" onClick={() => setIsEditing((prev) => !prev)}>
              {isEditing ? 'Guardar cambios' : 'Editar perfil'}
            </button>
          </div>

          <div className="ls-profile-grid">
            <div className="ls-studio-card" style={{ gridColumn: '1 / -1' }}>
              <span className="ls-studio-tag">Biography</span>
              {isEditing ? (
                <textarea
                  value={profile.bio}
                  onChange={(event) => handleChange('bio', event.target.value)}
                />
              ) : (
                <p>{profile.bio}</p>
              )}
            </div>
          </div>

          <div className="ls-profile-form-grid">
            <div className="ls-profile-field">
              <label>Name</label>
              {isEditing ? (
                <input value={profile.name} onChange={(event) => handleChange('name', event.target.value)} />
              ) : (
                <span>{profile.name}</span>
              )}
            </div>

            <div className="ls-profile-field">
              <label>Role / Title</label>
              {isEditing ? (
                <input value={profile.role} onChange={(event) => handleChange('role', event.target.value)} />
              ) : (
                <span>{profile.role}</span>
              )}
            </div>

            <div className="ls-profile-field">
              <label>Categoría</label>
              {isEditing ? (
                <select value={profile.category} onChange={(event) => handleChange('category', event.target.value)}>
                  <option value="Productor">Productor</option>
                  <option value="Artista">Artista</option>
                  <option value="Productor/Artista">Productor/Artista</option>
                </select>
              ) : (
                <span>{profile.category}</span>
              )}
            </div>

            <div className="ls-profile-field wide-field">
              <label>Intereses de género</label>
              {isEditing ? (
                <div className="ls-genre-selector">
                  {genreOptions.map((genre) => {
                    const checked = profile.interestGenres.includes(genre)

                    return (
                      <button
                        key={genre}
                        type="button"
                        className={`ls-genre-chip ${checked ? 'is-selected' : ''}`}
                        onClick={() => {
                          const nextSelection = checked
                            ? profile.interestGenres.filter((item) => item !== genre)
                            : [...profile.interestGenres, genre]

                          handleChange('interestGenres', nextSelection.slice(0, 6))
                        }}
                      >
                        {genre}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="ls-genre-selector read-only">
                  {profile.interestGenres.map((genre) => (
                    <span key={genre} className="ls-genre-chip read-only-chip">
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="ls-profile-field">
              <label>Location</label>
              {isEditing ? (
                <input value={profile.location} onChange={(event) => handleChange('location', event.target.value)} />
              ) : (
                <span>{profile.location}</span>
              )}
            </div>

            <div className="ls-profile-field">
              <label>Spotify</label>
              {isEditing ? (
                <input value={profile.spotify} onChange={(event) => handleChange('spotify', event.target.value)} />
              ) : (
                <a href={profile.spotify} target="_blank" rel="noreferrer">{profile.spotify}</a>
              )}
            </div>

            <div className="ls-profile-field">
              <label>Instagram</label>
              {isEditing ? (
                <input value={profile.instagram} onChange={(event) => handleChange('instagram', event.target.value)} />
              ) : (
                <a href={profile.instagram} target="_blank" rel="noreferrer">{profile.instagram}</a>
              )}
            </div>

            <div className="ls-profile-field">
              <label>SoundCloud URL</label>
              {isEditing ? (
                <input value={profile.soundcloud} onChange={(event) => handleChange('soundcloud', event.target.value)} />
              ) : (
                <a href={profile.soundcloud} target="_blank" rel="noreferrer">{profile.soundcloud}</a>
              )}
            </div>
          </div>

          <div className="ls-rules-grid">
            <div className="ls-rule-card">
              <label className="ls-toggle-wrap">
                <span>Permite editar</span>
                <input
                  type="checkbox"
                  checked={profile.allowEdit}
                  onChange={(event) => handleChange('allowEdit', event.target.checked)}
                />
              </label>
            </div>

            <div className="ls-rule-card">
              <label className="ls-toggle-wrap">
                <span>Permite (post-registro)</span>
                <input
                  type="checkbox"
                  checked={profile.allowPostRegister}
                  onChange={(event) => handleChange('allowPostRegister', event.target.checked)}
                />
              </label>
            </div>

            <div className="ls-rule-card">
              <span className="ls-rule-title">[Decisión de equipo]</span>
              <p>{profile.teamDecision}</p>
            </div>

            <div className="ls-rule-card">
              <span className="ls-rule-title">[Decisión de equipo]</span>
              <p>{profile.validationRule}</p>
            </div>

            <div className="ls-rule-card">
              <span className="ls-rule-title">2.3.4 Eliminación de perfil</span>
              <p>{profile.eliminationPolicy}</p>
            </div>

            <div className="ls-rule-card">
              <span className="ls-rule-title">Navegación</span>
              <p>{profile.finalAction}</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
