import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, encodeDescription } from '../utils/api';
import './Pages.css';

// Strict array of forbidden words (Spanish insults and inappropriate terms)
const FORBIDDEN_WORDS = [
  'mierda', 'puto', 'puta', 'pendejo', 'pendeja', 'cabron', 'cabrón', 
  'estupido', 'estúpido', 'tonto', 'tonta', 'idiota', 'imbecil', 'imbécil', 
  'groseria', 'grosería', 'basura', 'hijo de puta', 'malparido', 'culiado'
];

export default function SuggestionForm() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Academico');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saveSource, setSaveSource] = useState('backend');
  const [errorMessage, setErrorMessage] = useState('');

  // Checks if text contains any forbidden words (case-insensitive)
  const hasProfanity = (text) => {
    if (!text) return false;
    const lower = text.toLowerCase();
    return FORBIDDEN_WORDS.some(word => lower.includes(word));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) return;

    setLoading(true);
    setErrorMessage('');
    setSubmitted(false);

    // Moderation check: Profanity filter validation
    if (hasProfanity(title) || hasProfanity(description)) {
      setErrorMessage('⚠️ ¡ATENCIÓN! Tu sugerencia contiene lenguaje inapropiado o palabras ofensivas. El Buzón de Sugerencias Montepiedra exige un vocabulario respetuoso e institucional.');
      setLoading(false);
      return;
    }

    // Determine target author name (use form field or fall back to logged-in user name)
    const authorName = isAnonymous ? user.nombre : (author.trim() || user.nombre);
    
    // Encode description with author metadata and anonymity flag
    const encodedDesc = encodeDescription(description, authorName, isAnonymous);

    try {
      const result = await api.createSuggestion(
        title,
        encodedDesc,
        category,
        user.usuario_id
      );

      // Set source to display correct success message
      setSaveSource(result.isSimulated ? 'local' : 'backend');
      setSubmitted(true);

      // Reset Form fields
      setTitle('');
      setCategory('Academico');
      setDescription('');
      setAuthor('');
      setIsAnonymous(true);

      // Auto-hide success alert
      setTimeout(() => {
        setSubmitted(false);
      }, 6000);
    } catch (err) {
      setErrorMessage(err.message || 'Error al enviar la sugerencia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1 className="page-title">Nueva Sugerencia</h1>
        <p className="page-subtitle">
          Envía tus comentarios o propuestas para ayudarnos a mejorar cada día.
        </p>
      </div>

      <div className="form-container">
        {submitted && (
          <div className="alert-banner alert-success">
            <span>✅</span>
            <span>
              {saveSource === 'backend' 
                ? '¡Tu sugerencia ha sido enviada con éxito al backend y guardada en Supabase!' 
                : '¡Sugerencia guardada con éxito (Simulador local activo)! Será visible en el tablero.'}
            </span>
          </div>
        )}

        {errorMessage && (
          <div className="alert-banner alert-error" style={{ display: 'flex', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.25rem' }}>🛑</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="title">Título de la sugerencia</label>
            <input
              type="text"
              id="title"
              placeholder="Ej. Mejorar el equipamiento del laboratorio de física"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={loading}
            />
            <p className="form-help">Escribe un título corto y claro que describa tu propuesta.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="category">Categoría</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
            >
              <option value="Academico">Académico</option>
              <option value="Infraestructura">Infraestructura</option>
              <option value="Convivencia">Convivencia / Actividades</option>
              <option value="Otros">Otros</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Detalle de la propuesta</label>
            <textarea
              id="description"
              rows="5"
              placeholder="Describe detalladamente tu sugerencia, explicando por qué crees que es importante y cómo beneficiará al colegio..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={loading}
            ></textarea>
          </div>

          <div className="form-group">
            <label className="form-label">Identificación</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="identity"
                  checked={isAnonymous}
                  onChange={() => setIsAnonymous(true)}
                  disabled={loading}
                />
                Enviar como Anónimo (la administración conocerá tu autoría, pero el público no)
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="identity"
                  checked={!isAnonymous}
                  onChange={() => setIsAnonymous(false)}
                  disabled={loading}
                  style={{ width: 'auto' }}
                />
                Incluir mi nombre
              </label>
            </div>
          </div>

          {!isAnonymous && (
            <div className="form-group animate-fadeIn" style={{ animation: 'fadeIn 0.2s ease-out' }}>
              <label className="form-label" htmlFor="author">Nombre completo o curso</label>
              <input
                type="text"
                id="author"
                placeholder={`Ej. ${user.nombre}`}
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required={!isAnonymous}
                disabled={loading}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Validando...' : 'Enviar Sugerencia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
