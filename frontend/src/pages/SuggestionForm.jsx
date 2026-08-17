import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import './Pages.css';

// Lista de palabras prohibidas para moderación previa en frontend (coincidente con backend)
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
  const [fotoUrl, setFotoUrl] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saveSource, setSaveSource] = useState('backend');
  const [errorMessage, setErrorMessage] = useState('');

  // Verificación de lenguaje inapropiado
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

    // Validación anti-groserías
    if (hasProfanity(title) || hasProfanity(description)) {
      setErrorMessage('⚠️ ¡ATENCIÓN! Tu sugerencia contiene lenguaje inapropiado o palabras ofensivas. El Buzón de Sugerencias Montepiedra exige un vocabulario respetuoso e institucional.');
      setLoading(false);
      return;
    }

    try {
      const result = await api.createSuggestion({
        titulo: title,
        descripcion: description,
        categoria: category,
        usuario_id: user.usuario_id || user.cedula,
        es_anonimo: isAnonymous,
        foto_url: fotoUrl.trim() || null,
        userRole: user.rol,
        authorProfile: {
          id: user.usuario_id || user.cedula,
          nombre: user.nombre,
          correo: user.correo,
          foto_url: user.avatar
        }
      });

      setSaveSource(result.isSimulated ? 'local' : 'backend');
      setSubmitted(true);

      // Limpiar formulario
      setTitle('');
      setCategory('Academico');
      setDescription('');
      setFotoUrl('');
      setIsAnonymous(true);

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
        <h1 className="page-title">✍️ Nueva Sugerencia</h1>
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
                ? '¡Tu sugerencia ha sido enviada con éxito al servidor y guardada en Supabase!' 
                : '¡Sugerencia guardada con éxito (Modo local sincronizado)! Ya es visible en el tablero.'}
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
              placeholder="Ej. Mejorar la red Wi-Fi en laboratorios de cómputo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={loading}
            />
            <p className="form-help">Escribe un título corto y claro que resuma tu idea.</p>
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
            <label className="form-label" htmlFor="foto-url">Enlace a imagen o evidencia (Opcional)</label>
            <input
              type="url"
              id="foto-url"
              placeholder="https://ejemplo.com/foto.jpg"
              value={fotoUrl}
              onChange={(e) => setFotoUrl(e.target.value)}
              disabled={loading}
            />
            <p className="form-help">Puedes pegar un enlace a una imagen de referencia.</p>
          </div>

          <div className="form-group">
            <label className="form-label">Privacidad y Anonimato</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="identity"
                  checked={isAnonymous}
                  onChange={() => setIsAnonymous(true)}
                  disabled={loading}
                />
                Enviar como <strong>Anónimo</strong> (Solo los administradores podrán ver tu autoría).
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="identity"
                  checked={!isAnonymous}
                  onChange={() => setIsAnonymous(false)}
                  disabled={loading}
                />
                Público (mostrar mi nombre <strong>{user.nombre}</strong> en el tablero).
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Validando y Enviando...' : 'Enviar Sugerencia al Buzón'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
