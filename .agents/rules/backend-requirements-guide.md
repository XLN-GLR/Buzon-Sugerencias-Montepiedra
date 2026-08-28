---
trigger: always_on
---

# Protocolo de Handoff Backend

Cada vez que crees, modifiques o elimines interfaces de usuario, componentes o flujos (o en general, hagas cualquier cambio en el FRONTEND) que requieran persistencia de datos, consumo de APIs o lógica de negocio en el backend, en función del prompt que yo te haya mandado, debes documentar automáticamente los requisitos en el archivo `specs/backend-requirements.md`. Este archivo debe ser subido al repositorio que se esté trabajando junto al resto de archivos.

## Reglas de Ejecución:
1. **No sobreescribir ni borrar:** Nunca elimines secciones anteriores ni modifiques tareas marcadas como completadas (`- [x]` o `🟢 Completado`).
2. **Ubicación:** Añade siempre una nueva sección al final (o al inicio) de `specs/backend-requirements.md`.
3. **Estado inicial:** Todo nuevo bloque debe crearse con el estado `🟡 Pendiente` y casillas desmarcadas (`- [ ]`).
4. **Detalle técnico:**
   - Define el método HTTP y la ruta del endpoint (`GET`, `POST`, `PUT`, `DELETE`, etc.).
   - Especifica parámetros de consulta (Query params) o de ruta (Path params).
   - Incluye ejemplos JSON reales de los datos que el frontend enviará (Payload) y de lo que espera recibir de vuelta (Response).
   - Si la vista requiere nuevos campos de datos que antes no existían, especifícalos en la sección de base de datos.

## Plantilla a utilizar:

## [YYYY-MM-DD] <Nombre de la Pantalla / Feature>
**Estado:** 🟡 Pendiente

### Contexto de UI
<Breve resumen de la vista creada y qué acción realiza el usuario>

### Endpoints solicitados
- [ ] `<METODO> /api/<ruta>`
  - **Params / Query:** `<descripción o tipos>`
  - **Request Body:**
    ```json
    { ... }
    ```
  - **Response esperada:**
    ```json
    { ... }
    ```

### Cambios en Base de Datos sugeridos
- [ ] <Nuevo modelo, tabla, columna o relación requerida>