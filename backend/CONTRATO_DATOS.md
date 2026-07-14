### 📊 Contrato de Datos - Sistema de Sugerencias

Este documento define la estructura de comunicación entre el frontend y el backend para el sistema de sugerencias.

- **URL Base Local:** `http://127.0.0.1:8080`

---

#### 1. Crear una Sugerencia

Permite registrar una nueva sugerencia enviada por un usuario de la institución educativa.

- **Método:** `POST`
- **Ruta:** `/sugerencias`
- **Encabezado requerido:** `Content-Type: application/json`

##### 📥 JSON que debe enviar el Frontend (Request Body)

```json
{
  "titulo": "Mejorar la red Wi-Fi",
  "descripcion": "El internet en los laboratorios de cómputo se desconecta constantemente durante las clases.",
  "categoria": "Infraestructura",
  "usuario_id": "60685e1f-3d41-42c2-b9a6-d71739856b22",
  "es_anonimo": true,
  "foto_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c"
}
```

##### 📤 JSON que devuelve el Backend (Response - Status 201 Created)

Si el registro es exitoso en la base de datos de Supabase:

```json
{
  "message": "Sugerencia creada exitosamente",
  "data": {
    "id": "d798a3e4-8cf1-4509-bc01-e24df234a9f9",
    "created_at": "2026-06-25T02:01:15.123Z",
    "titulo": "Mejorar la red Wi-Fi",
    "descripcion": "El internet en los laboratorios de cómputo se desconecta constantemente durante las clases.",
    "categoria": "Infraestructura",
    "estado": "pendiente",
    "usuario_id": "60685e1f-3d41-42c2-b9a6-d71739856b22",
    "es_anonimo": true,
    "votos": 0,
    "respuesta_moderador": null,
    "foto_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c"
  }
}
```

##### ❌ Respuestas de Error

###### Error 400 - Bad Request (Faltan campos obligatorios)
Se devuelve cuando alguno de los campos (`titulo`, `descripcion`, `categoria`, `usuario_id`) no es enviado en la petición:

```json
{
  "error": "Faltan campos obligatorios. Debes proporcionar: titulo, descripcion, categoria y usuario_id."
}
```

###### Error 400 - Bad Request (Contenido inapropiado detectado)
Se devuelve cuando el servidor intercepta palabras prohibidas o inapropiadas (insultos, palabras vulgares u ofensivas en español) en los campos `titulo` o `descripcion` del cuerpo de la petición. El proceso de inserción a la base de datos se detiene inmediatamente:

```json
{
  "error": "Contenido inapropiado detectado. Por favor, modifique su lenguaje."
}
```

###### Error 500 - Internal Server Error
Se devuelve cuando ocurre un fallo interno en el servidor o un error de base de datos (por ejemplo, errores de claves foráneas o políticas de seguridad RLS):

```json
{
  "error": "Error interno del servidor al crear la sugerencia",
  "details": "new row violates row-level security policy for table \"sugerencias\""
}
```

---

#### 2. Obtener todas las Sugerencias

Permite recuperar el listado completo de sugerencias, ordenadas cronológicamente de manera descendente (las más recientes primero), aplicando las políticas de anonimización según el rol del usuario que consulta.

- **Método:** `GET`
- **Ruta:** `/sugerencias`
- **Encabezados requeridos:** 
  * `x-user-role` (Valores permitidos: `alumno`, `profesor`, `admin`)

##### 📤 Respuestas de Éxito (Status 200 OK)

###### Caso 1: Consulta realizada por rol Administrador (`admin` o datos visibles)
Si el rol especificado es `admin`, se envían los datos reales del creador de la sugerencia en la propiedad `usuarios`, sin importar si es anónima o no:

