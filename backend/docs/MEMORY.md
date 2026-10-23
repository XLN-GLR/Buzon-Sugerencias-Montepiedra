# MEMORY: Estado Dinámico del Backend (Buzón de Sugerencias Montepiedra)

## 1. Resumen Ejecutivo
El backend del **Buzón de Sugerencias Montepiedra** cuenta con un servidor monolítico API REST completamente operativo construido sobre Node.js y Express.js, conectado a Supabase (PostgreSQL). Proporciona todos los servicios de negocio requeridos por el frontend para la gestión integral de propuestas, autenticación, secretaría y mantenimiento.

---

## 2. Lo que está Completado (Done)
- [x] **Configuración y Arranque del Servidor:**
  - Servidor Express con CORS y parseo de JSON en puerto configurable (`backend/config.js` e `index.js`).
  - Verificación de credenciales obligatorias de Supabase al iniciar.
- [x] **Módulo 1: Autenticación y Cédula Ecuatoriana:**
  - Endpoint `POST /auth/login` con validación de contraseña mediante `bcrypt.compare`.
  - Endpoint `POST /auth/primer-ingreso` para configuración inicial de credenciales institucionales.
  - Validación matemática oficial mediante algoritmo de Módulo 10 en `validateEcuadorianCedula`.
- [x] **Módulo 2: Buzón de Sugerencias, Votos y Comentarios:**
  - Endpoint `POST /sugerencias` con motor híbrido de moderación léxica asíncrono (`hasProfanity`).
  - Erradicación de falsos positivos en palabras legítimas mediante tokenización estricta por palabras completas (`leo-profanity`).
  - Detección de ofuscación leetspeak y remoción de diacríticos NFD.
  - Integración con API externa de PurgoMalum con timeout de 2.5s mediante `AbortController`.
  - Endpoint `GET /sugerencias` con anonimización selectiva para roles no administradores.
  - Endpoint `POST /sugerencias/:id/votar` con control atómico de likes y dislikes.
  - Endpoint `PATCH /sugerencias/:id/moderacion` para respuesta oficial del moderador.
  - Endpoint `DELETE /sugerencias/:id` restringido a rol administrador.
  - Endpoints `GET` y `POST /sugerencias/:id/comentarios` para el hilo de debate.
- [x] **Módulo 3: Secretaría y Nómina:**
  - Endpoint `POST /usuarios/registro-masivo` para ingesta de nómina escolar.
  - Endpoint `POST /usuarios` para registro unitario validando cédula.
  - Endpoints `GET`, `PUT /usuarios/:id/foto`, `PUT /usuarios/:id` y `DELETE /usuarios/:id`.
- [x] **Módulo 4: Mantenimiento:**
  - Endpoint `GET /sugerencias/mantenimiento` filtrado por infraestructura.
  - Endpoint `PATCH /sugerencias/:id/estado` para transiciones de estado.
  - Endpoints `GET`, `POST`, `DELETE /mantenimiento/tareas` para el tablón de mantenimiento.
- [x] **Suite Automatizada de Pruebas:**
  - Archivo `backend/tests/profanity.test.js` con 23 casos de prueba ejecutados exitosamente para verificación de cero falsos positivos e intercepción de insultos directos y camuflados.
- [x] **Suite de Verificación Manual de Endpoints:**
  - Archivo `backend/pruebas.http` con más de 20 casos de prueba listos para ejecución.
- [x] **Documentación de Contrato:**
  - `backend/CONTRATO_DATOS.md` y `contrato.md` en raíz.

---

## 3. En lo que estamos Trabajando Ahora (In Progress)
- [x] **Sincronización y Actualización Integral de Documentación:**
  - Actualización de `backend/docs/` (`PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `TEST_PLAN.md`, `SECURITY.md`, `DECISIONS.md`, `MEMORY.md`).
  - Actualización de `backend/TASKS.md`, `backend/README.md` y `backend/tests/README.md`.
  - Verificación del árbol de dependencias (`npm install`) y ejecución exitosa de pruebas automatizadas (`node tests/profanity.test.js`).

---

## 4. Errores Conocidos y Consideraciones Técnicas
- **Esquema de Base de Datos en Supabase:** El backend depende de la existencia de las tablas `usuarios`, `sugerencias`, `votos_sugerencias`, `comentarios_sugerencias` y `tareas_mantenimiento` con sus claves foráneas correspondientes. En caso de credenciales inválidas o base de datos no inicializada, Express retornará errores `500` con el mensaje descriptivo de Supabase.
- **Header de Rol:** Los roles son enviados mediante el header `x-user-role`. Si no se envía, el backend asume por defecto `alumno`.

---

## 5. Próximos Pasos (Next Steps)
1. Implementar pruebas automatizadas con un runner como Jest/Supertest o Vitest en `backend/tests/`.
2. Evaluar modularización a futuro (separar `index.js` en carpetas `/routes`, `/controllers`, `/services`) cuando el ciclo de refactorización lo planifique formalmente.
3. Incorporar validación de tokens JWT nativos de Supabase Auth si se requiere mayor robustez frente al header `x-user-role`.
