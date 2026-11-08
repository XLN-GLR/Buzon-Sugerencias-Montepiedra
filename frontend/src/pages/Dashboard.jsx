import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, getAuthorInfo, formatRole } from '../utils/api';
import {
  ShieldCheck,
  RefreshCw,
  Wifi,
  CheckCircle2,
  AlertOctagon,
  FileText,
  Users,
  Search,
  Tag,
  CheckSquare,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  Trash2,
  MessageSquare,
  UserCheck,
  GraduationCap,
  ArrowDownAZ,
  User,
  X
} from 'lucide-react';
import './Pages.css';

export default function Dashboard() {
  const { user, profiles } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Modal form states (Moderar Sugerencia y Debate Integrado)
  const [selectedItem, setSelectedItem] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [newStatus, setNewStatus] = useState('Aprobada');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [modComments, setModComments] = useState([]);
  const [modCommentsLoading, setModCommentsLoading] = useState(false);

  // Banner status alerts
  const [successBanner, setSuccessBanner] = useState('');
  const [errorBanner, setErrorBanner] = useState('');

  const loadData = async () => {
    setLoading(true);
    setErrorBanner('');
    try {
      const result = await api.getSuggestions(user ? user.rol : 'profesor');
      setSuggestions(result.data);
    } catch {
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

  // State Management (Change Status & Reply & Comments)
  const handleOpenResponseModal = async (item) => {
    setSelectedItem(item);
    setResponseText(item.respuesta_moderador || '');
    setNewStatus(item.estado || 'Aprobada');
    setIsModalOpen(true);
    setModCommentsLoading(true);
    setModComments([]);

    try {
      const res = await api.getComments(item.id, user ? user.rol : 'profesor');
      setModComments(res.data || []);
    } catch {
      setModComments([]);
    } finally {
      setModCommentsLoading(false);
    }
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

      triggerSuccessAlert(`La sugerencia se actualizó exitosamente en el servidor.`);

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

  // Delete Comment inside Moderation Modal
  const handleDeleteComment = async (commentId) => {
    if (!selectedItem) return;
    if (!window.confirm('¿Desea eliminar permanentemente este comentario por infringir las normas institucionales?')) {
      return;
    }

    try {
      await api.deleteComment(selectedItem.id, commentId, user.rol, user.usuario_id || user.cedula);
      setModComments(prev => prev.filter(c => c.id !== commentId));
      triggerSuccessAlert('Comentario eliminado exitosamente.');
    } catch (err) {
      triggerErrorAlert(err.message || 'Error al eliminar el comentario.');
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
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ShieldCheck size={28} /> Panel de Gestión y Moderación
        </h1>
        <p className="page-subtitle">
          Administración de propuestas comunitarias, cambio de estados, respuestas institucionales y moderación de debate.
        </p>

        {/* API connection status notification badge */}
        <div style={{ marginTop: '0.75rem', display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="status-indicator backend-online" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Wifi size={14} /> Servidor Backend Conectado (Supabase)
          </span>
          <button onClick={loadData} className="btn-refresh" title="Actualizar datos" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <RefreshCw size={13} /> Recargar
          </button>
        </div>
      </div>

      {/* Action Alerts */}
      {successBanner && (
        <div className="alert-banner alert-success animate-fadeIn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{successBanner}</span>
        </div>
      )}

      {errorBanner && (
        <div className="alert-banner alert-error animate-fadeIn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertOctagon size={18} />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="secretaria-tabs-nav" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`sec-tab-btn ${activeTab === 'sugerencias' ? 'active' : ''}`}
          onClick={() => setActiveTab('sugerencias')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <FileText size={16} /> Todas las Sugerencias ({suggestions.length})
        </button>
        <button
          className={`sec-tab-btn ${activeTab === 'usuarios' ? 'active' : ''}`}
          onClick={() => setActiveTab('usuarios')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Users size={16} /> Directorio de la Comunidad ({profiles.length})
        </button>
      </div>

      {/* TAB 1: Sugerencias */}
      {activeTab === 'sugerencias' && (
        <>
          {/* Toolbar */}
          <div className="toolbar-container">
            <div className="toolbar-search">
              <span className="toolbar-icon">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Buscar por título, contenido o autor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="toolbar-filters">
              <div className="filter-select-wrapper">
                <span className="select-icon">
                  <Tag size={15} />
                </span>
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
                <span className="select-icon">
                  <CheckSquare size={15} />
                </span>
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
                <span className="select-icon">
                  <BarChart3 size={15} />
                </span>
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
                    const authorInfo = getAuthorInfo(item, user ? user.rol : 'profesor');
                    const likesCount = item.likes !== undefined ? item.likes : (item.votos || 0);
                    const dislikesCount = item.dislikes || 0;

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
                            <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <MessageSquare size={13} />
                              <em>"{item.respuesta_moderador}"</em>
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
                            {authorInfo.avatar ? (
                              <img 
                                src={authorInfo.avatar} 
                                alt="Avatar" 
                                className="table-avatar-thumb" 
                              />
                            ) : (
                              <span className="card-author-avatar-placeholder" style={{ width: '28px', height: '28px' }}>
                                <User size={13} />
                              </span>
                            )}
                            <div>
                              <span className={authorInfo.isDeleted ? 'author-deleted' : ''}>
                                {authorInfo.name}
                              </span>
                              {authorInfo.isAnonymous && (
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-warning)' }}>
                                  (Marcado Anónimo)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="moderation-votes-grid">
                            <span className="vote-metric-pill like-metric" title="Total de Likes" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <ThumbsUp size={12} /> {likesCount}
                            </span>
                            <span className="vote-metric-pill dislike-metric" title="Total de Dislikes" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <ThumbsDown size={12} /> {dislikesCount}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge status-${statusNorm}`}>
                            {item.estado || 'Pendiente'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '0.65rem', alignItems: 'center', justifyContent: 'center' }}>
                            {/* Botón Moderar Estado, Respuesta y Debate */}
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                              onClick={() => handleOpenResponseModal(item)}
                              title="Responder, cambiar estado o moderar debate"
                            >
                              <Edit3 size={14} />
                              <span>Moderar</span>
                            </button>

                            {/* Botón Eliminar Sugerencia */}
                            <button
                              className="btn-delete-row"
                              onClick={() => handleDeleteSuggestion(item.id)}
                              title="Eliminar sugerencia permanentemente"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.35rem 0.55rem' }}
                            >
                              <Trash2 size={14} />
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

      {/* TAB 2: Directorio de Usuarios */}
      {activeTab === 'usuarios' && (
        <div className="animate-fadeIn">
          <div className="toolbar-container" style={{ marginBottom: '1.5rem' }}>
            <div className="toolbar-search">
              <span className="toolbar-icon">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Buscar usuario por nombre o cédula..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
              />
            </div>

            <div className="toolbar-filters">
              <div className="filter-select-wrapper">
                <span className="select-icon">
                  <UserCheck size={15} />
                </span>
                <select
                  value={userFilterRole}
                  onChange={(e) => setUserFilterRole(e.target.value)}
                >
                  <option value="todos">Todos los roles</option>
                  <option value="alumno">Alumnos</option>
                  <option value="profesor">Profesores</option>
                  <option value="secretaria">Secretaría</option>
                  <option value="administrador">Administradores</option>
                </select>
              </div>

              <div className="filter-select-wrapper">
                <span className="select-icon">
                  <GraduationCap size={15} />
                </span>
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
                <span className="select-icon">
                  <ArrowDownAZ size={15} />
                </span>
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
                  <th>Nombre y Apellido</th>
                  <th>Rol</th>
                  <th>Correo Institucional</th>
                  <th>Curso / Grado</th>
                </tr>
              </thead>
              <tbody>
                {profiles
                  .filter((p) => {
                    const matchesSearch =
                      (p.nombre || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                      (p.cedula || '').includes(userSearchTerm);
                    const matchesRole = userFilterRole === 'todos' || p.rol === userFilterRole;
                    const matchesCourse = userFilterCourse === 'todos' || (p.curso || '').toLowerCase() === userFilterCourse.toLowerCase();
                    return matchesSearch && matchesRole && matchesCourse;
                  })
                  .sort((a, b) => {
                    const nameA = (a.nombre || '').toLowerCase();
                    const nameB = (b.nombre || '').toLowerCase();
                    return userSortOrder === 'az' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
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
                          {formatRole(p.rol)}
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

      {/* Modal para Moderar Estado y Respuesta de la Sugerencia */}
      {isModalOpen && selectedItem && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit3 size={20} /> Moderación Institucional
              </h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)} aria-label="Cerrar modal">
                <X size={18} />
              </button>
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

              {/* SECCIÓN INTEGRADA: MODERACIÓN DE COMENTARIOS ASOCIADOS */}
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary)', margin: 0, fontSize: '1rem' }}>
                    <MessageSquare size={16} />
                    Comentarios del Debate ({modComments.length})
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Supervisión de intervenciones
                  </span>
                </div>

                {modCommentsLoading ? (
                  <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto 0.5rem auto' }}></div>
                    <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>Cargando comentarios...</p>
                  </div>
                ) : modComments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    Esta sugerencia no tiene comentarios asociados actualmente.
                  </div>
                ) : (
                  <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingRight: '0.25rem' }}>
                    {modComments.map((com, index) => {
                      const authorName = com.usuarios?.nombre || com.nombre || 'Comunidad Montepiedra';
                      const authorAvatar = com.usuarios?.foto_url || com.foto_url || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(authorName)}`;
                      const authorRole = com.usuarios?.rol || com.rol || 'alumno';

                      return (
                        <div 
                          key={com.id || index}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '0.75rem',
                            padding: '0.6rem 0.85rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg)'
                          }}
                        >
                          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                            <img 
                              src={authorAvatar} 
                              alt={authorName} 
                              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} 
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <strong style={{ fontSize: '0.825rem', color: 'var(--color-text)' }}>{authorName}</strong>
                                <span className={`badge-role-pill role-${authorRole}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                                  {formatRole(authorRole)}
                                </span>
                              </div>
                              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.825rem', color: 'var(--color-text)', wordBreak: 'break-word' }}>
                                {com.texto}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="btn-delete-row"
                            onClick={() => handleDeleteComment(com.id)}
                            title="Eliminar permanentemente este comentario"
                            style={{ padding: '0.35rem', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Trash2 size={13} color="#DC2626" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
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
