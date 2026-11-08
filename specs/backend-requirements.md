# Requisitos de Backend - Buzón de Sugerencias Montepiedra

## [2026-08-28] Correcciones de Votación, Modal Split de Comentarios y Moderación
**Estado:** 🟢 Completado

### Contexto de UI
Se actualizaron las vistas del frontend (`Board.jsx`, `Dashboard.jsx`, `SecretariaPanel.jsx`, `Login.jsx`) para:
1. Sincronizar dinámicamente en el estado local el conteo de **Likes** y **Dislikes** tras una votación.
2. Desplegar un modal flotante split con información detallada de la propuesta a la izquierda y el módulo de comentarios a la derecha.
3. Mostrar la etiqueta 'Usuario eliminado' cuando una sugerencia pertenezca a un usuario cuya cuenta fue borrada.
4. Capitalización de roles institucionalmente en tablas y formularios.
5. Validación matemática de Cédula mediante el Algoritmo del Módulo 10.
6. Alineación en cuadrícula Flexbox/Grid de las métricas separadas de Likes y Dislikes en el Panel de Moderación.

### Endpoints solicitados
- [x] `POST /sugerencias/:id/votar`
  - **Params / Query:** `id` (string, Path param - ID de la sugerencia)
  - **Request Body:**
    ```json
    {
      "usuario_id": "60685e1f-3d41-42c2-b9a6-d71739856b22",
      "tipo_voto": "dislike"
    }
    ```
  - **Response esperada:**
    ```json
    {
      "message": "Voto registrado exitosamente",
      "id": "sug-123",
      "votos": 12,
      "likes": 12,
      "dislikes": 3,
      "currentVote": "dislike"
    }
    ```

- [x] `GET /sugerencias/:id/comentarios`
  - **Params / Query:** `id` (string, Path param)
  - **Headers:** `x-user-role: alumno`
  - **Response esperada:**
    ```json
    {
      "sugerencia_id": "sug-123",
      "comentarios": [
        {
          "id": "com-1",
          "sugerencia_id": "sug-123",
          "usuario_id": "usr-456",
          "texto": "Excelente propuesta para el pabellón A.",
          "created_at": "2026-08-28T10:15:00.000Z",
          "usuarios": {
            "id": "usr-456",
            "nombre": "Carlos Vaca",
            "foto_url": "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Carlos"
          }
        }
      ]
    }
    ```

- [x] `POST /sugerencias/:id/comentarios`
  - **Params / Query:** `id` (string, Path param)
  - **Headers:** `x-user-role: alumno`
  - **Request Body:**
    ```json
    {
      "usuario_id": "60685e1f-3d41-42c2-b9a6-d71739856b22",
      "texto": "Apoyo totalmente esta iniciativa."
    }
    ```
  - **Response esperada:**
    ```json
    {
      "message": "Comentario publicado exitosamente",
      "comentario": {
        "id": "com-789",
        "sugerencia_id": "sug-123",
        "usuario_id": "60685e1f-3d41-42c2-b9a6-d71739856b22",
        "texto": "Apoyo totalmente esta iniciativa.",
        "created_at": "2026-08-28T11:20:00.000Z"
      }
    }
    ```

### Cambios en Base de Datos sugeridos
- [x] Asegurar que la tabla `sugerencias` cuente con la columna `dislikes` (INTEGER DEFAULT 0) e `likes` (INTEGER DEFAULT 0) además de `votos`.
- [x] Garantizar la relación `FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL` para que la eliminación de un usuario preserve las sugerencias con `usuarios = null` (permitiendo renderizar 'Usuario eliminado' en el frontend).
- [x] Crear la tabla `comentarios_sugerencias` con columnas `(id, sugerencia_id, usuario_id, texto, created_at)`.

---

## [2026-08-28] Validación Estricta de Cédula Ecuatoriana (Módulo 10) y Reinicio de Datos
**Estado:** 🟢 Completado

