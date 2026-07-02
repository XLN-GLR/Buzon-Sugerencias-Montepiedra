import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import styles from './Layout.module.css';
import logoImg from '../assets/logo.png';

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={styles.layout}>
      {/* Header Section */}
      <header className={styles.header}>
        <div className={`${styles.headerContainer} container`}>
          {/* Logo & Branding */}
          <NavLink to="/" className={styles.brand} onClick={closeMobileMenu}>
            <img src={logoImg} alt="Logo Montepiedra" className={styles.logo} />
            <div className={styles.brandText}>
              <span className={styles.title}>MONTEPIEDRA</span>
              <span className={styles.subtitle}>Buzón de Sugerencias</span>
            </div>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className={styles.nav}>
            <ul className={styles.navList}>
              <li>
                <NavLink 
                  to="/" 
                  className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}
                >
                  Tablero
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/nueva-sugerencia" 
                  className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}
                >
                  Enviar Sugerencia
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/admin" 
                  className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}
                >
                  Administración
                </NavLink>
              </li>
            </ul>
          </nav>

          {/* Mobile Hamburguer Toggle */}
          <button className={styles.menuBtn} onClick={toggleMobileMenu} aria-label="Menú">
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <ul className={styles.mobileNav}>
            <li className={styles.mobileNavItem}>
              <NavLink 
                to="/" 
                className={({ isActive }) => isActive ? `${styles.mobileLink} ${styles.mobileActiveLink}` : styles.mobileLink}
                onClick={closeMobileMenu}
              >
                Tablero público
              </NavLink>
            </li>
            <li className={styles.mobileNavItem}>
              <NavLink 
                to="/nueva-sugerencia" 
                className={({ isActive }) => isActive ? `${styles.mobileLink} ${styles.mobileActiveLink}` : styles.mobileLink}
                onClick={closeMobileMenu}
              >
                Nueva Sugerencia
              </NavLink>
            </li>
            <li className={styles.mobileNavItem}>
              <NavLink 
                to="/admin" 
                className={({ isActive }) => isActive ? `${styles.mobileLink} ${styles.mobileActiveLink}` : styles.mobileLink}
                onClick={closeMobileMenu}
              >
                Panel Administrativo
              </NavLink>
            </li>
          </ul>
        )}
      </header>

      {/* Main Content Area */}
      <main className={styles.main}>
        <Outlet />
      </main>

      {/* Footer Section */}
      <footer className={styles.footer}>
        <div className={`${styles.footerContainer} container`}>
          <div className={styles.footerLogoSection}>
            <img src={logoImg} alt="U.E. Montepiedra" className={styles.footerLogo} />
            <div>
              <div className={styles.footerText}>Unidad Educativa Montepiedra</div>
              <div style={{ fontSize: '0.75rem' }}>Formando líderes con valores</div>
            </div>
          </div>
          <div style={{ marginTop: '0.5rem', mdMarginTop: 0 }}>
            &copy; {new Date().getFullYear()} Buzón de Sugerencias Montepiedra. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
