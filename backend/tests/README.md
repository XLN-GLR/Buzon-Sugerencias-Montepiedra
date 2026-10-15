# Tests - Backend (Buzón de Sugerencias Montepiedra)

Este directorio aloja las especificaciones, guías y casos de prueba para verificar la funcionalidad, seguridad y contratos de la API REST del backend.

---

## 1. Estrategia Actual de Pruebas

Actualmente, las pruebas de integración de endpoints se gestionan a través del archivo:
- [`backend/pruebas.http`](../pruebas.http)

### ¿Cómo ejecutar las pruebas con `pruebas.http`?
1. Instale la extensión **REST Client** (de Huachao Mao) o **Thunder Client** en VS Code / Cursor.
2. Inicie el servidor backend ejecutando:
   ```bash
   cd backend
   node index.js
   ```
3. Abra `pruebas.http` y haga clic en **Send Request** sobre cada bloque de prueba.

---

## 2. Cobertura de Casos de Prueba

La suite cubre los siguientes flujos de verificación:
- **Salud y Conexión:** `GET /`
- **Autenticación e Identidad:**
  - `POST /auth/login` (cédulas válidas vs. no válidas por Módulo 10)
  - `POST /auth/primer-ingreso` (configuración de clave)
- **Sugerencias y Filtro Léxico:**
  - `POST /sugerencias` (creación exitosa, campos faltantes, contenido inapropiado)
  - `GET /sugerencias` (anonimato condicional según `x-user-role`)
  - `DELETE /sugerencias/:id` (permisos 403 vs 200)
- **Votaciones y Comentarios:**
  - `POST /sugerencias/:id/votar` (likes y dislikes)
  - `GET /sugerencias/:id/comentarios` y `POST /sugerencias/:id/comentarios`
- **Secretaría y Nómina:**
  - `POST /usuarios/registro-masivo`
  - `POST /usuarios`
  - `GET /usuarios`
  - `PUT /usuarios/:id`
  - `DELETE /usuarios/:id`
- **Mantenimiento:**
  - `GET /sugerencias/mantenimiento`
  - `PATCH /sugerencias/:id/estado`
  - `GET`, `POST`, `DELETE /mantenimiento/tareas`

---

## 3. Plan de Pruebas Automatizadas Futuras
Para la Fase 6 (`TASK-BE-019`), se integrará un runner automatizado (Supertest + Vitest o Jest) dentro de este directorio (`backend/tests/`) para ejecutar pruebas de integración en pipelines de CI/CD sin requerir intervención manual.
