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
      case 'administrador':
      case 'admin': return 'Administrador';
      case 'mantenimiento': return 'Mantenimiento';
      case 'secretaria': return 'Secretaría';
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
    <div className="container profile-page-container">
      <div className="page-header" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h1 className="page-title">👤 Perfil de Usuario</h1>
        <p className="page-subtitle">
          Consulta los datos de tu cuenta institucional y gestiona la información de la comunidad.
        </p>
      </div>

      {successMsg && (
        <div className="alert-banner alert-success" style={{ maxWidth: '550px', margin: '0 auto 1.5rem auto' }}>
          <span>✅</span>
          <span>{successMsg}</span>
        </div>
      )}

      <div className="profile-layout-centered">
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
              <span className="detail-label">Cédula de Identidad</span>
              <span className="detail-val"><strong>{user.cedula || 'N/A'}</strong></span>
            </div>
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

          <div className="profile-card-footer-info">
            <span>ℹ️ Los datos institucionales de esta cuenta son administrados por el departamento de Secretaría y Administración de Montepiedra.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

