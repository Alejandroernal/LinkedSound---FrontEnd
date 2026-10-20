import { useState, useEffect } from 'react'
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
import { api, getToken, setToken, clearToken } from './services/api'
import type {
  ProfileCard,
  Conversation,
  Message,
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

const EMPTY_PROFILE: Profile = {
  firstName: '',
  lastName: '',
  nickname: '',
  email: '',
  password: '',
  role: 'Artista',
  category: 'Artista',
  location: '',
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

const EMPTY_REGISTER_PROFILE: Profile = {
  firstName: '',
  lastName: '',
  nickname: '',
  email: '',
  password: '',
  role: 'Productor y Artista',
  category: 'Productor y Artista',
  location: '',
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

  // Profile starts with registered or empty profile if logged in
  const [profile, setProfile] = useState<Profile>(() => {
    const storedReg = getInitialRegisteredUser()
    if (storedReg) return storedReg
    return EMPTY_PROFILE
  })

  const [adminProfile, setAdminProfile] = useState<Profile>(EMPTY_PROFILE)

  // Cargar usuario autenticado real desde la base de datos de Supabase si existe token
  useEffect(() => {
    const token = getToken()
    if (!token) return

    api.auth.getMe().then((res) => {
      if (res.success && res.user) {
        const u = res.user
        const loaded: Profile = {
          ...EMPTY_PROFILE,
          ...u,
          role: u.role || 'Artista',
          category: u.role || 'Artista',
          interestGenres: u.interestGenres || [],
          allowEdit: true,
          allowPostRegister: true,
        }
        if (u.role === 'Administrador' || u.role === 'Admin') {
          setAdminProfile(loaded)
          setProfile(loaded)
          setAuthSession({ isLoggedIn: true, role: 'admin' })
        } else {
          setProfile(loaded)
          setRegisteredUser(loaded)
          setAuthSession({ isLoggedIn: true, role: 'user' })
        }
      } else {
        clearToken()
        setAuthSession({ isLoggedIn: false, role: null })
      }
    }).catch(() => {
      // Backend temporalmente no disponible
    })
  }, [])

  // Borrador de registro independiente para evitar datos precargados
  const [registrationDraft, setRegistrationDraft] = useState<Profile>(EMPTY_REGISTER_PROFILE)

  // Estado de notificaciones para usuario normal y administrador
  const [userNotifs, setUserNotifs] = useState<NotificationItem[]>([])
  const [adminNotifs, setAdminNotifs] = useState<NotificationItem[]>([])

  // Estado global para mensajes y conversaciones matcheadas
  const [conversationsList, setConversationsList] = useState<Conversation[]>([])
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({})
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

  const handleLoginAsAdmin = (backendUser?: any) => {
    const session: AuthSession = { isLoggedIn: true, role: 'admin' }
    setAuthSession(session)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))

    if (backendUser) {
      const formatted: Profile = {
        ...EMPTY_PROFILE,
        ...backendUser,
        role: 'Administrador',
        category: backendUser.role || 'Administrador',
        interestGenres: backendUser.interestGenres || [],
        allowEdit: true,
        allowPostRegister: true,
      }
      setAdminProfile(formatted)
      setProfile(formatted)
    }
  }

  const handleLoginAsUser = (_email?: string, backendUser?: Partial<Profile>) => {
    const session: AuthSession = { isLoggedIn: true, role: 'user' }
    setAuthSession(session)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))

    if (backendUser) {
      const merged: Profile = {
        ...EMPTY_PROFILE,
        ...backendUser,
        role: backendUser.role || 'Artista',
        category: backendUser.role || 'Artista',
        interestGenres: backendUser.interestGenres || [],
        allowEdit: true,
        allowPostRegister: true,
      }
      setProfile(merged)
      setRegisteredUser(merged)
      localStorage.setItem(REGISTERED_USER_KEY, JSON.stringify(merged))
      return
    }

    if (registeredUser) {
      setProfile(registeredUser)
    }
  }

  const handleRegistrationDraftChange = (field: keyof Profile, value: any) => {
    setRegistrationDraft((prev) => {
      if (field === 'role') {
        return { ...prev, role: value, category: value }
      }
      return { ...prev, [field]: value }
    })
  }

  const handleRegisterComplete = async (): Promise<{ success: boolean; message?: string }> => {
    const finalProfile: Profile = {
      ...registrationDraft,
      role: registrationDraft.role || 'Artista',
      category: registrationDraft.role || registrationDraft.category || 'Artista',
    }

    try {
      const res = await api.auth.register({
        email: finalProfile.email,
        password: finalProfile.password,
        firstName: finalProfile.firstName,
        lastName: finalProfile.lastName,
        nickname: finalProfile.nickname || `${finalProfile.firstName} ${finalProfile.lastName}`.trim(),
        role: finalProfile.role,
        location: finalProfile.location || 'No especificada',
        country: finalProfile.country,
        province: finalProfile.province,
        city: finalProfile.city,
        streetAddress: finalProfile.streetAddress,
        latitude: finalProfile.latitude,
        longitude: finalProfile.longitude,
        interestGenres: finalProfile.interestGenres || [],
        description: finalProfile.description,
        soundcloudUrl: finalProfile.soundcloudUrl || finalProfile.soundcloud,
        spotifyUrl: finalProfile.spotifyUrl || finalProfile.spotify,
        instagramUrl: finalProfile.instagramUrl || finalProfile.instagram,
        profileImage: finalProfile.profileImage,
      })

      if (!res.success) {
        return {
          success: false,
          message: res.message || 'Error al registrar el usuario en el servidor.',
        }
      }

      if (res.token) {
        setToken(res.token)
      }

      const savedUser: Profile = res.user
        ? {
            ...EMPTY_PROFILE,
            ...res.user,
            interestGenres: res.user.interestGenres || finalProfile.interestGenres || [],
            allowEdit: true,
            allowPostRegister: true,
          }
        : finalProfile

      setRegisteredUser(savedUser)
      localStorage.setItem(REGISTERED_USER_KEY, JSON.stringify(savedUser))
      setProfile(savedUser)
      const session: AuthSession = { isLoggedIn: true, role: 'user' }
      setAuthSession(session)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
      return { success: true }
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Error de conexión con el servidor al registrar el usuario.',
      }
    }
  }

  const handleSignOut = () => {
    setAuthSession({ isLoggedIn: false, role: null })
    localStorage.removeItem(STORAGE_KEY)
    clearToken()
    setConversationsList([])
    setMessagesMap({})
    setActiveChatId('')
    setUserNotifs([])
    setMatchedCard(null)
    // Borrador de registro limpio para el próximo alta
    setRegistrationDraft(EMPTY_REGISTER_PROFILE)
    navigate('/login')
  }

  const activeProfile = isAdminLoggedIn ? adminProfile : profile

  const handleProfileChange = (field: keyof Profile, value: any) => {
    if (isAdminLoggedIn) {
      setAdminProfile((prev) => ({ ...prev, [field]: value }))
    } else {
      setProfile((prev) => {
        const updated = { ...prev, [field]: value }
        if (field === 'role') {
          updated.category = value
        }
        if (registeredUser && registeredUser.email && prev.email === registeredUser.email) {
          setRegisteredUser(updated)
          localStorage.setItem(REGISTERED_USER_KEY, JSON.stringify(updated))
        }
        return updated
      })
    }
  }

  const handleNavigate = (page: AppPage) => {
    if (page === 'Register') {
      setRegistrationDraft(EMPTY_REGISTER_PROFILE)
    }
    navigate(pagePaths[page])
  }

  // Handler de Conexion y Verificacion de Match Mutuo persistente en base de datos
  const handleConnectProfile = async (card: ProfileCard) => {
    const cardName = card.nickname || ('firstName' in card ? card.firstName : '') || 'Artista'
    const targetUserId = card.id

    if (!targetUserId) {
      return
    }

    try {
      const res = await api.interactions.like(targetUserId)

      if (res.success && res.isMatch) {
        // 1. Notificacion de Match Mutuo confirmado
        const matchNotif: NotificationItem = {
          id: `notif_match_${Date.now()}`,
          title: `¡Nuevo Match con ${cardName}!`,
          message: `${cardName} tambien ha conectado contigo. ¡Ya pueden conversar en Mensajes!`,
          timestamp: 'Justo ahora',
          read: false,
          type: 'match',
          linkPage: 'Messages',
        }
        setUserNotifs((prev) => [matchNotif, ...prev])

        // 2. Incorporar la conversacion persistente creada en PostgreSQL
        if (res.conversation) {
          const conv = res.conversation
          setConversationsList((prev) => {
            const exists = prev.some((c) => c.id === conv.id)
            if (exists) return prev
            return [conv, ...prev]
          })
          setActiveChatId(conv.id)
        }

        // 3. Abrir Modal de Celebracion de Match
        setMatchedCard(card)
      } else if (res.success) {
        // Like registrado pero pendiente de reciprocidad
        const likeSentNotif: NotificationItem = {
          id: `notif_like_${Date.now()}`,
          title: `Like enviado a ${cardName}`,
          message: `Has enviado un like a ${cardName}. Si coincide contigo, se creara el chat.`,
          timestamp: 'Justo ahora',
          read: false,
          type: 'like',
          linkPage: 'Messages',
        }
        setUserNotifs((prev) => [likeSentNotif, ...prev])
      }
    } catch (error) {
      console.error('Error al conectar perfil:', error)
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
                registeredEmail={registeredUser?.email}
                registeredPassword={registeredUser?.password}
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
                profile={registrationDraft}
                onProfileChange={handleRegistrationDraftChange}
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
                profile={registrationDraft}
                onProfileChange={handleRegistrationDraftChange}
                onRegisterComplete={handleRegisterComplete}
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
