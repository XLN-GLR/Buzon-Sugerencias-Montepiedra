# TEST PLAN: Plan Integral de Pruebas y Criterios de Aceptación (Backend)

## 1. Objetivos del Plan de Pruebas
Verificar la robustez, seguridad, exactitud de la lógica de negocio y consistencia de los contratos de la API REST del Buzón de Sugerencias Montepiedra frente a Supabase y los clientes consumidores.

---

## 2. Estrategia y Niveles de Pruebas

### A. Pruebas de Contrato y Endpoints HTTP
- **Herramienta principal:** `backend/pruebas.http` (compatible con extensiones REST Client de VS Code/Cursor y Thunder Client) o `curl`.
- **Alcance:** Validación de códigos de respuesta HTTP, validación de encabezados `x-user-role`, verificación de payloads JSON devueltos y captura de errores controlados (400, 403, 404, 500).

### B. Pruebas de Integración con Base de Datos
- **Entorno:** Base de datos PostgreSQL en Supabase conectada mediante credenciales de prueba.
- **Alcance:** Integridad de claves foráneas (`FOREIGN KEY`), cascadas controladas (`ON DELETE SET NULL`), y políticas de seguridad RLS.

---

## 3. Matriz de Casos de Prueba por Módulo

### Módulo 1: Autenticación y Cédula Ecuatoriana (`/auth`)
- [ ] **TC-BE-AUTH-01:** Login con cédula válida y contraseña correcta -> `200 OK` con objeto de usuario y rol.
- [ ] **TC-BE-AUTH-02:** Login con cédula con dígito verificador erróneo -> `400 Bad Request` indicando falla en Algoritmo Módulo 10.
- [ ] **TC-BE-AUTH-03:** Login con contraseña errónea -> `401 Unauthorized`.
- [ ] **TC-BE-AUTH-04:** Primer ingreso (`/auth/primer-ingreso`) con asignación de nueva clave cifrada con bcrypt -> `200 OK`.
- [ ] **TC-BE-AUTH-05:** Primer ingreso conservando cédula como contraseña -> `200 OK` y flag de primer ingreso actualizado.

### Módulo 2: Buzón de Sugerencias y Moderación (`/sugerencias`)
- [ ] **TC-BE-SUG-01:** Creación de sugerencia con datos válidos -> `201 Created` con ID generado y votos en 0.
- [ ] **TC-BE-SUG-02:** Intento de creación omitiendo campos obligatorios (título/descripción) -> `400 Bad Request`.
- [ ] **TC-BE-SUG-03:** Intento de creación con lenguaje soez en título o cuerpo -> `400 Bad Request` con mensaje de advertencia.
- [ ] **TC-BE-SUG-04:** Consulta de sugerencias con rol `alumno` -> Retorna sugerencias; aquellas con `es_anonimo: true` ocultan el objeto `usuarios`.
- [ ] **TC-BE-SUG-05:** Consulta de sugerencias con rol `admin` -> Retorna información completa de autoría incluso para sugerencias anónimas.
- [ ] **TC-BE-SUG-06:** Eliminación de sugerencia con `x-user-role: alumno` -> `403 Forbidden`.
- [ ] **TC-BE-SUG-07:** Eliminación de sugerencia con `x-user-role: admin` -> `200 OK` o `404 Not Found`.

### Módulo 3: Votación Atómica y Comentarios
- [ ] **TC-BE-VOTE-01:** Emisión de primer voto tipo `like` -> Conteo incrementado y `currentVote: "like"`.
- [ ] **TC-BE-VOTE-02:** Cambio de voto de `like` a `dislike` por el mismo usuario -> Decrementa likes, incrementa dislikes.
- [ ] **TC-BE-VOTE-03:** Anulación de voto existente al votar dos veces por la misma opción -> Retorna a estado neutro.
- [ ] **TC-BE-COM-01:** Listado de comentarios por sugerencia (`GET /sugerencias/:id/comentarios`) -> Lista ordenada con datos de autor.
- [ ] **TC-BE-COM-02:** Publicación de comentario válido -> `201 Created`.

### Módulo 4: Secretaría y Nómina (`/usuarios`)
- [ ] **TC-BE-SEC-01:** Consulta de usuarios sin encabezado de secretaría -> `403 Forbidden`.
- [ ] **TC-BE-SEC-02:** Registro de usuario con cédula de 10 dígitos matemáticamente válida -> `201 Created`.
- [ ] **TC-BE-SEC-03:** Registro masivo de nómina con arreglo de usuarios -> `200 OK` con total de registros procesados.

### Módulo 5: Mantenimiento (`/mantenimiento`)
- [ ] **TC-BE-MANT-01:** Consulta de sugerencias de infraestructura -> Retorna incidencias filtradas para el equipo técnico.
- [ ] **TC-BE-MANT-02:** Actualización de estado operativo (`PATCH /sugerencias/:id/estado`) a `en proceso` o `realizada` -> `200 OK`.
- [ ] **TC-BE-MANT-03:** Creación y borrado de tareas internas de mantenimiento -> `201 Created` y `200 OK`.

---

## 4. Guía de Ejecución Rápida
1. Iniciar el servidor backend en modo local:
   ```powershell
   cd backend
   npm install
   node index.js
   ```
2. Abrir el archivo `backend/pruebas.http` en su entorno y ejecutar las peticiones secuenciales.
