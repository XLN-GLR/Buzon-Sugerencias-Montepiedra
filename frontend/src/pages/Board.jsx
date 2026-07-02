import React, { useState } from 'react';
import './Pages.css';

const INITIAL_SUGGESTIONS = [
  {
    id: 1,
    title: 'Áreas verdes en el patio central',
    category: 'Infraestructura',
    description: 'Sería excelente colocar más plantas ornamentales y césped en las zonas de descanso. Ayudaría a tener un ambiente más fresco y agradable durante el recreo.',
    status: 'Respondido',
    date: '2026-06-28',
    response: '¡Excelente sugerencia! El departamento administrativo ha aprobado un proyecto de jardinería para el patio central. Los trabajos comenzarán la próxima semana.',
    author: 'Juan Pérez (10mo de Básica)'
  },
  {
    id: 2,
    title: 'Actualización de libros en la Biblioteca',
    category: 'Academico',
    description: 'Solicito que se adquieran más novelas juveniles y libros actualizados de programación para la biblioteca general. Muchos compañeros están interesados en estos temas.',
    status: 'En proceso',
    date: '2026-07-01',
    response: '',
    author: 'Anónimo'
  },
  {
    id: 3,
    title: 'Talleres extracurriculares de Robótica',
    category: 'Academico',
    description: 'Me gustaría que se abran clubes o talleres de robótica y electrónica los días sábados, para fomentar las habilidades tecnológicas en los estudiantes.',
    status: 'Respondido',
    date: '2026-06-25',
    response: 'Agradecemos tu iniciativa. A partir del próximo quimestre, implementaremos el taller de robótica los días viernes por la tarde en el laboratorio de computación.',
    author: 'Anónimo'
  },
  {
    id: 4,
    title: 'Implementación de más basureros de reciclaje',
    category: 'Convivencia',
    description: 'Deberíamos colocar contenedores diferenciados para plástico, papel y orgánicos cerca del bar escolar. Esto nos ayudará a mantener limpio el colegio y cuidar el planeta.',
    status: 'Pendiente',
    date: '2026-07-02',
    response: '',
    author: 'Comité de Estudiantes'
  }
];

export default function Board() {
  const [suggestions] = useState(INITIAL_SUGGESTIONS);
  const [filter, setFilter] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSuggestions = suggestions.filter(item => {
    const matchesCategory = filter === 'Todas' || item.category.toLowerCase() === filter.toLowerCase();
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ['Todas', 'Academico', 'Infraestructura', 'Convivencia', 'Otros'];

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
      <div className="page-header">
        <h1 className="page-title">Tablero de Sugerencias</h1>
        <p className="page-subtitle">
          Sugerencias compartidas por la comunidad educativa Montepiedra y las respuestas oficiales.
        </p>
      </div>

      <div className="filter-bar">
        <div style={{ flexGrow: 1, minWidth: '250px' }}>
          <input
            type="text"
            placeholder="Buscar sugerencia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-btn ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {filteredSuggestions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1.5rem', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 0, fontSize: '1.1rem' }}>
            No se encontraron sugerencias con los criterios seleccionados.
          </p>
        </div>
      ) : (
        <div className="suggestions-grid">
          {filteredSuggestions.map((item) => (
            <div key={item.id} className={`suggestion-card ${item.status.toLowerCase().replace(' ', '-')}`}>
              <div>
                <div className="card-top">
                  <span className={`badge badge-${item.category.toLowerCase()}`}>
                    {getCategoryLabel(item.category)}
                  </span>
                  <span className={`status-badge status-${item.status.toLowerCase().replace(' ', '-')}`}>
                    {item.status}
                  </span>
                </div>
                <h3 className="card-title">{item.title}</h3>
                <p className="card-desc">{item.description}</p>
              </div>

              <div>
                {item.status === 'Respondido' && item.response && (
                  <div className="card-response">
                    <div className="response-header">
                      <span>💬</span> Respuesta Montepiedra:
                    </div>
                    <p className="response-text">"{item.response}"</p>
                  </div>
                )}

                <div className="card-footer">
                  <span>Por: <strong className="card-author">{item.author}</strong></span>
                  <span>{item.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
