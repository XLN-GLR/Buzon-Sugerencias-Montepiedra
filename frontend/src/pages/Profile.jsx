import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Pages.css';

const PRESET_AVATARS = [
  { name: 'Aventurero Carlos', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Carlos' },
  { name: 'Divertido Juan', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Juan' },
  { name: 'Estudiante Pedro', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Pedro' },
  { name: 'Creativa María', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Maria' },
  { name: 'Sonriente Sofía', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Sofia' },
  { name: 'Deportista Luis', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Luis' }
];

export default function Profile() {
  const { user, profiles, updateStudentAvatar } = useAuth();
  const [selectedStudentEmail, setSelectedStudentEmail] = useState('');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Get only student profiles for the dropdown list
  const students = profiles.filter(p => p.rol === 'alumno');

  // Map roles to Spanish friendly tags
  const getRoleLabel = (rol) => {
    switch (rol) {
      case 'alumno': return 'Estudiante';
      case 'profesor': return 'Profesor';
      case 'administrador': return 'Administrador';
      default: return rol;
    }
  };

  const handleStudentSelect = (e) => {
    const email = e.target.value;
    setSelectedStudentEmail(email);
    const student = students.find(s => s.correo === email);
    setNewAvatarUrl(student ? student.avatar : '');
  };

  const handleSaveAvatar = (e) => {
    e.preventDefault();
    if (!selectedStudentEmail || !newAvatarUrl) return;

    const student = students.find(s => s.correo === selectedStudentEmail);
    if (student) {
      updateStudentAvatar(selectedStudentEmail, newAvatarUrl);
      setSuccessMsg(`La foto de perfil de ${student.nombre} se ha actualizado correctamente.`);
      
      // Auto-hide alert
      setTimeout(() => {
        setSuccessMsg('');
      }, 5000);
    }
  };

  const applyPreset = (url) => {
    setNewAvatarUrl(url);
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Perfil de Usuario</h1>
        <p className="page-subtitle">
          Consulta los datos de tu cuenta institucional y gestiona la información de la comunidad.
        </p>
      </div>

      {successMsg && (
        <div className="alert-banner alert-success" style={{ maxWidth: '800px', margin: '0 auto 1.5rem auto' }}>
          <span>✅</span>
          <span>{successMsg}</span>
        </div>
      )}

      <div className="profile-layout-grid">
        {/* User Profile Card (Visible to all) */}
        <div className="profile-card">
          <div className="profile-card-header">
            <img 
              src={user.avatar || 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=avatar'} 
              alt={`Avatar de ${user.nombre}`} 
              className="profile-big-avatar" 
            />
            <h2 className="profile-name">{user.nombre}</h2>
            <span className={`profile-badge role-${user.rol}`}>
              {getRoleLabel(user.rol)}
            </span>
          </div>

          <div className="profile-details-list">
            <div className="profile-detail-item">
              <span className="detail-label">Correo Institucional</span>
              <span className="detail-val">{user.correo}</span>
            </div>
            {user.rol === 'alumno' && (
              <div className="profile-detail-item">
                <span className="detail-label">Curso / Grado</span>
                <span className="detail-val">{user.curso || '2do de Bachillerato'}</span>
              </div>
            )}
            <div className="profile-detail-item">
              <span className="detail-label">ID de Sesión (UUID)</span>
              <code className="detail-uuid">{user.usuario_id}</code>
            </div>
          </div>

          {user.rol !== 'administrador' && (
            <div className="profile-card-footer-info">
              <span>🔒 Esta cuenta es de <strong>solo lectura</strong>. Los datos son administrados por el departamento de TI.</span>
            </div>
          )}
        </div>

        {/* Administrator Exclusive Panel: Update Student Avatars */}
        {user.rol === 'administrador' && (
          <div className="profile-card admin-avatar-manager">
            <h2 className="profile-card-title">🛡️ Gestión de Fotos de Estudiantes</h2>
            <p className="profile-card-subtitle">
              Sube o actualiza las fotos de perfil de los estudiantes para facilitar su identificación institucional.
            </p>

            <form onSubmit={handleSaveAvatar}>
              <div className="form-group">
                <label className="form-label" htmlFor="student-select">Seleccionar Estudiante</label>
                <select
                  id="student-select"
                  value={selectedStudentEmail}
                  onChange={handleStudentSelect}
                  required
                >
                  <option value="">-- Elige un estudiante --</option>
                  {students.map(s => (
                    <option key={s.usuario_id} value={s.correo}>
                      {s.nombre} ({s.correo})
                    </option>
                  ))}
                </select>
              </div>

              {selectedStudentEmail && (
                <div className="animate-fadeIn">
                  {/* Preview avatar */}
                  <div className="avatar-preview-container">
                    <span className="form-label">Vista Previa</span>
                    <img 
                      src={newAvatarUrl || 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=placeholder'} 
                      alt="Vista previa de avatar" 
                      className="avatar-preview-img" 
                      onError={(e) => {
                        e.target.src = 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=error';
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="avatar-url">URL de la Foto / Avatar</label>
                    <input
                      type="url"
                      id="avatar-url"
                      placeholder="https://ejemplo.com/foto.jpg o URL de Dicebear"
                      value={newAvatarUrl}
                      onChange={(e) => setNewAvatarUrl(e.target.value)}
                      required
                    />
                  </div>

                  {/* Preset avatar options for ease of testing */}
                  <div className="form-group">
                    <label className="form-label">Presets Rápidos (Ilustraciones de Prueba)</label>
                    <div className="preset-grid">
                      {PRESET_AVATARS.map(p => (
                        <button
                          key={p.name}
                          type="button"
                          className="preset-btn"
                          onClick={() => applyPreset(p.url)}
                          title={p.name}
                        >
                          <img src={p.url} alt={p.name} className="preset-img-thumb" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                    💾 Actualizar Foto del Estudiante
                  </button>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
