import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <>
      {/* Mobile Top Navbar (only visible on mobile screens) */}
      <div className={styles.mobileHeader}>
        <div className={styles.mobileBrand}>
          <img src={logoImg} alt="Logo" className={styles.mobileLogo} />
          <div>
            <div className={styles.mobileTitle}>MONTEPIEDRA</div>
            <div className={styles.mobileSubtitle}>Buzón</div>
          </div>
        </div>
        <div className={styles.mobileActions}>
          <button className={styles.hamburger} onClick={toggleSidebar} aria-label="Menú">
            {isOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Sidebar Container */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        {/* Brand Header */}
        <div className={styles.brand}>
          <img src={logoImg} alt="Logo Montepiedra" className={styles.logo} />
          <div className={styles.brandText}>
            <span className={styles.title}>MONTEPIEDRA</span>
            <span className={styles.subtitle}>Buzón de Sugerencias</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            <li>
              <NavLink 
                to="/" 
                className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}
                onClick={closeSidebar}
                end
              >
                <span className={styles.linkIcon}>📋</span> Tablero Público
              </NavLink>
            </li>

            {/* Alumno & Administrador can create suggestions */}
            {(user.rol === 'alumno' || user.rol === 'administrador') && (
              <li>
                <NavLink 
                  to="/nueva-sugerencia" 
                  className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}
                  onClick={closeSidebar}
                >
                  <span className={styles.linkIcon}>✍️</span> Enviar Sugerencia
                </NavLink>
              </li>
            )}

            {/* Profesor & Administrador can access the management dashboard */}
            {(user.rol === 'profesor' || user.rol === 'administrador') && (
              <li>
                <NavLink 
                  to="/admin" 
                  className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}
                  onClick={closeSidebar}
                >
                  <span className={styles.linkIcon}>⚙️</span> Panel de Gestión
                </NavLink>
              </li>
            )}

            {/* All authenticated users have access to Profile */}
            <li>
              <NavLink 
                to="/perfil" 
                className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}
                onClick={closeSidebar}
              >
                <span className={styles.linkIcon}>👤</span> Mi Perfil
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Sidebar Footer (Logout only, theme toggle is in top Header) */}
        <div className={styles.footer}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <span className={styles.logoutIcon}>🚪</span> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Overlay to close sidebar on mobile when clicking outside */}
      {isOpen && <div className={styles.overlay} onClick={closeSidebar} />}
    </>
  );
}
