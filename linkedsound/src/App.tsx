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
import type { AppPage, Profile, NotificationItem } from './types'
import { userNotifications as defaultUserNotifs, adminNotifications as defaultAdminNotifs } from './data/mockData'

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

  // Estado de notificaciones para usuario normal y administrador
  const [userNotifs, setUserNotifs] = useState<NotificationItem[]>(defaultUserNotifs)
  const [adminNotifs, setAdminNotifs] = useState<NotificationItem[]>(defaultAdminNotifs)

  const activeNotifications = isAdminLoggedIn ? adminNotifs : userNotifs

  const handleMarkNotificationAsRead = (id: string) => {
    if (isAdminLoggedIn) {
      setAdminNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    } else {
      setUserNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    }
  }

  const handleMarkAllNotificationsAsRead = () => {
    if (isAdminLoggedIn) {
      setAdminNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
    } else {
      setUserNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
    }
  }

  const handleClearNotifications = () => {
    if (isAdminLoggedIn) {
      setAdminNotifs([])
    } else {
      setUserNotifs([])
    }
  }

  const handleSignOut = () => {
    setIsAdminLoggedIn(false)
    navigate('/login')
  }

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
    soundcloudUrl: 'https://soundcloud',
    profileImage: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
    allowEdit: true,
    allowPostRegister: true,
  })

  const activeProfile = isAdminLoggedIn ? adminProfile : profile

  const handleProfileChange = (field: keyof Profile, value: any) => {
    if (isAdminLoggedIn) {
      setAdminProfile((prev) => ({ ...prev, [field]: value }))
    } else {
      setProfile((prev) => ({ ...prev, [field]: value }))
    }
  }


  const handleNavigate = (page: AppPage) => {
    navigate(pagePaths[page])
  }

  // Props comunes para la TopBar a través de páginas
  const topBarProps = {
    notifications: activeNotifications,
    onMarkNotificationAsRead: handleMarkNotificationAsRead,
    onMarkAllNotificationsAsRead: handleMarkAllNotificationsAsRead,
    onClearNotifications: handleClearNotifications,
    onSignOut: handleSignOut,
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
        element={
          <DashboardPage
            activePage="Discovery"
            onNavigate={handleNavigate}
            profile={activeProfile}
            isAdminSession={isAdminLoggedIn}
            {...topBarProps}
          />
        }
      />
      <Route
        path="/explorer"
        element={
          <ExplorePage
            activePage="Explorer"
            onNavigate={handleNavigate}
            profile={activeProfile}
            isAdminSession={isAdminLoggedIn}
            {...topBarProps}
          />
        }
      />
      <Route
        path="/messages"
        element={
          <MessagesPage
            activePage="Messages"
            onNavigate={handleNavigate}
            profile={activeProfile}
            isAdminSession={isAdminLoggedIn}
            {...topBarProps}
          />
        }
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
            {...topBarProps}
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
              onLogout={handleSignOut}
              profile={activeProfile}
              {...topBarProps}
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

