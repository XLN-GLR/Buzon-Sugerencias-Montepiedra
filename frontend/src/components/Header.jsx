import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import styles from './Header.module.css';

export default function Header() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  if (!user) return null;

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

  const handleProfileClick = () => {
    navigate('/perfil');
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        {/* Left Side placeholder */}
        <div className={styles.pageTitlePlaceholder}>
          {/* Vacío ya que la barra lateral contiene el título */}
        </div>

        {/* Right Side: Dark Mode & User Profile details */}
        <div className={styles.userSection}>
          {/* Botón de Modo Oscuro */}
          <button 
            className={styles.themeToggle} 
            onClick={toggleTheme}
            aria-label="Alternar modo oscuro"
            title={theme === 'light' ? 'Activar Modo Oscuro' : 'Activar Modo Claro'}
          >
            <span className={styles.toggleIcon}>{theme === 'light' ? '🌙' : '☀️'}</span>
          </button>

          {/* Widget de Usuario y Avatar */}
          <div className={styles.profileWidget} onClick={handleProfileClick} title="Ver mi perfil">
            <div className={styles.profileText}>
              <span className={styles.userName}>{user.nombre}</span>
              <span className={`${styles.roleTag} ${styles[`role-${user.rol}`]}`}>
                {getRoleLabel(user.rol)}
              </span>
            </div>
            <img 
              src={user.avatar || 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=avatar'} 
              alt={`Avatar de ${user.nombre}`} 
              className={styles.avatar} 
            />
          </div>
        </div>
      </div>
    </header>
  );
}
