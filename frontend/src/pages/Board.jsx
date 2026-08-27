import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
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

  // Estados para el Modal de Comentarios
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

  // Manejo de votación con Toggle (desmarcar o cambiar voto)
  const handleVote = async (id, voteType, e) => {
    e.stopPropagation();
    if (!user) return;

    setVotingId(id);
    const userId = user.usuario_id || user.cedula || 'usr-default';

    const result = await api.voteSuggestion(id, voteType, userId, user.rol);
    setVotingId(null);

    if (result.success) {
      setSuggestions(prev => 
        prev.map(s => {
          if (s.id === id) {
            const newLikes = result.likes !== undefined ? result.likes : (result.votos !== undefined ? result.votos : s.votos);
            const newDislikes = result.dislikes !== undefined ? result.dislikes : s.dislikes;
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
    }
  };

  // Abrir modal de comentarios
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


  // Redirección al perfil solo si el usuario creador no es anónimo
  const handleAuthorClick = (authorId, isAnonymous) => {
    if (!authorId || (isAnonymous && user.rol !== 'administrador' && user.rol !== 'admin')) {
      return; // Clic deshabilitado para anónimos
    }
    navigate('/perfil');
  };

  // Filtrado y Ordenamiento
  const processedSuggestions = suggestions
    .filter(item => {
      // Filtro por categoría
      const matchesCategory = filterCategory === 'Todas' || 
        item.categoria.toLowerCase() === filterCategory.toLowerCase();
      
      // Filtro por estado
      const matchesStatus = filterStatus === 'Todos' || 
        (item.estado || 'Pendiente').toLowerCase().replace(' ', '-') === filterStatus.toLowerCase().replace(' ', '-');

      // Filtro por búsqueda
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        (item.titulo || '').toLowerCase().includes(term) ||
        (item.descripcion || '').toLowerCase().includes(term);

      return matchesCategory && matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'votadas') {
        return (b.votos || 0) - (a.votos || 0);
      }
      
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);

      if (sortBy === 'antiguas') {
        return dateA - dateB;
      }
      // 'recientes' (default)
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
            
            // 2. Renderizado simplificado de usuarios (Directo desde objeto usuarios provisto por API)
            const authorName = item.usuarios?.nombre || (item.es_anonimo ? 'Anónimo' : 'Comunidad');
            const authorAvatar = item.usuarios?.foto_url || null;
            const authorId = item.usuarios?.id || null;
            const isAnonymous = Boolean(item.es_anonimo);
            
            // 3. Control de interacción para autores anónimos
            const canInteractProfile = authorId !== null && (!isAnonymous || user.rol === 'administrador' || user.rol === 'admin');

            // 4. Votación limitada: consultar voto actual del usuario
            const userId = user ? (user.usuario_id || user.cedula) : null;
            const userVote = api.getUserVote(item.id, userId);

            // 5. Etiqueta dinámica de popularidad
            const isPopular = (item.votos || 0) >= 5;

            return (
              <div 
                key={item.id || item.created_at} 
                className={`suggestion-card ${statusNorm}`}
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
                      className={`card-author-section ${canInteractProfile ? 'clickable' : 'anonymous-author'}`}
                      onClick={() => handleAuthorClick(authorId, isAnonymous)}
                      title={canInteractProfile ? `Ver perfil de ${authorName}` : (isAnonymous ? 'Propuesta anónima' : '')}
                    >
                      {authorAvatar ? (
                        <img 
                          src={authorAvatar} 
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
                        style={{ display: authorAvatar ? 'none' : 'flex' }}
                      >
                        👤
                      </span>
                      <span>
                        Por:{' '}
                        <strong className={`card-author ${isAnonymous && (user.rol === 'admin' || user.rol === 'administrador') ? 'revealed-author' : ''}`}>
                          {authorName}
                          {isAnonymous && (user.rol === 'admin' || user.rol === 'administrador') && ' (Anónimo)'}
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
                          <span className="vote-count">{item.votos || 0}</span>
                        </button>

                        <button 
                          className={`vote-btn dislike-btn ${userVote === 'dislike' ? 'active-dislike' : ''}`}
                          onClick={(e) => handleVote(item.id, 'dislike', e)}
                          title={userVote === 'dislike' ? "Quitar mi voto" : "No apoyar propuesta (Dislike)"}
                          disabled={votingId === item.id}
                        >
                          <span className="vote-icon">👎</span>
                          <span className="vote-count">{item.dislikes || 0}</span>
                        </button>

                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          onClick={(e) => handleOpenCommentsModal(item, e)}
                          title="Ver y añadir comentarios a esta propuesta"
                        >
                          💬 Comentar
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

      {/* MODAL FLOTANTE DE COMENTARIOS (ESTILO RED SOCIAL) */}
      {activeCommentsSug && (
        <div className="modal-backdrop" onClick={() => setActiveCommentsSug(null)}>
          <div className="modal-content animate-fadeIn" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>💬 Comentarios Comunitarios</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  Propuesta: <strong>"{activeCommentsSug.titulo}"</strong>
                </p>
              </div>
              <button className="modal-close" onClick={() => setActiveCommentsSug(null)}>✕</button>
            </div>

            <div className="comments-modal-body" style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1.25rem' }}>
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
                  const authorAvatar = com.usuarios?.foto_url || com.foto_url || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(authorName)}`;
                  const displayDate = com.created_at ? new Date(com.created_at).toLocaleString() : 'Reciente';

                  return (
                    <div key={com.id || index} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', padding: '0.75rem 1rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                      <img src={authorAvatar} alt={authorName} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <strong style={{ fontSize: '0.875rem', color: 'var(--color-primary)' }}>{authorName}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{displayDate}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text)', lineHeight: '1.4' }}>{com.texto}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {commentError && (
              <div className="alert-banner alert-error" style={{ marginBottom: '1rem' }}>
                <span>🛑</span>
                <span>{commentError}</span>
              </div>
            )}

            <form onSubmit={handlePostComment} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Escribe un comentario respetuoso..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                disabled={commentSubmitting}
                required
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" disabled={commentSubmitting || !newCommentText.trim()}>
                {commentSubmitting ? 'Enviando...' : 'Enviar 🚀'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

