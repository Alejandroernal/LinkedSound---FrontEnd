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
import AdminPage from './pages/AdminPage'
import type { AppPage, Profile } from './types'

const pagePaths: Record<AppPage, string> = {
  Login: '/login',
  Register: '/register',
  Validation: '/validation',
  Discovery: '/discovery',
  Explorer: '/explorer',
  Messages: '/messages',
  Profile: '/profile',
  Admin: '/admin',
}

function App() {
  const navigate = useNavigate()
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)

  const [profile, setProfile] = useState<Profile>({
    firstName: 'Kaelen',
    lastName: 'Voss',
    nickname: 'Kaelen Voss',
    email: 'kaelen@linkedsound.app',
    password: 'password123',
    role: 'Usuario',
    category: 'Productor',
    location: 'Berlin, Germany',
    bio: 'Building cinematic soundscapes with modular synths, analog drums, and hybrid live vocals.',
    interestGenres: ['Synthwave', 'Electronic', 'Dark Pop'],
    tags: ['Synthwave', 'Analog', 'Live', 'Night Drive'],
    spotifyUrl: 'https://open.spotify.com/artist/kaelenvoss',
    instagramUrl: 'https://instagram.com/kaelenvoss',
    soundcloudUrl: 'https://soundcloud.com/kaelen-voss',
    profileImage: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
    allowEdit: true,
    allowPostRegister: true,
    teamDecision: '...',
    validationRule: '...',
    eliminationPolicy: '...',
    finalAction: '...',
  })

  const [adminProfile, setAdminProfile] = useState<Profile>({
    firstName: 'Admin',
    lastName: 'User',
    nickname: 'Admin User',
    email: 'admin@linkedsound.app',
    password: 'adminpassword123',
    role: 'Administrador',
    category: 'Productor',
    location: 'LinkedSound HQ',
    bio: 'Administrador del sistema LinkedSound. Gestión de usuarios y moderación de contenidos.',
    interestGenres: ['Synthwave', 'DarkElectro', 'Cyberpunk'],
    tags: ['Admin', 'Mod', 'System'],
    spotifyUrl: 'https://spotify.com',
    instagramUrl: 'https://instagram.com',
    soundcloudUrl: 'https://soundcloud.com',
    profileImage: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
    allowEdit: true,
    allowPostRegister: true,
  })

  const activeProfile = isAdminLoggedIn ? adminProfile : profile

  const handleProfileChange = (field: keyof Profile, value: string | boolean | string[]) => {
    if (isAdminLoggedIn) {
      setAdminProfile((prev) => ({ ...prev, [field]: value }))
    } else {
      setProfile((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleNavigate = (page: AppPage) => {
    navigate(pagePaths[page])
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={
          <LoginPage
            onNavigate={handleNavigate}
            onLoginAsAdmin={() => setIsAdminLoggedIn(true)}
          />
        }
      />
      <Route
        path="/register"
        element={
          <RegisterPage
            onNavigate={handleNavigate}
            profile={profile}
            onProfileChange={handleProfileChange}
          />
        }
      />
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
      
      {/* Rutas estándar con prop isAdminSession si la sesión de admin está activa */}
      <Route
        path="/discovery"
        element={<DashboardPage activePage="Discovery" onNavigate={handleNavigate} profile={activeProfile} isAdminSession={isAdminLoggedIn} />}
      />
      <Route
        path="/explorer"
        element={<ExplorePage activePage="Explorer" onNavigate={handleNavigate} profile={activeProfile} isAdminSession={isAdminLoggedIn} />}
      />
      <Route
        path="/messages"
        element={<MessagesPage activePage="Messages" onNavigate={handleNavigate} profile={activeProfile} isAdminSession={isAdminLoggedIn} />}
      />
      <Route
        path="/profile"
        element={
          <ProfilePage
            activePage="Profile"
            onNavigate={handleNavigate}
            profile={activeProfile}
            onProfileChange={handleProfileChange}
            isAdminSession={isAdminLoggedIn}
          />
        }
      />

      {/* Sistema para Administrador */}
      <Route
        path="/admin"
        element={
          isAdminLoggedIn ? (
            <AdminPage
              onNavigate={handleNavigate}
              onLogout={() => setIsAdminLoggedIn(false)}
              profile={activeProfile}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
