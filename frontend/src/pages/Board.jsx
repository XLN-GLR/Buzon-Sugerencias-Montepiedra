import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, parseDescription } from '../utils/api';
import './Pages.css';

export default function Board() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiSource, setApiSource] = useState('local');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recientes'); // 'recientes', 'antiguas', 'votadas'
  const [errorMessage, setErrorMessage] = useState('');

  const loadSuggestions = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const result = await api.getSuggestions();
      setSuggestions(result.data);
      setApiSource(result.source);
    } catch (err) {
      setErrorMessage('No se pudieron cargar las sugerencias.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  // Handle Like/Vote click
  const handleVote = (id, e) => {
    e.stopPropagation(); // Avoid card click actions
    const newVotes = api.voteSuggestion(id);
    setSuggestions(prev => 
      prev.map(s => s.id === id ? { ...s, votos: newVotes } : s)
    );
  };

  // Perform search, category filtering, and sorting
  const processedSuggestions = suggestions
    .filter(item => {
      // Category filter
      const matchesCategory = filterCategory === 'Todas' || item.categoria.toLowerCase() === filterCategory.toLowerCase();
      
      // Keywords filter
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
        <h1 className="page-title">Tablero de Sugerencias</h1>
        <p className="page-subtitle">
          Sugerencias compartidas por la comunidad educativa Montepiedra y las respuestas oficiales.
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

      {/* Toolbar Section (Search, Category & Sorting Dropdowns) */}
      <div className="toolbar-container">
        <div className="toolbar-search">
          <span className="toolbar-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por palabras clave en título o contenido..."
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
              title="Ordenar sugerencias"
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
            // Decode description and anonymity tags
            const { cleanDesc, author, isAnonymous } = parseDescription(item.descripcion);
            
            // Format date YYYY-MM-DD
            const displayDate = item.created_at 
              ? item.created_at.split('T')[0] 
              : (item.date || '2026-07-08');

            // Format author and check if avatar should be displayed
            let authorDisplay = '';
            let isRevealMode = false;
            let displayAvatarUrl = null;

            if (isAnonymous) {
              if (user.rol === 'profesor' || user.rol === 'administrador') {
                authorDisplay = `${author} (Anónimo)`;
                isRevealMode = true;
                displayAvatarUrl = item.authorAvatar;
              } else {
                authorDisplay = 'Anónimo';
              }
            } else {
              authorDisplay = author;
              displayAvatarUrl = item.authorAvatar;
            }

            return (
              <div 
                key={item.id || item.created_at} 
                className={`suggestion-card ${item.estado.toLowerCase().replace(' ', '-')}`}
              >
                <div>
                  <div className="card-top">
                    <span className={`badge badge-${item.categoria.toLowerCase()}`}>
                      {getCategoryLabel(item.categoria)}
                    </span>
                    <span className={`status-badge status-${item.estado.toLowerCase().replace(' ', '-')}`}>
                      {item.estado}
                    </span>
                  </div>
                  <h3 className="card-title">{item.titulo}</h3>
                  <p className="card-desc">{cleanDesc}</p>
                </div>

                <div>
                  {item.estado === 'Respondido' && item.respuesta && (
                    <div className="card-response">
                      <div className="response-header">
                        <span>💬</span> Respuesta Montepiedra:
                      </div>
                      <p className="response-text">"{item.respuesta}"</p>
                    </div>
                  )}

                  <div className="card-footer-toolbar">
                    <div className="card-author-section">
                      {displayAvatarUrl ? (
                        <img src={displayAvatarUrl} alt="Avatar" className="card-author-avatar" />
                      ) : (
                        <span className="card-author-avatar-placeholder">👤</span>
                      )}
                      <span>
                        Por:{' '}
                        <strong className={`card-author ${isRevealMode ? 'revealed-author' : ''}`}>
                          {authorDisplay}
                        </strong>
                      </span>
                    </div>

                    <div className="card-actions-section">
                      {/* Voting Heart Button */}
                      <button 
                        className="card-vote-btn" 
                        onClick={(e) => handleVote(item.id, e)}
                        title="Votar por esta propuesta"
                      >
                        <span className="heart-icon">❤️</span>
                        <span className="vote-count">{item.votos || 0}</span>
                      </button>
                      <span className="card-date-label">{displayDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