### Contexto de UI
Se reforzó la validación del décimo dígito validador de la cédula ecuatoriana en el formulario de inicio de sesión (`Login.jsx`) y el panel de secretaría (`SecretariaPanel.jsx`), y se actualizaron las credenciales rápidas de prueba y nómina demo con cédulas válidas.

### Endpoints solicitados
- [x] `POST /auth/login`
  - **Params / Query:** Ninguno
  - **Request Body:**
    ```json
    {
      "cedula": "0917240327",
      "password": "admin"
    }
    ```
  - **Response esperada (400 Bad Request en caso de cédula inválida):**
    ```json
    {
      "error": "Cédula inválida: el décimo dígito verificador no coincide (Algoritmo Módulo 10)."
    }
    ```

- [x] `POST /auth/primer-ingreso`
  - **Params / Query:** Ninguno
  - **Request Body:**
    ```json
    {
      "cedula": "0940123458",
      "nueva_password": "nuevaPasswordSegura123",
      "conservar_cedula": false
    }
    ```
  - **Response esperada:**
    ```json
    {
      "message": "Contraseña configurada exitosamente. Ya puede iniciar sesión.",
      "usuario": { "id": "...", "cedula": "0940123458" }
    }
    ```

- [x] `POST /usuarios`
  - **Headers:** `x-user-role: secretaria`
  - **Request Body:**
    ```json
    {
      "cedula": "0950764043",
      "nombre": "Lcda. Elizabeth Ponce",
      "correo": "secretaria@montepiedra.edu.ec",
      "rol": "secretaria"
    }
    ```
  - **Response esperada:**
    ```json
    {
      "message": "Usuario registrado exitosamente",
      "usuario": { "id": "...", "cedula": "0950764043" }
    }
    ```

- [x] `POST /usuarios/registro-masivo`
  - **Headers:** `x-user-role: secretaria`
  - **Request Body:**
    ```json
    {
      "nomina": [
        {
          "cedula": "0921122339",
          "nombre": "Alejandro Morales",
          "correo": "alejandro.morales@alumno.montepiedra.edu.ec",
          "rol": "alumno"
        }
      ]
    }
    ```
  - **Response esperada:**
    ```json
    {
      "message": "Nómina de usuarios registrada exitosamente",
      "total_registrados": 1,
      "usuarios": [ { "id": "...", "cedula": "0921122339" } ]
    }
    ```

### Cambios en Base de Datos sugeridos
- [x] Limpieza en tabla `usuarios` eliminando registros cuyas cédulas no cumplan con el algoritmo oficial de validación del Módulo 10.
- [x] Siembra de usuarios iniciales limpios con cédulas reales y válidas para cada rol institucional ('admin', 'secretaria', 'mantenimiento', 'profesor', 'alumno') con sus respectivos hashes de bcrypt.

---

## [2026-10-21] Refactorización de Filtro de Lenguaje Inapropiado (Tokens y API Externa)
**Estado:** 🟢 Completado

### Contexto
Se resolvió el bug crítico de falsos positivos en palabras legítimas como "computadora", "disputa", "reputación", "calcular" o "acumular" eliminando la búsqueda ingenua por subcadenas. Se implementó un motor híbrido basado en normalización (NFD + leetspeak), evaluación estricta por tokens (palabras completas con `leo-profanity` y modismos locales), y consumo asíncrono con timeout de 2.5s de la API pública gratuita de PurgoMalum.

### Endpoints actualizados
- [x] `POST /sugerencias`
  - Validación con `await hasProfanity(...)` en `titulo` y `descripcion`.
  - Error 400 Bad Request: `{ "error": "Contenido inapropiado detectado. Por favor, mantenga un lenguaje respetuoso." }`.
- [x] `POST /sugerencias/:id/comentarios`
  - Validación con `await hasProfanity(...)` en `texto`.
  - Error 400 Bad Request: `{ "error": "Contenido inapropiado detectado. Por favor, modifique su lenguaje." }`.



---

