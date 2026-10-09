import { useState } from 'react'
import TopBar from '../components/TopBar'
import StatusBar from '../components/StatusBar'
import { mockReports, mockActivity, mockUsers, mockExplorerItems } from '../data/mockData'
import type { AppPage, Profile, UserReport, UserActivityLog, UserProfile, ExplorerItem, NotificationItem } from '../types'
import { useDebounce } from '../hooks/useDebounce'
import {
  PiUsersBold,
  PiWarningOctagonBold,
  PiPulseBold,
  PiPencilBold,
  PiTrashBold,
  PiEyeBold,
  PiCheckBold,
  PiXCircleBold,
  PiXBold,
  PiCaretLeftBold,
  PiCaretRightBold,
  PiEnvelopeSimpleBold,
  PiCalendarBold,
  PiClockBold
} from 'react-icons/pi'

type AdminPageProps = {
  onNavigate: (page: AppPage) => void
  onLogout?: () => void
  profile?: Profile
  notifications?: NotificationItem[]
  onMarkNotificationAsRead?: (id: string) => void
  onMarkAllNotificationsAsRead?: () => void
  onClearNotifications?: () => void
  onSignOut?: () => void
}

export default function AdminPage({
  onNavigate,
  onLogout,
  profile,
  notifications,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onClearNotifications,
  onSignOut,
}: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<'reports' | 'users' | 'events' | 'activity'>('reports')

  // Estados de datos interactivos desde mockData.ts
  const [reports, setReports] = useState<UserReport[]>(mockReports)
  const [users, setUsers] = useState<UserProfile[]>(mockUsers)
  const [explorerItems, setExplorerItems] = useState<ExplorerItem[]>(mockExplorerItems)
  const [activities, setActivities] = useState<UserActivityLog[]>(mockActivity)

  // Filtros y búsquedas (Con Debounce)
  const [reportOriginFilter, setReportOriginFilter] = useState<'All' | 'Discovery' | 'Explorer'>('All')
  const [reportStatusFilter, setReportStatusFilter] = useState<'All' | 'Pending' | 'Resolved' | 'Dismissed'>('All')
  
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const debouncedUserSearchTerm = useDebounce(userSearchTerm, 300)

  const [explorerSearchTerm, setExplorerSearchTerm] = useState('')
  const debouncedExplorerSearchTerm = useDebounce(explorerSearchTerm, 300)
  const [eventStatusFilter, setEventStatusFilter] = useState<'All' | 'Under Review' | 'Active' | 'Hidden'>('All')

  const [activitySearchTerm, setActivitySearchTerm] = useState('')
  const debouncedActivitySearchTerm = useDebounce(activitySearchTerm, 300)
  const [activityModuleFilter, setActivityModuleFilter] = useState<'All' | 'Perfil' | 'Explorer' | 'Sistema'>('All')

  // Paginación por Tab (preparada para integraciones backend)
  const [reportsPage, setReportsPage] = useState(1)
  const [usersPage, setUsersPage] = useState(1)
  const [explorerPage, setExplorerPage] = useState(1)
  const [activityPage, setActivityPage] = useState(1)
  const pageSize = 4

  // Paginación interna para Modales
  const [modalReportsPage, setModalReportsPage] = useState(1)
  const MODAL_PAGE_SIZE = 3

  // Estado para Edición/Inspección de Estado de Usuario (Lectura de datos personales para evitar suplantación)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)

  // Estado para Auditoría (Solo Lectura) y Baja de Eventos con Motivo
  const [editingExplorerItem, setEditingExplorerItem] = useState<ExplorerItem | null>(null)
  const [deletingExplorerItem, setDeletingExplorerItem] = useState<ExplorerItem | null>(null)
  const [eventDeleteReason, setEventDeleteReason] = useState('Contenido inapropiado / Infracción de normas')
  const [eventDeleteDetails, setEventDeleteDetails] = useState('')

  // Estado para Visualizar Modal/Ver Reportes de Usuario Específico
  const [viewingUserReports, setViewingUserReports] = useState<{ user: UserProfile; reports: UserReport[] } | null>(null)

  // Estado para Visualizar Detalle de Reporte Individual (Solo Lectura para Admin + Edición de Severidad / Comentario)
  const [editingReport, setEditingReport] = useState<UserReport | null>(null)

  // Estado para Modales de Resolución y Desestimación con Comentario Obligatorio
  const [resolvingReport, setResolvingReport] = useState<UserReport | null>(null)
  const [resolveComment, setResolveComment] = useState('')

  const [dismissingReport, setDismissingReport] = useState<UserReport | null>(null)
  const [dismissComment, setDismissComment] = useState('')

  const [notificationToast, setNotificationToast] = useState<{ message: string; targetUser: string } | null>(null)

  // Helper para Registrar Acciones Administrativas en el Log de Auditoría
  const logAdminAction = (actionText: string, targetModule: 'Perfil' | 'Explorer' | 'Sistema') => {
    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = now.getFullYear()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    const exactFormatted = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`

    const newLog: UserActivityLog = {
      id: `ACT-${String(activities.length + 1).padStart(2, '0')}`,
      user: 'Administrador (Admin)',
      action: actionText,
      timestamp: 'Hace unos instantes',
      exactTimestamp: exactFormatted,
      ip: '127.0.0.1',
      device: 'Chrome / Windows (Sesión Admin)',
      module: targetModule,
    }

    setActivities(prev => [newLog, ...prev])
  }

  // ── Handlers Reportes ──
  const handleOpenResolveModal = (report: UserReport) => {
    setResolvingReport(report)
    setResolveComment(report.adminComment ?? '')
  }

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault()
    if (!resolvingReport) return

    const updatedComment = resolveComment.trim() || 'El reporte fue revisado y resuelto satisfactoriamente por el equipo de administración.'

    setReports(prev => prev.map(r => {
      if (r.id === resolvingReport.id) {
        return {
          ...r,
          status: 'Resolved',
          adminComment: updatedComment,
        }
      }
      return r
    }))

    // Registrar en Log de Auditoría
    logAdminAction(`Resolvió el reporte ${resolvingReport.id} sobre "${resolvingReport.reportedUser}". Comentario: "${updatedComment}"`, 'Sistema')

    // Notificar al usuario denunciante
    setNotificationToast({
      message: `Tu reporte ${resolvingReport.id} ha sido resuelto. Comentario del Administrador: "${updatedComment}"`,
      targetUser: resolvingReport.reporterUser,
    })

    setResolvingReport(null)
    setResolveComment('')

    setTimeout(() => {
      setNotificationToast(null)
    }, 6000)
  }

  const handleOpenDismissModal = (report: UserReport) => {
    setDismissingReport(report)
    setDismissComment(report.adminComment ?? '')
  }

  const handleConfirmDismiss = (e: React.FormEvent) => {
    e.preventDefault()
    if (!dismissingReport) return
    const comment = dismissComment.trim()
    if (!comment) return

    setReports(prev => prev.map(r => {
      if (r.id === dismissingReport.id) {
        return {
          ...r,
          status: 'Dismissed',
          adminComment: comment,
        }
      }
      return r
    }))

    // Registrar en Log de Auditoría
    logAdminAction(`Desestimó el reporte ${dismissingReport.id} sobre "${dismissingReport.reportedUser}". Motivo: "${comment}"`, 'Sistema')

    // Notificar al usuario denunciante
    setNotificationToast({
      message: `Tu reporte ${dismissingReport.id} fue desestimado. Motivo: "${comment}"`,
      targetUser: dismissingReport.reporterUser,
    })

    setDismissingReport(null)
    setDismissComment('')

    setTimeout(() => {
      setNotificationToast(null)
    }, 6000)
  }

  const handleSaveReportDetails = (updated: UserReport) => {
    setReports(prev => prev.map(r => r.id === updated.id ? updated : r))
    logAdminAction(`Actualizó severidad/anotación del reporte ${updated.id} sobre "${updated.reportedUser}"`, 'Sistema')
    setEditingReport(null)
  }

  // ── Handlers Usuarios ──
  const handleSaveUserStatus = (updated: UserProfile) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))

    const statusLabel = updated.status === 'Active' ? 'Activo' : updated.status === 'Suspended' ? 'Suspendido' : 'Baneado'
    const motive = updated.statusJustification?.trim() || 'Modificación de estado administrativa.'

    // Registrar en Log de Auditoría
    logAdminAction(`Cambió estado de cuenta del usuario "${updated.nickname}" a ${statusLabel}. Motivo: "${motive}"`, 'Perfil')

    // Si el estado es Suspendido o Baneado, notificar al usuario con la justificación
    if (updated.status === 'Suspended' || updated.status === 'Banned') {
      setNotificationToast({
        message: `Tu cuenta ha cambiado a estado "${statusLabel}". Motivo registrado: "${motive}"`,
        targetUser: updated.nickname,
      })
      setTimeout(() => {
        setNotificationToast(null)
      }, 6000)
    }

    setEditingUser(null)
  }

  const handleTriggerPasswordReset = (user: UserProfile) => {
    // Registrar en Log de Auditoría
    logAdminAction(`Disparó enlace de restablecimiento de contraseña por email para el usuario "${user.nickname}" (${user.email})`, 'Perfil')

    setNotificationToast({
      message: `Se ha enviado un correo electrónico a ${user.email} con el enlace seguro para restablecer su contraseña.`,
      targetUser: user.nickname,
    })
    setTimeout(() => {
      setNotificationToast(null)
    }, 6000)
  }

  const handleOpenUserReportsModal = (user: UserProfile) => {
    const userReportsList = reports.filter(
      r => r.reportedUser.toLowerCase().includes(user.nickname.toLowerCase()) ||
        r.reportedUser.toLowerCase().includes((user.firstName ?? '').toLowerCase())
    )
    setModalReportsPage(1)
    setViewingUserReports({ user, reports: userReportsList })
  }

  // ── Handlers Eventos ──
  const handleConfirmDeleteExplorerItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!deletingExplorerItem) return

    const fullMotive = `${eventDeleteReason}${eventDeleteDetails.trim() ? `: ${eventDeleteDetails.trim()}` : ''}`
    
    setExplorerItems(prev => prev.filter(item => item.id !== deletingExplorerItem.id))

    // Registrar en Log de Auditoría
    logAdminAction(`Dio de baja el evento "${deletingExplorerItem.title}" del organizador "${deletingExplorerItem.owner}". Motivo: "${fullMotive}"`, 'Explorer')

    setNotificationToast({
      message: `El evento "${deletingExplorerItem.title}" del organizador "${deletingExplorerItem.owner}" fue dado de baja. Motivo trazado: "${fullMotive}"`,
      targetUser: deletingExplorerItem.owner,
    })

    setDeletingExplorerItem(null)
    setEventDeleteReason('Contenido inapropiado / Infracción de normas')
    setEventDeleteDetails('')

    setTimeout(() => {
      setNotificationToast(null)
    }, 6000)
  }

  const handleToggleExplorerStatus = (id: string) => {
    let targetItem: ExplorerItem | undefined
    setExplorerItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === 'Active' ? 'Hidden' : 'Active'
        targetItem = { ...item, status: nextStatus }
        return targetItem
      }
      return item
    }))

    if (targetItem) {
      const statusLabel = targetItem.status === 'Active' ? 'Activo' : 'Oculto'
      logAdminAction(`Cambió visibilidad del evento "${targetItem.title}" a estado ${statusLabel}`, 'Explorer')
    }
  }

  const handleSaveExplorerItem = (updated: ExplorerItem) => {
    setExplorerItems(prev => prev.map(item => item.id === updated.id ? updated : item))
    const statusLabel = updated.status === 'Active' ? 'Activo' : updated.status === 'Under Review' ? 'En revisión' : 'Oculto'
    logAdminAction(`Actualizó estado del evento "${updated.title}" a ${statusLabel}`, 'Explorer')
    setEditingExplorerItem(null)
  }

  const handleSignOut = () => {
    const signOutFn = onSignOut || onLogout
    if (signOutFn) {
      signOutFn()
    } else {
      onNavigate('Login')
    }
  }

  // Helper para normalizar la etiqueta visual de los estados
  const getNormalizedStatusText = (statusStr?: string): string => {
    if (!statusStr) return 'Activo'
    const s = statusStr.toLowerCase()
    if (s === 'active' || s === 'activo') return 'Activo'
    if (s === 'suspended' || s === 'suspendido') return 'Suspendido'
    if (s === 'banned' || s === 'baneado') return 'Baneado'
    if (s === 'under review' || s === 'under_review' || s === 'en revisión') return 'En revisión'
    if (s === 'hidden' || s === 'oculto') return 'Oculto'
    if (s === 'pending' || s === 'pendiente') return 'Pendiente'
    if (s === 'resolved' || s === 'resuelto') return 'Resuelto'
    if (s === 'dismissed' || s === 'desestimado') return 'Desestimado'
    return statusStr.charAt(0).toUpperCase() + statusStr.slice(1).toLowerCase()
  }

  // Filtros aplicados & Paginación
  const filteredReports = reports.filter(r => {
    if (reportOriginFilter !== 'All' && r.origin !== reportOriginFilter) return false
    if (reportStatusFilter !== 'All' && r.status !== reportStatusFilter) return false
    return true
  })
  const totalReportsPages = Math.ceil(filteredReports.length / pageSize) || 1
  const paginatedReports = filteredReports.slice((reportsPage - 1) * pageSize, reportsPage * pageSize)

  const filteredUsers = users.filter(u =>
    u.nickname.toLowerCase().includes(debouncedUserSearchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(debouncedUserSearchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(debouncedUserSearchTerm.toLowerCase())
  )
  const totalUsersPages = Math.ceil(filteredUsers.length / pageSize) || 1
  const paginatedUsers = filteredUsers.slice((usersPage - 1) * pageSize, usersPage * pageSize)

  const filteredExplorerItems = explorerItems.filter(item => {
    if (eventStatusFilter !== 'All' && item.status !== eventStatusFilter) return false
    const term = debouncedExplorerSearchTerm.toLowerCase()
    return (
      item.title.toLowerCase().includes(term) ||
      item.owner.toLowerCase().includes(term) ||
      item.location.toLowerCase().includes(term)
    )
  })
  const totalExplorerPages = Math.ceil(filteredExplorerItems.length / pageSize) || 1
  const paginatedExplorerItems = filteredExplorerItems.slice((explorerPage - 1) * pageSize, explorerPage * pageSize)

  const filteredActivities = activities.filter(act => {
    if (activityModuleFilter !== 'All' && act.module !== activityModuleFilter) return false
    const term = debouncedActivitySearchTerm.toLowerCase()
    if (!term) return true
    return (
      act.user.toLowerCase().includes(term) ||
      act.ip.toLowerCase().includes(term) ||
      act.action.toLowerCase().includes(term)
    )
  })
  const totalActivityPages = Math.ceil(filteredActivities.length / pageSize) || 1
  const paginatedActivities = filteredActivities.slice((activityPage - 1) * pageSize, activityPage * pageSize)

  // Componente de UI de Paginación genérico para cada Tab
  const renderPaginationControls = (
    currentPage: number,
    totalPages: number,
    totalItems: number,
    onPageChange: (page: number) => void
  ) => {
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
    const endItem = Math.min(currentPage * pageSize, totalItems)

    return (
      <div className="ls-admin-pagination">
        <div className="ls-admin-pagination-info">
          Mostrando {startItem} - {endItem} de {totalItems} registros
        </div>
        <div className="ls-admin-pagination-controls">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="ls-admin-pagination-btn"
            title="Página Anterior"
          >
            <PiCaretLeftBold /> Anterior
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`ls-admin-pagination-num ${page === currentPage ? 'active' : ''}`}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="ls-admin-pagination-btn"
            title="Página Siguiente"
          >
            Siguiente <PiCaretRightBold />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="ls-admin-app-layout">

      {/* TopBar global con la sesión de Administrador activa */}
      <TopBar
        activePage="Admin"
        onNavigate={onNavigate}
        profile={profile}
        isAdminSession={true}
        notifications={notifications}
        onMarkNotificationAsRead={onMarkNotificationAsRead}
        onMarkAllNotificationsAsRead={onMarkAllNotificationsAsRead}
        onClearNotifications={onClearNotifications}
        onSignOut={handleSignOut}
      />

      <main className="ls-admin-main-content">

        {/* Banner Admin Header */}
        <div className="ls-admin-banner">
          <div>
            <div className="ls-admin-banner-header-row">
              <span className="ls-admin-badge-isolated">Sistema Aislado de Administración</span>
              <h1 className="ls-admin-banner-title">Panel de Moderación y Control Global</h1>
            </div>
            <p className="ls-admin-banner-desc">
              Monitoreo centralizado de la plataforma: Gestión de reportes, control de cuentas de usuarios, auditoría de eventos y logs de actividad.
            </p>
          </div>

          <div className="ls-admin-banner-stats-group">
            <div className="ls-admin-stat-card pending">
              <div className="ls-admin-stat-num pending">{reports.filter(r => r.status === 'Pending').length}</div>
              <div className="ls-admin-stat-lbl">Reportes Pendientes</div>
            </div>
            <div className="ls-admin-stat-card users">
              <div className="ls-admin-stat-num users">{users.length}</div>
              <div className="ls-admin-stat-lbl">Usuarios Totales</div>
            </div>
          </div>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="ls-admin-tabs-row">
          <button
            onClick={() => setActiveTab('reports')}
            className={`ls-admin-tab-btn ${activeTab === 'reports' ? 'active-reports' : ''}`}
          >
            <PiWarningOctagonBold className="ls-admin-tab-icon" /> Reportes ({reports.length})
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`ls-admin-tab-btn ${activeTab === 'users' ? 'active-users' : ''}`}
          >
            <PiUsersBold className="ls-admin-tab-icon" /> Gestión de Usuarios ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`ls-admin-tab-btn ${activeTab === 'events' ? 'active-explorer' : ''}`}
          >
            <PiCalendarBold className="ls-admin-tab-icon" /> Gestión de Eventos ({explorerItems.length})
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`ls-admin-tab-btn ${activeTab === 'activity' ? 'active-activity' : ''}`}
          >
            <PiPulseBold className="ls-admin-tab-icon" /> Registro de Actividad ({activities.length})
          </button>
        </div>

        {/* ── TAB 1: REPORTES ── */}
        {activeTab === 'reports' && (
          <div className="ls-admin-card-panel">
            <div className="ls-admin-card-header">
              <div>
                <h3 className="ls-admin-panel-title">Todos los Reportes de la Plataforma</h3>
                <p className="ls-admin-panel-subtitle">Filtra por estado (Pendiente / Resuelto / Desestimado) u origen (Discovery / Explorer).</p>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {/* Filtro por estado */}
                <div className="ls-admin-filter-group">
                  {(['All', 'Pending', 'Resolved', 'Dismissed'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => {
                        setReportStatusFilter(st)
                        setReportsPage(1)
                      }}
                      className={`ls-admin-filter-btn ${reportStatusFilter === st ? 'active' : ''}`}
                    >
                      {st === 'All' ? 'Todos los Estados' : getNormalizedStatusText(st)}
                    </button>
                  ))}
                </div>

                {/* Filtro por origen */}
                <div className="ls-admin-filter-group">
                  {(['All', 'Discovery', 'Explorer'] as const).map(orig => (
                    <button
                      key={orig}
                      onClick={() => {
                        setReportOriginFilter(orig)
                        setReportsPage(1)
                      }}
                      className={`ls-admin-filter-btn ${reportOriginFilter === orig ? 'active' : ''}`}
                    >
                      {orig === 'All' ? 'Todos los Orígenes' : orig}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="ls-admin-list-container">
              {paginatedReports.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                  No se encontraron reportes con los filtros seleccionados.
                </div>
              ) : (
                paginatedReports.map((report) => (
                  <div key={report.id} className="ls-admin-report-card">
                    <div className="ls-admin-report-card-main">
                      <div className="ls-admin-report-card-header">
                        <span className="ls-admin-report-id">{report.id}</span>

                        <span className="ls-admin-badge-subtle">
                          Origen: {report.origin}
                        </span>

                        <span className="ls-admin-badge-subtle">
                          Tipo: {report.targetType}
                        </span>

                        <span className="ls-admin-badge-subtle">
                          Severidad: {report.severity}
                        </span>

                        <span className="ls-admin-report-user-line">
                          <strong className="ls-admin-reported-user">{report.reportedUser}</strong>
                          <span className="ls-admin-reporter-text"> reportado por <strong>{report.reporterUser}</strong></span>
                        </span>
                      </div>

                      <div className="ls-admin-report-reason">
                        Motivo: <span className="ls-admin-reason-text">{report.reason}</span>
                      </div>

                      <p className="ls-admin-report-details">
                        "{report.details}"
                      </p>

                      {report.adminComment && (
                        <div className="ls-admin-comment-box">
                          <strong>Resolución / Comentario Administrador:</strong> {report.adminComment}
                        </div>
                      )}

                      <div className="ls-admin-report-date">
                        Fecha y hora: {report.date}
                      </div>
                    </div>

                    <div className="ls-admin-report-card-actions">
                      <div className="ls-admin-status-wrap">
                        <span className="ls-admin-status-label">Estado:</span>
                        <span className={`ls-admin-status-pill status-${report.status.toLowerCase()}`}>
                          {getNormalizedStatusText(report.status)}
                        </span>
                      </div>

                      {/* Solo mostrar 'Ver Completo' para reportes ya resueltos o desestimados */}
                      {report.status !== 'Pending' ? (
                        <button
                          onClick={() => setEditingReport(report)}
                          className="ls-admin-btn-action-edit"
                          title="Ver los detalles completos del reporte"
                        >
                          <PiEyeBold /> Ver Completo
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingReport(report)}
                            className="ls-admin-btn-action-edit"
                            title="Ver los detalles completos del reporte"
                          >
                            <PiEyeBold /> Ver Completo
                          </button>

                          <button
                            onClick={() => handleOpenResolveModal(report)}
                            className="ls-admin-btn-action-resolve"
                          >
                            <PiCheckBold /> Marcar Resuelto
                          </button>

                          <button
                            onClick={() => handleOpenDismissModal(report)}
                            className="ls-admin-btn-action-dismiss"
                          >
                            <PiXCircleBold /> Desestimar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Paginación de Reportes */}
            {renderPaginationControls(reportsPage, totalReportsPages, filteredReports.length, setReportsPage)}
          </div>
        )}

        {/* ── TAB 2: GESTIÓN DE USUARIOS ── */}
        {activeTab === 'users' && (
          <div className="ls-admin-card-panel">
            <div className="ls-admin-card-header">
              <div>
                <h3 className="ls-admin-card-title">Gestión Total de Usuarios</h3>
                <p className="ls-admin-card-subtitle">Inspecciona la información de cuentas, gestiona el estado y dispara el reseteo de contraseña.</p>
              </div>
              <input
                type="text"
                placeholder="Buscar usuario, email o rol..."
                value={userSearchTerm}
                onChange={e => {
                  setUserSearchTerm(e.target.value)
                  setUsersPage(1)
                }}
                className="ls-admin-search-input"
              />
            </div>

            <div className="ls-admin-table-container">
              {paginatedUsers.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                  No se encontraron usuarios que coincidan con los criterios de búsqueda.
                </div>
              ) : (
                <table className="ls-admin-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Ubicación</th>
                      <th>Estado</th>
                      <th>Reportes</th>
                      <th className="ls-admin-table-align-right">Acciones Administrador</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map(u => (
                      <tr key={u.id}>
                        <td className="ls-admin-table-bold-cell">
                          <div>
                            <div>{u.nickname}</div>
                            <small className="ls-admin-table-subtext">{u.firstName} {u.lastName}</small>
                          </div>
                        </td>
                        <td className="ls-admin-table-secondary-cell">{u.email}</td>
                        <td>{u.role}</td>
                        <td className="ls-admin-table-muted-cell">{u.location}</td>
                        <td>
                          <span className={`ls-admin-user-status-pill status-${(u.status ?? 'active').toLowerCase()}`}>
                            {getNormalizedStatusText(u.status)}
                          </span>
                        </td>
                        <td>
                          {/* Botón interactivo para ver los reportes específicos de este usuario */}
                          <button
                            onClick={() => handleOpenUserReportsModal(u)}
                            className={`ls-admin-user-reports-btn ${u.reportsCount ? 'has-reports' : ''}`}
                            title="Presione para ver el desglose de reportes de este usuario"
                          >
                            <PiWarningOctagonBold /> {u.reportsCount ?? 0} Rep
                          </button>
                        </td>
                        <td className="ls-admin-table-align-right">
                          <div className="ls-admin-table-actions">
                            <button
                              onClick={() => setEditingUser(u)}
                              className="ls-admin-table-btn-edit"
                              title="Ver Datos y Cambiar Estado"
                            >
                              <PiPencilBold /> Ver Datos / Estado
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Paginación de Usuarios */}
            {renderPaginationControls(usersPage, totalUsersPages, filteredUsers.length, setUsersPage)}
          </div>
        )}

        {/* ── TAB 3: GESTIÓN DE EVENTOS ── */}
        {activeTab === 'events' && (
          <div className="ls-admin-card-panel">
            <div className="ls-admin-card-header">
              <div>
                <h3 className="ls-admin-card-title">Gestión y Moderación de Eventos</h3>
                <p className="ls-admin-card-subtitle">Filtra por estado (Activos / En Revisión / Ocultos) y audita las publicaciones de eventos de la comunidad.</p>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Filtro rápido por estado de aprobación / moderación */}
                <div className="ls-admin-filter-group">
                  {(['All', 'Under Review', 'Active', 'Hidden'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => {
                        setEventStatusFilter(st)
                        setExplorerPage(1)
                      }}
                      className={`ls-admin-filter-btn ${eventStatusFilter === st ? 'active' : ''}`}
                    >
                      {st === 'All' ? 'Todos los Eventos' : st === 'Under Review' ? 'En revisión' : st === 'Active' ? 'Activos' : 'Ocultos'}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Buscar evento, organizador o ciudad..."
                  value={explorerSearchTerm}
                  onChange={e => {
                    setExplorerSearchTerm(e.target.value)
                    setExplorerPage(1)
                  }}
                  className="ls-admin-search-input"
                />
              </div>
            </div>

            <div className="ls-admin-table-container">
              {paginatedExplorerItems.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                  No se encontraron eventos que coincidan con la búsqueda o filtro seleccionado.
                </div>
              ) : (
                <table className="ls-admin-table">
                  <thead>
                    <tr>
                      <th>Título del Evento</th>
                      <th>Organizador / Creador</th>
                      <th>Ubicación</th>
                      <th>Vistas</th>
                      <th>Estado</th>
                      <th className="ls-admin-table-align-right">Acciones Administrador</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedExplorerItems.map(item => (
                      <tr key={item.id}>
                        <td className="ls-admin-table-bold-cell">
                          <div>
                            <div>{item.title}</div>
                            <small className="ls-admin-table-subtext">{item.genres.join(', ')}</small>
                          </div>
                        </td>
                        <td className="ls-admin-table-owner-cell">{item.owner}</td>
                        <td className="ls-admin-table-muted-cell">{item.location}</td>
                        <td className="ls-admin-table-views-cell">{item.views}</td>
                        <td>
                          <span className={`ls-admin-status-pill status-${item.status === 'Active' ? 'resolved' : item.status === 'Under Review' ? 'pending' : 'dismissed'}`}>
                            {getNormalizedStatusText(item.status)}
                          </span>
                        </td>
                        <td className="ls-admin-table-align-right">
                          <div className="ls-admin-table-actions">
                            <button
                              onClick={() => handleToggleExplorerStatus(item.id)}
                              className="ls-admin-table-btn-toggle"
                              title="Cambiar visibilidad entre Activo y Oculto"
                            >
                              {item.status === 'Active' ? 'Ocultar' : 'Activar'}
                            </button>
                            <button
                              onClick={() => setEditingExplorerItem(item)}
                              className="ls-admin-table-btn-edit"
                              title="Auditar detalle completo del evento (Solo lectura)"
                            >
                              <PiEyeBold /> Ver detalle
                            </button>
                            <button
                              onClick={() => setDeletingExplorerItem(item)}
                              className="ls-admin-table-btn-delete"
                              title="Dar de baja con registro de motivo"
                            >
                              <PiTrashBold /> Dar de baja
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Paginación de Eventos */}
            {renderPaginationControls(explorerPage, totalExplorerPages, filteredExplorerItems.length, setExplorerPage)}
          </div>
        )}

        {/* ── TAB 4: REGISTRO DE ACTIVIDAD (Auditoría con Tooltip Exacto y Buscador de IP / Usuario) ── */}
        {activeTab === 'activity' && (
          <div className="ls-admin-activity-panel">
            <div className="ls-admin-activity-header">
              <div>
                <h3 className="ls-admin-panel-title">Registro Global de Actividad y Auditoría</h3>
                <p className="ls-admin-panel-subtitle">Auditoría completa de acciones realizadas por usuarios y acciones de moderación del Administrador.</p>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Filtro por Módulo */}
                <div className="ls-admin-activity-filter-group">
                  {(['All', 'Perfil', 'Explorer', 'Sistema'] as const).map(mod => (
                    <button
                      key={mod}
                      onClick={() => {
                        setActivityModuleFilter(mod)
                        setActivityPage(1)
                      }}
                      className={`ls-admin-activity-filter-btn ${activityModuleFilter === mod ? 'active' : ''}`}
                    >
                      {mod === 'All' ? 'Todos los Módulos' : mod}
                    </button>
                  ))}
                </div>

                {/* Buscador de usuario o IP */}
                <input
                  type="text"
                  placeholder="Buscar por usuario, IP o acción..."
                  value={activitySearchTerm}
                  onChange={e => {
                    setActivitySearchTerm(e.target.value)
                    setActivityPage(1)
                  }}
                  className="ls-admin-search-input"
                />
              </div>
            </div>

            <div className="ls-admin-activity-table-wrap">
              {paginatedActivities.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                  No se encontraron registros de actividad que coincidan con la búsqueda o filtro seleccionado.
                </div>
              ) : (
                <table className="ls-admin-activity-table">
                  <thead>
                    <tr className="ls-admin-activity-table-head-row">
                      <th>ID Evento</th>
                      <th>Módulo</th>
                      <th>Usuario / Actor</th>
                      <th>Acción Ejecutada</th>
                      <th>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <PiClockBold /> Tiempo (Hover = Exacto)
                        </span>
                      </th>
                      <th>Dirección IP</th>
                      <th>Dispositivo / Sesión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedActivities.map(act => (
                      <tr key={act.id} className="ls-admin-activity-table-row">
                        <td className="ls-admin-activity-id-cell">{act.id}</td>
                        <td className="ls-admin-activity-cell">
                          <span className={`ls-admin-module-badge ${act.module.toLowerCase()}`}>
                            {act.module}
                          </span>
                        </td>
                        <td className="ls-admin-activity-user-cell">
                          <strong style={{ color: act.user.includes('Admin') ? '#a855f7' : undefined }}>
                            {act.user}
                          </strong>
                        </td>
                        <td className="ls-admin-activity-action-cell">{act.action}</td>
                        <td
                          className="ls-admin-activity-time-cell"
                          title={`Fecha y hora exacta: ${act.exactTimestamp || '09/10/2026 00:00:00'}`}
                          style={{ cursor: 'help', textDecoration: 'underline dotted rgba(255,255,255,0.3)' }}
                        >
                          {act.timestamp}
                        </td>
                        <td className="ls-admin-activity-ip-cell">{act.ip}</td>
                        <td className="ls-admin-activity-device-cell">{act.device}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Paginación de Actividades */}
            {renderPaginationControls(activityPage, totalActivityPages, filteredActivities.length, setActivityPage)}
          </div>
        )}

      </main>

      {/* ── MODAL VISUALIZACIÓN DE USUARIO Y CAMBIO DE ESTADO ── */}
      {editingUser && (
        <div className="ls-admin-modal-overlay">
          <div className="ls-admin-modal-content w-650">
            <div className="ls-admin-modal-header">
              <h3 className="ls-admin-modal-title purple">Inspección de Perfil y Control de Estado</h3>
              <span className="ls-admin-modal-id">ID: {editingUser.id}</span>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="ls-admin-modal-close-btn"
              >
                <PiXBold />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveUserStatus(editingUser) }} className="ls-admin-modal-grid-form">
              <label className="ls-admin-form-label">
                Primer Nombre (firstName)
                <input
                  type="text"
                  readOnly
                  value={editingUser.firstName ?? ''}
                  className="ls-admin-form-input readonly"
                />
              </label>

              <label className="ls-admin-form-label">
                Apellido (lastName)
                <input
                  type="text"
                  readOnly
                  value={editingUser.lastName ?? ''}
                  className="ls-admin-form-input readonly"
                />
              </label>

              <label className="ls-admin-form-label">
                Nickname / Nombre Artístico
                <input
                  type="text"
                  readOnly
                  value={editingUser.nickname}
                  className="ls-admin-form-input readonly"
                />
              </label>

              <label className="ls-admin-form-label">
                Email
                <input
                  type="email"
                  readOnly
                  value={editingUser.email ?? ''}
                  className="ls-admin-form-input readonly"
                />
              </label>

              <label className="ls-admin-form-label">
                Rol
                <input
                  type="text"
                  readOnly
                  value={editingUser.role}
                  className="ls-admin-form-input readonly"
                />
              </label>

              <label className="ls-admin-form-label">
                Ubicación
                <input
                  type="text"
                  readOnly
                  value={editingUser.location}
                  className="ls-admin-form-input readonly"
                />
              </label>

              <label className="ls-admin-form-label">
                Estado de la Cuenta (Modificable)
                <select
                  value={editingUser.status ?? 'Active'}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                  className="ls-admin-form-select"
                >
                  <option value="Active">Activo</option>
                  <option value="Suspended">Suspendido</option>
                  <option value="Banned">Baneado</option>
                </select>
              </label>

              {/* Justificación obligatoria en caso de Suspensión o Ban */}
              {(editingUser.status === 'Suspended' || editingUser.status === 'Banned') && (
                <label className="ls-admin-form-label span-2 bold-label">
                  Justificación de la Sanción (Obligatorio - Se notificará al usuario):
                  <textarea
                    required
                    placeholder="Indica el motivo detallado de la suspensión o ban..."
                    value={editingUser.statusJustification ?? ''}
                    onChange={(e) => setEditingUser({ ...editingUser, statusJustification: e.target.value })}
                    rows={3}
                    className="ls-admin-form-textarea"
                    style={{ borderColor: '#ff3c6e' }}
                  />
                </label>
              )}

              <label className="ls-admin-form-label span-2">
                Géneros de Interés (Solo lectura)
                <input
                  type="text"
                  readOnly
                  value={(editingUser.interestGenres ?? []).join(', ')}
                  className="ls-admin-form-input readonly"
                />
              </label>

              <label className="ls-admin-form-label span-2">
                Biografía / Descripción del Perfil (Solo lectura)
                <textarea
                  readOnly
                  value={editingUser.description ?? ''}
                  rows={3}
                  className="ls-admin-form-textarea readonly"
                />
              </label>

              <div className="span-2" style={{ marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleTriggerPasswordReset(editingUser)}
                  className="ls-admin-btn-action-edit"
                  style={{ width: '100%', padding: '10px', background: 'rgba(168, 85, 247, 0.2)', borderColor: '#a855f7', color: '#a855f7', justifyContent: 'center' }}
                >
                  <PiEnvelopeSimpleBold /> Disparar Reseteo de Contraseña por Email
                </button>
              </div>

              <div className="ls-admin-form-actions">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="ls-admin-btn-cancel"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="ls-admin-btn-save-purple"
                >
                  Guardar Estado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL AUDITORÍA DE EVENTO (Solo lectura para el Admin + Cambio de Visibilidad) ── */}
      {editingExplorerItem && (
        <div className="ls-admin-modal-overlay">
          <div className="ls-admin-modal-content w-600">
            <div className="ls-admin-modal-header">
              <h3 className="ls-admin-modal-title yellow">Detalle del Evento (Auditoría)</h3>
              <span className="ls-admin-modal-id">ID: {editingExplorerItem.id}</span>
              <button
                type="button"
                onClick={() => setEditingExplorerItem(null)}
                className="ls-admin-modal-close-btn"
              >
                <PiXBold />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveExplorerItem(editingExplorerItem) }} className="ls-admin-modal-grid-form">
              <label className="ls-admin-form-label span-2">
                Título del Evento (Solo lectura)
                <input
                  type="text"
                  readOnly
                  value={editingExplorerItem.title}
                  className="ls-admin-form-input readonly"
                />
              </label>

              <label className="ls-admin-form-label">
                Tipo
                <input
                  type="text"
                  readOnly
                  value="Evento"
                  className="ls-admin-form-input readonly"
                />
              </label>

              <label className="ls-admin-form-label">
                Estado de Publicación (Modificable)
                <select
                  value={editingExplorerItem.status}
                  onChange={(e) => setEditingExplorerItem({ ...editingExplorerItem, status: e.target.value as any })}
                  className="ls-admin-form-select"
                >
                  <option value="Active">Activo</option>
                  <option value="Under Review">En revisión</option>
                  <option value="Hidden">Oculto</option>
                </select>
              </label>

              <label className="ls-admin-form-label">
                Organizador / Creador
                <input
                  type="text"
                  readOnly
                  value={editingExplorerItem.owner}
                  className="ls-admin-form-input readonly"
                />
              </label>

              <label className="ls-admin-form-label">
                Ubicación / Venue
                <input
                  type="text"
                  readOnly
                  value={editingExplorerItem.location}
                  className="ls-admin-form-input readonly"
                />
              </label>

              <label className="ls-admin-form-label">
                Número de Vistas
                <input
                  type="text"
                  readOnly
                  value={editingExplorerItem.views}
                  className="ls-admin-form-input readonly"
                />
              </label>

              <label className="ls-admin-form-label">
                Fecha de Creación
                <input
                  type="text"
                  readOnly
                  value={editingExplorerItem.createdDate}
                  className="ls-admin-form-input readonly"
                />
              </label>

              <label className="ls-admin-form-label span-2">
                Géneros y Etiquetas
                <input
                  type="text"
                  readOnly
                  value={editingExplorerItem.genres.join(', ')}
                  className="ls-admin-form-input readonly"
                />
              </label>

              <label className="ls-admin-form-label span-2">
                Descripción del Evento (Solo lectura)
                <textarea
                  readOnly
                  value={editingExplorerItem.description}
                  rows={4}
                  className="ls-admin-form-textarea readonly"
                />
              </label>

              <div className="ls-admin-form-actions">
                <button
                  type="button"
                  onClick={() => setEditingExplorerItem(null)}
                  className="ls-admin-btn-cancel"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="ls-admin-btn-save-yellow"
                >
                  Guardar Estado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL EDICIÓN Y VISUALIZACIÓN COMPLETA DE REPORTE ── */}
      {editingReport && (
        <div className="ls-admin-modal-overlay">
          <div className="ls-admin-modal-content w-550">
            <div className="ls-admin-modal-header">
              <h3 className="ls-admin-modal-title cyan">Detalles del Reporte</h3>
              <span className="ls-admin-modal-id">ID: {editingReport.id}</span>
              <button
                type="button"
                onClick={() => setEditingReport(null)}
                className="ls-admin-modal-close-btn"
              >
                <PiXBold />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveReportDetails(editingReport) }} className="ls-admin-modal-flex-form">
              <div className="ls-admin-modal-grid-form">
                <label className="ls-admin-form-label">
                  Usuario Reportado
                  <input
                    type="text"
                    readOnly
                    value={editingReport.reportedUser}
                    className="ls-admin-form-input readonly"
                  />
                </label>

                <label className="ls-admin-form-label">
                  Usuario Denunciante
                  <input
                    type="text"
                    readOnly
                    value={editingReport.reporterUser}
                    className="ls-admin-form-input readonly"
                  />
                </label>
              </div>

              <div className="ls-admin-modal-grid-form">
                <label className="ls-admin-form-label">
                  Origen
                  <input
                    type="text"
                    readOnly
                    value={editingReport.origin}
                    className="ls-admin-form-input readonly"
                  />
                </label>

                <label className="ls-admin-form-label">
                  Tipo Objetivo
                  <input
                    type="text"
                    readOnly
                    value={editingReport.targetType}
                    className="ls-admin-form-input readonly"
                  />
                </label>

                <label className="ls-admin-form-label">
                  Severidad (Modificable)
                  <select
                    value={editingReport.severity}
                    onChange={(e) => setEditingReport({ ...editingReport, severity: e.target.value as any })}
                    className="ls-admin-form-select"
                  >
                    <option value="Low">Baja (Low)</option>
                    <option value="Medium">Media (Medium)</option>
                    <option value="High">Alta (High)</option>
                  </select>
                </label>
              </div>

              <label className="ls-admin-form-label">
                Motivo Principal
                <input
                  type="text"
                  readOnly
                  value={editingReport.reason}
                  className="ls-admin-form-input readonly"
                />
              </label>

              <label className="ls-admin-form-label">
                Detalles del Incidente (Solo Lectura)
                <textarea
                  readOnly
                  value={editingReport.details}
                  rows={4}
                  className="ls-admin-form-textarea readonly"
                />
              </label>

              <label className="ls-admin-form-label">
                Estado Actual
                <input
                  type="text"
                  readOnly
                  value={getNormalizedStatusText(editingReport.status)}
                  className="ls-admin-form-input readonly"
                />
              </label>

              <label className="ls-admin-form-label">
                Comentario de Resolución (Administrador)
                <textarea
                  placeholder="Detalla los motivos o resolución de la acción tomada..."
                  value={editingReport.adminComment ?? ''}
                  onChange={(e) => setEditingReport({ ...editingReport, adminComment: e.target.value })}
                  rows={3}
                  className="ls-admin-form-textarea green-border"
                />
              </label>

              <div className="ls-admin-form-actions flex-start-margin">
                <button
                  type="button"
                  onClick={() => setEditingReport(null)}
                  className="ls-admin-btn-cancel"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="ls-admin-btn-save-cyan"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL VER REPORTES DE UN USUARIO ESPECÍFICO ── */}
      {viewingUserReports && (
        <div className="ls-admin-modal-overlay">
          <div className="ls-admin-modal-content w-600 border-user-reports">
            <div className="ls-admin-modal-header">
              <div>
                <h3 className="ls-admin-modal-title pink">
                  Reportes Asociados a {viewingUserReports.user.nickname}
                </h3>
                <p className="ls-admin-panel-subtitle">
                  Total contabilizado: {viewingUserReports.reports.length} reporte(s)
                </p>
              </div>
              <button
                onClick={() => setViewingUserReports(null)}
                className="ls-admin-modal-close-btn"
              >
                <PiXBold />
              </button>
            </div>

            {viewingUserReports.reports.length === 0 ? (
              <div className="ls-admin-user-reports-empty">
                Este usuario no cuenta con reportes activos o contabilizados en el sistema.
              </div>
            ) : (
              <>
                <div className="ls-admin-user-reports-list">
                  {viewingUserReports.reports
                    .slice((modalReportsPage - 1) * MODAL_PAGE_SIZE, modalReportsPage * MODAL_PAGE_SIZE)
                    .map(rep => (
                      <div key={rep.id} className="ls-admin-user-report-item">
                        <div className="ls-admin-user-report-item-header">
                          <span className="ls-admin-user-report-item-id">{rep.id}</span>
                          <span className={`ls-admin-severity-badge ${rep.severity === 'High' ? 'high' : 'medium'}`}>
                            {rep.severity}
                          </span>
                        </div>

                        <div className="ls-admin-user-report-reported-by">
                          Denunciado por: <span className="ls-admin-user-report-reporter-name">{rep.reporterUser}</span>
                        </div>

                        <div className="ls-admin-user-report-reason-line">
                          <strong>Motivo:</strong> {rep.reason}
                        </div>

                        <p className="ls-admin-user-report-details-box">
                          "{rep.details}"
                        </p>

                        <div className="ls-admin-user-report-footer">
                          <span>Fecha: {rep.date} | Origen: {rep.origin}</span>
                          <span>Estado: <strong className={rep.status === 'Resolved' ? 'ls-admin-status-resolved' : rep.status === 'Dismissed' ? 'ls-admin-status-dismissed' : 'ls-admin-status-pending-text'}>{getNormalizedStatusText(rep.status)}</strong></span>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Paginación en Modal */}
                {viewingUserReports.reports.length > MODAL_PAGE_SIZE && (
                  <div className="ls-admin-pagination" style={{ marginTop: '16px', paddingTop: '12px' }}>
                    <div className="ls-admin-pagination-info">
                      Página {modalReportsPage} de {Math.ceil(viewingUserReports.reports.length / MODAL_PAGE_SIZE)}
                    </div>
                    <div className="ls-admin-pagination-controls">
                      <button
                        type="button"
                        onClick={() => setModalReportsPage(p => Math.max(p - 1, 1))}
                        disabled={modalReportsPage <= 1}
                        className="ls-admin-pagination-btn"
                      >
                        <PiCaretLeftBold /> Anterior
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalReportsPage(p => Math.min(p + 1, Math.ceil(viewingUserReports.reports.length / MODAL_PAGE_SIZE)))}
                        disabled={modalReportsPage >= Math.ceil(viewingUserReports.reports.length / MODAL_PAGE_SIZE)}
                        className="ls-admin-pagination-btn"
                      >
                        Siguiente <PiCaretRightBold />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="ls-admin-form-actions flex-start-margin">
              <button
                onClick={() => setViewingUserReports(null)}
                className="ls-admin-btn-save-pink"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL MARCAR COMO RESUELTO CON COMENTARIO DE ADMINISTRADOR ── */}
      {resolvingReport && (
        <div className="ls-admin-modal-overlay">
          <div className="ls-admin-modal-content w-500 border-resolve">
            <div className="ls-admin-modal-header resolve-header">
              <h3 className="ls-admin-modal-title green">
                Resolver Reporte {resolvingReport.id}
              </h3>
              <button
                type="button"
                onClick={() => setResolvingReport(null)}
                className="ls-admin-modal-close-btn"
              >
                <PiXBold />
              </button>
            </div>

            <p className="ls-admin-resolve-prompt-text">
              Ingresa el comentario de resolución que se asociará al reporte e informará a <strong>{resolvingReport.reporterUser}</strong>.
            </p>

            <form onSubmit={handleConfirmResolve} className="ls-admin-modal-flex-form resolve-form-gap">
              <div className="ls-admin-resolve-callout">
                <strong>Motivo denunciado:</strong> {resolvingReport.reason}<br />
                <strong>Reportado:</strong> {resolvingReport.reportedUser} | <strong>Denunciante:</strong> {resolvingReport.reporterUser}
              </div>

              <label className="ls-admin-form-label bold-label">
                Comentario de resolución del Administrador:
                <textarea
                  required
                  placeholder="Ej: Se ha revisado el caso y sancionado al usuario acorde a los términos de la plataforma."
                  value={resolveComment}
                  onChange={(e) => setResolveComment(e.target.value)}
                  rows={4}
                  className="ls-admin-form-textarea green-outline"
                />
              </label>

              <div className="ls-admin-form-actions resolve-margin">
                <button
                  type="button"
                  onClick={() => setResolvingReport(null)}
                  className="ls-admin-btn-cancel"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="ls-admin-btn-save-green"
                >
                  Confirmar y Notificar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL DESESTIMAR REPORTE CON COMENTARIO OBLIGATORIO ── */}
      {dismissingReport && (
        <div className="ls-admin-modal-overlay">
          <div className="ls-admin-modal-content w-500 border-dismiss">
            <div className="ls-admin-modal-header dismiss-header">
              <h3 className="ls-admin-modal-title red" style={{ color: '#ff3c6e' }}>
                Desestimar Reporte {dismissingReport.id}
              </h3>
              <button
                type="button"
                onClick={() => setDismissingReport(null)}
                className="ls-admin-modal-close-btn"
              >
                <PiXBold />
              </button>
            </div>

            <p className="ls-admin-resolve-prompt-text">
              Es obligatorio ingresar un motivo o comentario de desestimación. Este mensaje se notificará al denunciante (<strong>{dismissingReport.reporterUser}</strong>).
            </p>

            <form onSubmit={handleConfirmDismiss} className="ls-admin-modal-flex-form resolve-form-gap">
              <div className="ls-admin-resolve-callout" style={{ borderColor: 'rgba(255, 60, 110, 0.3)' }}>
                <strong>Motivo denunciado:</strong> {dismissingReport.reason}<br />
                <strong>Reportado:</strong> {dismissingReport.reportedUser} | <strong>Denunciante:</strong> {dismissingReport.reporterUser}
              </div>

              <label className="ls-admin-form-label bold-label">
                Comentario de desestimación (Obligatorio):
                <textarea
                  required
                  placeholder="Ej: Tras la revisión, se determinó que la publicación no infringe los términos y condiciones de la comunidad."
                  value={dismissComment}
                  onChange={(e) => setDismissComment(e.target.value)}
                  rows={4}
                  className="ls-admin-form-textarea"
                  style={{ borderColor: 'rgba(255, 60, 110, 0.5)' }}
                />
              </label>

              <div className="ls-admin-form-actions resolve-margin">
                <button
                  type="button"
                  onClick={() => setDismissingReport(null)}
                  className="ls-admin-btn-cancel"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="ls-admin-btn-save-red"
                >
                  Confirmar Desestimación y Notificar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL DAR DE BAJA EVENTO (Con Registro de Motivo Obligatorio) ── */}
      {deletingExplorerItem && (
        <div className="ls-admin-modal-overlay">
          <div className="ls-admin-modal-content w-500 border-dismiss">
            <div className="ls-admin-modal-header dismiss-header">
              <h3 className="ls-admin-modal-title red" style={{ color: '#ff3c6e' }}>
                Dar de Baja / Eliminar Evento
              </h3>
              <button
                type="button"
                onClick={() => setDeletingExplorerItem(null)}
                className="ls-admin-modal-close-btn"
              >
                <PiXBold />
              </button>
            </div>

            <p className="ls-admin-resolve-prompt-text">
              ¿Desea dar de baja permanentemente el evento <strong>{deletingExplorerItem.title}</strong> de <strong>{deletingExplorerItem.owner}</strong>?
            </p>

            <form onSubmit={handleConfirmDeleteExplorerItem} className="ls-admin-modal-flex-form resolve-form-gap">
              <label className="ls-admin-form-label bold-label">
                Motivo de la Baja:
                <select
                  value={eventDeleteReason}
                  onChange={e => setEventDeleteReason(e.target.value)}
                  className="ls-admin-form-select"
                >
                  <option value="Contenido inapropiado / Infracción de normas">Contenido inapropiado / Infracción de normas</option>
                  <option value="Spam o publicidad engañosa">Spam o publicidad engañosa</option>
                  <option value="Evento cancelado o información falsa">Evento cancelado o información falsa</option>
                  <option value="Infracción de derechos de autor">Infracción de derechos de autor</option>
                  <option value="Otro motivo">Otro motivo</option>
                </select>
              </label>

              <label className="ls-admin-form-label bold-label">
                Detalles Adicionales de la Baja (Obligatorio para trazabilidad):
                <textarea
                  required
                  placeholder="Detalla la razón específica de la baja del evento para mantener el registro administrativo..."
                  value={eventDeleteDetails}
                  onChange={e => setEventDeleteDetails(e.target.value)}
                  rows={3}
                  className="ls-admin-form-textarea"
                  style={{ borderColor: 'rgba(255, 60, 110, 0.5)' }}
                />
              </label>

              <div className="ls-admin-form-actions resolve-margin">
                <button
                  type="button"
                  onClick={() => setDeletingExplorerItem(null)}
                  className="ls-admin-btn-cancel"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="ls-admin-btn-save-red"
                >
                  Confirmar Baja y Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── NOTIFICACIÓN ESTILIZADA AL USUARIO DENUNCIANTE / SANCIONADO ── */}
      {notificationToast && (
        <div className="ls-toast-notification">
          <div className="ls-toast-header">
            <span className="ls-toast-title">
              Notificación enviada a {notificationToast.targetUser}
            </span>
            <button
              onClick={() => setNotificationToast(null)}
              className="ls-toast-close-btn"
            >
              <PiXBold />
            </button>
          </div>
          <p className="ls-toast-message">
            "{notificationToast.message}"
          </p>
        </div>
      )}

      <StatusBar />
    </div>
  )
}
