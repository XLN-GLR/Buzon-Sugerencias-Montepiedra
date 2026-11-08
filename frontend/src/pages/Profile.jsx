import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { 
  User, 
  Mail, 
  CreditCard, 
  GraduationCap, 
  Key, 
  Info,
  ShieldCheck,
  FileText,
  ThumbsUp
} from 'lucide-react';
import './Pages.css';

export default function Profile() {
  const { user } = useAuth();
  const [suggestionsCount, setSuggestionsCount] = useState(0);

  // Map roles to Spanish friendly tags
  const getRoleLabel = (rol) => {
    switch (rol) {
      case 'alumno': return 'Estudiante';
      case 'profesor': return 'Profesor';
      case 'administrador':
      case 'admin': return 'Administrador';
      case 'secretaria': return 'Secretaría';
      default: return rol;
    }
  };

  // Cálculo dinámico de datos históricos del usuario activo desde el backend
  useEffect(() => {
    if (!user) return;
    const fetchUserStats = async () => {
      try {
        const userId = user.usuario_id || user.cedula;
        const res = await api.getSuggestions(user.rol, userId);
        const list = res.data || [];
        const count = list.filter(s => 
          String(s.usuario_id) === String(user.usuario_id) || 
          String(s.usuario_id) === String(user.cedula)
        ).length;
        setSuggestionsCount(count);
      } catch {
        setSuggestionsCount(0);
      }
    };
    fetchUserStats();
  }, [user]);

  const votesCount = useMemo(() => {
    if (!user) return 0;
    try {
      const votesMap = JSON.parse(localStorage.getItem('montepiedra_user_votes') || '{}');
      const userVotes = votesMap[user.usuario_id || user.cedula] || {};
      return Object.keys(userVotes).length;
    } catch {
      return 0;
    }
  }, [user]);

  const userStats = { suggestionsCount, votesCount };

  if (!user) return null;

  return (
    <div className="profile-page-container">
      <div className="page-header profile-compact-header">
        <h1 className="page-title profile-compact-title">
          <User size={24} className="profile-title-icon" />
          Perfil de Usuario
        </h1>
        <p className="page-subtitle profile-compact-subtitle">
          Consulta los datos de tu cuenta institucional activa en Montepiedra.
        </p>
      </div>

      <div className="profile-card-compact">
        {/* Main layout: Hero (avatar + name) and Info Grid */}
        <div className="profile-body-row">
          {/* Hero Column */}
          <div className="profile-hero-col">
            <div className="profile-avatar-wrapper">
              <img 
                src={user.avatar || 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=avatar'} 
                alt={`Avatar de ${user.nombre}`} 
                className="profile-avatar-compact" 
              />
              <span className="profile-status-indicator" title="Sesión activa"></span>
            </div>
            <h2 className="profile-hero-name" title={user.nombre}>{user.nombre}</h2>
            <span className={`profile-badge role-${user.rol}`}>
              {getRoleLabel(user.rol)}
            </span>
          </div>

          {/* Details Column / Grid */}
          <div className="profile-grid-col">
            <div className="profile-meta-card">
              <div className="profile-meta-header">
                <CreditCard size={15} className="profile-meta-icon" />
                <span className="profile-meta-label">Cédula de Identidad</span>
              </div>
              <span className="profile-meta-val" title={user.cedula || 'N/A'}>
                {user.cedula || 'N/A'}
              </span>
            </div>

            <div className="profile-meta-card">
              <div className="profile-meta-header">
                <Mail size={15} className="profile-meta-icon" />
                <span className="profile-meta-label">Correo Institucional</span>
              </div>
              <span className="profile-meta-val" title={user.correo}>
                {user.correo}
              </span>
            </div>

            <div className="profile-meta-card">
              <div className="profile-meta-header">
                {user.rol === 'alumno' ? (
                  <GraduationCap size={15} className="profile-meta-icon" />
                ) : (
                  <ShieldCheck size={15} className="profile-meta-icon" />
                )}
                <span className="profile-meta-label">
                  {user.rol === 'alumno' ? 'Curso / Grado' : 'Departamento'}
                </span>
              </div>
              <span className="profile-meta-val" title={user.rol === 'alumno' ? (user.curso || '2do de Bachillerato') : 'Personal Institucional'}>
                {user.rol === 'alumno' ? (user.curso || '2do de Bachillerato') : 'Personal Institucional'}
              </span>
            </div>

            <div className="profile-meta-card">
              <div className="profile-meta-header">
                <Key size={15} className="profile-meta-icon" />
                <span className="profile-meta-label">ID de Sesión (UUID)</span>
              </div>
              <code className="profile-meta-uuid" title={user.usuario_id}>
                {user.usuario_id || 'ID Activo'}
              </code>
            </div>

            {/* Métricas y Datos Históricos del Usuario */}
            <div className="profile-meta-card">
              <div className="profile-meta-header">
                <FileText size={15} className="profile-meta-icon" />
                <span className="profile-meta-label">Propuestas Presentadas</span>
              </div>
              <span className="profile-meta-val" title={`${userStats.suggestionsCount} sugerencias enviadas`}>
                {userStats.suggestionsCount} registradas
              </span>
            </div>

            <div className="profile-meta-card">
              <div className="profile-meta-header">
                <ThumbsUp size={15} className="profile-meta-icon" />
                <span className="profile-meta-label">Votos Emitidos</span>
              </div>
              <span className="profile-meta-val" title={`${userStats.votesCount} votos registrados`}>
                {userStats.votesCount} aportes
              </span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="profile-compact-footer">
          <Info size={16} className="profile-footer-icon" />
          <span>
            Los datos institucionales de esta cuenta son administrados por el departamento de Secretaría y Administración de Montepiedra.
          </span>
        </div>
      </div>
    </div>
  );
}
