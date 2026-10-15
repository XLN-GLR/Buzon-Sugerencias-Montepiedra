# MEMORY: Estado Dinámico del Proyecto (Frontend)

## 1. Resumen Ejecutivo
El frontend del **Buzón de Sugerencias Montepiedra** cuenta con una base sólida y funcional construida con React 18, Vite y Vanilla CSS/CSS Modules. Implementa un sistema de gestión de sugerencias integral con roles diferenciados para la comunidad educativa.

---

## 2. Lo que está Completado (Done)
- [x] **Configuración Base:** Proyecto Vite + React 18 con ESLint y scripts de desarrollo configurados.
- [x] **Design System e Identidad Visual:**
  - Paleta institucional aplicada (Verde Montepiedra, Gris, estados semánticos).
  - Tema Claro y Oscuro funcional mediante `ThemeContext` y selector en `Header`.
  - Tipografías Google Fonts (`Outfit` e `Inter`).
- [x] **Módulo de Autenticación (`Login.jsx`, `AuthContext.jsx`):**
  - Validación de Cédula ecuatoriana mediante algoritmo Módulo 10.
  - Validación de correo institucional (`@alumno.montepiedra.edu.ec` y `@montepiedra.edu.ec`).
  - Flujo de primer inicio de sesión con cambio obligatorio de contraseña.
  - Soporte de roles: `alumno`, `profesor`, `mantenimiento`, `secretaria`, `administrador`.
- [x] **Navegación y Layout Estructural:**
  - Componentes `Layout`, `Header` y `Sidebar` responsivos con badge de rol institucional.
  - Rutas protegidas (`ProtectedRoute`, `RoleRoute`, `GuestRoute`).
- [x] **Tablero de Sugerencias (`Board.jsx`):**
  - Lista de sugerencias con contrato de 10 columnas.
  - Filtro por categorías y buscador en tiempo real.
  - Contador y votación reactiva de Likes y Dislikes.
  - Modal Split con vista de detalle y módulo de comentarios.
- [x] **Formulario de Nueva Sugerencia (`SuggestionForm.jsx`):**
  - Selección de categoría, evidencia fotográfica y opción de anonimato.
- [x] **Vistas Especializadas por Rol:**
  - `MaintenanceBoard.jsx`: Visualización de tareas e incidencias para personal de mantenimiento.
  - `SecretariaPanel.jsx`: Gestión de nómina de usuarios con búsqueda y validación de cédulas.
  - `Dashboard.jsx`: Panel de moderación y aprobación de sugerencias para docentes y administradores.
  - `Profile.jsx`: Gestión de perfil individual, datos institucionales y cambio de clave.
- [x] **Modo Dual y Resiliencia (`api.js`):**
  - Fallback automático a LocalStorage cuando el backend no está disponible.

---

## 3. En lo que estamos Trabajando Ahora (In Progress)
- [x] **Adaptación Estructural y Documental (Guía Vibe Coding de Joel Hernández C.):**
  - Creación del ecosistema documental en `frontend/docs/` (`PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `TEST_PLAN.md`, `SECURITY.md`, `DECISIONS.md`, `MEMORY.md`).
  - Definición de reglas automáticas nativas en `.agents/rules/frontend-rules.md` y `frontend/RULES.md`.
  - Estructuración de `frontend/TASKS.md` y `frontend/.env.example`.
  - Preparación del directorio `frontend/tests/`.

---

## 4. Errores Conocidos y Consideraciones Técnicas
- **Sincronización de Contrato de 10 Columnas:** El backend cuenta con un endpoint `/sugerencias` base; los nuevos endpoints detallados en `specs/backend-requirements.md` (voto individual tipo like/dislike y comentarios `/sugerencias/:id/comentarios`) operan transparentemente en el frontend a través del fallback local en caso de que el backend aún esté en proceso de migración.

---

## 5. Próximos Pasos (Next Steps)
1. Integrar pruebas automatizadas E2E con Playwright en el directorio `frontend/tests/` según las directrices de `TEST_PLAN.md`.
2. Continuar verificando la compatibilidad de nuevos endpoints conforme el backend los implemente según `specs/backend-requirements.md`.
3. Optimizar el tiempo de carga y accesibilidad (WCAG 2.1 AA) en todas las vistas de usuario.
