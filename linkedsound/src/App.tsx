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
import MatchModal from './components/MatchModal'
import type { AppPage, Profile, NotificationItem } from './types'
import {
  userNotifications as defaultUserNotifs,
  adminNotifications as defaultAdminNotifs,
  conversations as initialConversations,
  messagesByConversation as initialMessages,
  type ProfileCard,
  type Conversation,
  type Message,
} from './data/mockData'

const pagePaths: Record<AppPage, string> = {
  Login: '/login',
  Register: '/register',
  Validation: '/onboarding',
  Onboarding: '/onboarding',
  Discovery: '/discovery',
  Explorer: '/explorer',
  Messages: '/messages',
  Profile: '/profile',
  Admin: '/admin',
}

type AuthSession = {
  isLoggedIn: boolean
  role: 'user' | 'admin' | null
}

const STORAGE_KEY = 'linkedsound_auth_session'
const REGISTERED_USER_KEY = 'linkedsound_registered_user'

const DEFAULT_DEMO_USER_PROFILE: Profile = {
  firstName: 'Kaelen',
  lastName: 'Voss',
  nickname: 'Kaelen Voss',
  email: 'kaelen@linkedsound.app',
  password: 'password123',
  role: 'Usuario',
  category: 'Productor',
  location: 'Berlin, Germany',
  description: 'Building cinematic soundscapes with modular synths, analog drums, and hybrid live vocals. Specialized in dark synthwave, electronic arrangements, and immersive audio production.',
  interestGenres: ['Synthwave', 'Electronic', 'Dark Pop'],
  tags: ['Synthwave', 'Analog', 'Live', 'Night Drive'],
  spotifyUrl: 'https://open.spotify.com/artist/kaelenvoss',
  instagramUrl: 'https://instagram.com/kaelenvoss',
  soundcloudUrl: 'https://soundcloud.com/kaelen-voss',
  profileImage: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
  allowEdit: true,
  allowPostRegister: true,
}

const EMPTY_REGISTER_PROFILE: Profile = {
  firstName: '',
  lastName: '',
  nickname: '',
  email: '',
  password: '',
  role: 'Productor y Artista',
  category: 'Productor',
  location: 'Berlin, Germany',
  description: '',
  interestGenres: [],
  tags: [],
  spotifyUrl: '',
  instagramUrl: '',
  soundcloudUrl: '',
  profileImage: '',
  allowEdit: true,
  allowPostRegister: true,
}

const getInitialAuthSession = (): AuthSession => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed && typeof parsed.isLoggedIn === 'boolean' && parsed.isLoggedIn) {
        return {
          isLoggedIn: true,
          role: parsed.role === 'admin' ? 'admin' : 'user',
        }
      }
    }
  } catch {
    // fallback
  }
  return { isLoggedIn: false, role: null }
}

