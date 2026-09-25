import { useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import DashboardPage from './pages/DashboardPage'
import MessagesPage from './pages/MessagesPage'
import ExplorePage from './pages/ExplorePage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ValidationPage from './pages/ValidationPage'
import type { AppPage, Profile } from './types'

const pagePaths: Record<AppPage, string> = {
  Login: '/login',
  Register: '/register',
  Validation: '/validation',
  Discovery: '/discovery',
  Explorer: '/explorer',
  Messages: '/messages',
  Profile: '/profile',
}

function App() {
  const navigate = useNavigate()

  const [profile, setProfile] = useState<Profile>({
    nickname: 'Kaelen Voss',
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
    teamDecision: 'Permitir cambiar la categoría (Productor/Artista) después del alta, y si eso recalcula los matches generados por afinidad. -> Sí, permite cambiar la categoría y recalcularía matches.',
    validationRule: 'Definir el formato de validación de la URL de SoundCloud cargada manualmente (ej. exigir dominio soundcloud.com) antes de aceptarla como válida. -> Sí, que cargue manualmente y después que sea verificado ese link.',
    eliminationPolicy: 'Definir si "eliminar perfil" implica baja total de la cuenta o una desactivación temporal reversible. -> Baja total de la cuenta.',
    finalAction: 'Navegación tras confirmar la eliminación → pantalla de Login. -> Correcto, cuando se elimina el perfil que te direccione al login.',
  })

  const handleProfileChange = (field: keyof Profile, value: string | boolean | string[]) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const handleNavigate = (page: AppPage) => {
    navigate(pagePaths[page])
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage onNavigate={handleNavigate} />} />
      <Route path="/register" element={<RegisterPage onNavigate={handleNavigate} />} />
      <Route
        path="/validation"
        element={
          <ValidationPage
            onNavigate={handleNavigate}
            profile={profile}
            onProfileChange={handleProfileChange}
          />
        }
      />
      <Route
        path="/discovery"
        element={<DashboardPage activePage="Discovery" onNavigate={handleNavigate} profile={profile} />}
      />
      <Route
        path="/explorer"
        element={<ExplorePage activePage="Explorer" onNavigate={handleNavigate} profile={profile} />}
      />
      <Route
        path="/messages"
        element={<MessagesPage activePage="Messages" onNavigate={handleNavigate} profile={profile} />}
      />
      <Route
        path="/profile"
        element={
          <ProfilePage
            activePage="Profile"
            onNavigate={handleNavigate}
            profile={profile}
            onProfileChange={handleProfileChange}
          />
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App

