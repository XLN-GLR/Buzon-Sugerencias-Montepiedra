# TASKS: Plan de Trabajo Granular por Fases (Frontend)

Este documento detalla el plan secuencial de trabajo para el desarrollo, mantenimiento y evolución del frontend del Buzón de Sugerencias Montepiedra.

---

## Fase 1: Configuración, Arquitectura y Documentación Base
- [x] **TASK-001:** Inicialización del proyecto con React 18 y Vite 5.
- [x] **TASK-002:** Configuración de ESLint y estructura de carpetas modular (`pages`, `components`, `context`, `utils`).
- [x] **TASK-003:** Creación del Design System institucional en `src/index.css` con variables CSS y tema oscuro.
- [x] **TASK-004:** Implementación de la documentación de contexto según la Guía Vibe Coding (`docs/PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `TEST_PLAN.md`, `SECURITY.md`, `DECISIONS.md`, `MEMORY.md`, `RULES.md`, `.cursor/rules/`).

---

## Fase 2: Autenticación, Identidad y Control de Acceso (RBAC)
- [x] **TASK-005:** Implementación de `AuthContext.jsx` con persistencia de sesión local y roles institucionales.
- [x] **TASK-006:** Implementación de la vista `Login.jsx` con validación de correos institucionales y cédula ecuatoriana (Algoritmo Módulo 10).
- [x] **TASK-007:** Flujo de primer inicio de sesión para el establecimiento de contraseña obligatoria.
- [x] **TASK-008:** Configuración de guards de enrutamiento (`ProtectedRoute`, `RoleRoute`, `GuestRoute`) en `src/App.jsx`.

---

## Fase 3: Tablero Público, Sugerencias y Participación Estudiantil
- [x] **TASK-009:** Creación del componente `Layout` con `Header` y `Sidebar` responsivos y conmutador de tema claro/oscuro.
- [x] **TASK-010:** Implementación del Tablero de Sugerencias (`Board.jsx`) con filtros por categoría y búsqueda en tiempo real.
- [x] **TASK-011:** Formulario de Creación de Sugerencias (`SuggestionForm.jsx`) con opción de anonimato y carga de evidencia fotográfica.
- [x] **TASK-012:** Sistema de votación interactiva (Likes y Dislikes) con sincronización reactiva de estado.
- [x] **TASK-013:** Modal flotante Split View para detalle ampliado de sugerencia y visualización/envío de comentarios.

---

## Fase 4: Módulos Especializados por Rol Institucional
- [x] **TASK-014:** Tablón de Mantenimiento (`MaintenanceBoard.jsx`) para gestión de incidencias físicas por estado.
- [x] **TASK-015:** Panel de Secretaría (`SecretariaPanel.jsx`) para visualización y filtrado de la nómina de usuarios institucionales.
- [x] **TASK-016:** Panel de Moderación Docente / Administrativo (`Dashboard.jsx`) para emitir respuestas oficiales y dictaminar estados.
- [x] **TASK-017:** Vista de Perfil (`Profile.jsx`) con historial personal y cambio de contraseña.

---

## Fase 5: Capa de Resiliencia y Modo Dual
- [x] **TASK-018:** Implementación de cliente HTTP en `src/utils/api.js` con fallback transparente a LocalStorage en ausencia de backend.
- [x] **TASK-019:** Creación del iniciador por lotes `iniciar_proyecto.bat` con opción de ejecución Frontend Offline / Simulador.

---

## Fase 6: Pruebas Automatizadas y Calidad Continua (Siguientes Pasos)
- [ ] **TASK-020:** Configurar suite de pruebas unitarias y de componentes en `tests/` con Vitest.
- [ ] **TASK-021:** Implementar pruebas E2E con Playwright para el flujo completo: Login -> Creación de sugerencia -> Votación -> Moderación.
- [ ] **TASK-022:** Auditoría de accesibilidad WCAG 2.1 AA y optimización de rendimiento (Lighthouse score > 90).
