# TEST PLAN: Plan de Pruebas y Criterios de Aceptación (Frontend)

## 1. Objetivos del Plan de Pruebas
Garantizar que todas las interfaces, flujos de autenticación, validaciones de identidad, interacción con propuestas y enrutamiento protegido operen sin fisuras ni regresiones visuales o lógicas.

---

## 2. Niveles de Pruebas y Estrategia

### A. Pruebas Unitarias y de Integración (Componentes y Utilidades)
- **Foco:** Validaciones puras de datos en cliente, helpers de formato de fecha, algoritmo Módulo 10 para cédulas, y renderizado aislado de componentes.
- **Herramientas recomendadas:** Vitest / Jest + React Testing Library.

### B. Pruebas de Flujo de Extremo a Extremo (E2E)
- **Foco:** Validación de flujos de usuario completos (Login -> Navegación -> Creación de sugerencia -> Votación -> Moderación).
- **Herramienta recomendada:** Playwright.

---

## 3. Matriz de Casos de Prueba por Vista

### 1. Módulo de Autenticación (`/login`)
- [ ] **TC-AUTH-01:** Validación de formato de correo institucional (debe pertenecer al dominio `@alumno.montepiedra.edu.ec` o `@montepiedra.edu.ec`).
- [ ] **TC-AUTH-02:** Validación matemática de cédula ecuatoriana mediante algoritmo Módulo 10 (rechazar cédulas inválidas o incompletas).
- [ ] **TC-AUTH-03:** Flujo de primer inicio de sesión: si el usuario no tiene contraseña previa, debe solicitar el establecimiento de una nueva contraseña.
- [ ] **TC-AUTH-04:** Redirección automática de usuarios ya autenticados que intenten acceder a `/login`.

### 2. Tablero Público (`/`)
- [ ] **TC-BOARD-01:** Renderizado de la lista de sugerencias con sus 10 atributos de contrato.
- [ ] **TC-BOARD-02:** Filtrado reactivo por categorías (`Infraestructura`, `Academico`, `Eventos`, etc.).
- [ ] **TC-BOARD-03:** Búsqueda en tiempo real por coincidencia parcial en título y descripción.
- [ ] **TC-BOARD-04:** Interacción de Votos:
  - Al pulsar "Like", incrementa el conteo de likes y actualiza el estado.
  - Al pulsar "Dislike", incrementa dislikes.
  - Alternar de like a dislike actualiza ambos contadores sin inconsistencias.
- [ ] **TC-BOARD-05:** Apertura de Modal Split:
  - Verificar que al hacer clic en una sugerencia se abra el modal con información detallada a la izquierda y comentarios a la derecha.
  - Publicación de nuevo comentario reactivo.

### 3. Formulario de Sugerencias (`/nueva-sugerencia`)
- [ ] **TC-FORM-01:** Validación de campos requeridos (Título, Categoría, Descripción).
- [ ] **TC-FORM-02:** Activación de checkbox de anonimato: la sugerencia se guarda con `es_anonimo: true` y no expone el nombre del alumno a otros estudiantes.
- [ ] **TC-FORM-03:** Detección y bloqueo preventivo ante vocabulario ofensivo o inapropiado.

### 4. Paneles por Rol Institucional
- [ ] **TC-ROLE-01:** Un usuario con rol `alumno` que intente navegar a `/admin` o `/mantenimiento` debe ser redirigido a `/` de forma segura.
- [ ] **TC-ROLE-02:** El panel `/mantenimiento` solo es accesible por roles `mantenimiento` y `administrador`.
- [ ] **TC-ROLE-03:** El panel `/secretaria` solo es accesible por `secretaria` y `administrador`.
- [ ] **TC-ROLE-04:** En el panel de moderación (`/admin`), el moderador puede aprobar, rechazar o responder oficialmente a una sugerencia.

### 5. Modo Fuera de Línea / Resiliencia Local
- [ ] **TC-OFFLINE-01:** Desconectar el servidor backend (apagar puerto 8080) y verificar que el frontend continúe funcionando con el almacenamiento en LocalStorage y los datos semilla sin arrojar pantallas blancas de error.