## [2026-11-04] Delegación de Validación Anti-Profanity y Manejo HTTP 400 en SuggestionForm
**Estado:** 🟡 Pendiente

### Contexto de UI
En el formulario de creación de sugerencias (`SuggestionForm.jsx`), se eliminó la validación local estática con `.includes()` para erradicar el problema de Scunthorpe (bloqueo erróneo de términos legítimos como "Computadora"). La validación de contenido inapropiado se delega por completo al backend, gestionando la respuesta de error HTTP 400 para mostrar una alerta visual clara al usuario sin interrumpir el flujo cuando se envían términos válidos.

### Endpoints solicitados
- [ ] `POST /sugerencias`
  - **Params / Query:** Ninguno
  - **Headers:** `x-user-role: alumno`
  - **Request Body:**
    ```json
    {
      "titulo": "Mejorar las computadoras del laboratorio",
      "descripcion": "Se requiere mantenimiento en las computadoras para las clases de informática.",
      "categoria": "Infraestructura",
      "usuario_id": "60685e1f-3d41-42c2-b9a6-d71739856b22",
      "es_anonimo": false,
      "votos": 0,
      "respuesta_moderador": null,
      "foto_url": null
    }
    ```
  - **Response esperada (Éxito HTTP 201):**
    ```json
    {
      "message": "Sugerencia creada exitosamente",
      "data": {
        "id": "sug-987",
        "titulo": "Mejorar las computadoras del laboratorio",
        "descripcion": "Se requiere mantenimiento en las computadoras para las clases de informática.",
        "categoria": "Infraestructura",
        "usuario_id": "60685e1f-3d41-42c2-b9a6-d71739856b22",
        "estado": "pendiente",
        "es_anonimo": false,
        "votos": 0,
        "likes": 0,
        "dislikes": 0,
        "respuesta_moderador": null,
        "foto_url": null,
        "created_at": "2026-11-04T22:50:00.000Z"
      }
    }
    ```
  - **Response esperada (Error HTTP 400 Bad Request):**
    ```json
    {
      "error": "Contenido inapropiado detectado. Por favor, mantenga un lenguaje respetuoso."
    }
    ```

### Cambios en Base de Datos sugeridos
- [ ] Ninguno (la persistencia en la tabla `sugerencias` mantiene la estructura existente).


---

## [2026-11-04] Intercepción y Gestión UI de Rate Limiting (HTTP 429) en Sugerencias y Comentarios
**Estado:** 🟡 Pendiente

### Contexto de UI
Se actualizó la gestión de errores en `SuggestionForm.jsx` y `Board.jsx` (modal de comentarios) para capturar y mostrar claramente las respuestas HTTP 429 (Too Many Requests). La interfaz despliega alertas de aviso/tiempo amigables (con icono ⏳ y estilo visual diferenciado), preserva los textos ingresados por el usuario para evitar pérdida de datos y desactiva los estados de carga de los botones.

### Endpoints solicitados
- [ ] `POST /sugerencias`
  - **Params / Query:** Ninguno
  - **Headers:** `x-user-role: alumno`, `x-user-id: <usuario_id>`
  - **Request Body:**
    ```json
    {
      "titulo": "Mantenimiento a laboratorios",
      "descripcion": "Solicitud de revisión de los equipos.",
      "categoria": "Infraestructura",
      "usuario_id": "60685e1f-3d41-42c2-b9a6-d71739856b22",
      "es_anonimo": true
    }
    ```
  - **Response esperada (HTTP 429 Too Many Requests):**
    ```json
    {
      "error": "Has alcanzado el límite de 1 sugerencia cada 24 horas. Por favor, intenta de nuevo más tarde."
    }
    ```

