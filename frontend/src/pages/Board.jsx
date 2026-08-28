import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, getAuthorInfo, formatRole } from '../utils/api';
import './Pages.css';

export default function Board() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiSource, setApiSource] = useState('local');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recientes'); // 'recientes', 'antiguas', 'votadas'
  const [errorMessage, setErrorMessage] = useState('');
  const [votingId, setVotingId] = useState(null);

  // Estados para el Modal Flotante de Detalles y Comentarios Split
  const [activeCommentsSug, setActiveCommentsSug] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);


  const loadSuggestions = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      // 1. Envío de rol y ID del usuario para evaluar estado inicial de sus votos
      const userId = user ? (user.usuario_id || user.cedula) : null;
      const result = await api.getSuggestions(user ? user.rol : 'alumno', userId);
      setSuggestions(result.data);
      setApiSource(result.source);
    } catch (err) {
      setErrorMessage('No se pudieron cargar las sugerencias del servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, [user]);

  // Manejo de votación con Toggle (desmarcar o cambiar voto) y actualización en tiempo real de Likes y Dislikes
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

      // Actualizar modal si está abierto para esta sugerencia
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
    setNewCommentText('');
    
    const res = await api.getComments(sug.id, user ? user.rol : 'alumno');
    setComments(res.data || []);
    setCommentsLoading(false);
  };

  // Enviar comentario
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!activeCommentsSug || !newCommentText.trim() || !user) return;

    setCommentSubmitting(true);
    setCommentError('');

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

      setComments(prev => [...prev, addedComment]);
      setNewCommentText('');
    } catch (err) {
      setCommentError(err.message || 'Error al publicar el comentario.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  // Redirección al perfil si el usuario no es anónimo ni eliminado
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

  const getCategoryLabel = (cat) => {
    switch(cat) {
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
          {apiSource === 'backend' ? (
            <span className="status-indicator backend-online">
              🟢 Conectado a Supabase API
            </span>
          ) : (
            <span className="status-indicator backend-offline" title="Cargado desde el almacenamiento local">
              🟡 Modo Local (Offline Sincronizado)
            </span>
          )}
          <button onClick={loadSuggestions} className="btn-refresh" title="Actualizar sugerencias">
            🔄 Recargar
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="alert-banner alert-error">
          <span>❌</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="toolbar-container">
        <div className="toolbar-search">
          <span className="toolbar-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar propuestas por palabras clave..."
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
            <span className="select-icon">🚦</span>
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
            <span className="select-icon">📊</span>
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
        <div className="suggestions-grid">
          {processedSuggestions.map((item) => {
            const statusNorm = getStatusNormalized(item.estado);
            const displayDate = item.created_at ? item.created_at.split('T')[0] : '2026-07-08';
            
            // Renderizado de autor y evaluación de 'Usuario eliminado'
            const authorInfo = getAuthorInfo(item, user ? user.rol : 'alumno');
            
            // Votación: consultar voto actual del usuario y conteos de likes/dislikes
            const userId = user ? (user.usuario_id || user.cedula) : null;
            const userVote = item.user_vote || api.getUserVote(item.id, userId);
            const likesCount = item.likes !== undefined ? item.likes : (item.votos || 0);
            const dislikesCount = item.dislikes || 0;

            // Etiqueta dinámica de popularidad
            const isPopular = likesCount >= 5;

            return (
              <div 
                key={item.id || item.created_at} 
                className={`suggestion-card clickable-card ${statusNorm}`}
                onClick={(e) => handleOpenCommentsModal(item, e)}
                title="Haz clic para ver detalles completos y comentarios de la propuesta"
              >
                <div>
                  {/* Top Badges (Categoría, Popularidad, Estado) */}
                  <div className="card-top">
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className={`badge badge-${(item.categoria || 'otros').toLowerCase()}`}>
                        {getCategoryLabel(item.categoria)}
                      </span>
                      {isPopular && (
                        <span className="badge badge-popular animate-pulse" title="¡Propuesta muy votada por la comunidad!">
                          🔥 Popular
                        </span>
                      )}
                    </div>
                    <span className={`status-badge status-${statusNorm}`}>
                      {item.estado || 'Pendiente'}
                    </span>
                  </div>

                  <h3 className="card-title">{item.titulo}</h3>
                  <p className="card-desc">{item.descripcion}</p>

                  {/* Imagen adjunta si existe */}
                  {item.foto_url && (
                    <div className="card-image-preview">
                      <img src={item.foto_url} alt={item.titulo} className="card-media-thumbnail" />
                    </div>
                  )}
                </div>

                <div>
                  {/* Respuesta oficial del moderador */}
                  {item.respuesta_moderador && (
                    <div className="card-response">
                      <div className="response-header">
                        <span>💬</span> Respuesta Institucional:
                      </div>
                      <p className="response-text">"{item.respuesta_moderador}"</p>
                    </div>
                  )}

                  <div className="card-footer-toolbar">
                    {/* Sección de Autor y Avatar */}
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
                        👤
                      </span>
                      <span>
                        Por:{' '}
                        <strong className={`card-author ${authorInfo.isDeleted ? 'author-deleted' : ''}`}>
                          {authorInfo.name}
                        </strong>
                      </span>
                    </div>

                    {/* Sistema de Votación Like / Dislike con desmarcado Toggle */}
                    <div className="card-actions-section">
                      <div className="vote-buttons-group">
                        <button 
                          className={`vote-btn like-btn ${userVote === 'like' ? 'active-like' : ''}`}
                          onClick={(e) => handleVote(item.id, 'like', e)}
                          title={userVote === 'like' ? "Quitar mi voto" : "Apoyar propuesta (Like)"}
                          disabled={votingId === item.id}
                        >
                          <span className="vote-icon">👍</span>
                          <span className="vote-count">{likesCount}</span>
                        </button>

                        <button 
                          className={`vote-btn dislike-btn ${userVote === 'dislike' ? 'active-dislike' : ''}`}
                          onClick={(e) => handleVote(item.id, 'dislike', e)}
                          title={userVote === 'dislike' ? "Quitar mi voto" : "No apoyar propuesta (Dislike)"}
                          disabled={votingId === item.id}
                        >
                          <span className="vote-icon">👎</span>
                          <span className="vote-count">{dislikesCount}</span>
                        </button>

                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          onClick={(e) => handleOpenCommentsModal(item, e)}
                          title="Ver detalles completos y añadir comentarios"
                        >
                          💬 Detalle
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
      )}

      {/* MODAL FLOTANTE DE DETALLES Y COMENTARIOS (SPLIT SCREEN CON BACKDROP BLUR) */}
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
                <button className="modal-close" onClick={() => setActiveCommentsSug(null)}>✕</button>
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
                      <span className="card-author-avatar-placeholder">👤</span>
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
                        <span>💬</span> Respuesta Institucional:
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
                        <span className="vote-icon">👍</span>
                        <span className="vote-count">{modalLikes} Likes</span>
                      </button>

                      <button 
                        className={`vote-btn dislike-btn ${modalUserVote === 'dislike' ? 'active-dislike' : ''}`}
                        onClick={(e) => handleVote(activeCommentsSug.id, 'dislike', e)}
                        disabled={votingId === activeCommentsSug.id}
                      >
                        <span className="vote-icon">👎</span>
                        <span className="vote-count">{modalDislikes} Dislikes</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* COLUMNA DERECHA: Sistema de Comentarios */}
                <div className="split-pane-right">
                  <h3 className="comments-pane-title">💬 Comentarios Comunitarios ({comments.length})</h3>

                  <div className="comments-list-scroll">
                    {commentsLoading ? (
                      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div className="spinner"></div>
                        <p>Cargando comentarios...</p>
                      </div>
                    ) : comments.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-muted)' }}>
                        <p>💬 No hay comentarios aún. ¡Sé el primero en aportar a esta propuesta!</p>
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
                    <div className="alert-banner alert-error" style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                      <span>🛑</span>
                      <span>{commentError}</span>
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
                    <button type="submit" className="btn btn-primary" disabled={commentSubmitting || !newCommentText.trim()}>
                      {commentSubmitting ? '...' : 'Enviar 🚀'}
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
