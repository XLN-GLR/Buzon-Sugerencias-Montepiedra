# PRD: Buzón de Sugerencias Montepiedra (Backend API)

## 1. Visión General del Producto
El backend del **Buzón de Sugerencias Montepiedra** es una API RESTful desarrollada sobre Node.js y Express.js, integrada con Supabase (PostgreSQL), concebida para servir como la capa central de persistencia, lógica de negocio, autenticación institucional y moderación del sistema de sugerencias de la Unidad Educativa Montepiedra.

Provee servicios desacoplados para la comunidad estudiantil, docente, administrativa y de mantenimiento, garantizando integridad referencial, anonimización selectiva de datos y validaciones normativas locales (cédula ecuatoriana vía Módulo 10).

---

## 2. Definición de Usuarios y Roles en Backend
El sistema implementa un modelo de autorización basado en roles (RBAC) gestionado a nivel de controlador mediante el encabezado HTTP `x-user-role`:

1. **Alumno (`alumno`):**
   - Creación de sugerencias institucionales con opción de anonimato (`es_anonimo: true`).
   - Consulta de sugerencias públicas (con datos de usuario anonimizados si corresponde).
   - Votación ponderada (`like` / `dislike`) con restricción de un voto por sugerencia.
   - Publicación y lectura de comentarios en el hilo de sugerencias.
2. **Profesor (`profesor`):**
   - Visualización de propuestas y comentarios.
   - Participación en debates y aporte pedagógico/disciplinario.
3. **Personal de Mantenimiento (`mantenimiento`):**
   - Consulta de sugerencias catalogadas como incidencias físicas (`/sugerencias/mantenimiento`).
   - Actualización de estados operativos (`pendiente`, `en proceso`, `realizada`, `rechazada`).
   - Gestión integral de tareas internas de mantenimiento (`/mantenimiento/tareas`).
4. **Secretaría (`secretaria`):**
   - Inserción y auditoría de nómina de usuarios (`/usuarios` y `/usuarios/registro-masivo`).
   - Validación matemática obligatoria de cédulas antes de cualquier inserción.
   - Administración del padrón institucional educativo.
5. **Administrador (`admin`):**
   - Acceso total e irrestricto a todas las entidades.
   - Visualización de autores reales incluso en sugerencias marcadas como anónimas.
   - Moderación formal: aprobación, descarte y respuesta oficial del moderador (`/sugerencias/:id/moderacion`).
   - Eliminación física o lógica de sugerencias y usuarios.

---

## 3. Problemas que Resuelve el Backend
- **Centralización y Persistencia Segura:** Evita la fragmentación de datos y garantiza respaldo relacional en PostgreSQL vía Supabase.
- **Validación de Identidad e Integridad de Datos:** Exige que toda cédula ingresada cumpla el algoritmo verificador de Módulo 10, bloqueando registros inválidos o ficticios.
- **Moderación Léxica Automatizada:** Intercepta expresiones soeces o agravios antes de persistir registros en base de datos.
- **Privacidad del Estudiante:** Protege la identidad de los alumnos en consultas públicas respetando la directiva de anonimato institucional.
- **Control de Votaciones Duplicadas:** Asegura que un usuario solo pueda mantener un estado de voto por sugerencia (like, dislike o anulación).

---

## 4. Alcance del MVP (Backend)
El MVP del backend abarca cuatro módulos funcionales organizados en endpoints REST:

### Módulo 1: Autenticación y Primer Ingreso
- Autenticación mediante cédula y contraseña (`POST /auth/login`).
- Soporte para primer inicio de sesión: usuarios nuevos en nómina pueden definir su contraseña permanente (`POST /auth/primer-ingreso`) conservando o no su cédula inicial.
- Cifrado unidireccional de claves mediante `bcrypt` (salt rounds: 10).

### Módulo 2: Buzón de Sugerencias, Votación y Comentarios
- Registro de sugerencias con validación de campos obligatorios (`POST /sugerencias`).
- Listado general con orden descendente y anonimización condicional (`GET /sugerencias`).
- Registro y actualización de votos atómicos (`POST /sugerencias/:id/votar`).
- Moderación y respuesta oficial administrativa (`PATCH /sugerencias/:id/moderacion`).
- Borrado de sugerencias con restricción de rol administrador (`DELETE /sugerencias/:id`).
- Obtención y publicación de comentarios en hilo (`GET` y `POST /sugerencias/:id/comentarios`).

### Módulo 3: Secretaría y Gestión de Nómina
- Registro individual de usuarios con validación Módulo 10 (`POST /usuarios`).
- Carga masiva de nómina estudiantil/docente (`POST /usuarios/registro-masivo`).
- Consulta, actualización de perfil, avatar y baja de usuarios (`GET`, `PUT`, `DELETE /usuarios`).

### Módulo 4: Operaciones de Mantenimiento
- Filtro especializado de sugerencias de infraestructura (`GET /sugerencias/mantenimiento`).
- Transición de estados de resolución (`PATCH /sugerencias/:id/estado`).
- Tablero CRUD de tareas de mantenimiento (`GET`, `POST`, `DELETE /mantenimiento/tareas`).

---

## 5. Fuera de Alcance (Out of Scope)
- Emisión y validación de tokens JWT asimétricos con refresh tokens (se emplea autenticación de sesión directa con Supabase y cabecera de rol para el MVP).
- Procesamiento de pagos, cuotas escolares o donaciones.
- Envío masivo de correos SMTP transaccionales.
- WebSockets para mensajería en tiempo real instantánea (se utiliza polling REST / recarga bajo demanda).
