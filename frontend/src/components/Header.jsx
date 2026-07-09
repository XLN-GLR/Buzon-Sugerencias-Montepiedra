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
      case 'administrador': return 'Admin';
      default: return rol;
    }
  };

  const handleProfileClick = () => {
    navigate('/perfil');
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        {/* Left Side spacer if needed, or title placeholder */}
        <div className={styles.pageTitlePlaceholder}>
          {/* Can be empty since sidebar has the brand */}
        </div>

        {/* Right Side: Dark Mode & User Profile details */}
        <div className={styles.userSection}>
          {/* Aesthetic Dark Mode Toggle */}
          <button 
            className={styles.themeToggle} 
            onClick={toggleTheme}
            aria-label="Alternar modo oscuro"
            title={theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
          >
            <span className={styles.toggleIcon}>{theme === 'light' ? '🌙' : '☀️'}</span>
          </button>

          {/* User Details and Avatar */}
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
