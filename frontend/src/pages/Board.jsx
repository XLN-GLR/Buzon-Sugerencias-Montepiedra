import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, getAuthorInfo, formatRole } from '../utils/api';
import { 
  MessageCircle, 
  ThumbsUp, 
  ThumbsDown, 
  Search, 
  Tag, 
  CheckSquare, 
  ArrowUpDown, 
  Flame, 
  RefreshCw, 
  X, 
  Send, 
  Clock, 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  Wifi, 
  ChevronLeft, 
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import './Pages.css';

const ITEMS_PER_PAGE = 6;

export default function Board() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recientes'); // 'recientes', 'antiguas', 'votadas'
  const [errorMessage, setErrorMessage] = useState('');
  const [votingId, setVotingId] = useState(null);

  // Paginación estricta de 6 sugerencias por página
  const [currentPage, setCurrentPage] = useState(1);

  // Registro en tiempo real de conteo de comentarios por sugerencia { [id]: count }
  const [commentCounts, setCommentCounts] = useState({});

  // Estados para el Modal Flotante de Detalles y Comentarios Split
  const [activeCommentsSug, setActiveCommentsSug] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const [commentErrorStatus, setCommentErrorStatus] = useState(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const syncCommentCountsFromBackend = async (items) => {
    if (!items || items.length === 0) return;
    try {
      const userRole = user ? user.rol : 'alumno';
      const results = await Promise.allSettled(
        items.map(async (item) => {
          const res = await api.getComments(item.id, userRole);
          const list = res.data || [];
          return { id: item.id, count: list.length };
        })
      );

      const serverCounts = {};
      results.forEach((r) => {
        if (r.status === 'fulfilled' && r.value) {
          serverCounts[r.value.id] = r.value.count;
        }
      });

      setCommentCounts(prev => ({
        ...prev,
        ...serverCounts
      }));
    } catch (e) {
      console.warn('Error al sincronizar conteos de comentarios con el servidor:', e);
    }
  };

  const loadSuggestions = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const userId = user ? (user.usuario_id || user.cedula) : null;
      const result = await api.getSuggestions(user ? user.rol : 'alumno', userId);
      const suggestionsData = result.data || [];
      setSuggestions(suggestionsData);

      // Cargar conteos inmediatos de comentarios desde la caché local para renderizado sin parpadeos
      const counts = {};
      for (const item of suggestionsData) {
        counts[item.id] = api.getCommentCount(item.id);
      }
      setCommentCounts(counts);

      // Sincronizar en segundo plano con el servidor para obtener los conteos exactos de todos los comentarios anteriores
      syncCommentCountsFromBackend(suggestionsData);
    } catch (err) {
      setErrorMessage('No se pudieron cargar las sugerencias del servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, [user]);

  // Resetear paginación al cambiar criterios de búsqueda o filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterStatus, sortBy]);

  // Manejo de votación con Toggle
  const handleVote = async (id, voteType, e) => {
    if (e) e.stopPropagation();
    if (!user) return;

    setVotingId(id);
    const userId = user.usuario_id || user.cedula || 'usr-default';

    const result = await api.voteSuggestion(id, voteType, userId, user.rol);
    setVotingId(null);

    if (result.success) {
      const newLikes = result.likes !== undefined ? result.likes : (result.votos !== undefined ? result.votos : 0);
      const newDislikes = result.dislikes !== undefined ? result.dislikes : 0;

      setSuggestions(prev =>
        prev.map(s => {
          if (s.id === id) {
            return {
              ...s,
              votos: newLikes,
              likes: newLikes,
              dislikes: newDislikes,
              user_vote: result.currentVote
            };
          }
          return s;
        })
      );

      if (activeCommentsSug && activeCommentsSug.id === id) {
        setActiveCommentsSug(prev => ({
          ...prev,
          votos: newLikes,
          likes: newLikes,
          dislikes: newDislikes,
          user_vote: result.currentVote
        }));
      }
    }
  };

  // Abrir modal flotante de detalles y comentarios
  const handleOpenCommentsModal = async (sug, e) => {
    if (e) e.stopPropagation();
    setActiveCommentsSug(sug);
    setCommentsLoading(true);
    setCommentError('');
    setCommentErrorStatus(null);
    setNewCommentText('');

    const res = await api.getComments(sug.id, user ? user.rol : 'alumno');
    const fetchedComments = res.data || [];
    setComments(fetchedComments);
    setCommentsLoading(false);

    // Actualizar conteo en tiempo real
    setCommentCounts(prev => ({
      ...prev,
      [sug.id]: fetchedComments.length
    }));
  };

  // Enviar comentario
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!activeCommentsSug || !newCommentText.trim() || !user) return;

    setCommentSubmitting(true);
    setCommentError('');
    setCommentErrorStatus(null);

    try {
      const userId = user.usuario_id || user.cedula || 'usr-default';
      const res = await api.createComment(activeCommentsSug.id, {
        usuario_id: userId,
        texto: newCommentText.trim()
      }, user.rol);

      const addedComment = {
        ...(res.data || {}),
        usuarios: {
          id: userId,
          nombre: user.nombre,
          foto_url: user.avatar,
          rol: user.rol
        }
      };

      setComments(prev => {
        const updated = [...prev, addedComment];
        // Sincronizar en localStorage inmediatamente con la lista completa actualizada
        try {
          localStorage.setItem(`comments_${activeCommentsSug.id}`, JSON.stringify(updated));
        } catch (err) {
          console.warn('Error al persistir comments en localStorage:', err);
        }
        // Actualizar el contador numérico de comentarios en tiempo real
        setCommentCounts(cPrev => ({
          ...cPrev,
          [activeCommentsSug.id]: updated.length
        }));
        return updated;
      });

      setNewCommentText('');
      setCommentError('');
      setCommentErrorStatus(null);
    } catch (err) {
      const status = err.status || err.response?.status;
      const apiMessage = err.response?.data?.error || err.data?.error || err.message;
      setCommentErrorStatus(status);

      if (status === 429 || (apiMessage && (apiMessage.includes('límite') || apiMessage.includes('hora')))) {
        setCommentErrorStatus(429);
        setCommentError(
          apiMessage ||
          'Has alcanzado el límite de 5 comentarios por hora. Por favor, espera antes de publicar nuevos comentarios.'
        );
      } else if (status === 400 || (apiMessage && apiMessage.toLowerCase().includes('inapropiado'))) {
        setCommentErrorStatus(400);
        setCommentError(
          apiMessage ||
          '¡ATENCIÓN! Tu comentario contiene lenguaje inapropiado. Por favor, utiliza un vocabulario respetuoso.'
        );
      } else {
        setCommentErrorStatus(status || 500);
        setCommentError(
          apiMessage && !apiMessage.startsWith('Error ') && apiMessage !== 'Failed to fetch'
            ? apiMessage
            : 'Error en el servidor al publicar el comentario. Intenta nuevamente más tarde.'
        );
      }
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleAuthorClick = (authorInfo, e) => {
    if (e) e.stopPropagation();
    if (!authorInfo.canInteract || authorInfo.isDeleted || authorInfo.isAnonymous) {
      return;
    }
    navigate('/perfil');
  };

  // Filtrado y Ordenamiento
  const processedSuggestions = suggestions
    .filter(item => {
      const matchesCategory = filterCategory === 'Todas' ||
        item.categoria.toLowerCase() === filterCategory.toLowerCase();

      const matchesStatus = filterStatus === 'Todos' ||
        (item.estado || 'Pendiente').toLowerCase().replace(' ', '-') === filterStatus.toLowerCase().replace(' ', '-');

      const term = searchTerm.toLowerCase();
      const matchesSearch =
        (item.titulo || '').toLowerCase().includes(term) ||
        (item.descripcion || '').toLowerCase().includes(term);

      return matchesCategory && matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'votadas') {
        return (b.likes || b.votos || 0) - (a.likes || a.votos || 0);
      }

      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);

      if (sortBy === 'antiguas') {
        return dateA - dateB;
      }
      return dateB - dateA;
    });

  // Paginación estricta a 6 elementos por página
  const totalPages = Math.ceil(processedSuggestions.length / ITEMS_PER_PAGE) || 1;
  const paginatedSuggestions = processedSuggestions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'Academico': return 'Académico';
      case 'Infraestructura': return 'Infraestructura';
      case 'Convivencia': return 'Convivencia';
      default: return cat || 'Otros';
    }
  };

  const getStatusNormalized = (estado) => {
    if (!estado) return 'pendiente';
    return estado.toLowerCase().replace(/\s+/g, '-');
  };

  return (
    <div className="container">
      {/* Cabecera del Tablero */}
      <div className="page-header">
        <h1 className="page-title">Tablero de Sugerencias</h1>
        <p className="page-subtitle">
          Propuestas de la comunidad educativa Montepiedra y respuestas oficiales de la institución.
        </p>

        {/* Indicador de Conexión */}
        <div style={{ marginTop: '0.75rem', display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="status-indicator backend-online" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Wifi size={14} /> Conectado al Servidor (Supabase)
          </span>
          <button onClick={loadSuggestions} className="btn-refresh" title="Actualizar sugerencias" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <RefreshCw size={13} /> Recargar
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="alert-banner alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertOctagon size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="toolbar-container">
        <div className="toolbar-search">
          <span className="toolbar-icon">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Buscar propuestas por palabras clave..."
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
            <span className="select-icon">
              <CheckSquare size={15} />
            </span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              title="Filtrar por estado"
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
              <ArrowUpDown size={15} />
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              title="Ordenar sugerencias"
            >
              <option value="recientes">Más recientes</option>
              <option value="antiguas">Más antiguas</option>
              <option value="votadas">Más apoyadas (Likes)</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner-container">
          <div className="spinner"></div>
          <p>Cargando sugerencias del buzón...</p>
        </div>
      ) : processedSuggestions.length === 0 ? (
        <div className="empty-state">
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 0, fontSize: '1.1rem' }}>
            No se encontraron sugerencias con los criterios seleccionados.
          </p>
        </div>
      ) : (
        <>
          <div className="suggestions-grid">
            {paginatedSuggestions.map((item) => {
              const statusNorm = getStatusNormalized(item.estado);
              const displayDate = item.created_at ? item.created_at.split('T')[0] : '2026-07-08';
              const authorInfo = getAuthorInfo(item, user ? user.rol : 'alumno');
              const userId = user ? (user.usuario_id || user.cedula) : null;
              const userVote = item.user_vote || api.getUserVote(item.id, userId);
              const likesCount = item.likes !== undefined ? item.likes : (item.votos || 0);
              const dislikesCount = item.dislikes || 0;
              const isPopular = likesCount >= 5;
              const currentItemComments = commentCounts[item.id] !== undefined 
                ? commentCounts[item.id] 
                : api.getCommentCount(item.id);

              return (
                <div
                  key={item.id || item.created_at}
                  className={`suggestion-card clickable-card ${statusNorm}`}
                  onClick={(e) => handleOpenCommentsModal(item, e)}
                  title="Haz clic para ver detalles completos y comentarios de la propuesta"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="card-top">
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className={`badge badge-${(item.categoria || 'otros').toLowerCase()}`}>
                          {getCategoryLabel(item.categoria)}
                        </span>
                        {isPopular && (
                          <span className="badge badge-popular animate-pulse" title="¡Propuesta muy votada por la comunidad!">
                            <Flame size={12} style={{ marginRight: '0.2rem' }} /> Popular
                          </span>
                        )}
                      </div>
                      <span className={`status-badge status-${statusNorm}`}>
                        {item.estado || 'Pendiente'}
                      </span>
                    </div>

                    <h3 className="card-title">{item.titulo}</h3>
                    <p className="card-desc">{item.descripcion}</p>

                    {item.foto_url && (
                      <div className="card-image-preview">
                        <img src={item.foto_url} alt={item.titulo} className="card-media-thumbnail" />
                      </div>
                    )}
                  </div>

                  <div>
                    {item.respuesta_moderador && (
                      <div className="card-response">
                        <div className="response-header">
                          <MessageSquare size={14} style={{ marginRight: '0.35rem' }} /> Respuesta Institucional:
                        </div>
                        <p className="response-text">"{item.respuesta_moderador}"</p>
                      </div>
                    )}

                    <div className="card-footer-toolbar">
                      {/* Autor y Avatar */}
                      <div
                        className={`card-author-section ${authorInfo.canInteract && !authorInfo.isDeleted ? 'clickable' : 'anonymous-author'}`}
                        onClick={(e) => handleAuthorClick(authorInfo, e)}
                        title={authorInfo.canInteract && !authorInfo.isDeleted ? `Ver perfil de ${authorInfo.name}` : ''}
                      >
                        {authorInfo.avatar ? (
                          <img
                            src={authorInfo.avatar}
                            alt="Avatar"
                            className="card-author-avatar"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <span
                          className="card-author-avatar-placeholder"
                          style={{ display: authorInfo.avatar ? 'none' : 'flex' }}
                        >
                          <User size={13} />
                        </span>
                        <span>
                          Por:{' '}
                          <strong className={`card-author ${authorInfo.isDeleted ? 'author-deleted' : ''}`}>
                            {authorInfo.name}
                          </strong>
                        </span>
                      </div>

                      {/* Votación y Botón de Comentarios Interactivo Estilo Red Social */}
                      <div className="card-actions-section">
                        <div className="vote-buttons-group">
                          <button
                            className={`vote-btn like-btn ${userVote === 'like' ? 'active-like' : ''}`}
                            onClick={(e) => handleVote(item.id, 'like', e)}
                            title={userVote === 'like' ? "Quitar mi voto" : "Apoyar propuesta (Like)"}
                            disabled={votingId === item.id}
                          >
                            <span className="vote-icon">
                              <ThumbsUp size={14} />
                            </span>
                            <span className="vote-count">{likesCount}</span>
                          </button>

                          <button
                            className={`vote-btn dislike-btn ${userVote === 'dislike' ? 'active-dislike' : ''}`}
                            onClick={(e) => handleVote(item.id, 'dislike', e)}
                            title={userVote === 'dislike' ? "Quitar mi voto" : "No apoyar propuesta (Dislike)"}
                            disabled={votingId === item.id}
                          >
                            <span className="vote-icon">
                              <ThumbsDown size={14} />
                            </span>
                            <span className="vote-count">{dislikesCount}</span>
                          </button>

                          {/* Botón de Comentarios Interactivo estilo Instagram / TikTok */}
                          <button
                            className="social-comment-btn"
                            onClick={(e) => handleOpenCommentsModal(item, e)}
                            title="Ver detalles e hilo de comentarios"
                          >
                            <MessageCircle size={15} className="social-comment-icon" />
                            <span className="social-comment-count">{currentItemComments}</span>
                          </button>
                        </div>

                        <span className="card-date-label">{displayDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Barra de Paginación Estricta (Máximo 6 sugerencias por página) */}
          {totalPages > 1 && (
            <div className="pagination-wrapper">
              <button
                className="pagination-nav-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                title="Página anterior"
              >
                <ChevronLeft size={16} />
                <span>Anterior</span>
              </button>

              <div className="pagination-numbers-group">
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`pagination-num-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                    title={`Ir a página ${pageNum}`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                className="pagination-nav-btn"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                title="Página siguiente"
              >
                <span>Siguiente</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* MODAL FLOTANTE DE DETALLES Y COMENTARIOS SPLIT SCREEN */}
      {activeCommentsSug && (() => {
        const modalAuthor = getAuthorInfo(activeCommentsSug, user ? user.rol : 'alumno');
        const modalUserVote = activeCommentsSug.user_vote || (user ? api.getUserVote(activeCommentsSug.id, user.usuario_id || user.cedula) : null);
        const modalLikes = activeCommentsSug.likes !== undefined ? activeCommentsSug.likes : (activeCommentsSug.votos || 0);
        const modalDislikes = activeCommentsSug.dislikes || 0;
        const modalStatusNorm = getStatusNormalized(activeCommentsSug.estado);

        return (
          <div className="modal-backdrop floating-detail-backdrop" onClick={() => setActiveCommentsSug(null)}>
            <div className="modal-content split-detail-modal animate-fadeIn" onClick={(e) => e.stopPropagation()}>

              {/* Encabezado del Modal */}
              <div className="modal-header split-modal-header">
                <div>
                  <span className={`badge badge-${(activeCommentsSug.categoria || 'otros').toLowerCase()}`} style={{ marginRight: '0.5rem' }}>
                    {getCategoryLabel(activeCommentsSug.categoria)}
                  </span>
                  <span className={`status-badge status-${modalStatusNorm}`}>
                    {activeCommentsSug.estado || 'Pendiente'}
                  </span>
                </div>
                <button className="modal-close" onClick={() => setActiveCommentsSug(null)} aria-label="Cerrar modal">
                  <X size={18} />
                </button>
              </div>

              {/* Cuerpo Split: Izquierda Detalles, Derecha Comentarios */}
              <div className="split-modal-body">

                {/* COLUMNA IZQUIERDA: Detalles de la Sugerencia */}
                <div className="split-pane-left">
                  <h2 className="split-sug-title">{activeCommentsSug.titulo}</h2>

                  {/* Autor y Fecha */}
                  <div className="split-author-box">
                    {modalAuthor.avatar ? (
                      <img src={modalAuthor.avatar} alt="Avatar" className="card-author-avatar" />
                    ) : (
                      <span className="card-author-avatar-placeholder">
                        <User size={14} />
                      </span>
                    )}
                    <div>
                      <strong className={modalAuthor.isDeleted ? 'author-deleted' : ''}>
                        {modalAuthor.name}
                      </strong>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Fecha: {activeCommentsSug.created_at ? activeCommentsSug.created_at.split('T')[0] : 'Reciente'}
                      </span>
                    </div>
                  </div>

                  {/* Descripción completa */}
                  <div className="split-sug-desc-container">
                    <h4>Descripción de la Propuesta:</h4>
                    <p className="split-sug-desc">{activeCommentsSug.descripcion}</p>
                  </div>

                  {/* Imagen adjunta si existe */}
                  {activeCommentsSug.foto_url && (
                    <div className="split-image-container">
                      <img src={activeCommentsSug.foto_url} alt={activeCommentsSug.titulo} className="split-sug-image" />
                    </div>
                  )}

                  {/* Respuesta oficial de Moderación si existe */}
                  {activeCommentsSug.respuesta_moderador && (
                    <div className="card-response" style={{ marginTop: '1rem' }}>
                      <div className="response-header">
                        <MessageSquare size={14} style={{ marginRight: '0.35rem' }} /> Respuesta Institucional:
                      </div>
                      <p className="response-text">"{activeCommentsSug.respuesta_moderador}"</p>
                    </div>
                  )}

                  {/* Botones Interactivos de Votación */}
                  <div className="split-voting-bar">
                    <span>¿Qué opinas de esta sugerencia?</span>
                    <div className="vote-buttons-group">
                      <button
                        className={`vote-btn like-btn ${modalUserVote === 'like' ? 'active-like' : ''}`}
                        onClick={(e) => handleVote(activeCommentsSug.id, 'like', e)}
                        disabled={votingId === activeCommentsSug.id}
                      >
                        <span className="vote-icon">
                          <ThumbsUp size={14} />
                        </span>
                        <span className="vote-count">{modalLikes} Likes</span>
                      </button>

                      <button
                        className={`vote-btn dislike-btn ${modalUserVote === 'dislike' ? 'active-dislike' : ''}`}
                        onClick={(e) => handleVote(activeCommentsSug.id, 'dislike', e)}
                        disabled={votingId === activeCommentsSug.id}
                      >
                        <span className="vote-icon">
                          <ThumbsDown size={14} />
                        </span>
                        <span className="vote-count">{modalDislikes} Dislikes</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* COLUMNA DERECHA: Sistema de Comentarios */}
                <div className="split-pane-right">
                  <h3 className="comments-pane-title">
                    <MessageCircle size={17} style={{ marginRight: '0.4rem', verticalAlign: 'text-bottom' }} />
                    Comentarios ({comments.length})
                  </h3>

                  <div className="comments-list-scroll">
                    {commentsLoading ? (
                      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div className="spinner"></div>
                        <p>Cargando comentarios...</p>
                      </div>
                    ) : comments.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-muted)' }}>
                        <p>No hay comentarios aún. ¡Sé el primero en aportar a esta propuesta!</p>
                      </div>
                    ) : (
                      comments.map((com, index) => {
                        const authorName = com.usuarios?.nombre || com.nombre || 'Comunidad Montepiedra';
                        const authorRole = com.usuarios?.rol || com.rol;
                        const authorAvatar = com.usuarios?.foto_url || com.foto_url || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(authorName)}`;
                        const displayDate = com.created_at ? new Date(com.created_at).toLocaleString() : 'Reciente';

                        return (
                          <div key={com.id || index} className="comment-item-card">
                            <img src={authorAvatar} alt={authorName} className="comment-avatar" />
                            <div className="comment-body">
                              <div className="comment-header">
                                <strong className="comment-author-name">{authorName}</strong>
                                {authorRole && (
                                  <span className={`badge-role-pill role-${authorRole}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                                    {formatRole(authorRole)}
                                  </span>
                                )}
                                <span className="comment-date">{displayDate}</span>
                              </div>
                              <p className="comment-text">{com.texto}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {commentError && (
                    <div
                      className={`alert-banner ${commentErrorStatus === 429 ? 'alert-warning' : 'alert-error'}`}
                      style={{
                        marginBottom: '0.75rem',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.5rem'
                      }}
                    >
                      <span style={{ display: 'inline-flex', marginTop: '2px' }}>
                        {commentErrorStatus === 429 ? <Clock size={16} /> : commentErrorStatus === 400 ? <AlertOctagon size={16} /> : <AlertTriangle size={16} />}
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {commentErrorStatus === 429 && <strong>Límite horario alcanzado (429)</strong>}
                        {commentErrorStatus === 400 && <strong>Moderación de comentario</strong>}
                        <span>{commentError}</span>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handlePostComment} className="comment-post-form">
                    <input
                      type="text"
                      placeholder="Escribe un comentario respetuoso..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      disabled={commentSubmitting}
                      required
                    />
                    <button type="submit" className="btn btn-primary" disabled={commentSubmitting || !newCommentText.trim()} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      {commentSubmitting ? '...' : (
                        <>
                          <span>Enviar</span>
                          <Send size={14} />
                        </>
                      )}
                    </button>
                  </form>
                </div>

              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
