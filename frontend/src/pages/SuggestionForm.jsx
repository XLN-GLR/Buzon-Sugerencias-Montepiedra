import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { 
  FileText, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertOctagon, 
  AlertTriangle 
} from 'lucide-react';
import './Pages.css';

export default function SuggestionForm() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Academico');
  const [description, setDescription] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorStatus, setErrorStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) return;

    setLoading(true);
    setErrorMessage('');
    setErrorStatus(null);
    setSubmitted(false);

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

      // Limpiar formulario y resetear errores previos
      setTitle('');
      setCategory('Academico');
      setDescription('');
      setFotoUrl('');
      setIsAnonymous(true);
      setErrorMessage('');
      setErrorStatus(null);

      // Actualizar estado de éxito
      setSubmitted(true);

      setTimeout(() => {
        setSubmitted(false);
      }, 6000);
    } catch (err) {
      const status = err.status || err.response?.status;
      const apiMessage = err.response?.data?.error || err.data?.error || err.message;
      setErrorStatus(status);

      // 1. Manejo específico de Rate Limit (HTTP 429)
      if (status === 429 || (apiMessage && (apiMessage.includes('límite') || apiMessage.includes('24 horas')))) {
        setErrorStatus(429);
        setErrorMessage(
          apiMessage || 
          'Has alcanzado el límite de 1 sugerencia cada 24 horas. Por favor, intenta de nuevo más tarde.'
        );
        // NOTA: Se preserva el título y la descripción intactos en los campos del formulario
      } 
      // 2. Manejo de contenido inapropiado (HTTP 400)
      else if (status === 400 || (apiMessage && apiMessage.toLowerCase().includes('inapropiado'))) {
        setErrorStatus(400);
        setErrorMessage(
          apiMessage || 
          'Atención: Tu sugerencia contiene lenguaje inapropiado o palabras ofensivas. El Buzón de Sugerencias Montepiedra exige un vocabulario respetuoso e institucional.'
        );
      } 
      // 3. Error de servidor u otros (HTTP 500)
      else {
        setErrorStatus(status || 500);
        setErrorMessage(
          apiMessage && !apiMessage.startsWith('Error ') && apiMessage !== 'Failed to fetch'
            ? apiMessage 
            : 'Ocurrió un error en el servidor al enviar la sugerencia. Por favor, reintenta más tarde.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1 className="page-title" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
          <FileText size={28} />
          Nueva Sugerencia
        </h1>
        <p className="page-subtitle">
          Envía tus comentarios o propuestas para ayudarnos a mejorar cada día.
        </p>
      </div>

      <div className="form-container">
        {submitted && (
          <div className="alert-banner alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckCircle2 size={20} color="#059669" />
            <span>¡Tu sugerencia ha sido enviada con éxito al servidor y guardada en Supabase!</span>
          </div>
        )}

        {errorMessage && (
          <div 
            className={`alert-banner ${errorStatus === 429 ? 'alert-warning' : 'alert-error'}`} 
            style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}
          >
            <div style={{ marginTop: '0.15rem', flexShrink: 0 }}>
              {errorStatus === 429 ? (
                <Clock size={20} color="#D97706" />
              ) : errorStatus === 400 ? (
                <AlertOctagon size={20} color="#DC2626" />
              ) : (
                <AlertTriangle size={20} color="#DC2626" />
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {errorStatus === 429 && <strong>Límite de participación alcanzado (429)</strong>}
              {errorStatus === 400 && <strong>Moderación de contenido institucional</strong>}
              <span>{errorMessage}</span>
            </div>
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
              style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              disabled={loading}
            >
              <Send size={18} />
              {loading ? 'Validando y Enviando...' : 'Enviar Sugerencia al Buzón'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
