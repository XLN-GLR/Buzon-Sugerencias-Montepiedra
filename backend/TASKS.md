# TASKS: Plan de Trabajo Granular por Fases (Backend)

Este documento detalla el plan secuencial de trabajo para el desarrollo, evolución y aseguramiento de calidad del backend del Buzón de Sugerencias Montepiedra.

---

## Fase 1: Configuración, Conexión y Arquitectura Base
- [x] **TASK-BE-001:** Inicialización del proyecto Node.js con Express, CORS y dependencias esenciales (`@supabase/supabase-js`, `bcrypt`, `dotenv`).
- [x] **TASK-BE-002:** Creación de `config.js` para validación estricta de variables de entorno y conexión con cliente Supabase.
- [x] **TASK-BE-003:** Implementación del endpoint base de verificación de estado y salud (`GET /`).
- [x] **TASK-BE-004:** Adaptación y estructuración de la documentación de contexto según la Guía Vibe Coding (`docs/PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `TEST_PLAN.md`, `SECURITY.md`, `DECISIONS.md`, `MEMORY.md`, `RULES.md`, `.agents/rules/backend-rules.md`).

---

## Fase 2: Autenticación, Identidad y Algoritmo Módulo 10
- [x] **TASK-BE-005:** Implementación del validador de cédula ecuatoriana según el algoritmo matemático oficial de Módulo 10 (`validateEcuadorianCedula`).
- [x] **TASK-BE-006:** Implementación del endpoint de autenticación institucional (`POST /auth/login`) con verificación de hash bcrypt.
- [x] **TASK-BE-007:** Implementación del endpoint de activación y primer ingreso (`POST /auth/primer-ingreso`) con soporte para nueva contraseña o retención de cédula.

---

## Fase 3: Buzón de Sugerencias, Moderación Léxica y Votación Atómica
- [x] **TASK-BE-008:** Implementación del filtro léxico y lista de palabras no permitidas (`hasProfanity`).
- [x] **TASK-BE-009:** Creación del endpoint de inserción de sugerencias (`POST /sugerencias`) con validación de obligatoriedad y filtro de lenguaje.
- [x] **TASK-BE-010:** Implementación del endpoint de consulta (`GET /sugerencias`) con ordenamiento cronológico descendente y anonimización de identidad según el rol de la petición.
- [x] **TASK-BE-011:** Implementación del endpoint de votación ponderada (`POST /sugerencias/:id/votar`) gestionando likes, dislikes y anulación de votos en tabla intermedia.
- [x] **TASK-BE-012:** Implementación del endpoint de moderación y respuesta oficial (`PATCH /sugerencias/:id/moderacion`) restringido a rol administrador.
- [x] **TASK-BE-013:** Implementación del endpoint de eliminación segura (`DELETE /sugerencias/:id`) con verificación de rol administrador.

---

## Fase 4: Sistema de Comentarios y Debate Comunitario
- [x] **TASK-BE-014:** Endpoint de consulta de comentarios por sugerencia (`GET /sugerencias/:id/comentarios`) con vinculación de perfil de autor.
- [x] **TASK-BE-015:** Endpoint de publicación de comentarios (`POST /sugerencias/:id/comentarios`) con validación de cuerpo y persistencia relacional.

---

## Fase 5: Secretaría, Gestión de Nómina y Mantenimiento Físico
- [x] **TASK-BE-016:** Implementación de endpoints de gestión de usuarios (`POST /usuarios` y `POST /usuarios/registro-masivo`) con validación estricta de cédula.
- [x] **TASK-BE-017:** Endpoints de actualización y baja de usuarios (`PUT /usuarios/:id`, `PUT /usuarios/:id/foto`, `DELETE /usuarios/:id`).
- [x] **TASK-BE-018:** Endpoints especializados de mantenimiento (`GET /sugerencias/mantenimiento`, `PATCH /sugerencias/:id/estado`, y CRUD `/mantenimiento/tareas`).

---

## Fase 6: Pruebas Automatizadas y Evolución Futura (Siguientes Pasos)
- [ ] **TASK-BE-019:** Crear suite de pruebas de integración automatizadas con Supertest / Vitest en `backend/tests/`.
- [ ] **TASK-BE-020:** Modularizar el archivo monolítico `index.js` en controladores (`/controllers`), rutas (`/routes`) y servicios (`/services`) cuando la fase de refactorización sea programada.
- [ ] **TASK-BE-021:** Implementar autenticación basada en tokens JWT con verificación asimétrica en sustitución del encabezado simple de rol.
