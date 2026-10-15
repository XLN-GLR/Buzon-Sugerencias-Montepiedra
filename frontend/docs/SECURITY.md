# SECURITY: Políticas de Seguridad en el Frontend

## 1. Principios Fundamentales
El frontend del Buzón de Sugerencias Montepiedra implementa una estrategia de defensa en profundidad orientada al cliente web, asegurando la privacidad del estudiante, la integridad de los datos y el cumplimiento de las normativas institucionales.

---

## 2. Checklist de Seguridad en el Cliente

### A. Validación y Saneamiento de Entradas (Input Sanitation)
- [x] **Prevención de XSS (Cross-Site Scripting):**
  - Utilizar el motor de renderizado de React (`{variable}`) para escapar automáticamente cadenas HTML maliciosas.
  - Prohibir estrictamente el uso de `dangerouslySetInnerHTML` salvo en sanitizadores de confianza previamente auditados.
- [x] **Validación Matemática de Cédulas:**
  - Verificación rigurosa de 10 dígitos con validación de provincia y algoritmo de dígito verificador Módulo 10 antes de emitir cualquier petición.
- [x] **Filtro Preventivo de Lenguaje Inapropiado:**
  - Advertencias en el cliente sobre palabras vetadas en título y descripción para prevenir faltas al reglamento disciplinario institucional.

### B. Rutas Protegidas y Control de Acceso (RBAC)
- [x] **Guardas de Enrutamiento (`src/App.jsx`):**
  - `ProtectedRoute`: Redirige al `/login` a cualquier usuario no autenticado.
  - `RoleRoute`: Evalúa la propiedad `user.rol` contra una lista blanca de roles autorizados (`alumno`, `profesor`, `mantenimiento`, `secretaria`, `administrador`). Redirige inmediatamente a `/` si no cuenta con privilegios.
  - `GuestRoute`: Impide que usuarios ya autenticados vuelvan a la pantalla de login.

### C. Anonimato y Privacidad del Usuario
- [x] **Manejo de Sugerencias Anónimas:**
  - Si una propuesta tiene la bandera `es_anonimo: true`, los componentes del cliente nunca deben renderizar el nombre, correo o foto del alumno ante otros estudiantes o público general.
  - En la vista de administración o secretaría, el rol autorizado puede auditar la procedencia únicamente cuando las políticas institucionales lo demanden.

### D. Gestión de Variables de Entorno y Secretos
- [x] **Cero Exposición de Secretos en el Bundle:**
  - Las variables expuestas al navegador deben llevar exclusivamente el prefijo `VITE_` (e.g. `VITE_API_URL`).
  - **NUNCA** incluir claves maestras de base de datos (`SUPABASE_SERVICE_ROLE_KEY`), contraseñas de backend ni firmas JWT privadas en el código frontend.
  - Todas las variables requeridas deben estar documentadas en `.env.example`.

### E. Manejo de Sesión y Almacenamiento Local
- [x] **Almacenamiento Seguro:**
  - Los datos de usuario en `localStorage` corresponden a la sesión activa y son eliminados inmediatamente al invocar `logout()`.
  - La expiración o cierre de sesión invalida de inmediato el estado en `AuthContext`.
