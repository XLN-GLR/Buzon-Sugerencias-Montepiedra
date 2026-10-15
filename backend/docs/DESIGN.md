# DESIGN: Especificación de Diseño de API y Contratos de Comunicación (Backend)

## 1. Principios de Diseño de la API RESTful
La API del Buzón de Sugerencias Montepiedra sigue las convenciones RESTful estándar para garantizar interoperabilidad, predictibilidad y consistencia con los clientes consumidores (Frontend React y herramientas de testing):

1. **Protocolo sin estado (Stateless):** Cada petición HTTP contiene toda la información necesaria para procesar la transacción.
2. **Semántica de Verbos HTTP:**
   - `GET`: Recuperación de recursos de solo lectura (seguro e idempotente).
   - `POST`: Creación de nuevos recursos o ejecución de acciones que alteran estado (votos, inicio de sesión).
   - `PUT`: Actualización completa de un recurso existente (`/usuarios/:id`).
   - `PATCH`: Modificación parcial de propiedades específicas (`/sugerencias/:id/moderacion`, `/sugerencias/:id/estado`).
   - `DELETE`: Eliminación de un recurso persistido (`/sugerencias/:id`, `/mantenimiento/tareas/:id`).
3. **Nomenclatura y Formatos de Datos:**
   - **Formato:** Cargas útiles y respuestas exclusivamente en formato `application/json`.
   - **Convención de Atributos:** Uso consistente de `snake_case` para sincronía con el esquema relacional de PostgreSQL (`usuario_id`, `created_at`, `es_anonimo`, `respuesta_moderador`).
   - **Fechas y Tiempos:** Formato estándar internacional **ISO-8601 UTC** (`YYYY-MM-DDTHH:mm:ss.sssZ`).

---

## 2. Convención de Códigos de Estado HTTP

| Código | Significado | Escenario de Aplicación |
| :--- | :--- | :--- |
| `200 OK` | Operación exitosa | Consultas `GET`, actualizaciones `PUT`/`PATCH`, y votaciones completadas. |
| `201 Created` | Creación exitosa | Inserción de sugerencias, comentarios, tareas o registros de usuarios. |
| `400 Bad Request` | Petición inválida | Cédula no válida (Módulo 10), campos requeridos ausentes o detección de palabras prohibidas. |
| `403 Forbidden` | Acceso denegado | Operaciones reservadas a roles privilegiados (`admin`, `secretaria`) cuando se envía un rol inferior. |
| `404 Not Found` | No encontrado | El recurso solicitado por ID (`UUID`) no existe en la base de datos. |
| `500 Internal Server Error` | Error de servidor | Fallas de conexión a Supabase, violación de restricciones relacionales o excepciones no capturadas. |

---

## 3. Esquemas Estándar de Respuesta

### A. Respuestas de Éxito

#### 1. Creación de Recurso (201 Created)
```json
{
  "message": "Sugerencia creada exitosamente",
  "data": {
    "id": "d798a3e4-8cf1-4509-bc01-e24df234a9f9",
    "created_at": "2026-06-25T02:01:15.123Z",
    "titulo": "Mejorar la red Wi-Fi",
    "descripcion": "El internet en los laboratorios se desconecta.",
    "categoria": "Infraestructura",
    "estado": "pendiente",
    "usuario_id": "60685e1f-3d41-42c2-b9a6-d71739856b22",
    "es_anonimo": true,
    "votos": 0,
    "likes": 0,
    "dislikes": 0,
    "respuesta_moderador": null,
    "foto_url": null
  }
}
```

#### 2. Respuesta de Votación Atómica (200 OK)
```json
{
  "message": "Voto registrado exitosamente",
  "id": "d798a3e4-8cf1-4509-bc01-e24df234a9f9",
  "votos": 12,
  "likes": 12,
  "dislikes": 2,
  "currentVote": "like"
}
```

### B. Respuestas de Error Estándar

#### 1. Faltan campos obligatorios (400 Bad Request)
```json
{
  "error": "Faltan campos obligatorios. Debes proporcionar: titulo, descripcion, categoria y usuario_id."
}
```

#### 2. Cédula inválida por Módulo 10 (400 Bad Request)
```json
{
  "error": "Cédula inválida: el décimo dígito verificador no coincide (Algoritmo Módulo 10)."
}
```

#### 3. Lenguaje inapropiado interceptado (400 Bad Request)
```json
{
  "error": "Contenido inapropiado detectado. Por favor, modifique su lenguaje."
}
```

#### 4. Privilegios insuficientes (403 Forbidden)
```json
{
  "error": "Acceso denegado. Se requiere rol de administrador para realizar esta acción."
}
```

#### 5. Recurso no encontrado (404 Not Found)
```json
{
  "error": "No se encontró ninguna sugerencia con el ID proporcionado."
}
```

#### 6. Error interno o fallo de Supabase (500 Internal Server Error)
```json
{
  "error": "Error interno del servidor al procesar la solicitud",
  "details": "Mensaje detallado de la excepción o error de base de datos"
}
```

---

## 4. Encabezados HTTP (Headers) del Protocolo

- `Content-Type: application/json`: Obligatorio en peticiones con cuerpo (`POST`, `PUT`, `PATCH`).
- `x-user-role: <rol>`: Utilizado para evaluar permisos de consulta y moderación. Roles reconocidos:
  - `alumno` (predeterminado si se omite el encabezado)
  - `profesor`
  - `mantenimiento`
  - `secretaria`
  - `admin`
