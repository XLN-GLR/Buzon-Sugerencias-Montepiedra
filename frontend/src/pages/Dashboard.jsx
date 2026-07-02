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

export default function Dashboard() {
  const [suggestions, setSuggestions] = useState(INITIAL_SUGGESTIONS);
  const [selectedItem, setSelectedItem] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [newStatus, setNewStatus] = useState('Respondido');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Statistics calculation
  const total = suggestions.length;
  const pending = suggestions.filter(item => item.status === 'Pendiente' || item.status === 'En proceso').length;
  const responded = suggestions.filter(item => item.status === 'Respondido').length;

  const handleDelete = (id) => {
    if (window.confirm('¿Está seguro de eliminar esta sugerencia?')) {
      setSuggestions(suggestions.filter(item => item.id !== id));
    }
  };

  const handleOpenResponseModal = (item) => {
    setSelectedItem(item);
    setResponseText(item.response || '');
    setNewStatus(item.status || 'Respondido');
    setIsModalOpen(true);
  };

  const handleSaveResponse = (e) => {
    e.preventDefault();
    setSuggestions(suggestions.map(item => {
      if (item.id === selectedItem.id) {
        return {
          ...item,
          status: newStatus,
          response: responseText
        };
      }
      return item;
    }));
    setIsModalOpen(false);
    setSelectedItem(null);
  };

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
        <h1 className="page-title">Panel de Administración</h1>
        <p className="page-subtitle">
          Administración institucional del buzón. Revisa, responde y gestiona las sugerencias recibidas.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon icon-blue">📂</div>
          <div className="stat-info">
            <span className="stat-val">{total}</span>
            <span className="stat-label">Sugerencias Recibidas</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon icon-amber">⏳</div>
          <div className="stat-info">
            <span className="stat-val">{pending}</span>
            <span className="stat-label">Pendientes / Proceso</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon icon-green">✅</div>
          <div className="stat-info">
            <span className="stat-val">{responded}</span>
            <span className="stat-label">Respondidas</span>
          </div>
        </div>
      </div>

      {/* Admin Table */}
      <div className="admin-card">
        <div className="admin-header">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Bandeja de Sugerencias</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Muestra propuestas activas</span>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Sugerencia</th>
                <th>Categoría</th>
                <th>Remitente</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    No hay sugerencias registradas.
                  </td>
                </tr>
              ) : (
                suggestions.map((item) => (
                  <tr key={item.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{item.date}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.25rem' }}>{item.title}</div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.825rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {item.description}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${item.category.toLowerCase()}`}>
                        {getCategoryLabel(item.category)}
                      </span>
                    </td>
                    <td>{item.author}</td>
                    <td>
                      <span className={`status-badge status-${item.status.toLowerCase().replace(' ', '-')}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className="action-btn btn-action-view"
                          onClick={() => handleOpenResponseModal(item)}
                        >
                          Responder
                        </button>
                        <button
                          className="action-btn btn-action-delete"
                          onClick={() => handleDelete(item.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Response Modal */}
      {isModalOpen && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            <h2 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', color: 'var(--color-primary)' }}>
              Responder Sugerencia
            </h2>
            
            <div style={{ marginBottom: '1.25rem', backgroundColor: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>{selectedItem.title}</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {selectedItem.description}
              </p>
            </div>

            <form onSubmit={handleSaveResponse}>
              <div className="form-group">
                <label className="form-label" htmlFor="modal-status">Cambiar Estado</label>
                <select
                  id="modal-status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En proceso">En proceso</option>
                  <option value="Respondido">Respondido</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="modal-response">Texto de Respuesta</label>
                <textarea
                  id="modal-response"
                  rows="4"
                  placeholder="Redacta la respuesta institucional..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  required={newStatus === 'Respondido'}
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