const getInitialRegisteredUser = (): Profile | null => {
  try {
    const stored = localStorage.getItem(REGISTERED_USER_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // fallback
  }
  return null
}

function App() {
  const navigate = useNavigate()
  const [authSession, setAuthSession] = useState<AuthSession>(getInitialAuthSession)
  const [registeredUser, setRegisteredUser] = useState<Profile | null>(getInitialRegisteredUser)
  const isAdminLoggedIn = authSession.isLoggedIn && authSession.role === 'admin'

  // Profile starts empty for registration, or initialized with registered / demo user if logged in
  const [profile, setProfile] = useState<Profile>(() => {
    const storedReg = getInitialRegisteredUser()
    if (storedReg) return storedReg
    const initialSession = getInitialAuthSession()
    if (initialSession.isLoggedIn && initialSession.role === 'user') return DEFAULT_DEMO_USER_PROFILE
    return EMPTY_REGISTER_PROFILE
  })

  // Estado de notificaciones para usuario normal y administrador
  const [userNotifs, setUserNotifs] = useState<NotificationItem[]>(defaultUserNotifs)
  const [adminNotifs, setAdminNotifs] = useState<NotificationItem[]>(defaultAdminNotifs)

  // Estado global para mensajes y conversaciones matcheadas
  const [conversationsList, setConversationsList] = useState<Conversation[]>(initialConversations)
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>(initialMessages)
  const [activeChatId, setActiveChatId] = useState<string>('')
  const [matchedCard, setMatchedCard] = useState<ProfileCard | null>(null)

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

  const handleLoginAsAdmin = () => {
    const session: AuthSession = { isLoggedIn: true, role: 'admin' }
    setAuthSession(session)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  }

  const handleLoginAsUser = (email?: string) => {
    const session: AuthSession = { isLoggedIn: true, role: 'user' }
    setAuthSession(session)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))

    if (email && email.toLowerCase() === 'kaelen@linkedsound.app') {
      setProfile(DEFAULT_DEMO_USER_PROFILE)
    } else if (email && registeredUser && registeredUser.email && email.toLowerCase() === registeredUser.email.toLowerCase()) {
      setProfile(registeredUser)
    } else if (profile.email) {
      // Complete registration: persist registered user
      setRegisteredUser(profile)
      localStorage.setItem(REGISTERED_USER_KEY, JSON.stringify(profile))
    }
  }

  const handleSignOut = () => {
    setAuthSession({ isLoggedIn: false, role: null })
    localStorage.removeItem(STORAGE_KEY)
    // Clear registration draft so next registration starts empty
    setProfile(registeredUser || EMPTY_REGISTER_PROFILE)
    navigate('/login')
  }

  const [adminProfile, setAdminProfile] = useState<Profile>({
    firstName: 'Admin',
    lastName: 'User',
    nickname: 'Admin User',
    email: 'admin@linkedsound.app',
    password: 'adminpassword123',
    role: 'Administrador',
    category: 'Productor',
    location: 'LinkedSound HQ',
    description: 'Administrador del sistema LinkedSound. Encargado de la gestión integral de usuarios, moderación activa de contenidos comunitarios y supervisión de la plataforma musical.',
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
      setProfile((prev) => {
        const updated = { ...prev, [field]: value }
        if (registeredUser && registeredUser.email && prev.email === registeredUser.email) {
          setRegisteredUser(updated)
          localStorage.setItem(REGISTERED_USER_KEY, JSON.stringify(updated))
        }
        return updated
      })
    }
  }

  const handleNavigate = (page: AppPage) => {
    navigate(pagePaths[page])
  }

  // Handler de Conexión / Match Mutuo (Tinder Style) desde Discovery o Explorer
  const handleConnectProfile = (card: ProfileCard) => {
    const cardName = card.nickname || ('firstName' in card ? card.firstName : '') || 'Artista'
    const convId = card.id || cardName.toLowerCase().replace(/[^a-z0-9]/g, '-')

    // Se realiza el Match si el perfil tiene preLiked === true o por defecto
    const isMatch = card.preLiked === true || card.preLiked !== false

    if (isMatch) {
      // 1. Notificación de Match
      const matchNotif: NotificationItem = {
        id: `notif_match_${Date.now()}`,
        title: `¡Nuevo Match con ${cardName}!`,
        message: `${cardName} también ha aceptado conectar contigo. ¡Hablad en Mensajes!`,
        timestamp: 'Justo ahora',
        read: false,
        type: 'match',
        linkPage: 'Messages',
      }
      setUserNotifs((prev) => [matchNotif, ...prev])

      // 2. Crear nueva conversación si no existe
      setConversationsList((prev) => {
        const exists = prev.some((c) => c.id === convId || c.name.toLowerCase() === cardName.toLowerCase())
        if (exists) return prev

        const newConv: Conversation = {
          id: convId,
          name: cardName,
          role: card.role || (card.isProfile !== false ? 'Productor/Artista' : 'Evento'),
          avatar: cardName.substring(0, 2).toUpperCase(),
          accent: 'purple',
          status: 'Conectado (Match)',
          preview: `¡Habéis conectado! Empieza la conversación.`,
          time: 'Ahora',
          unread: 1,
          profileImage: card.profileImage,
          location: card.location,
        }
        return [newConv, ...prev]
      })

      // 3. Crear mensaje de bienvenida inicial
      setMessagesMap((prev) => {
        if (prev[convId] && prev[convId].length > 0) return prev
        const welcomeMsg: Message = {
          id: `msg_match_${Date.now()}`,
          sender: 'them',
          text: `¡Hola ${profile.firstName || 'Kaelen'}! Qué genial que hayamos conectado por LinkedSound. Me encanta tu perfil y tu música.`,
          time: 'Justo ahora',
        }
        return {
          ...prev,
          [convId]: [welcomeMsg],
        }
      })

      // 4. Seleccionar la nueva conversación
      setActiveChatId(convId)

      // 5. Abrir Modal de Celebración de Match
      setMatchedCard(card)
    }
  }

  const unreadMessagesCount = conversationsList.reduce((acc, c) => acc + (c.unread || 0), 0)

  // Props comunes para la TopBar a través de páginas
  const topBarProps = {
    notifications: activeNotifications,
    onMarkNotificationAsRead: handleMarkNotificationAsRead,
    onMarkAllNotificationsAsRead: handleMarkAllNotificationsAsRead,
    onClearNotifications: handleClearNotifications,
    onSignOut: handleSignOut,
    unreadMessagesCount,
  }

  return (
    <>
      <Routes>
        {/* Rutas de Acceso / Autenticación */}
        <Route
          path="/login"
          element={
            authSession.isLoggedIn ? (
              authSession.role === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : (
                <Navigate to="/discovery" replace />
              )
            ) : (
              <LoginPage
                onNavigate={handleNavigate}
                onLoginAsAdmin={handleLoginAsAdmin}
                onLoginAsUser={handleLoginAsUser}
                registeredEmail={registeredUser?.email || profile.email}
                registeredPassword={registeredUser?.password || profile.password}
              />
            )
          }
        />
        <Route
          path="/register"
          element={
            authSession.isLoggedIn ? (
              authSession.role === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : (
                <Navigate to="/discovery" replace />
              )
            ) : (
              <RegisterPage
                onNavigate={handleNavigate}
                profile={profile}
                onProfileChange={handleProfileChange}
              />
            )
          }
        />
        <Route path="/validation" element={<Navigate to="/onboarding" replace />} />
        <Route
          path="/onboarding"
          element={
            authSession.isLoggedIn ? (
              <Navigate to="/discovery" replace />
            ) : (
              <ValidationPage
                onNavigate={handleNavigate}
                profile={profile}
                onProfileChange={handleProfileChange}
                onRegisterComplete={() => handleLoginAsUser(profile.email)}
              />
            )
          }
        />

        {/* Rutas Protegidas para Usuarios */}
        <Route
          path="/discovery"
          element={
            !authSession.isLoggedIn ? (
              <Navigate to="/login" replace />
            ) : (
              <DashboardPage
                activePage="Discovery"
                onNavigate={handleNavigate}
                profile={activeProfile}
                isAdminSession={isAdminLoggedIn}
                onConnectProfile={handleConnectProfile}
                {...topBarProps}
              />
            )
          }
        />
        <Route
          path="/explorer"
          element={
            !authSession.isLoggedIn ? (
              <Navigate to="/login" replace />
            ) : (
              <ExplorePage
                activePage="Explorer"
                onNavigate={handleNavigate}
                profile={activeProfile}
                isAdminSession={isAdminLoggedIn}
                onConnectProfile={handleConnectProfile}
                {...topBarProps}
              />
            )
          }
        />
        <Route
          path="/messages"
          element={
            !authSession.isLoggedIn ? (
              <Navigate to="/login" replace />
            ) : (
              <MessagesPage
                activePage="Messages"
                onNavigate={handleNavigate}
                profile={activeProfile}
                isAdminSession={isAdminLoggedIn}
                conversationsList={conversationsList}
                setConversationsList={setConversationsList}
                messagesMap={messagesMap}
                setMessagesMap={setMessagesMap}
                activeId={activeChatId}
                setActiveId={setActiveChatId}
                {...topBarProps}
              />
            )
          }
        />
        <Route
          path="/profile"
          element={
            !authSession.isLoggedIn ? (
              <Navigate to="/login" replace />
            ) : (
              <ProfilePage
                activePage="Profile"
                onNavigate={handleNavigate}
                profile={activeProfile}
                onProfileChange={handleProfileChange}
                isAdminSession={isAdminLoggedIn}
                {...topBarProps}
              />
            )
          }
        />

        {/* Ruta Protegida de Administrador */}
        <Route
          path="/admin"
          element={
            !authSession.isLoggedIn ? (
              <Navigate to="/login" replace />
            ) : authSession.role === 'admin' ? (
              <AdminPage
                onNavigate={handleNavigate}
                onLogout={handleSignOut}
                profile={activeProfile}
                {...topBarProps}
              />
            ) : (
              <Navigate to="/discovery" replace />
            )
          }
        />

        {/* Redirección por defecto */}
        <Route
          path="/"
          element={
            !authSession.isLoggedIn ? (
              <Navigate to="/login" replace />
            ) : authSession.role === 'admin' ? (
              <Navigate to="/admin" replace />
            ) : (
              <Navigate to="/discovery" replace />
            )
          }
        />
        <Route
          path="*"
          element={
            !authSession.isLoggedIn ? (
              <Navigate to="/login" replace />
            ) : authSession.role === 'admin' ? (
              <Navigate to="/admin" replace />
            ) : (
              <Navigate to="/discovery" replace />
            )
          }
        />
      </Routes>

      {/* Modal de Conexión Profesional (Match de Colaboración) */}
      <MatchModal
        isOpen={Boolean(matchedCard)}
        matchedCard={matchedCard}
        userProfileImage={activeProfile.profileImage}
        onClose={() => setMatchedCard(null)}
        onOpenChat={() => {
          setMatchedCard(null)
          handleNavigate('Messages')
        }}
      />
    </>
  )
}

export default App
