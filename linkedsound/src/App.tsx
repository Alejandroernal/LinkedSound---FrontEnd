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
import { defaultUserProfile } from './data/mockData'

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

  const [profile, setProfile] = useState<Profile>(defaultUserProfile)

  const handleProfileChange = <K extends keyof Profile>(field: K, value: Profile[K]) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const handleNavigate = (page: AppPage) => {
    navigate(pagePaths[page])
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage onNavigate={handleNavigate} />} />
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

