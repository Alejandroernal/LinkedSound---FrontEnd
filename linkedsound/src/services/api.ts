const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const TOKEN_STORAGE_KEY = 'linkedsound_auth_token'

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export type ApiResponse<T = any> = {
  success: boolean
  message?: string
  data?: T
  user?: any
  users?: any[]
  genres?: string[]
  token?: string
  status?: number
  [key: string]: any
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        message: data.message || `Error del servidor (${response.status})`,
        ...data,
      }
    }

    return {
      success: true,
      status: response.status,
      ...data,
    }
  } catch (error: any) {
    return {
      success: false,
      status: 0,
      message: error.message || 'Error de conexion con el servidor backend',
    }
  }
}

export const api = {
  health: {
    check: () => request('/health', { method: 'GET' }),
  },
  auth: {
    register: (payload: Record<string, any>) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    login: (credentials: { email: string; password: string }) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    getMe: () => request('/auth/me', { method: 'GET' }),
    updateProfile: (payload: Record<string, any>) =>
      request('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    getGenres: () => request<{ genres: string[] }>('/auth/genres', { method: 'GET' }),
    getUsers: (params?: { all?: boolean }) =>
      request<{ users: any[] }>(params?.all ? '/auth/users?all=true' : '/auth/users', { method: 'GET' }),
  },
  upload: {
    image: async (file: File): Promise<ApiResponse<{ url: string }>> => {
      const token = getToken()
      const formData = new FormData()
      formData.append('image', file)

      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      try {
        const response = await fetch(`${API_BASE_URL}/upload/image`, {
          method: 'POST',
          headers,
          body: formData,
        })
        const data = await response.json().catch(() => ({}))
        return {
          success: response.ok,
          status: response.status,
          ...data,
        }
      } catch (err: any) {
        return {
          success: false,
          status: 0,
          message: err.message || 'Error al subir la imagen',
        }
      }
    },
    audio: async (
      file: File
    ): Promise<
      ApiResponse<{
        url: string
        format: string
        duration: string
        fileSize: string
        originalName: string
      }>
    > => {
      const token = getToken()
      const formData = new FormData()
      formData.append('audio', file)

      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      try {
        const response = await fetch(`${API_BASE_URL}/upload/audio`, {
          method: 'POST',
          headers,
          body: formData,
        })
        const data = await response.json().catch(() => ({}))
        return {
          success: response.ok,
          status: response.status,
          ...data,
        }
      } catch (err: any) {
        return {
          success: false,
          status: 0,
          message: err.message || 'Error al subir el archivo de audio',
        }
      }
    },
  },
  events: {
    getAll: () => request<{ events: any[] }>('/events', { method: 'GET' }),
    create: (payload: Record<string, any>) =>
      request('/events', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: Record<string, any>) =>
      request<{ success: boolean; event: any; message?: string }>(`/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    delete: (id: string, payload?: Record<string, any>) =>
      request<{ success: boolean; message?: string }>(`/events/${id}`, {
        method: 'DELETE',
        ...(payload ? { body: JSON.stringify(payload) } : {}),
      }),
    addComment: (id: string, payload: { content: string; userId?: string; userRole?: string }) =>
      request<{ success: boolean; comment: any; message?: string }>(`/events/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    deleteComment: (id: string, commentId: string, payload?: { userId?: string; userRole?: string }) =>
      request<{ success: boolean; message?: string }>(`/events/${id}/comments/${commentId}`, {
        method: 'DELETE',
        ...(payload ? { body: JSON.stringify(payload) } : {}),
      }),
  },
  tracks: {
    getOptions: () =>
      request<{ snippetTypes: any[]; musicalKeys: any[] }>('/tracks/options', { method: 'GET' }),
    getSnippetTypes: () =>
      request<{ snippetTypes: any[] }>('/tracks/snippet-types', { method: 'GET' }),
    getMusicalKeys: () =>
      request<{ musicalKeys: any[] }>('/tracks/musical-keys', { method: 'GET' }),
  },
  reports: {
    getAll: () => request<{ reports: any[] }>('/reports', { method: 'GET' }),
    create: (payload: Record<string, any>) =>
      request('/reports', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: Record<string, any>) =>
      request(`/reports/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
  },
  activity: {
    getAll: () => request<{ activities: any[] }>('/activity', { method: 'GET' }),
    create: (payload: { action: string; module?: string }) =>
      request('/activity', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },
  conversations: {
    getAll: async () => {
      const res = await request<{ conversations: any[] }>('/conversations', { method: 'GET' })
      if (res.success && Array.isArray(res.conversations)) {
        res.conversations = res.conversations.map((c: any) => {
          const name = c.name || c.participant?.name || c.participant?.nickname || 'Creador'
          const role = c.role || c.participant?.role || 'Artista'
          const avatar = c.avatar || c.participant?.avatar || name.slice(0, 2).toUpperCase()
          const profileImage = c.profileImage || c.participant?.avatar || ''
          const preview = c.preview || c.lastMessage || 'Comienza una nueva conversacion'
          const time = c.time || (c.lastMessageTime ? new Date(c.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Reciente')
          const unread = typeof c.unread === 'number' ? c.unread : (c.unreadCount || 0)
          return {
            ...c,
            name,
            role,
            avatar,
            profileImage,
            preview,
            time,
            unread,
            accent: c.accent || 'purple',
            status: c.status || c.participant?.status || 'Online',
          }
        })
      }
      return res
    },
    getMessages: async (conversationId: string) => {
      const res = await request<{ messages: any[] }>(`/conversations/${conversationId}/messages`, { method: 'GET' })
      if (res.success && Array.isArray(res.messages)) {
        res.messages = res.messages.map((m: any) => {
          const sender = m.sender || (m.isMe ? 'me' : 'them')
          const time = m.time || (m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Reciente')
          let attachment = m.attachment
          if (!attachment && m.attachmentUrl) {
            attachment = {
              url: m.attachmentUrl,
              name: m.attachmentName || 'Archivo adjunto',
              type: (m.attachmentType === 'audio' || String(m.attachmentUrl).match(/\.(mp3|wav|ogg|m4a|aac)/i)) ? 'audio' : 'image',
              size: m.attachmentSize || 'Audio file',
              format: m.attachmentType || 'MP3',
            }
          }
          return {
            ...m,
            sender,
            time,
            attachment,
          }
        })
      }
      return res
    },
    sendMessage: (conversationId: string, payload: { text?: string; [key: string]: any }) =>
      request(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: { blocked?: boolean; pinned?: boolean; muted?: boolean }) =>
      request<{ success: boolean; conversation: any }>(`/conversations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/conversations/${id}`, {
        method: 'DELETE',
      }),
  },
  interactions: {
    like: (targetUserId: string) =>
      request<{
        isMatch: boolean
        match?: any
        conversation?: any
        partner?: any
      }>('/interactions/like', {
        method: 'POST',
        body: JSON.stringify({ targetUserId }),
      }),
    pass: (targetUserId: string) =>
      request<{ isMatch: boolean }>('/interactions/pass', {
        method: 'POST',
        body: JSON.stringify({ targetUserId }),
      }),
    unmatch: (targetUserId: string) =>
      request<{ success: boolean; message: string }>('/interactions/unmatch', {
        method: 'POST',
        body: JSON.stringify({ targetUserId }),
      }),
    getMatches: () => request<{ matches: any[] }>('/interactions/matches', { method: 'GET' }),
    getUserInteractions: () =>
      request<{
        interactions: Array<{ receiverId: string; isLike: boolean }>
        incomingLikes?: string[]
      }>('/interactions/status', { method: 'GET' }),
    reset: () => request<{ success: boolean; message: string }>('/interactions/reset', { method: 'POST' }),
  },
  notifications: {
    getAll: () => request<{ notifications: any[] }>('/notifications', { method: 'GET' }),
    markAsRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllAsRead: () => request('/notifications/read-all', { method: 'PATCH' }),
    clearAll: () => request('/notifications', { method: 'DELETE' }),
  },
}

