import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import styles from './Layout.module.css';

export default function Layout() {
  return (
    <div className={styles.layout}>
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Layout Area */}
      <div className={styles.mainWrapper}>
        {/* Top Right Header Widget */}
        <Header />

        <main className={styles.main}>
          <Outlet />
        </main>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerContainer}>
            <div className={styles.footerLogoSection}>
              <span className={styles.footerBrand}>Unidad Educativa Montepiedra</span>
              <span className={styles.bullet}>•</span>
              <span>Formando líderes con valores</span>
            </div>
            <div className={styles.footerCopyright}>
              &copy; {new Date().getFullYear()} Buzón de Sugerencias.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
