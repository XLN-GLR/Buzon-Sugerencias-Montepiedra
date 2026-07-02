import React, { useState } from 'react';
import './Pages.css';

export default function SuggestionForm() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Academico');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !description) return;

    // Simulate suggestion submission
    const newSuggestion = {
      title,
      category,
      description,
      author: isAnonymous ? 'Anónimo' : author || 'Anónimo',
      date: new Date().toISOString().split('T')[0],
      status: 'Pendiente'
    };

    console.log('Nueva Sugerencia Enviada:', newSuggestion);

    // Show success banner and reset form
    setSubmitted(true);
    setTitle('');
    setCategory('Academico');
    setDescription('');
    setAuthor('');
    setIsAnonymous(true);

    // Hide success banner after 5 seconds
    setTimeout(() => {
      setSubmitted(false);
    }, 5000);
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
            <span>¡Tu sugerencia ha sido enviada con éxito! Será revisada por la administración institucional.</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="title">Título de la sugerencia</label>
            <input
              type="text"
              id="title"
              placeholder="Ej. Mejorar el equipamiento del taller de carpintería"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <p className="form-help">Escribe un título corto y claro que describa tu propuesta.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="category">Categoría</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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
                />
                Enviar como Anónimo
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="identity"
                  checked={!isAnonymous}
                  onChange={() => setIsAnonymous(false)}
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
                placeholder="Ej. Carlos Mendoza (2do de Bachillerato)"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required={!isAnonymous}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Enviar Sugerencia
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
