# Requisitos de Backend - Buzón de Sugerencias Montepiedra

## [2026-08-28] Correcciones de Votación, Modal Split de Comentarios y Moderación
**Estado:** 🟡 Pendiente

### Contexto de UI
Se actualizaron las vistas del frontend (`Board.jsx`, `Dashboard.jsx`, `SecretariaPanel.jsx`, `Login.jsx`) para:
1. Sincronizar dinámicamente en el estado local el conteo de **Likes** y **Dislikes** tras una votación.
2. Desplegar un modal flotante split con información detallada de la propuesta a la izquierda y el módulo de comentarios a la derecha.
3. Mostrar la etiqueta 'Usuario eliminado' cuando una sugerencia pertenezca a un usuario cuya cuenta fue borrada.
4. Capitalización de roles institucionalmente en tablas y formularios.
5. Validación matemática de Cédula mediante el Algoritmo del Módulo 10.
6. Alineación en cuadrícula Flexbox/Grid de las métricas separadas de Likes y Dislikes en el Panel de Moderación.

### Endpoints solicitados
- [ ] `POST /sugerencias/:id/votar`
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

- [ ] `GET /sugerencias/:id/comentarios`
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

- [ ] `POST /sugerencias/:id/comentarios`
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
- [ ] Asegurar que la tabla `sugerencias` cuente con la columna `dislikes` (INTEGER DEFAULT 0) e `likes` (INTEGER DEFAULT 0) además de `votos`.
- [ ] Garantizar la relación `FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL` para que la eliminación de un usuario preserve las sugerencias con `usuarios = null` (permitiendo renderizar 'Usuario eliminado' en el frontend).
- [ ] Crear la tabla `comentarios_sugerencias` con columnas `(id, sugerencia_id, usuario_id, texto, created_at)`.
