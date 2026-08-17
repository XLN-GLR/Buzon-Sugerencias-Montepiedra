import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import './Pages.css';

export default function MaintenanceBoard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterState, setFilterState] = useState('Todas'); // 'Todas', 'Aprobada', 'En Proceso', 'Realizada'
  const [updatingId, setUpdatingId] = useState(null);
  const [alertMessage, setAlertMessage] = useState({ type: '', text: '' });

  // Modal para agregar nueva tarea rápida de infraestructura
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');

  const loadMaintenanceTasks = async () => {
    setLoading(true);
    try {
      const result = await api.getSuggestions(user ? user.rol : 'mantenimiento');
      // Filtrar estrictamente solo sugerencias de categoría 'Infraestructura'
      const infraTasks = (result.data || []).filter(item => 
        (item.categoria || '').toLowerCase() === 'infraestructura'
      );
      setTasks(infraTasks);
    } catch (err) {
      showAlert('error', 'Error al cargar las tareas del equipo de mantenimiento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaintenanceTasks();
  }, [user]);

  const showAlert = (type, text) => {
    setAlertMessage({ type, text });
    setTimeout(() => {
      setAlertMessage({ type: '', text: '' });
    }, 5000);
  };

  // Cambiar estado de la tarea (En Proceso, Realizada, Aprobada)
  const handleUpdateStatus = async (taskId, newStatus) => {
    setUpdatingId(taskId);
    try {
      const task = tasks.find(t => t.id === taskId);
      const updatedResponse = task.respuesta_moderador || `Estado actualizado por el departamento de Mantenimiento (${user.nombre}).`;
      
      await api.updateSuggestionModeration(taskId, newStatus, updatedResponse, user.rol);
      
      setTasks(prev => 
        prev.map(t => t.id === taskId ? { ...t, estado: newStatus, respuesta_moderador: updatedResponse } : t)
      );

      showAlert('success', `Tarea marcada como "${newStatus}" exitosamente.`);
    } catch (err) {
      showAlert('error', 'No se pudo actualizar el estado de la tarea.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Eliminar tarea del tablón
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('¿Está seguro de remover esta tarea del tablón de mantenimiento?')) {
      return;
    }

    try {
      await api.deleteSuggestion(taskId, user.rol);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      showAlert('success', 'Tarea eliminada del tablón.');
    } catch (err) {
      showAlert('error', 'Error al eliminar la tarea.');
    }
  };

  // Crear nueva tarea directa de mantenimiento
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskDesc) return;

    try {
      const result = await api.createSuggestion({
        titulo: newTaskTitle,
        descripcion: newTaskDesc,
        categoria: 'Infraestructura',
        usuario_id: user.usuario_id || user.cedula,
        es_anonimo: false,
        foto_url: null,
        userRole: user.rol,
        authorProfile: {
          id: user.usuario_id,
          nombre: user.nombre,
          correo: user.correo,
          foto_url: user.avatar
        }
      });

      // Forzar estado Aprobada/En Proceso para tarea de mantenimiento
      const created = {
        ...result.data,
        estado: 'En Proceso',
        respuesta_moderador: `Registrado directamente por Mantenimiento: ${user.nombre}`
      };

      setTasks(prev => [created, ...prev]);
      setIsNewTaskModalOpen(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      showAlert('success', 'Nueva tarea de infraestructura añadida al tablón.');
    } catch (err) {
      showAlert('error', 'Error al crear la tarea de mantenimiento.');
    }
  };

  // Filtro
  const filteredTasks = tasks.filter(task => {
    if (filterState === 'Todas') return true;
    return (task.estado || '').toLowerCase().replace(' ', '-') === filterState.toLowerCase().replace(' ', '-');
  });

  // Métricas
  const totalCount = tasks.length;
  const inProgressCount = tasks.filter(t => (t.estado || '').toLowerCase() === 'en proceso').length;
  const completedCount = tasks.filter(t => (t.estado || '').toLowerCase() === 'realizada').length;
  const pendingCount = totalCount - inProgressCount - completedCount;

  return (
    <div className="container">
      {/* Cabecera */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">🔨 Tablón de Tareas de Mantenimiento</h1>
            <p className="page-subtitle">
              Gestión operativa y seguimiento de requerimientos de infraestructura y reparaciones escolares.
            </p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setIsNewTaskModalOpen(true)}
          >
            ➕ Añadir Tarea de Infraestructura
          </button>
        </div>
      </div>

      {alertMessage.text && (
        <div className={`alert-banner alert-${alertMessage.type === 'error' ? 'error' : 'success'} animate-fadeIn`}>
          <span>{alertMessage.type === 'error' ? '❌' : '✅'}</span>
          <span>{alertMessage.text}</span>
        </div>
      )}

      {/* Tarjetas de Métricas Resumen */}
      <div className="metrics-summary-grid">
        <div className="metric-card">
          <div className="metric-icon">📋</div>
          <div className="metric-info">
            <span className="metric-value">{totalCount}</span>
            <span className="metric-label">Total Infraestructura</span>
          </div>
        </div>

        <div className="metric-card metric-warning">
          <div className="metric-icon">🔨</div>
          <div className="metric-info">
            <span className="metric-value">{inProgressCount}</span>
            <span className="metric-label">En Proceso</span>
          </div>
        </div>

        <div className="metric-card metric-success">
          <div className="metric-icon">✅</div>
          <div className="metric-info">
            <span className="metric-value">{completedCount}</span>
            <span className="metric-label">Realizadas</span>
          </div>
        </div>

        <div className="metric-card metric-info-box">
          <div className="metric-icon">⏳</div>
          <div className="metric-info">
            <span className="metric-value">{pendingCount}</span>
            <span className="metric-label">Por Iniciar</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtro de Estados */}
      <div className="toolbar-container" style={{ marginTop: '1.5rem' }}>
        <div className="filter-tabs-group">
          {['Todas', 'Aprobada', 'En Proceso', 'Realizada'].map(st => (
            <button
              key={st}
              className={`filter-tab-btn ${filterState === st ? 'active' : ''}`}
              onClick={() => setFilterState(st)}
            >
              {st === 'Todas' ? 'Todas las Tareas' : st}
            </button>
          ))}
        </div>
        <button onClick={loadMaintenanceTasks} className="btn-refresh">
          🔄 Refrescar
        </button>
      </div>

      {/* Listado de Tareas */}
      {loading ? (
        <div className="loading-spinner-container">
          <div className="spinner"></div>
          <p>Cargando tareas de infraestructura...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state">
          <p>No hay tareas de infraestructura bajo el filtro "{filterState}".</p>
        </div>
      ) : (
        <div className="maintenance-task-grid">
          {filteredTasks.map((task) => {
            const statusNorm = (task.estado || 'pendiente').toLowerCase().replace(' ', '-');
            const displayDate = task.created_at ? task.created_at.split('T')[0] : '2026-07-08';

            return (
              <div key={task.id} className={`maintenance-task-card ${statusNorm}`}>
                <div className="task-header-row">
                  <span className="badge badge-infraestructura">🏗️ Infraestructura</span>
                  <span className={`status-badge status-${statusNorm}`}>
                    {task.estado || 'Pendiente'}
                  </span>
                </div>

                <h3 className="task-title">{task.titulo}</h3>
                <p className="task-desc">{task.descripcion}</p>

                {task.respuesta_moderador && (
                  <div className="task-response-note">
                    <strong>Nota / Estado:</strong> "{task.respuesta_moderador}"
                  </div>
                )}

                <div className="task-meta-row">
                  <span>📅 Reportado: {displayDate}</span>
                  <span>👤 Por: {task.usuarios?.nombre || 'Comunidad'}</span>
                </div>

                {/* Acciones para cambiar estado */}
                <div className="task-action-controls">
                  <div className="action-buttons-wrap">
                    <button
                      className="btn-status-toggle btn-process"
                      onClick={() => handleUpdateStatus(task.id, 'En Proceso')}
                      disabled={updatingId === task.id || (task.estado || '').toLowerCase() === 'en proceso'}
                      title="Marcar tarea en ejecución activa"
                    >
                      🔨 En Proceso
                    </button>
                    <button
                      className="btn-status-toggle btn-done"
                      onClick={() => handleUpdateStatus(task.id, 'Realizada')}
                      disabled={updatingId === task.id || (task.estado || '').toLowerCase() === 'realizada'}
                      title="Marcar tarea finalizada y reparada"
                    >
                      ✅ Realizada
                    </button>
                    <button
                      className="btn-status-toggle btn-approve"
                      onClick={() => handleUpdateStatus(task.id, 'Aprobada')}
                      disabled={updatingId === task.id || (task.estado || '').toLowerCase() === 'aprobada'}
                      title="Regresar a estado aprobada"
                    >
                      📋 Aprobada
                    </button>
                  </div>

                  <button
                    className="btn-delete-task"
                    onClick={() => handleDeleteTask(task.id)}
                    title="Eliminar tarea del tablón"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Crear Nueva Tarea de Infraestructura */}
      {isNewTaskModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content animate-fadeIn">
            <div className="modal-header">
              <h2>➕ Nueva Tarea de Mantenimiento</h2>
              <button className="modal-close" onClick={() => setIsNewTaskModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label className="form-label" htmlFor="task-title">Título de la Reparación / Requerimiento</label>
                <input
                  id="task-title"
                  type="text"
                  placeholder="Ej. Cambio de cerradura en laboratorio de química"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="task-desc">Detalles del Trabajo a Realizar</label>
                <textarea
                  id="task-desc"
                  rows="4"
                  placeholder="Especifica el bloque, aula o área física y los materiales necesarios..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsNewTaskModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