- [ ] `POST /sugerencias/:id/comentarios`
  - **Params / Query:** `id` (Path param - ID de sugerencia)
  - **Headers:** `x-user-role: alumno`, `x-user-id: <usuario_id>`
  - **Request Body:**
    ```json
    {
      "usuario_id": "60685e1f-3d41-42c2-b9a6-d71739856b22",
      "texto": "Apoyo la propuesta."
    }
    ```
  - **Response esperada (HTTP 429 Too Many Requests):**
    ```json
    {
      "error": "Has alcanzado el límite de 5 comentarios por hora. Por favor, espera antes de publicar nuevos comentarios."
    }
    ```

### Cambios en Base de Datos sugeridos
- [ ] Ninguno (la limitación de tasa se gestiona perimetralmente en memoria/middleware con `express-rate-limit`).


---

## [2026-11-05] Moderación y Gestión de Comentarios de Debate en Panel de Moderación
**Estado:** 🟡 Pendiente

### Contexto de UI
En el Panel de Moderación (`Dashboard.jsx`), se integró un modal interactivo para la moderación y supervisión de los hilos de debate y comentarios por sugerencia. Permite a los profesores y administradores revisar, ocultar (soft-delete / toggle visibility) y eliminar de forma definitiva intervenciones inapropiadas u ofensivas en los comentarios asociados a cada propuesta del alumnado.

### Endpoints solicitados
- [ ] `DELETE /sugerencias/:id/comentarios/:comentarioId`
  - **Params / Query:** 
    - `id`: Path param (UUID o ID de la sugerencia)
    - `comentarioId`: Path param (UUID o ID del comentario a eliminar)
  - **Headers:** `x-user-role: profesor` o `x-user-role: administrador`
  - **Response esperada:**
    ```json
    {
      "message": "Comentario eliminado exitosamente",
      "comentarioId": "com-789"
    }
    ```

- [ ] `PATCH /sugerencias/:id/comentarios/:comentarioId/ocultar`
  - **Params / Query:**
    - `id`: Path param (UUID o ID de la sugerencia)
    - `comentarioId`: Path param (UUID o ID del comentario)
  - **Headers:** `x-user-role: profesor` o `x-user-role: administrador`
  - **Request Body:**
    ```json
    {
      "is_hidden": true
    }
    ```
  - **Response esperada:**
    ```json
    {
      "message": "Estado de visualización del comentario actualizado",
      "comentarioId": "com-789",
      "is_hidden": true
    }
    ```

### Cambios en Base de Datos sugeridos
- [ ] Agregar columna `is_hidden` (BOOLEAN DEFAULT false) en la tabla `comentarios_sugerencias` para soportar la moderación y ocultamiento temporal sin pérdida del registro original.


---

## [2026-11-07] Eliminación Definitiva de Comentarios en Moderación
**Estado:** 🟡 Pendiente

### Contexto de UI
En el modal de moderación institucional (`Dashboard.jsx`), se integró el módulo de debate permitiendo a profesores y administradores supervisar las intervenciones y eliminar de forma permanente comentarios que infrinjan las normas institucionales. Se descartó la funcionalidad de ocultar comentarios en favor del borrado directo.

### Endpoints solicitados
- [ ] `DELETE /sugerencias/:id/comentarios/:comentarioId`
  - **Params / Query:** 
    - `id`: Path param (UUID o ID de la propuesta/sugerencia)
    - `comentarioId`: Path param (UUID o ID del comentario a remover)
  - **Headers:** 
    - `x-user-role`: `profesor` o `administrador`
    - `x-user-id`: UUID del usuario moderador
  - **Response esperada (Éxito HTTP 200):**
    ```json
    {
      "message": "Comentario eliminado exitosamente",
      "sugerencia_id": "sug-123",
      "comentarioId": "com-789"
    }
    ```
  - **Response esperada (Error HTTP 404):**
    ```json
    {
      "error": "El comentario especificado no existe o ya fue eliminado."
    }
    ```

### Cambios en Base de Datos sugeridos
- [ ] Ejecutar `DELETE FROM comentarios_sugerencias WHERE id = $comentarioId AND sugerencia_id = $id` o cascada referencial correspondiente en Supabase/PostgreSQL.