```json
{
  "message": "Sugerencias recuperadas exitosamente",
  "data": [
    {
      "id": "d798a3e4-8cf1-4509-bc01-e24df234a9f9",
      "created_at": "2026-06-25T02:01:15.123Z",
      "titulo": "Mejorar la red Wi-Fi",
      "descripcion": "El internet en los laboratorios de cómputo se desconecta constantemente durante las clases.",
      "categoria": "Infraestructura",
      "es_anonimo": true,
      "votos": 15,
      "estado": "pendiente",
      "respuesta_moderador": null,
      "usuarios": {
        "id": "60685e1f-3d41-42c2-b9a6-d71739856b22",
        "nombre": "Carlos Mendoza",
        "correo": "carlos.mendoza@montepiedra.edu.ec",
        "foto_url": "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Carlos"
      }
    }
  ]
}
```

###### Caso 2: Consulta realizada por rol Alumno o Profesor (`alumno` o `profesor` con `es_anonimo: true`)
Si el rol es `alumno` o `profesor` y la sugerencia se marcó como anónima (`es_anonimo: true`), el backend anonimiza la información del objeto `usuarios`:

```json
{
  "message": "Sugerencias recuperadas exitosamente",
  "data": [
    {
      "id": "d798a3e4-8cf1-4509-bc01-e24df234a9f9",
      "created_at": "2026-06-25T02:01:15.123Z",
      "titulo": "Mejorar la red Wi-Fi",
      "descripcion": "El internet en los laboratorios de cómputo se desconecta constantemente durante las clases.",
      "categoria": "Infraestructura",
      "es_anonimo": true,
      "votos": 15,
      "estado": "pendiente",
      "respuesta_moderador": null,
      "usuarios": {
        "id": null,
        "nombre": "Anónimo",
        "correo": "anonimo@montepiedra.edu.ec",
        "foto_url": null
      }
    }
  ]
}
```

##### ❌ Respuestas de Error

###### Error 500 - Internal Server Error
Se devuelve cuando ocurre un error en el servidor al consultar los registros:

```json
{
  "error": "Error interno del servidor al obtener las sugerencias",
  "details": "Mensaje técnico detallado del error"
}
```

---

#### 3. Registrar un Voto en una Sugerencia

Permite realizar un incremento de `+1` en la columna de votos para una sugerencia en específico.

- **Método:** `POST`
- **Ruta:** `/sugerencias/:id/votar`
- **Encabezados requeridos:** Ninguno en específico.

##### 📤 Respuestas de Éxito (Status 200 OK)

Si la operación en la base de datos es exitosa, devuelve el ID de la sugerencia y el número total de votos ya actualizado tras el incremento:

```json
{
  "message": "Voto registrado exitosamente",
  "id": "d798a3e4-8cf1-4509-bc01-e24df234a9f9",
  "votos": 16
}
```

##### ❌ Respuestas de Error

###### Error 404 - Not Found (Sugerencia inexistente)
Se devuelve cuando el UUID proporcionado en la URL no corresponde a ninguna sugerencia registrada en Supabase:

```json
{
  "error": "La sugerencia especificada no existe."
}
```

###### Error 500 - Internal Server Error
Se devuelve cuando ocurre una falla inesperada en el servidor o de comunicación con Supabase:

```json
{
  "error": "Error interno del servidor al registrar el voto",
  "details": "Mensaje técnico detallado del error"
}
```

---

#### 4. Moderar una Sugerencia

Permite cambiar el estado de una sugerencia (ej. aprobada, rechazada) y registrar la respuesta institucional o justificación del moderador. Solo los usuarios con rol de `profesor` o `admin` están autorizados para realizar esta acción.

- **Método:** `PATCH`
- **Ruta:** `/sugerencias/:id/moderacion`
- **Encabezados requeridos:** 
  * `x-user-role` (Valores permitidos: `profesor`, `admin`)

##### 📥 JSON que debe enviar el Frontend (Request Body)

```json
{
  "estado": "aprobada",
  "respuesta_moderador": "Se ha coordinado con el departamento de infraestructura para atender este requerimiento."
}
```

##### 📤 Respuestas de Éxito (Status 200 OK)

Si la operación en la base de datos es exitosa, se retorna el JSON con los campos actualizados:

