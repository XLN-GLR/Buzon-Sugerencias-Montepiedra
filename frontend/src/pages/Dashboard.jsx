import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import './Pages.css';

export default function Dashboard() {
  const { user, profiles } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiSource, setApiSource] = useState('local');
  const [activeTab, setActiveTab] = useState('sugerencias'); // 'sugerencias' or 'usuarios'

  // Toolbar search, filter, and sort states for suggestions
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [sortBy, setSortBy] = useState('recientes'); // 'recientes', 'antiguas', 'votadas'

  // Toolbar search, filter, and sort states for User Directory
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userFilterRole, setUserFilterRole] = useState('todos');
  const [userFilterCourse, setUserFilterCourse] = useState('todos');
  const [userSortOrder, setUserSortOrder] = useState('az'); // 'az', 'za'

  // Modal form states
  const [selectedItem, setSelectedItem] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [newStatus, setNewStatus] = useState('Aprobada');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Banner status alerts
  const [successBanner, setSuccessBanner] = useState('');
  const [errorBanner, setErrorBanner] = useState('');

  const loadData = async () => {
    setLoading(true);
    setErrorBanner('');
    try {
      const result = await api.getSuggestions(user ? user.rol : 'profesor');
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
  }, [user]);

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
    setResponseText(item.respuesta_moderador || '');
    setNewStatus(item.estado || 'Aprobada');
    setIsModalOpen(true);
  };

  const handleSaveResponse = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    setActionLoading(true);
    setErrorBanner('');
    
    try {
      const result = await api.updateSuggestionModeration(
        selectedItem.id,
        newStatus,
        responseText,
        user.rol
      );

      // Actualizar lista local
      setSuggestions(prev => 
        prev.map(item => item.id === selectedItem.id ? { ...item, estado: newStatus, respuesta_moderador: responseText } : item)
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

  // Filter and Sort Suggestions
  const processedSuggestions = suggestions
    .filter(item => {
      const matchesCategory = filterCategory === 'Todas' || item.categoria.toLowerCase() === filterCategory.toLowerCase();
      const matchesStatus = filterStatus === 'Todos' || (item.estado || 'pendiente').toLowerCase().replace(' ', '-') === filterStatus.toLowerCase().replace(' ', '-');
      const matchesSearch = (item.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (item.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (item.usuarios?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'votadas') {
        return (b.votos || 0) - (a.votos || 0);
      }
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      if (sortBy === 'antiguas') return dateA - dateB;
      return dateB - dateA;
    });

  return (
    <div className="container">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">⚙️ Panel de Gestión y Moderación</h1>
        <p className="page-subtitle">
          Administración de propuestas comunitarias, cambio de estados y respuestas institucionales.
        </p>

        {/* API connection status notification badge */}
        <div style={{ marginTop: '0.75rem', display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
          {apiSource === 'backend' ? (
            <span className="status-indicator backend-online">
              🟢 Servidor Backend Conectado
            </span>
          ) : (
            <span className="status-indicator backend-offline" title="Cargado desde el almacenamiento local">
              🟡 Modo Offline (Simulador Activo)
            </span>
          )}
          <button onClick={loadData} className="btn-refresh" title="Actualizar datos">
            🔄 Recargar
          </button>
        </div>
      </div>

      {/* Action Alerts */}
      {successBanner && (
        <div className="alert-banner alert-success animate-fadeIn">
          <span>✅</span>
          <span>{successBanner}</span>
        </div>
      )}

      {errorBanner && (
        <div className="alert-banner alert-error animate-fadeIn">
          <span>🛑</span>
          <span>{errorBanner}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="secretaria-tabs-nav" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`sec-tab-btn ${activeTab === 'sugerencias' ? 'active' : ''}`}
          onClick={() => setActiveTab('sugerencias')}
        >
          📋 Todas las Sugerencias ({suggestions.length})
        </button>
        <button
          className={`sec-tab-btn ${activeTab === 'usuarios' ? 'active' : ''}`}
          onClick={() => setActiveTab('usuarios')}
        >
          👥 Directorio de la Comunidad ({profiles.length})
        </button>
      </div>

      {/* TAB 1: Sugerencias */}
      {activeTab === 'sugerencias' && (
        <>
          {/* Toolbar */}
          <div className="toolbar-container">
            <div className="toolbar-search">
              <span className="toolbar-icon">🔍</span>
              <input
                type="text"
                placeholder="Buscar por título, contenido o autor..."
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
                >
                  <option value="Todas">Todas las categorías</option>
                  <option value="Academico">Académico</option>
                  <option value="Infraestructura">Infraestructura</option>
                  <option value="Convivencia">Convivencia / Actividades</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div className="filter-select-wrapper">
                <span className="select-icon">🚦</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="Todos">Todos los estados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="aprobada">Aprobadas</option>
                  <option value="en-proceso">En Proceso</option>
                  <option value="realizada">Realizadas</option>
                  <option value="rechazada">Rechazadas</option>
                </select>
              </div>

              <div className="filter-select-wrapper">
                <span className="select-icon">📊</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="recientes">Más recientes</option>
                  <option value="antiguas">Más antiguas</option>
                  <option value="votadas">Más votadas (Likes)</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading-spinner-container">
              <div className="spinner"></div>
              <p>Cargando sugerencias...</p>
            </div>
          ) : processedSuggestions.length === 0 ? (
            <div className="empty-state">
              <p>No se encontraron registros con los filtros actuales.</p>
            </div>
          ) : (
            <div className="table-responsive-wrapper">
              <table className="custom-data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Título y Descripción</th>
                    <th>Categoría</th>
                    <th>Autor / Usuario</th>
                    <th>Votos</th>
                    <th>Estado Actual</th>
                    <th style={{ textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {processedSuggestions.map((item) => {
                    const statusNorm = (item.estado || 'pendiente').toLowerCase().replace(' ', '-');
                    const displayDate = item.created_at ? item.created_at.split('T')[0] : '2026-07-08';
                    const isAnon = Boolean(item.es_anonimo);
                    const authorName = item.usuarios?.nombre || (isAnon ? 'Anónimo' : 'Comunidad');

                    return (
                      <tr key={item.id}>
                        <td>{displayDate}</td>
                        <td style={{ maxWidth: '320px' }}>
                          <strong style={{ display: 'block', color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                            {item.titulo}
                          </strong>
                          <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {item.descripcion}
                          </span>
                          {item.respuesta_moderador && (
                            <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--color-primary)' }}>
                              💬 <em>"{item.respuesta_moderador}"</em>
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge-${(item.categoria || 'otros').toLowerCase()}`}>
                            {item.categoria}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <img 
                              src={item.usuarios?.foto_url || 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=user'} 
                              alt="Avatar" 
                              className="table-avatar-thumb" 
                            />
                            <div>
                              <span>{authorName}</span>
                              {isAnon && (
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-warning)' }}>
                                  (Marcado Anónimo)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="code-badge">👍 {item.votos || 0}</span>
                        </td>
                        <td>
                          <span className={`status-badge status-${statusNorm}`}>
                            {item.estado || 'Pendiente'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                              onClick={() => handleOpenResponseModal(item)}
                              title="Responder o cambiar estado"
                            >
                              ✍️ Moderar
                            </button>
                            <button
                              className="btn-delete-row"
                              onClick={() => handleDeleteSuggestion(item.id)}
                              title="Eliminar sugerencia"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* TAB 2: Directorio de Usuarios con Filtros Avanzados */}
      {activeTab === 'usuarios' && (
        <div className="animate-fadeIn">
          {/* Toolbar de Filtros Avanzados del Directorio */}
          <div className="toolbar-container" style={{ marginBottom: '1.5rem' }}>
            <div className="toolbar-search">
              <span className="toolbar-icon">🔍</span>
              <input
                type="text"
                placeholder="Buscar usuario por nombre o cédula..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
              />
            </div>

            <div className="toolbar-filters">
              <div className="filter-select-wrapper">
                <span className="select-icon">🎭</span>
                <select
                  value={userFilterRole}
                  onChange={(e) => setUserFilterRole(e.target.value)}
                >
                  <option value="todos">Todos los roles</option>
                  <option value="alumno">Alumnos</option>
                  <option value="profesor">Profesores</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="secretaria">Secretaría</option>
                  <option value="administrador">Administradores</option>
                </select>
              </div>

              <div className="filter-select-wrapper">
                <span className="select-icon">🎓</span>
                <select
                  value={userFilterCourse}
                  onChange={(e) => setUserFilterCourse(e.target.value)}
                >
                  <option value="todos">Todos los cursos</option>
                  <option value="8vo de Básica">8vo de Básica</option>
                  <option value="9no de Básica">9no de Básica</option>
                  <option value="10mo de Básica">10mo de Básica</option>
                  <option value="1ro de Bachillerato">1ro de Bachillerato</option>
                  <option value="2do de Bachillerato">2do de Bachillerato</option>
                  <option value="3ro de Bachillerato">3ro de Bachillerato</option>
                </select>
              </div>

              <div className="filter-select-wrapper">
                <span className="select-icon">🔤</span>
                <select
                  value={userSortOrder}
                  onChange={(e) => setUserSortOrder(e.target.value)}
                >
                  <option value="az">Orden A-Z</option>
                  <option value="za">Orden Z-A</option>
                </select>
              </div>
            </div>
          </div>

          <div className="table-responsive-wrapper">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Cédula</th>
                  <th>Nombre</th>
                  <th>Rol</th>
                  <th>Correo Institucional</th>
                  <th>Curso / Área</th>
                </tr>
              </thead>
              <tbody>
                {profiles
                  .filter(p => {
                    const matchesSearch = (p.nombre || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                                          (p.cedula || '').includes(userSearchTerm) ||
                                          (p.correo || '').toLowerCase().includes(userSearchTerm.toLowerCase());
                    const matchesRole = userFilterRole === 'todos' || p.rol === userFilterRole;
                    const matchesCourse = userFilterCourse === 'todos' || (p.curso || '').toLowerCase() === userFilterCourse.toLowerCase();
                    return matchesSearch && matchesRole && matchesCourse;
                  })
                  .sort((a, b) => {
                    const nameA = (a.nombre || '').toLowerCase();
                    const nameB = (b.nombre || '').toLowerCase();
                    return userSortOrder === 'za' ? nameB.localeCompare(nameA) : nameA.localeCompare(nameB);
                  })
                  .map((p) => (
                    <tr key={p.usuario_id || p.cedula}>
                      <td><strong className="code-badge">{p.cedula}</strong></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <img src={p.avatar} alt="Avatar" className="table-avatar-thumb" />
                          <span>{p.nombre}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge-role-pill role-${p.rol}`}>
                          {p.rol}
                        </span>
                      </td>
                      <td>{p.correo}</td>
                      <td>{p.curso || 'N/A'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal para Moderar / Responder */}
      {isModalOpen && selectedItem && (
        <div className="modal-backdrop">
          <div className="modal-content animate-fadeIn">
            <div className="modal-header">
              <h2>✍️ Moderación Institucional</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveResponse}>
              <div style={{ marginBottom: '1.25rem', padding: '1rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ color: 'var(--color-primary)', margin: 0 }}>{selectedItem.titulo}</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>
                  {selectedItem.descripcion}
                </p>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="select-status">Nuevo Estado de la Propuesta</label>
                <select
                  id="select-status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  disabled={actionLoading}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Aprobada">Aprobada</option>
                  <option value="En Proceso">En Proceso</option>
                  <option value="Realizada">Realizada</option>
                  <option value="Rechazada">Rechazada</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="response-text">
                  Respuesta Institucional / Justificación
                </label>
                <textarea
                  id="response-text"
                  rows="4"
                  placeholder="Redacta la respuesta oficial para la comunidad estudiantil..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  disabled={actionLoading}
                ></textarea>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
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
