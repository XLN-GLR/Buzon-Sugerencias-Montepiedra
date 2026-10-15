# DECISIONS: Architecture Decision Records (ADRs) - Frontend

Este documento registra las decisiones arquitectónicas fundamentales y permanentes del frontend del proyecto Buzón de Sugerencias Montepiedra para preservar la coherencia técnica del sistema.

---

## ADR-001: Uso de React 18 con Vite en lugar de Create React App o Next.js SSR
- **Estado:** Aceptado / En Producción
- **Contexto:** Se requería una aplicación web ágil (SPA), con despliegue sencillo como bundle estático y alta velocidad de recarga en caliente durante el desarrollo (Fast Refresh).
- **Decisión:** Utilizar React 18 impulsado por Vite 5.
- **Consecuencias Positivas:**
  - Tiempos de arranque casi instantáneos gracias a ESBuild.
  - Generación de artefactos optimizados (`dist/`) aptos para cualquier servidor estático (Vercel, Netlify, Nginx).
  - Simplicidad arquitectónica sin sobrecarga de hidratación del lado del servidor (SSR) innecesaria para una intranet institucional.

---

## ADR-002: Sistema de Estilos con Vanilla CSS, Variables Nativas y CSS Modules
- **Estado:** Aceptado / En Producción
- **Contexto:** Se evaluó si incorporar Tailwind CSS, Bootstrap o soluciones CSS-in-JS.
- **Decisión:** Emplear Vanilla CSS estructurado mediante:
  1. `src/index.css` para el Design System global (paleta de colores institucionales, tipografías, tokens de espaciado, soporte para modo oscuro mediante selector de atributos).
  2. Archivos `*.module.css` para el encapsulamiento de estilos en componentes estructurales (`Layout`, `Header`, `Sidebar`).
- **Consecuencias Positivas:**
  - Cero dependencias adicionales en el árbol de paquetes de NPM.
  - Máxima fidelidad a la identidad gráfica institucional de Montepiedra.
  - Ausencia de problemas de colisión de clases CSS gracias al scope local de CSS Modules.

---

## ADR-003: Capa de Resiliencia y Modo Dual (API REST + Simulador LocalStorage)
- **Estado:** Aceptado / En Producción
- **Contexto:** En entornos educativos o de desarrollo local, los desarrolladores y evaluadores a menudo no cuentan con las credenciales de base de datos activas o el servidor backend levantado.
- **Decisión:** Implementar en `src/utils/api.js` un cliente inteligente que verifique la conectividad con el backend (`http://127.0.0.1:8080`) y, en caso de inactividad, realice un fallback transparente a `localStorage` precargado con datos semilla (`SEED_SUGGESTIONS`, `SEED_COMMENTS`, `SEED_NOMINA`).
- **Consecuencias Positivas:**
  - El frontend puede ser ejecutado, testeado y demostrado de forma 100% autónoma en modo simulador (opción 1 del script `iniciar_proyecto.bat`).
  - Cuando el backend se encuentra disponible, opera como cliente REST completo sin requerir cambios de código.

---

## ADR-004: Control de Acceso Basado en Roles (RBAC) en Capa de Enrutamiento
- **Estado:** Aceptado / En Producción
- **Contexto:** La institución maneja perfiles con responsabilidades claramente delimitadas (`alumno`, `profesor`, `mantenimiento`, `secretaria`, `administrador`).
- **Decisión:** Declarar componentes contenedores de ruta (`RoleRoute` y `ProtectedRoute`) en `src/App.jsx` que evalúan la sesión del usuario antes de instanciar la página destino.
- **Consecuencias Positivas:**
  - Evita renderizados inconsistentes o fuga visual de interfaces restringidas.
  - Mantiene la lógica de autorización centralizada en la configuración de rutas.

---

## ADR-005: Modal Flotante de Tipo Split para Detalle y Comentarios
- **Estado:** Aceptado / En Producción
- **Contexto:** Las sugerencias requerían mostrar información enriquecida (imágenes, estados, respuesta del moderador) y al mismo tiempo permitir un flujo continuo de comentarios comunitarios sin perder el contexto visual.
- **Decisión:** Diseñar un modal interactivo dividido en dos paneles: panel izquierdo con la ficha técnica de la propuesta y panel derecho con la lista interactiva de comentarios y formulario de envío.
- **Consecuencias Positivas:**
  - Experiencia de usuario (UX) fluida y compacta sin saltos de página.