```json
{
  "message": "Sugerencia moderada exitosamente",
  "id": "d798a3e4-8cf1-4509-bc01-e24df234a9f9",
  "estado": "aprobada",
  "respuesta_moderador": "Se ha coordinado con el departamento de infraestructura para atender este requerimiento."
}
```

##### ❌ Respuestas de Error

###### Error 403 - Forbidden (Permisos insuficientes)
Se devuelve cuando el rol especificado en `x-user-role` es `alumno` o no cuenta con los privilegios de moderación:

```json
{
  "error": "Acceso denegado. No tienes permisos de moderación."
}
```

###### Error 404 - Not Found (Sugerencia inexistente)
Se devuelve cuando el UUID proporcionado en la URL no corresponde a ninguna sugerencia registrada en la base de datos de Supabase:

```json
{
  "error": "La sugerencia especificada no existe."
}
```

###### Error 500 - Internal Server Error
Se devuelve ante fallas de comunicación con la base de datos o fallos internos del servidor:

```json
{
  "error": "Error interno del servidor al moderar la sugerencia",
  "details": "Mensaje técnico detallado del error"
}
```

---

### 👥 Módulo de Administración de Estudiantes (Exclusivo Admin)

Este módulo expone endpoints orientados a la gestión y actualización de la información de los estudiantes, restringidos para uso exclusivo del rol `admin`.

#### 1. Obtener Estudiantes

Permite recuperar el listado de todos los usuarios registrados con rol de alumno/estudiante.

- **Método:** `GET`
- **Ruta:** `/usuarios/estudiantes`
- **Encabezados requeridos:** 
  * `x-user-role` (Debe ser: `admin`)

##### 📤 Respuestas de Éxito (Status 200 OK)

Retorna un arreglo con la información básica de los estudiantes encontrados en la base de datos:

```json
[
  {
    "id": "60685e1f-3d41-42c2-b9a6-d71739856b22",
    "nombre": "Carlos Mendoza",
    "correo": "carlos.mendoza@montepiedra.edu.ec",
    "foto_url": "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Carlos"
  },
  {
    "id": "71796f2a-4e52-53d3-c0b7-e82840967c33",
    "nombre": "Juan Pérez",
    "correo": "juan.perez@montepiedra.edu.ec",
    "foto_url": "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Juan"
  }
]
```

##### ❌ Respuestas de Error

###### Error 403 - Forbidden (Permisos insuficientes)
Se devuelve cuando el rol especificado no corresponde al administrador:

```json
{
  "error": "Acceso denegado. Se requieren permisos de administrador."
}
```

---

#### 2. Actualizar Foto de Perfil

Permite a los administradores actualizar la dirección URL de la foto de perfil para un estudiante determinado.

- **Método:** `PUT`
- **Ruta:** `/usuarios/:id/foto`
- **Encabezados requeridos:** 
  * `x-user-role` (Debe ser: `admin`)

##### 📥 JSON que debe enviar el Frontend (Request Body)

```json
{
  "foto_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb"
}
```

##### 📤 Respuestas de Éxito (Status 200 OK)

Si la actualización es exitosa, se retorna el objeto de confirmación con la nueva URL:

```json
{
  "message": "Foto de perfil actualizada exitosamente",
  "id": "60685e1f-3d41-42c2-b9a6-d71739856b22",
  "foto_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb"
}
```

##### ❌ Respuestas de Error

###### Error 403 - Forbidden (Permisos insuficientes)
Se devuelve cuando el rol del consultor no es `admin`:

```json
{
  "error": "Acceso denegado. Se requieren permisos de administrador."
}
```

###### Error 404 - Not Found (Usuario inexistente)
Se devuelve cuando el UUID en la ruta no corresponde a ningún usuario registrado en Supabase:

```json
{
  "error": "El usuario especificado no existe."
}
```

###### Error 500 - Internal Server Error
Se devuelve ante fallas de comunicación con la base de datos o fallos internos del servidor:

```json
{
  "error": "Error interno del servidor al actualizar la foto de perfil",
  "details": "Mensaje técnico detallado del error"
}
```
