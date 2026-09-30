import { useState } from 'react'
import TopBar from '../components/TopBar'
import StatusBar from '../components/StatusBar'
import { mockReports, mockActivity, mockUsers, mockExplorerItems } from '../data/mockData'
import type { AppPage, Profile, UserReport, UserActivityLog, UserProfile, ExplorerItem } from '../types'
import {
  PiSignOutBold,
  PiUsersBold,
  PiWarningOctagonBold,
  PiPulseBold,
  PiMagnifyingGlassBold,
  PiPencilBold,
  PiTrashBold,
  PiEyeBold
} from 'react-icons/pi'

type AdminPageProps = {
  onNavigate: (page: AppPage) => void
  onLogout?: () => void
  profile?: Profile
}

export default function AdminPage({ onNavigate, onLogout, profile }: AdminPageProps) {
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
    onLogout?.()
    onNavigate('Login')
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
      <TopBar activePage="Admin" onNavigate={onNavigate} profile={profile} isAdminSession={true} />

      <main className="ls-admin-main-content">

        {/* Banner Admin Header */}
        <div className="ls-admin-banner">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="ls-admin-badge-isolated">Sistema Aislado de Administración</span>
              <h1 className="ls-admin-banner-title">Panel de Moderación y Control Global</h1>
            </div>
            <p className="ls-admin-banner-desc">
              Monitoreo centralizado de la plataforma: Gestión de reportes, edición de usuarios, objetos de Explorer e inspección de logs de actividad.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="ls-admin-stat-card pending">
              <div className="ls-admin-stat-num pending">{reports.filter(r => r.status === 'Pending').length}</div>
              <div className="ls-admin-stat-lbl">Reportes Pendientes</div>
            </div>
            <div className="ls-admin-stat-card users">
              <div className="ls-admin-stat-num users">{users.length}</div>
              <div className="ls-admin-stat-lbl">Usuarios Totales</div>
            </div>
            <button
              onClick={handleSignOut}
              className="ls-admin-logout-btn"
            >
              <PiSignOutBold /> Salir
            </button>
          </div>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="ls-admin-tabs-row">
          <button
            onClick={() => setActiveTab('reports')}
            className={`ls-admin-tab-btn ${activeTab === 'reports' ? 'active-reports' : ''}`}
          >
            <PiWarningOctagonBold style={{ fontSize: '18px' }} /> Reportes ({reports.length})
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`ls-admin-tab-btn ${activeTab === 'users' ? 'active-users' : ''}`}
          >
            <PiUsersBold style={{ fontSize: '18px' }} /> Gestión de Usuarios ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('explorer')}
            className={`ls-admin-tab-btn ${activeTab === 'explorer' ? 'active-explorer' : ''}`}
          >
            <PiMagnifyingGlassBold style={{ fontSize: '18px' }} /> Objetos de Explorer ({explorerItems.length})
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`ls-admin-tab-btn ${activeTab === 'activity' ? 'active-activity' : ''}`}
          >
            <PiPulseBold style={{ fontSize: '18px' }} /> Registro de Actividad ({activities.length})
          </button>
        </div>

        {/* ── TAB 1: REPORTES ── */}
        {activeTab === 'reports' && (
          <div className="ls-admin-card-panel">
            <div className="ls-admin-card-header">
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 700 }}>Todos los Reportes de la Plataforma</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Visualiza el origen (Discovery / Explorer) y la categoría (Perfil / Evento) de cada reporte.</p>
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
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{report.id}</span>

                      <span className={report.origin === 'Discovery' ? 'ls-admin-badge-origin-discovery' : 'ls-admin-badge-origin-explorer'}>
                        Origen: {report.origin}
                      </span>

                      <span className={report.targetType === 'Perfil' ? 'ls-admin-badge-type-perfil' : 'ls-admin-badge-type-evento'}>
                        Tipo: {report.targetType}
                      </span>

                      <span className={report.severity === 'High' ? 'ls-admin-badge-severity-high' : 'ls-admin-badge-severity-medium'}>
                        Severidad: {report.severity}
                      </span>

                      <span style={{ fontSize: '14px', color: '#fff', fontWeight: 600 }}>
                        <strong style={{ color: '#ff3c6e' }}>{report.reportedUser}</strong> reportado por <strong>{report.reporterUser}</strong>
                      </span>
                    </div>

                    <div style={{ fontSize: '14px', color: '#fff', marginBottom: '8px', fontWeight: 500 }}>
                      Motivo: <span style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>{report.reason}</span>
                    </div>

                    <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.3)', padding: '12px 14px', borderRadius: '8px', borderLeft: '3px solid #ff3c6e' }}>
                      "{report.details}"
                    </p>

                    {report.adminComment && (
                      <div className="ls-admin-comment-box">
                        <strong>Resolución Administrador:</strong> {report.adminComment}
                      </div>
                    )}

                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                      Fecha y hora: {report.date}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '160px' }}>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textAlign: 'right' }}>
                      Estado: <strong style={{ color: report.status === 'Resolved' ? '#27ae60' : report.status === 'Pending' ? '#ffb400' : 'rgba(255,255,255,0.6)' }}>{report.status}</strong>
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
          <div style={{ background: 'rgba(18, 18, 28, 0.6)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 700 }}>Gestión Total de Usuarios</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Inspecciona la información completa de las cuentas y presiona sobre la cifra de reportes para auditar sus casos.</p>
              </div>
              <input
                type="text"
                placeholder="Buscar usuario, email o rol..."
                value={userSearchTerm}
                onChange={e => setUserSearchTerm(e.target.value)}
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  color: '#fff',
                  width: '280px',
                  fontSize: '13px'
                }}
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '14px' }}>Usuario</th>
                    <th style={{ padding: '14px' }}>Email</th>
                    <th style={{ padding: '14px' }}>Rol</th>
                    <th style={{ padding: '14px' }}>Ubicación</th>
                    <th style={{ padding: '14px' }}>Estado</th>
                    <th style={{ padding: '14px' }}>Reportes</th>
                    <th style={{ padding: '14px', textAlign: 'right' }}>Acciones Administrador</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}>
                      <td style={{ padding: '14px', fontWeight: 700 }}>
                        <div>
                          <div>{u.nickname}</div>
                          <small style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{u.firstName} {u.lastName}</small>
                        </div>
                      </td>
                      <td style={{ padding: '14px', color: 'rgba(255,255,255,0.7)' }}>{u.email}</td>
                      <td style={{ padding: '14px' }}>{u.role}</td>
                      <td style={{ padding: '14px', color: 'rgba(255,255,255,0.6)' }}>{u.location}</td>
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: u.status === 'Active' ? 'rgba(39, 174, 96, 0.2)' : 'rgba(231, 76, 60, 0.2)',
                          color: u.status === 'Active' ? '#27ae60' : '#e74c3c',
                          border: `1px solid ${u.status === 'Active' ? '#27ae60' : '#e74c3c'}`
                        }}>
                          {u.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px' }}>
                        {/* Botón interactivo para ver los reportes específicos de este usuario */}
                        <button
                          onClick={() => handleOpenUserReportsModal(u)}
                          style={{
                            background: u.reportsCount ? 'rgba(255, 60, 110, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            color: u.reportsCount ? '#ff3c6e' : 'rgba(255,255,255,0.6)',
                            border: `1px solid ${u.reportsCount ? '#ff3c6e' : 'rgba(255,255,255,0.1)'}`,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Presione para ver el desglose de reportes de este usuario"
                        >
                          <PiWarningOctagonBold /> {u.reportsCount ?? 0} Reportes
                        </button>
                      </td>
                      <td style={{ padding: '14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => setEditingUser(u)}
                            style={{
                              background: 'rgba(0,229,255,0.15)',
                              color: '#00e5ff',
                              border: '1px solid rgba(0,229,255,0.3)',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Editar Perfil Completo"
                          >
                            <PiPencilBold /> Editar / Ver Todo
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id!)}
                            style={{
                              background: 'rgba(231, 76, 60, 0.2)',
                              color: '#e74c3c',
                              border: '1px solid rgba(231, 76, 60, 0.4)',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
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
          <div style={{ background: 'rgba(18, 18, 28, 0.6)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 700 }}>Gestión de Artículos y Objetos en Explorer</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Controla los eventos, perfiles y artículos publicados en la sección Explorer.</p>
              </div>
              <input
                type="text"
                placeholder="Buscar artículo, autor o lugar..."
                value={explorerSearchTerm}
                onChange={e => setExplorerSearchTerm(e.target.value)}
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  color: '#fff',
                  width: '280px',
                  fontSize: '13px'
                }}
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '14px' }}>Título del Objeto</th>
                    <th style={{ padding: '14px' }}>Tipo</th>
                    <th style={{ padding: '14px' }}>Propietario</th>
                    <th style={{ padding: '14px' }}>Ubicación</th>
                    <th style={{ padding: '14px' }}>Vistas</th>
                    <th style={{ padding: '14px' }}>Estado</th>
                    <th style={{ padding: '14px', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExplorerItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}>
                      <td style={{ padding: '14px', fontWeight: 700 }}>
                        <div>
                          <div>{item.title}</div>
                          <small style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{item.genres.join(', ')}</small>
                        </div>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: item.type === 'Evento' ? 'rgba(255, 180, 0, 0.2)' : 'rgba(155, 81, 224, 0.2)',
                          color: item.type === 'Evento' ? '#ffb400' : '#9b51e0'
                        }}>
                          {item.type}
                        </span>
                      </td>
                      <td style={{ padding: '14px', color: 'rgba(255,255,255,0.8)' }}>{item.owner}</td>
                      <td style={{ padding: '14px', color: 'rgba(255,255,255,0.6)' }}>{item.location}</td>
                      <td style={{ padding: '14px', color: '#00e5ff', fontWeight: 600 }}>{item.views}</td>
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: item.status === 'Active' ? 'rgba(39, 174, 96, 0.2)' : 'rgba(231, 76, 60, 0.2)',
                          color: item.status === 'Active' ? '#27ae60' : '#e74c3c'
                        }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => handleToggleExplorerStatus(item.id)}
                            style={{
                              background: 'rgba(255,255,255,0.08)',
                              color: '#fff',
                              border: '1px solid rgba(255,255,255,0.15)',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '11px'
                            }}
                          >
                            {item.status === 'Active' ? 'Ocultar' : 'Activar'}
                          </button>
                          <button
                            onClick={() => setEditingExplorerItem(item)}
                            style={{
                              background: 'rgba(0,229,255,0.15)',
                              color: '#00e5ff',
                              border: '1px solid rgba(0,229,255,0.3)',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <PiPencilBold /> Editar / Ver Todo
                          </button>
                          <button
                            onClick={() => handleDeleteExplorerItem(item.id)}
                            style={{
                              background: 'rgba(231, 76, 60, 0.2)',
                              color: '#e74c3c',
                              border: '1px solid rgba(231, 76, 60, 0.4)',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
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
          <div style={{ background: 'rgba(18, 18, 28, 0.6)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 700 }}>Registro Global de Actividad e IP</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Auditoría completa de acciones realizadas en Perfiles, Explorer y Sistema.</p>
              </div>

              {/* Filtro por Módulo */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['All', 'Perfil', 'Explorer', 'Sistema'] as const).map(mod => (
                  <button
                    key={mod}
                    onClick={() => setActivityModuleFilter(mod)}
                    style={{
                      background: activityModuleFilter === mod ? '#00e5ff' : 'rgba(255,255,255,0.06)',
                      color: activityModuleFilter === mod ? '#000' : '#fff',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {mod === 'All' ? 'Todos los Módulos' : mod}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '14px' }}>ID Evento</th>
                    <th style={{ padding: '14px' }}>Módulo</th>
                    <th style={{ padding: '14px' }}>Usuario</th>
                    <th style={{ padding: '14px' }}>Acción Ejecutada</th>
                    <th style={{ padding: '14px' }}>Tiempo</th>
                    <th style={{ padding: '14px' }}>Dirección IP</th>
                    <th style={{ padding: '14px' }}>Dispositivo</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map(act => (
                    <tr key={act.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}>
                      <td style={{ padding: '14px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{act.id}</td>
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: act.module === 'Explorer' ? 'rgba(255, 180, 0, 0.2)' : act.module === 'Perfil' ? 'rgba(155, 81, 224, 0.2)' : 'rgba(0, 229, 255, 0.2)',
                          color: act.module === 'Explorer' ? '#ffb400' : act.module === 'Perfil' ? '#9b51e0' : '#00e5ff'
                        }}>
                          {act.module}
                        </span>
                      </td>
                      <td style={{ padding: '14px', fontWeight: 600 }}>{act.user}</td>
                      <td style={{ padding: '14px', color: '#00e5ff', fontWeight: 500 }}>{act.action}</td>
                      <td style={{ padding: '14px', color: 'rgba(255,255,255,0.6)' }}>{act.timestamp}</td>
                      <td style={{ padding: '14px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.2)' }}>{act.ip}</td>
                      <td style={{ padding: '14px', color: 'rgba(255,255,255,0.5)' }}>{act.device}</td>
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#141420',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '16px',
            padding: '28px',
            width: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            color: '#fff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#9b51e0', fontWeight: 700 }}>Edición Completa del Perfil de Usuario</h3>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>ID: {editingUser.id}</span>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveUser(editingUser) }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                Primer Nombre (firstName)
                <input
                  type="text"
                  value={editingUser.firstName ?? ''}
                  onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                />
              </label>

              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                Apellido (lastName)
                <input
                  type="text"
                  value={editingUser.lastName ?? ''}
                  onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                />
              </label>

              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                Nickname / Nombre Artístico
                <input
                  type="text"
                  value={editingUser.nickname}
                  onChange={(e) => setEditingUser({ ...editingUser, nickname: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                />
              </label>

              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                Email
                <input
                  type="email"
                  value={editingUser.email ?? ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                />
              </label>

              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                Rol
                <input
                  type="text"
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                />
              </label>

              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                Ubicación (location)
                <input
                  type="text"
                  value={editingUser.location}
                  onChange={(e) => setEditingUser({ ...editingUser, location: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                />
              </label>

              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                Estado de la Cuenta
                <select
                  value={editingUser.status ?? 'Active'}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Banned">Banned</option>
                </select>
              </label>

              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                SoundCloud URL
                <input
                  type="url"
                  value={editingUser.soundcloudUrl ?? ''}
                  onChange={(e) => setEditingUser({ ...editingUser, soundcloudUrl: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                />
              </label>

              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                Spotify URL
                <input
                  type="url"
                  value={editingUser.spotifyUrl ?? ''}
                  onChange={(e) => setEditingUser({ ...editingUser, spotifyUrl: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                />
              </label>

              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                Instagram URL
                <input
                  type="url"
                  value={editingUser.instagramUrl ?? ''}
                  onChange={(e) => setEditingUser({ ...editingUser, instagramUrl: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                />
              </label>

              <label style={{ gridColumn: 'span 2', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                Géneros de Interés (separados por coma)
                <input
                  type="text"
                  value={(editingUser.interestGenres ?? []).join(', ')}
                  onChange={(e) => setEditingUser({ ...editingUser, interestGenres: e.target.value.split(',').map(s => s.trim()) })}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                />
              </label>

              <label style={{ gridColumn: 'span 2', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                Biografía / Descripción del Perfil
                <textarea
                  value={editingUser.bio ?? ''}
                  onChange={(e) => setEditingUser({ ...editingUser, bio: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                />
              </label>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ background: '#9b51e0', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#141420',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '16px',
            padding: '28px',
            width: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            color: '#fff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#ffb400', fontWeight: 700 }}>Edición Completa del Objeto de Explorer</h3>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>ID: {editingExplorerItem.id}</span>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveExplorerItem(editingExplorerItem) }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <label style={{ gridColumn: 'span 2', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                Título del Objeto / Evento
                <input
                  type="text"
                  value={editingExplorerItem.title}
                  onChange={(e) => setEditingExplorerItem({ ...editingExplorerItem, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                />
              </label>

              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                Tipo de Objeto
                <select
                  value={editingExplorerItem.type}
                  onChange={(e) => setEditingExplorerItem({ ...editingExplorerItem, type: e.target.value as 'Perfil' | 'Evento' })}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                >
                  <option value="Perfil">Perfil</option>
                  <option value="Evento">Evento</option>
                </select>
              </label>

              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                Estado de Publicación
                <select
                  value={editingExplorerItem.status}
                  onChange={(e) => setEditingExplorerItem({ ...editingExplorerItem, status: e.target.value as any })}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                >
                  <option value="Active">Active</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Hidden">Hidden</option>
                </select>
              </label>

              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                Propietario / Creador
                <input
                  type="text"
                  value={editingExplorerItem.owner}
                  onChange={(e) => setEditingExplorerItem({ ...editingExplorerItem, owner: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                />
              </label>

              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                Ubicación
                <input
                  type="text"
                  value={editingExplorerItem.location}
                  onChange={(e) => setEditingExplorerItem({ ...editingExplorerItem, location: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                />
              </label>

              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                Número de Vistas
                <input
                  type="number"
                  value={editingExplorerItem.views}
                  onChange={(e) => setEditingExplorerItem({ ...editingExplorerItem, views: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                />
              </label>

              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                Fecha de Creación
                <input
                  type="text"
                  value={editingExplorerItem.createdDate}
                  onChange={(e) => setEditingExplorerItem({ ...editingExplorerItem, createdDate: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                />
              </label>

              <label style={{ gridColumn: 'span 2', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                Géneros y Etiquetas (separados por coma)
                <input
                  type="text"
                  value={editingExplorerItem.genres.join(', ')}
                  onChange={(e) => setEditingExplorerItem({ ...editingExplorerItem, genres: e.target.value.split(',').map(s => s.trim()) })}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                />
              </label>

              <label style={{ gridColumn: 'span 2', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                Descripción Detallada
                <textarea
                  value={editingExplorerItem.description}
                  onChange={(e) => setEditingExplorerItem({ ...editingExplorerItem, description: e.target.value })}
                  rows={4}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                />
              </label>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEditingExplorerItem(null)}
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ background: '#ffb400', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#141420',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '16px',
            padding: '28px',
            width: '550px',
            color: '#fff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#00e5ff', fontWeight: 700 }}>Detalles del Reporte</h3>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>ID: {editingReport.id}</span>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveReportDetails(editingReport) }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                  Usuario Reportado
                  <input
                    type="text"
                    value={editingReport.reportedUser}
                    onChange={(e) => setEditingReport({ ...editingReport, reportedUser: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                  />
                </label>

                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                  Usuario Denunciante
                  <input
                    type="text"
                    value={editingReport.reporterUser}
                    onChange={(e) => setEditingReport({ ...editingReport, reporterUser: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                  Origen
                  <select
                    value={editingReport.origin}
                    onChange={(e) => setEditingReport({ ...editingReport, origin: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                  >
                    <option value="Discovery">Discovery</option>
                    <option value="Explorer">Explorer</option>
                  </select>
                </label>

                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                  Tipo Objetivo
                  <select
                    value={editingReport.targetType}
                    onChange={(e) => setEditingReport({ ...editingReport, targetType: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                  >
                    <option value="Perfil">Perfil</option>
                    <option value="Evento">Evento</option>
                  </select>
                </label>

                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                  Severidad
                  <select
                    value={editingReport.severity}
                    onChange={(e) => setEditingReport({ ...editingReport, severity: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </label>
              </div>

              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                Motivo Principal
                <input
                  type="text"
                  value={editingReport.reason}
                  onChange={(e) => setEditingReport({ ...editingReport, reason: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                />
              </label>

              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                Detalles del Incidente
                <textarea
                  value={editingReport.details}
                  onChange={(e) => setEditingReport({ ...editingReport, details: e.target.value })}
                  rows={4}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                />
              </label>

              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                Estado
                <select
                  value={editingReport.status}
                  onChange={(e) => setEditingReport({ ...editingReport, status: e.target.value as any })}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                >
                  <option value="Pending">Pending</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Dismissed">Dismissed</option>
                </select>
              </label>

              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                Comentario de Resolución (Administrador)
                <textarea
                  placeholder="Detalla los motivos o resolución de la acción tomada..."
                  value={editingReport.adminComment ?? ''}
                  onChange={(e) => setEditingReport({ ...editingReport, adminComment: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '4px', borderRadius: '6px', border: '1px solid rgba(39, 174, 96, 0.4)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setEditingReport(null)}
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ background: '#00e5ff', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#141420',
            border: '1px solid rgba(255, 60, 110, 0.3)',
            borderRadius: '16px',
            padding: '28px',
            width: '600px',
            maxHeight: '85vh',
            overflowY: 'auto',
            color: '#fff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#ff3c6e', fontWeight: 700 }}>
                  Reportes Asociados a {viewingUserReports.user.nickname}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                  Total contabilizado: {viewingUserReports.reports.length} reporte(s)
                </p>
              </div>
              <button
                onClick={() => setViewingUserReports(null)}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {viewingUserReports.reports.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
                Este usuario no cuenta con reportes activos o contabilizados en el sistema.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {viewingUserReports.reports.map(rep => (
                  <div key={rep.id} style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)' }}>{rep.id}</span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: rep.severity === 'High' ? 'rgba(255,60,110,0.25)' : 'rgba(255,180,0,0.25)',
                        color: rep.severity === 'High' ? '#ff3c6e' : '#ffb400'
                      }}>
                        {rep.severity}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: '#fff', marginBottom: '6px', fontWeight: 600 }}>
                      Denunciado por: <span style={{ color: '#00e5ff' }}>{rep.reporterUser}</span>
                    </div>

                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', marginBottom: '6px' }}>
                      <strong>Motivo:</strong> {rep.reason}
                    </div>

                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'rgba(255,255,255,0.6)', background: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: '6px' }}>
                      "{rep.details}"
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                      <span>Fecha: {rep.date} | Origen: {rep.origin}</span>
                      <span>Estado: <strong style={{ color: rep.status === 'Resolved' ? '#27ae60' : '#ffb400' }}>{rep.status}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setViewingUserReports(null)}
                style={{ background: '#ff3c6e', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL MARCAR COMO RESUELTO CON COMENTARIO DE ADMINISTRADOR ── */}
      {resolvingReport && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#141420',
            border: '1px solid rgba(39, 174, 96, 0.4)',
            borderRadius: '16px',
            padding: '28px',
            width: '500px',
            color: '#fff',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#27ae60', fontWeight: 700 }}>
                Resolver Reporte {resolvingReport.id}
              </h3>
              <button
                type="button"
                onClick={() => setResolvingReport(null)}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: '0 0 16px 0' }}>
              Ingresa el comentario de resolución que se asociará al reporte e informará a <strong>{resolvingReport.reporterUser}</strong>.
            </p>

            <form onSubmit={handleConfirmResolve} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #ff3c6e', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                <strong>Motivo denunciado:</strong> {resolvingReport.reason}<br />
                <strong>Reportado:</strong> {resolvingReport.reportedUser} | <strong>Denunciante:</strong> {resolvingReport.reporterUser}
              </div>

              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                Comentario de resolución del Administrador:
                <textarea
                  required
                  placeholder="Ej: Se ha revisado el caso y sancionado al usuario acorde a los términos de la plataforma."
                  value={resolveComment}
                  onChange={(e) => setResolveComment(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    marginTop: '6px',
                    borderRadius: '8px',
                    border: '1px solid rgba(39, 174, 96, 0.5)',
                    background: 'rgba(0,0,0,0.4)',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setResolvingReport(null)}
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#27ae60' }}>
              Notificación enviada a {notificationToast.targetUser}
            </span>
            <button
              onClick={() => setNotificationToast(null)}
              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
            "{notificationToast.message}"
          </p>
        </div>
      )}

      <StatusBar />
    </div>
  )
}
