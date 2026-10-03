import { useState } from 'react'
import TopBar from '../components/TopBar'
import StatusBar from '../components/StatusBar'
import { mockReports, mockActivity, mockUsers, mockExplorerItems } from '../data/mockData'
import type { AppPage, Profile, UserReport, UserActivityLog, UserProfile, ExplorerItem, NotificationItem } from '../types'
import {
  PiUsersBold,
  PiWarningOctagonBold,
  PiPulseBold,
  PiMagnifyingGlassBold,
  PiPencilBold,
  PiTrashBold
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
  const [activeTab, setActiveTab] = useState<'reports' | 'users' | 'explorer' | 'activity'>('reports')

  // Estados de datos interactivos desde mockData.ts
  const [reports, setReports] = useState<UserReport[]>(mockReports)
  const [users, setUsers] = useState<UserProfile[]>(mockUsers)
  const [explorerItems, setExplorerItems] = useState<ExplorerItem[]>(mockExplorerItems)
  const [activities] = useState<UserActivityLog[]>(mockActivity)

  // Filtros y búsquedas
  const [reportOriginFilter, setReportOriginFilter] = useState<'All' | 'Discovery' | 'Explorer'>('All')
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [explorerSearchTerm, setExplorerSearchTerm] = useState('')
  const [activityModuleFilter, setActivityModuleFilter] = useState<'All' | 'Perfil' | 'Explorer' | 'Sistema'>('All')

  // Estado para Edición/Inspección Completa de Usuario
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)

  // Estado para Edición/Inspección Completa de Objeto Explorer
  const [editingExplorerItem, setEditingExplorerItem] = useState<ExplorerItem | null>(null)

  // Estado para Visualizar Modal/Ver Reportes de Usuario Específico
  const [viewingUserReports, setViewingUserReports] = useState<{ user: UserProfile; reports: UserReport[] } | null>(null)

  // Estado para Visualizar Detalle de Reporte Individual
  const [editingReport, setEditingReport] = useState<UserReport | null>(null)

  // Estado para Modal de Resolución con Comentario de Administrador
  const [resolvingReport, setResolvingReport] = useState<UserReport | null>(null)
  const [resolveComment, setResolveComment] = useState('')
  const [notificationToast, setNotificationToast] = useState<{ message: string; targetUser: string } | null>(null)

  // ── Handlers Reportes ──
  const handleUpdateReportStatus = (id: string, status: UserReport['status']) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    if (editingReport && editingReport.id === id) {
      setEditingReport(prev => prev ? { ...prev, status } : null)
    }
  }

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

    // Mostrar notificación al usuario denunciante
    setNotificationToast({
      message: updatedComment,
      targetUser: resolvingReport.reporterUser,
    })

    setResolvingReport(null)
    setResolveComment('')

    // Auto-ocultar toast después de 6 segundos
    setTimeout(() => {
      setNotificationToast(null)
    }, 6000)
  }

  const handleSaveReportDetails = (updated: UserReport) => {
    setReports(prev => prev.map(r => r.id === updated.id ? updated : r))
    setEditingReport(null)
  }

  // ── Handlers Usuarios ──
  const handleDeleteUser = (id: string) => {
    if (window.confirm('¿Desea eliminar este usuario permanentemente?')) {
      setUsers(prev => prev.filter(u => u.id !== id))
    }
  }

  const handleSaveUser = (updated: UserProfile) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
    setEditingUser(null)
  }

  const handleOpenUserReportsModal = (user: UserProfile) => {
    const userReportsList = reports.filter(
      r => r.reportedUser.toLowerCase().includes(user.nickname.toLowerCase()) ||
        r.reportedUser.toLowerCase().includes((user.firstName ?? '').toLowerCase())
    )
    setViewingUserReports({ user, reports: userReportsList })
  }

  // ── Handlers Explorer Items ──
  const handleDeleteExplorerItem = (id: string) => {
    if (window.confirm('¿Desea eliminar este objeto de Explorer?')) {
      setExplorerItems(prev => prev.filter(item => item.id !== id))
    }
  }

  const handleToggleExplorerStatus = (id: string) => {
    setExplorerItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === 'Active' ? 'Hidden' : 'Active'
        return { ...item, status: nextStatus }
      }
      return item
    }))
  }

  const handleSaveExplorerItem = (updated: ExplorerItem) => {
    setExplorerItems(prev => prev.map(item => item.id === updated.id ? updated : item))
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

  // Filtros aplicados
  const filteredReports = reports.filter(r => {
    if (reportOriginFilter !== 'All' && r.origin !== reportOriginFilter) return false
    return true
  })

  const filteredUsers = users.filter(u =>
    u.nickname.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearchTerm.toLowerCase())
  )

  const filteredExplorerItems = explorerItems.filter(item =>
    item.title.toLowerCase().includes(explorerSearchTerm.toLowerCase()) ||
    item.owner.toLowerCase().includes(explorerSearchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(explorerSearchTerm.toLowerCase())
  )

  const filteredActivities = activities.filter(act => {
    if (activityModuleFilter !== 'All' && act.module !== activityModuleFilter) return false
    return true
  })

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
        onSignOut={onSignOut || onLogout}
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
              Monitoreo centralizado de la plataforma: Gestión de reportes, edición de usuarios, objetos de Explorer e inspección de logs de actividad.
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
            onClick={() => setActiveTab('explorer')}
            className={`ls-admin-tab-btn ${activeTab === 'explorer' ? 'active-explorer' : ''}`}
          >
            <PiMagnifyingGlassBold className="ls-admin-tab-icon" /> Objetos de Explorer ({explorerItems.length})
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
                <p className="ls-admin-panel-subtitle">Visualiza el origen (Discovery / Explorer) y la categoría (Perfil / Evento) de cada reporte.</p>
              </div>

              {/* Filtro por origen */}
              <div className="ls-admin-filter-group">
                {(['All', 'Discovery', 'Explorer'] as const).map(orig => (
                  <button
                    key={orig}
                    onClick={() => setReportOriginFilter(orig)}
                    className={`ls-admin-filter-btn ${reportOriginFilter === orig ? 'active' : ''}`}
                  >
                    {orig === 'All' ? 'Todos los Orígenes' : orig}
                  </button>
                ))}
              </div>
            </div>

            <div className="ls-admin-list-container">
              {filteredReports.map((report) => (
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
                        <strong>Resolución Administrador:</strong> {report.adminComment}
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
                        {report.status}
                      </span>
                    </div>

                    <button
                      onClick={() => setEditingReport(report)}
                      className="ls-admin-btn-action-edit"
                    >
                      <PiPencilBold /> Editar / Ver Todo
                    </button>

                    <button
                      onClick={() => handleOpenResolveModal(report)}
                      className="ls-admin-btn-action-resolve"
                    >
                      Marcar Resuelto
                    </button>
                    <button
                      onClick={() => handleUpdateReportStatus(report.id, 'Dismissed')}
                      className="ls-admin-btn-action-dismiss"
                    >
                      Desestimar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 2: GESTIÓN DE USUARIOS (Con Conteo Interactivo de Reportes) ── */}
        {activeTab === 'users' && (
          <div className="ls-admin-card-panel">
            <div className="ls-admin-card-header">
              <div>
                <h3 className="ls-admin-card-title">Gestión Total de Usuarios</h3>
                <p className="ls-admin-card-subtitle">Inspecciona la información completa de las cuentas y presiona sobre la cifra de reportes para auditar sus casos.</p>
              </div>
              <input
                type="text"
                placeholder="Buscar usuario, email o rol..."
                value={userSearchTerm}
                onChange={e => setUserSearchTerm(e.target.value)}
                className="ls-admin-search-input"
              />
            </div>

            <div className="ls-admin-table-container">
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
                  {filteredUsers.map(u => (
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
                        <span className={`ls-admin-user-status-pill status-${u.status?.toLowerCase() === 'active' ? 'active' : 'suspended'}`}>
                          {u.status}
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
                            title="Editar Perfil Completo"
                          >
                            <PiPencilBold /> Editar / Ver Todo
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id!)}
                            className="ls-admin-table-btn-delete"
                            title="Eliminar Perfil"
                          >
                            <PiTrashBold /> Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: OBJETOS DE EXPLORER ── */}
        {activeTab === 'explorer' && (
          <div className="ls-admin-card-panel">
            <div className="ls-admin-card-header">
              <div>
                <h3 className="ls-admin-card-title">Gestión de Artículos y Objetos en Explorer</h3>
                <p className="ls-admin-card-subtitle">Controla los eventos, perfiles y artículos publicados en la sección Explorer.</p>
              </div>
              <input
                type="text"
                placeholder="Buscar artículo, autor o lugar..."
                value={explorerSearchTerm}
                onChange={e => setExplorerSearchTerm(e.target.value)}
                className="ls-admin-search-input"
              />
            </div>

            <div className="ls-admin-table-container">
              <table className="ls-admin-table">
                <thead>
                  <tr>
                    <th>Título del Objeto</th>
                    <th>Tipo</th>
                    <th>Propietario</th>
                    <th>Ubicación</th>
                    <th>Vistas</th>
                    <th>Estado</th>
                    <th className="ls-admin-table-align-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExplorerItems.map(item => (
                    <tr key={item.id}>
                      <td className="ls-admin-table-bold-cell">
                        <div>
                          <div>{item.title}</div>
                          <small className="ls-admin-table-subtext">{item.genres.join(', ')}</small>
                        </div>
                      </td>
                      <td>
                        <span className="ls-admin-badge-subtle">
                          {item.type}
                        </span>
                      </td>
                      <td className="ls-admin-table-owner-cell">{item.owner}</td>
                      <td className="ls-admin-table-muted-cell">{item.location}</td>
                      <td className="ls-admin-table-views-cell">{item.views}</td>
                      <td>
                        <span className={`ls-admin-status-pill status-${item.status === 'Active' ? 'resolved' : item.status === 'Under Review' ? 'pending' : 'dismissed'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="ls-admin-table-align-right">
                        <div className="ls-admin-table-actions">
                          <button
                            onClick={() => handleToggleExplorerStatus(item.id)}
                            className="ls-admin-table-btn-toggle"
                          >
                            {item.status === 'Active' ? 'Ocultar' : 'Activar'}
                          </button>
                          <button
                            onClick={() => setEditingExplorerItem(item)}
                            className="ls-admin-table-btn-edit"
                          >
                            <PiPencilBold /> Editar / Ver Todo
                          </button>
                          <button
                            onClick={() => handleDeleteExplorerItem(item.id)}
                            className="ls-admin-table-btn-delete"
                          >
                            <PiTrashBold /> Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 4: REGISTRO DE ACTIVIDAD ── */}
        {activeTab === 'activity' && (
          <div className="ls-admin-activity-panel">
            <div className="ls-admin-activity-header">
              <div>
                <h3 className="ls-admin-panel-title">Registro Global de Actividad e IP</h3>
                <p className="ls-admin-panel-subtitle">Auditoría completa de acciones realizadas en Perfiles, Explorer y Sistema.</p>
              </div>

              {/* Filtro por Módulo */}
              <div className="ls-admin-activity-filter-group">
                {(['All', 'Perfil', 'Explorer', 'Sistema'] as const).map(mod => (
                  <button
                    key={mod}
                    onClick={() => setActivityModuleFilter(mod)}
                    className={`ls-admin-activity-filter-btn ${activityModuleFilter === mod ? 'active' : ''}`}
                  >
                    {mod === 'All' ? 'Todos los Módulos' : mod}
                  </button>
                ))}
              </div>
            </div>

            <div className="ls-admin-activity-table-wrap">
              <table className="ls-admin-activity-table">
                <thead>
                  <tr className="ls-admin-activity-table-head-row">
                    <th>ID Evento</th>
                    <th>Módulo</th>
                    <th>Usuario</th>
                    <th>Acción Ejecutada</th>
                    <th>Tiempo</th>
                    <th>Dirección IP</th>
                    <th>Dispositivo</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map(act => (
                    <tr key={act.id} className="ls-admin-activity-table-row">
                      <td className="ls-admin-activity-id-cell">{act.id}</td>
                      <td className="ls-admin-activity-cell">
                        <span className={`ls-admin-module-badge ${act.module.toLowerCase()}`}>
                          {act.module}
                        </span>
                      </td>
                      <td className="ls-admin-activity-user-cell">{act.user}</td>
                      <td className="ls-admin-activity-action-cell">{act.action}</td>
                      <td className="ls-admin-activity-time-cell">{act.timestamp}</td>
                      <td className="ls-admin-activity-ip-cell">{act.ip}</td>
                      <td className="ls-admin-activity-device-cell">{act.device}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* ── MODAL EDICIÓN Y VISUALIZACIÓN COMPLETA DE USUARIO (TODOS LOS CAMPOS) ── */}
      {editingUser && (
        <div className="ls-admin-modal-overlay">
          <div className="ls-admin-modal-content w-650">
            <div className="ls-admin-modal-header">
              <h3 className="ls-admin-modal-title purple">Edición Completa del Perfil de Usuario</h3>
              <span className="ls-admin-modal-id">ID: {editingUser.id}</span>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveUser(editingUser) }} className="ls-admin-modal-grid-form">
              <label className="ls-admin-form-label">
                Primer Nombre (firstName)
                <input
                  type="text"
                  value={editingUser.firstName ?? ''}
                  onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                  className="ls-admin-form-input"
                />
              </label>

              <label className="ls-admin-form-label">
                Apellido (lastName)
                <input
                  type="text"
                  value={editingUser.lastName ?? ''}
                  onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                  className="ls-admin-form-input"
                />
              </label>

              <label className="ls-admin-form-label">
                Nickname / Nombre Artístico
                <input
                  type="text"
                  value={editingUser.nickname}
                  onChange={(e) => setEditingUser({ ...editingUser, nickname: e.target.value })}
                  className="ls-admin-form-input"
                />
              </label>

              <label className="ls-admin-form-label">
                Email
                <input
                  type="email"
                  value={editingUser.email ?? ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="ls-admin-form-input"
                />
              </label>

              <label className="ls-admin-form-label">
                Rol
                <input
                  type="text"
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="ls-admin-form-input"
                />
              </label>

              <label className="ls-admin-form-label">
                Ubicación (location)
                <input
                  type="text"
                  value={editingUser.location}
                  onChange={(e) => setEditingUser({ ...editingUser, location: e.target.value })}
                  className="ls-admin-form-input"
                />
              </label>

              <label className="ls-admin-form-label">
                Estado de la Cuenta
                <select
                  value={editingUser.status ?? 'Active'}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                  className="ls-admin-form-select"
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Banned">Banned</option>
                </select>
              </label>

              <label className="ls-admin-form-label">
                SoundCloud URL
                <input
                  type="url"
                  value={editingUser.soundcloudUrl ?? ''}
                  onChange={(e) => setEditingUser({ ...editingUser, soundcloudUrl: e.target.value })}
                  className="ls-admin-form-input"
                />
              </label>

              <label className="ls-admin-form-label">
                Spotify URL
                <input
                  type="url"
                  value={editingUser.spotifyUrl ?? ''}
                  onChange={(e) => setEditingUser({ ...editingUser, spotifyUrl: e.target.value })}
                  className="ls-admin-form-input"
                />
              </label>

              <label className="ls-admin-form-label">
                Instagram URL
                <input
                  type="url"
                  value={editingUser.instagramUrl ?? ''}
                  onChange={(e) => setEditingUser({ ...editingUser, instagramUrl: e.target.value })}
                  className="ls-admin-form-input"
                />
              </label>

              <label className="ls-admin-form-label span-2">
                Géneros de Interés (separados por coma)
                <input
                  type="text"
                  value={(editingUser.interestGenres ?? []).join(', ')}
                  onChange={(e) => setEditingUser({ ...editingUser, interestGenres: e.target.value.split(',').map(s => s.trim()) })}
                  className="ls-admin-form-input"
                />
              </label>

              <label className="ls-admin-form-label span-2">
                Biografía / Descripción del Perfil
                <textarea
                  value={editingUser.description ?? ''}
                  onChange={(e) => setEditingUser({ ...editingUser, description: e.target.value })}
                  rows={3}
                  className="ls-admin-form-textarea"
                />
              </label>

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
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL EDICIÓN Y VISUALIZACIÓN COMPLETA DE OBJETO EXPLORER (TODOS LOS CAMPOS) ── */}
      {editingExplorerItem && (
        <div className="ls-admin-modal-overlay">
          <div className="ls-admin-modal-content w-600">
            <div className="ls-admin-modal-header">
              <h3 className="ls-admin-modal-title yellow">Edición Completa del Objeto de Explorer</h3>
              <span className="ls-admin-modal-id">ID: {editingExplorerItem.id}</span>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveExplorerItem(editingExplorerItem) }} className="ls-admin-modal-grid-form">
              <label className="ls-admin-form-label span-2">
                Título del Objeto / Evento
                <input
                  type="text"
                  value={editingExplorerItem.title}
                  onChange={(e) => setEditingExplorerItem({ ...editingExplorerItem, title: e.target.value })}
                  className="ls-admin-form-input"
                />
              </label>

              <label className="ls-admin-form-label">
                Tipo de Objeto
                <select
                  value={editingExplorerItem.type}
                  onChange={(e) => setEditingExplorerItem({ ...editingExplorerItem, type: e.target.value as 'Perfil' | 'Evento' })}
                  className="ls-admin-form-select"
                >
                  <option value="Perfil">Perfil</option>
                  <option value="Evento">Evento</option>
                </select>
              </label>

              <label className="ls-admin-form-label">
                Estado de Publicación
                <select
                  value={editingExplorerItem.status}
                  onChange={(e) => setEditingExplorerItem({ ...editingExplorerItem, status: e.target.value as any })}
                  className="ls-admin-form-select"
                >
                  <option value="Active">Active</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Hidden">Hidden</option>
                </select>
              </label>

              <label className="ls-admin-form-label">
                Propietario / Creador
                <input
                  type="text"
                  value={editingExplorerItem.owner}
                  onChange={(e) => setEditingExplorerItem({ ...editingExplorerItem, owner: e.target.value })}
                  className="ls-admin-form-input"
                />
              </label>

              <label className="ls-admin-form-label">
                Ubicación
                <input
                  type="text"
                  value={editingExplorerItem.location}
                  onChange={(e) => setEditingExplorerItem({ ...editingExplorerItem, location: e.target.value })}
                  className="ls-admin-form-input"
                />
              </label>

              <label className="ls-admin-form-label">
                Número de Vistas
                <input
                  type="number"
                  value={editingExplorerItem.views}
                  onChange={(e) => setEditingExplorerItem({ ...editingExplorerItem, views: parseInt(e.target.value) || 0 })}
                  className="ls-admin-form-input"
                />
              </label>

              <label className="ls-admin-form-label">
                Fecha de Creación
                <input
                  type="text"
                  value={editingExplorerItem.createdDate}
                  onChange={(e) => setEditingExplorerItem({ ...editingExplorerItem, createdDate: e.target.value })}
                  className="ls-admin-form-input"
                />
              </label>

              <label className="ls-admin-form-label span-2">
                Géneros y Etiquetas (separados por coma)
                <input
                  type="text"
                  value={editingExplorerItem.genres.join(', ')}
                  onChange={(e) => setEditingExplorerItem({ ...editingExplorerItem, genres: e.target.value.split(',').map(s => s.trim()) })}
                  className="ls-admin-form-input"
                />
              </label>

              <label className="ls-admin-form-label span-2">
                Descripción Detallada
                <textarea
                  value={editingExplorerItem.description}
                  onChange={(e) => setEditingExplorerItem({ ...editingExplorerItem, description: e.target.value })}
                  rows={4}
                  className="ls-admin-form-textarea"
                />
              </label>

              <div className="ls-admin-form-actions">
                <button
                  type="button"
                  onClick={() => setEditingExplorerItem(null)}
                  className="ls-admin-btn-cancel"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="ls-admin-btn-save-yellow"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL EDICIÓN Y VISUALIZACIÓN COMPLETA DE REPORTE (TODOS LOS CAMPOS) ── */}
      {editingReport && (
        <div className="ls-admin-modal-overlay">
          <div className="ls-admin-modal-content w-550">
            <div className="ls-admin-modal-header">
              <h3 className="ls-admin-modal-title cyan">Detalles del Reporte</h3>
              <span className="ls-admin-modal-id">ID: {editingReport.id}</span>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveReportDetails(editingReport) }} className="ls-admin-modal-flex-form">
              <div className="ls-admin-modal-grid-form">
                <label className="ls-admin-form-label">
                  Usuario Reportado
                  <input
                    type="text"
                    value={editingReport.reportedUser}
                    onChange={(e) => setEditingReport({ ...editingReport, reportedUser: e.target.value })}
                    className="ls-admin-form-input"
                  />
                </label>

                <label className="ls-admin-form-label">
                  Usuario Denunciante
                  <input
                    type="text"
                    value={editingReport.reporterUser}
                    onChange={(e) => setEditingReport({ ...editingReport, reporterUser: e.target.value })}
                    className="ls-admin-form-input"
                  />
                </label>
              </div>

              <div className="ls-admin-modal-grid-form">
                <label className="ls-admin-form-label">
                  Origen
                  <select
                    value={editingReport.origin}
                    onChange={(e) => setEditingReport({ ...editingReport, origin: e.target.value as any })}
                    className="ls-admin-form-select"
                  >
                    <option value="Discovery">Discovery</option>
                    <option value="Explorer">Explorer</option>
                  </select>
                </label>

                <label className="ls-admin-form-label">
                  Tipo Objetivo
                  <select
                    value={editingReport.targetType}
                    onChange={(e) => setEditingReport({ ...editingReport, targetType: e.target.value as any })}
                    className="ls-admin-form-select"
                  >
                    <option value="Perfil">Perfil</option>
                    <option value="Evento">Evento</option>
                  </select>
                </label>

                <label className="ls-admin-form-label">
                  Severidad
                  <select
                    value={editingReport.severity}
                    onChange={(e) => setEditingReport({ ...editingReport, severity: e.target.value as any })}
                    className="ls-admin-form-select"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </label>
              </div>

              <label className="ls-admin-form-label">
                Motivo Principal
                <input
                  type="text"
                  value={editingReport.reason}
                  onChange={(e) => setEditingReport({ ...editingReport, reason: e.target.value })}
                  className="ls-admin-form-input"
                />
              </label>

              <label className="ls-admin-form-label">
                Detalles del Incidente
                <textarea
                  value={editingReport.details}
                  onChange={(e) => setEditingReport({ ...editingReport, details: e.target.value })}
                  rows={4}
                  className="ls-admin-form-textarea"
                />
              </label>

              <label className="ls-admin-form-label">
                Estado
                <select
                  value={editingReport.status}
                  onChange={(e) => setEditingReport({ ...editingReport, status: e.target.value as any })}
                  className="ls-admin-form-select"
                >
                  <option value="Pending">Pending</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Dismissed">Dismissed</option>
                </select>
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

      {/* ── MODAL VER REPORTES DE UN USUARIO ESPECÍFICO (AL PRESIONAR EL NÚMERO DE REPORTES) ── */}
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
                ✕
              </button>
            </div>

            {viewingUserReports.reports.length === 0 ? (
              <div className="ls-admin-user-reports-empty">
                Este usuario no cuenta con reportes activos o contabilizados en el sistema.
              </div>
            ) : (
              <div className="ls-admin-user-reports-list">
                {viewingUserReports.reports.map(rep => (
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
                      <span>Estado: <strong className={rep.status === 'Resolved' ? 'ls-admin-status-resolved' : 'ls-admin-status-pending-text'}>{rep.status}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
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
                ✕
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

      {/* ── NOTIFICACIÓN ESTILIZADA AL USUARIO DENUNCIANTE ── */}
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
              ✕
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
