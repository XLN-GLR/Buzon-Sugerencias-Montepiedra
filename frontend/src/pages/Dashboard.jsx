import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, parseDescription } from '../utils/api';
import './Pages.css';

// Initial simulated accounts for the Administrator user management screen
const INITIAL_MOCK_USERS = [
  { id: 'usr-1', nombre: 'Carlos Mendoza', rol: 'Alumno', curso: '2do de Bachillerato', correo: 'carlos.mendoza@montepiedra.edu.ec' },
  { id: 'usr-2', nombre: 'Juan Pérez', rol: 'Alumno', curso: '10mo de Básica', correo: 'juan.perez@montepiedra.edu.ec' },
  { id: 'usr-3', nombre: 'Pedro Gómez', rol: 'Alumno', curso: '8vo de Básica', correo: 'pedro.gomez@montepiedra.edu.ec' },
  { id: 'usr-4', nombre: 'Dr. Gabriel Villalba', rol: 'Profesor', curso: 'N/A', correo: 'gabriel.villalba@montepiedra.edu.ec' },
  { id: 'usr-5', nombre: 'Ing. Mauricio Ramos', rol: 'Administrador', curso: 'N/A', correo: 'mauricio.ramos@montepiedra.edu.ec' }
];

export default function Dashboard() {
  const { user, profiles } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiSource, setApiSource] = useState('local');
  const [activeTab, setActiveTab] = useState('sugerencias'); // 'sugerencias' or 'usuarios'
  const [mockUsers, setMockUsers] = useState(() => {
    const saved = localStorage.getItem('montepiedra_mock_users');
    return saved ? JSON.parse(saved) : INITIAL_MOCK_USERS;
  });

  // Toolbar search, filter, and sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [sortBy, setSortBy] = useState('recientes'); // 'recientes', 'antiguas', 'votadas'

  // Modal form states
  const [selectedItem, setSelectedItem] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [newStatus, setNewStatus] = useState('Aprobada');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Banner status alerts
  const [successBanner, setSuccessBanner] = useState('');
  const [errorBanner, setErrorBanner] = useState('');

  // Persist mock users
  useEffect(() => {
    localStorage.setItem('montepiedra_mock_users', JSON.stringify(mockUsers));
  }, [mockUsers]);

  const loadData = async () => {
    setLoading(true);
    setErrorBanner('');
    try {
      const result = await api.getSuggestions();
      setSuggestions(result.data);
      setApiSource(result.source);
    } catch (err) {
      setErrorBanner('No se pudieron obtener las sugerencias del servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerSuccessAlert = (message) => {
    setSuccessBanner(message);
    setTimeout(() => {
      setSuccessBanner('');
    }, 6000);
  };

  const triggerErrorAlert = (message) => {
    setErrorBanner(message);
    setTimeout(() => {
      setErrorBanner('');
    }, 6000);
  };

  // State Management (Change Status & Reply)
  const handleOpenResponseModal = (item) => {
    setSelectedItem(item);
    setResponseText(item.respuesta || '');
    setNewStatus(item.estado || 'Aprobada');
    setIsModalOpen(true);
  };

  const handleSaveResponse = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    setActionLoading(true);
    setErrorBanner('');
    
    try {
      const result = await api.updateSuggestionState(
        selectedItem.id,
        newStatus,
        responseText,
        user.rol
      );

      // Update local state list immediately
      setSuggestions(prev => 
        prev.map(item => item.id === selectedItem.id ? { ...item, estado: newStatus, respuesta: responseText } : item)
      );

      if (result.isSimulated) {
        triggerSuccessAlert(`Estado actualizado localmente (Simulador). El backend no admite la edición de estado aún.`);
      } else {
        triggerSuccessAlert(`La sugerencia se actualizó exitosamente en el servidor.`);
      }

      setIsModalOpen(false);
      setSelectedItem(null);
    } catch (err) {
      triggerErrorAlert(err.message || 'Error al actualizar el estado de la sugerencia.');
    } finally {
      setActionLoading(false);
    }
  };

  // Moderation: Delete Suggestion
  const handleDeleteSuggestion = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar permanentemente esta sugerencia?')) {
      return;
    }

    setActionLoading(true);
    setErrorBanner('');

    try {
      const result = await api.deleteSuggestion(id, user.rol);
      
      // Update local state immediately
      setSuggestions(prev => prev.filter(item => item.id !== id));

      if (result.error) {
        triggerSuccessAlert(`Eliminada localmente (Simulación). El servidor denegó la petición: ${result.error}`);
      } else {
        triggerSuccessAlert('Sugerencia eliminada exitosamente en el backend.');
      }
    } catch (err) {
      triggerErrorAlert(err.message || 'Error al eliminar la sugerencia.');
    } finally {
      setActionLoading(false);
    }
  };

  // Simulation: Delete User account (Administrator exclusive)
  const handleDeleteUser = (id, nombre) => {
    if (window.confirm(`¿Está seguro de que desea eliminar permanentemente la cuenta de ${nombre}?`)) {
      setMockUsers(prev => prev.filter(usr => usr.id !== id));
      triggerSuccessAlert(`Cuenta de usuario "${nombre}" eliminada exitosamente (Simulado).`);
    }
  };

  // Perform search filtering, category filtering, and sorting on suggestions list
  const processedSuggestions = suggestions
    .filter(item => {
      // Category filter
      const matchesCategory = filterCategory === 'Todas' || item.categoria.toLowerCase() === filterCategory.toLowerCase();
      
      // Keywords search filter
      const { cleanDesc } = parseDescription(item.descripcion);
      const matchesSearch = item.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            cleanDesc.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'votadas') {
        return (b.votos || 0) - (a.votos || 0);
      }
      
      const dateA = new Date(a.created_at || a.date || 0);
      const dateB = new Date(b.created_at || b.date || 0);

      if (sortBy === 'antiguas') {
        return dateA - dateB;
      }
      // 'recientes' (default)
      return dateB - dateA;
    });

  // Stats calculation (based on all suggestions)
  const total = suggestions.length;
  const pending = suggestions.filter(item => item.estado.toLowerCase() === 'pendiente').length;
  const inProcess = suggestions.filter(item => item.estado.toLowerCase() === 'en proceso').length;
  const completed = suggestions.filter(item => 
    item.estado.toLowerCase() === 'respondido' || item.estado.toLowerCase() === 'aprobada'
  ).length;

  const getCategoryLabel = (cat) => {
    switch(cat) {
      case 'Academico': return 'Académico';
      case 'Infraestructura': return 'Infraestructura';
      case 'Convivencia': return 'Convivencia';
      default: return 'Otros';
    }
  };

  return (
    <div className="container">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Panel de Administración</h1>
        <p className="page-subtitle">
          Administración institucional del buzón. Revisa, responde y gestiona las sugerencias recibidas.
        </p>

        {/* Server connection indicator badge */}
        <div style={{ marginTop: '0.75rem', display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
          {apiSource === 'backend' ? (
            <span className="status-indicator backend-online">
              🟢 Backend Conectado
            </span>
          ) : (
            <span className="status-indicator backend-offline">
              🟡 Modo Offline (Simulador Activo)
            </span>
          )}
          <button onClick={loadData} className="btn-refresh" disabled={loading}>
            🔄 Recargar
          </button>
        </div>
      </div>

      {/* Tabs Menu (Only for Administrator) */}
      {user.rol === 'administrador' && (
        <div className="tab-menu">
          <button 
            className={`tab-btn ${activeTab === 'sugerencias' ? 'active' : ''}`}
            onClick={() => setActiveTab('sugerencias')}
          >
            📂 Bandeja de Sugerencias
          </button>
          <button 
            className={`tab-btn ${activeTab === 'usuarios' ? 'active' : ''}`}
            onClick={() => setActiveTab('usuarios')}
          >
            👥 Gestión de Usuarios (Simulador)
          </button>
        </div>
      )}

      {/* Banner Alerts */}
      {successBanner && (
        <div className="alert-banner alert-success">
          <span>✅</span>
          <span>{successBanner}</span>
        </div>
      )}

      {errorBanner && (
        <div className="alert-banner alert-error">
          <span>❌</span>
          <span>{errorBanner}</span>
        </div>
      )}

      {activeTab === 'sugerencias' ? (
        <>
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon icon-blue">📂</div>
              <div className="stat-info">
                <span className="stat-val">{total}</span>
                <span className="stat-label">Sugerencias Recibidas</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon icon-amber">⏳</div>
              <div className="stat-info">
                <span className="stat-val">{pending + inProcess}</span>
                <span className="stat-label">Pendientes o En Proceso</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon icon-green">✅</div>
              <div className="stat-info">
                <span className="stat-val">{completed}</span>
                <span className="stat-label">Aprobadas o Respondidas</span>
              </div>
            </div>
          </div>

          {/* Toolbar (Search, Filter, Sort) */}
          <div className="toolbar-container" style={{ marginBottom: '1.5rem' }}>
            <div className="toolbar-search">
              <span className="toolbar-icon">🔍</span>
              <input
                type="text"
                placeholder="Buscar por palabras clave en la bandeja..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="toolbar-filters">
              <div className="filter-select-wrapper">
                <span className="select-icon">🏷️</span>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  title="Filtrar por categoría"
                >
                  <option value="Todas">Todas las categorías</option>
                  <option value="Academico">Académico</option>
                  <option value="Infraestructura">Infraestructura</option>
                  <option value="Convivencia">Convivencia / Actividades</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div className="filter-select-wrapper">
                <span className="select-icon">📊</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  title="Ordenar listado"
                >
                  <option value="recientes">Más recientes</option>
                  <option value="antiguas">Más antiguas</option>
                  <option value="votadas">Más votadas (Likes)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Admin Table */}
          <div className="admin-card">
            <div className="admin-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Bandeja de Sugerencias</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Muestra propuestas filtradas</span>
            </div>

            <div className="admin-table-container">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
                  <p>Cargando datos del servidor...</p>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Sugerencia</th>
                      <th>Categoría</th>
                      <th>Remitente</th>
                      <th>Votos</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedSuggestions.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                          No hay sugerencias que coincidan con los filtros.
                        </td>
                      </tr>
                    ) : (
                      processedSuggestions.map((item) => {
                        const { cleanDesc, author, isAnonymous } = parseDescription(item.descripcion);
                        const displayDate = item.created_at ? item.created_at.split('T')[0] : (item.date || '2026-07-08');

                        // Check if avatar is edited dynamically by admin to show inside management rows
                        const activeProfile = profiles.find(p => p.nombre.toLowerCase() === author.toLowerCase());
                        const displayAvatarUrl = activeProfile ? activeProfile.avatar : item.authorAvatar;

                        return (
                          <tr key={item.id || item.created_at}>
                            <td style={{ whiteSpace: 'nowrap' }}>{displayDate}</td>
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                                {item.titulo}
                              </div>
                              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.825rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                {cleanDesc}
                              </div>
                              {item.respuesta && (
                                <div style={{ marginTop: '0.25rem', fontStyle: 'italic', fontSize: '0.775rem', color: 'var(--color-primary)' }}>
                                  <strong>Respuesta:</strong> "{item.respuesta}"
                                </div>
                              )}
                            </td>
                            <td>
                              <span className={`badge badge-${item.categoria.toLowerCase()}`}>
                                {getCategoryLabel(item.categoria)}
                              </span>
                            </td>
                            <td>
                              {isAnonymous ? (
                                <div className="revealed-container">
                                  <span className="revealed-badge" title="Enviado de forma anónima">🕵️ Anónimo</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                                    {displayAvatarUrl && <img src={displayAvatarUrl} alt="Avatar" className="table-row-avatar" />}
                                    <span className="revealed-name" title={`ID: ${item.usuario_id}`}>
                                      {author}
                                    </span>
                                  </div>
                                  <code className="revealed-id">{item.usuario_id.substring(0, 8)}...</code>
                                </div>
                              ) : (
                                <div className="revealed-container">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    {displayAvatarUrl && <img src={displayAvatarUrl} alt="Avatar" className="table-row-avatar" />}
                                    <span style={{ fontWeight: 500 }}>{author}</span>
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>ID: {item.usuario_id.substring(0, 8)}...</div>
                                </div>
                              )}
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.95rem' }}>
                              ❤️ {item.votos || 0}
                            </td>
                            <td>
                              <span className={`status-badge status-${item.estado.toLowerCase().replace(' ', '-')}`}>
                                {item.estado}
                              </span>
                            </td>
                            <td>
                              <div className="admin-actions">
                                <button
                                  className="action-btn btn-action-view"
                                  onClick={() => handleOpenResponseModal(item)}
                                  disabled={actionLoading}
                                >
                                  Responder
                                </button>
                                <button
                                  className="action-btn btn-action-delete"
                                  onClick={() => handleDeleteSuggestion(item.id)}
                                  disabled={actionLoading}
                                >
                                  Eliminar
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Administrator Exclusive: User Management Screen */
        <div className="admin-card">
          <div className="admin-header">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Gestión de Usuarios Institucionales</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Simulador de base de datos de usuarios autorizados.
            </span>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre completo</th>
                  <th>Rol asignado</th>
                  <th>Curso / Sección</th>
                  <th>Correo Institucional</th>
                  <th>ID de Usuario (UUID)</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mockUsers.map((usr) => {
                  // Resolve profile to show the latest edited avatar
                  const activeProfile = profiles.find(p => p.correo.toLowerCase() === usr.correo.toLowerCase());
                  const avatarUrl = activeProfile ? activeProfile.avatar : 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=placeholder';

                  return (
                    <tr key={usr.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <img src={avatarUrl} alt="Avatar" className="table-row-avatar-large" />
                          <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{usr.nombre}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge role-${usr.rol.toLowerCase()}`}>
                          {usr.rol}
                        </span>
                      </td>
                      <td>{usr.curso}</td>
                      <td>{usr.correo}</td>
                      <td>
                        <code style={{ fontSize: '0.75rem', backgroundColor: 'var(--color-secondary-light)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                          {usr.id === 'usr-1' ? '60685e1f-3d41-42c2-b9a6-d71739856b22' : 
                           usr.id === 'usr-2' ? '71796f2a-4e52-53d3-c0b7-e82840967c33' :
                           usr.id === 'usr-3' ? '82807g3b-5f63-64e4-d1c8-f93951078d44' :
                           usr.id === 'usr-4' ? '91ab8e1f-3d41-42c2-b9a6-d71739856c44' : 
                           usr.id === 'usr-5' ? 'd798a3e4-8cf1-4509-bc01-e24df234a9f9' : 
                           `usr-uuid-gen-${usr.id}`}
                        </code>
                      </td>
                      <td>
                        <button 
                          onClick={() => handleDeleteUser(usr.id, usr.nombre)}
                          className="action-btn btn-action-delete"
                          style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                        >
                          ❌ Eliminar Cuenta
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Response and Status Modal */}
      {isModalOpen && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            <h2 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', color: 'var(--color-primary)' }}>
              Responder Sugerencia
            </h2>
            
            <div style={{ marginBottom: '1.25rem', backgroundColor: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>{selectedItem.titulo}</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {parseDescription(selectedItem.descripcion).cleanDesc}
              </p>
            </div>

            <form onSubmit={handleSaveResponse}>
              <div className="form-group">
                <label className="form-label" htmlFor="modal-status">Cambiar Estado</label>
                <select
                  id="modal-status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  disabled={actionLoading}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En proceso">En proceso</option>
                  <option value="Aprobada">Aprobada</option>
                  <option value="Rechazada">Rechazada</option>
                  <option value="Respondido">Respondido</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="modal-response">Respuesta / Justificación</label>
                <textarea
                  id="modal-response"
                  rows="4"
                  placeholder="Escribe aquí la respuesta o justificación institucional..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  required={newStatus === 'Respondido' || newStatus === 'Aprobada' || newStatus === 'Rechazada'}
                  disabled={actionLoading}
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
