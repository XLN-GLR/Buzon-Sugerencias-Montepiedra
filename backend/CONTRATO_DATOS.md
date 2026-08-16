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

#### 3. Registrar un Voto en una Sugerencia (Likes / Dislikes)

Permite a un usuario emitir un voto (`like` o `dislike`) en una sugerencia determinada. El sistema restringe a **un único voto por usuario** para cada sugerencia mediante la tabla de control `votos_sugerencias`.

- **Método:** `POST`
- **Ruta:** `/sugerencias/:id/votar`
- **Encabezado requerido:** `Content-Type: application/json`

##### 📥 JSON que debe enviar el Frontend (Request Body)

```json
{
  "usuario_id": "60685e1f-3d41-42c2-b9a6-d71739856b22",
  "tipo_voto": "like"
}
```

> **Nota:** El campo `tipo_voto` solo admite los valores `"like"` o `"dislike"`.

##### 📤 Respuestas de Éxito (Status 200 OK)

Si el voto se registra exitosamente en `votos_sugerencias` y se actualiza el contador correspondiente en `sugerencias`, retorna los contadores actualizados:

```json
{
  "message": "Voto registrado exitosamente",
  "id": "d798a3e4-8cf1-4509-bc01-e24df234a9f9",
  "likes": 12,
  "dislikes": 2
}
```

##### ❌ Respuestas de Error

###### Error 400 - Bad Request (Voto Duplicado)
Se devuelve cuando el usuario ya ha emitido previamente un voto (`like` o `dislike`) en la misma sugerencia:

```json
{
  "error": "Ya has emitido un voto para esta sugerencia"
}
```

###### Error 400 - Bad Request (Datos inválidos o faltantes)
Se devuelve cuando falta el `usuario_id` o el `tipo_voto` no es válido:

```json
{
  "error": "El campo 'usuario_id' es obligatorio."
}
```
o
```json
{
  "error": "El campo 'tipo_voto' es inválido. Debe ser 'like' o 'dislike'."
}
```

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

### 👥 Módulo de Secretaría (Gestión de Nóminas y Usuarios)

Este módulo expone endpoints orientados a la gestión institucional de nóminas, registro individual de usuarios, consulta con filtros y eliminación de cuentas. Todas las rutas de este módulo están protegidas y requieren que el encabezado `x-user-role` sea `secretaria` o `admin`.

---

#### 1. Registro Masivo de Usuarios (Nómina)

Permite procesar e insertar en masa una lista de estudiantes o personal. El backend encripta automáticamente la cédula de cada usuario con `bcrypt` para establecerla como su contraseña por defecto, asigna el rol `alumno` (o el especificado) y marca `es_primer_ingreso: true`.

- **Método:** `POST`
- **Ruta:** `/usuarios/registro-masivo`
- **Encabezados requeridos:** 
  * `Content-Type: application/json`
  * `x-user-role` (Valores permitidos: `secretaria`, `admin`)

##### 📥 JSON que debe enviar el Frontend (Request Body)

```json
{
  "nomina": [
    {
      "cedula": "0912345678",
      "nombre": "Carlos Mendoza",
      "correo": "carlos.mendoza@montepiedra.edu.ec"
    },
    {
      "cedula": "0987654321",
      "nombre": "Juan Pérez",
      "correo": "juan.perez@montepiedra.edu.ec"
    }
  ]
}
```

##### 📤 Respuestas de Éxito (Status 201 Created)

```json
{
  "message": "Nómina de usuarios registrada exitosamente",
  "total_registrados": 2,
  "usuarios": [
    {
      "id": "60685e1f-3d41-42c2-b9a6-d71739856b22",
      "cedula": "0912345678",
      "nombre": "Carlos Mendoza",
      "correo": "carlos.mendoza@montepiedra.edu.ec",
      "rol": "alumno",
      "es_primer_ingreso": true
    },
    {
      "id": "71796f2a-4e52-53d3-c0b7-e82840967c33",
      "cedula": "0987654321",
      "nombre": "Juan Pérez",
      "correo": "juan.perez@montepiedra.edu.ec",
      "rol": "alumno",
      "es_primer_ingreso": true
    }
  ]
}
```

##### ❌ Respuestas de Error

###### Error 400 - Bad Request (Estructura de nómina inválida o campos faltantes)
```json
{
  "error": "El campo 'nomina' es obligatorio y debe ser un arreglo con al menos un usuario."
}
```

###### Error 403 - Forbidden (Permisos insuficientes)
```json
{
  "error": "Acceso denegado. Se requieren permisos de secretaría o administrador."
}
```

###### Error 500 - Internal Server Error (Error al insertar en base de datos)
```json
{
  "error": "Error interno del servidor al registrar la nómina en la base de datos",
  "details": "Mensaje técnico detallado del error"
}
```

---

#### 2. Registro Manual de Usuario Individual

Permite registrar manualmente a un nuevo usuario en la plataforma. Encripta la cédula con `bcrypt` para su contraseña inicial y establece `es_primer_ingreso: true`.

- **Método:** `POST`
- **Ruta:** `/usuarios`
- **Encabezados requeridos:** 
  * `Content-Type: application/json`
  * `x-user-role` (Valores permitidos: `secretaria`, `admin`)

##### 📥 JSON que debe enviar el Frontend (Request Body)

```json
{
  "cedula": "0923456789",
  "nombre": "Pedro Gómez",
  "correo": "pedro.gomez@montepiedra.edu.ec",
  "rol": "alumno"
}
```

##### 📤 Respuestas de Éxito (Status 201 Created)

```json
{
  "message": "Usuario registrado exitosamente",
  "usuario": {
    "id": "82807g3b-5f63-64e4-d1c8-f93951078d44",
    "cedula": "0923456789",
    "nombre": "Pedro Gómez",
    "correo": "pedro.gomez@montepiedra.edu.ec",
    "rol": "alumno",
    "es_primer_ingreso": true,
    "foto_url": null
  }
}
```

##### ❌ Respuestas de Error

###### Error 400 - Bad Request (Faltan campos obligatorios)
```json
{
  "error": "El campo 'cedula' es obligatorio."
}
```

###### Error 403 - Forbidden (Permisos insuficientes)
```json
{
  "error": "Acceso denegado. Se requieren permisos de secretaría o administrador."
}
```

###### Error 500 - Internal Server Error
```json
{
  "error": "Error interno del servidor al crear el usuario",
  "details": "Mensaje técnico detallado del error"
}
```

---

#### 3. Obtener Usuarios (con filtro opcional por rol)

Permite recuperar la lista de usuarios registrados. Soporta el parámetro opcional `?rol=valor` en la URL para filtrar por roles como `alumno`, `profesor`, `secretaria` o `admin`. Por motivos de seguridad, nunca se retorna el hash de la contraseña.

- **Método:** `GET`
- **Ruta:** `/usuarios` o `/usuarios?rol=alumno`
- **Encabezados requeridos:** 
  * `x-user-role` (Valores permitidos: `secretaria`, `admin`)

##### 📤 Respuestas de Éxito (Status 200 OK)

```json
[
  {
    "id": "60685e1f-3d41-42c2-b9a6-d71739856b22",
    "cedula": "0912345678",
    "nombre": "Carlos Mendoza",
    "correo": "carlos.mendoza@montepiedra.edu.ec",
    "rol": "alumno",
    "foto_url": "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Carlos",
    "es_primer_ingreso": false,
    "created_at": "2026-06-25T02:01:15.123Z"
  },
  {
    "id": "71796f2a-4e52-53d3-c0b7-e82840967c33",
    "cedula": "0987654321",
    "nombre": "Juan Pérez",
    "correo": "juan.perez@montepiedra.edu.ec",
    "rol": "alumno",
    "foto_url": "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Juan",
    "es_primer_ingreso": true,
    "created_at": "2026-06-25T02:05:00.000Z"
  }
]
```

##### ❌ Respuestas de Error

###### Error 403 - Forbidden (Permisos insuficientes)
```json
{
  "error": "Acceso denegado. Se requieren permisos de secretaría o administrador."
}
```

###### Error 500 - Internal Server Error
```json
{
  "error": "Error interno del servidor al obtener los usuarios",
  "details": "Mensaje técnico detallado del error"
}
```

---

#### 4. Eliminar Usuario

Permite eliminar el registro de un usuario en el sistema a través de su identificador UUID.

- **Método:** `DELETE`
- **Ruta:** `/usuarios/:id`
- **Encabezados requeridos:** 
  * `x-user-role` (Valores permitidos: `secretaria`, `admin`)

##### 📤 Respuestas de Éxito (Status 200 OK)

```json
{
  "message": "Usuario eliminado exitosamente",
  "usuario": {
    "id": "60685e1f-3d41-42c2-b9a6-d71739856b22",
    "cedula": "0912345678",
    "nombre": "Carlos Mendoza",
    "correo": "carlos.mendoza@montepiedra.edu.ec",
    "rol": "alumno"
  }
}
```

##### ❌ Respuestas de Error

###### Error 403 - Forbidden (Permisos insuficientes)
```json
{
  "error": "Acceso denegado. Se requieren permisos de secretaría o administrador."
}
```

###### Error 404 - Not Found (Usuario inexistente)
```json
{
  "error": "No se encontró ningún usuario con el ID proporcionado."
}
```

###### Error 500 - Internal Server Error
```json
{
  "error": "Error interno del servidor al eliminar el usuario",
  "details": "Mensaje técnico detallado del error"
}
```

---

#### 5. Actualizar Foto de Perfil

Permite a secretaría y administradores actualizar la dirección URL de la foto de perfil para un usuario determinado.

- **Método:** `PUT`
- **Ruta:** `/usuarios/:id/foto`
- **Encabezados requeridos:** 
  * `Content-Type: application/json`
  * `x-user-role` (Valores permitidos: `secretaria`, `admin`)

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
```json
{
  "error": "Acceso denegado. Se requieren permisos de secretaría o administrador."
}
```

###### Error 404 - Not Found (Usuario inexistente)
```json
{
  "error": "El usuario especificado no existe."
}
```

###### Error 500 - Internal Server Error
```json
{
  "error": "Error interno del servidor al actualizar la foto de perfil",
  "details": "Mensaje técnico detallado del error"
}
```

---

### 🔐 Módulo de Autenticación y Primer Ingreso

Este módulo gestiona la autenticación de usuarios por número de cédula y el flujo de configuración de contraseñas para el primer ingreso a la plataforma.

#### 1. Iniciar Sesión (Login)

Permite autenticar a un usuario mediante su número de cédula y contraseña, distinguiendo si es su primer ingreso a la plataforma para redirigirlo a la configuración de credenciales.

- **Método:** `POST`
- **Ruta:** `/auth/login`
- **Encabezado requerido:** `Content-Type: application/json`

##### 📥 JSON que debe enviar el Frontend (Request Body)

###### Para inicio de sesión regular:
```json
{
  "cedula": "0912345678",
  "password": "miPasswordSegura123"
}
```

###### Para verificar estado de primer ingreso (la contraseña es opcional si es primer ingreso):
```json
{
  "cedula": "0912345678"
}
```

##### 📤 Respuestas de Éxito (Status 200 OK)

###### Caso 1: Primer Ingreso (`es_primer_ingreso: true`)
Si el usuario ingresa por primera vez, el backend responde con `requiere_configuracion: true` junto a los datos del usuario para que el frontend lo redirija a la pantalla de configuración de contraseña:

```json
{
  "message": "Primer ingreso detectado. Se requiere configurar la contraseña.",
  "requiere_configuracion": true,
  "usuario": {
    "id": "60685e1f-3d41-42c2-b9a6-d71739856b22",
    "cedula": "0912345678",
    "nombre": "Carlos Mendoza",
    "correo": "carlos.mendoza@montepiedra.edu.ec",
    "rol": "alumno",
    "foto_url": "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Carlos"
  }
}
```

###### Caso 2: Ingreso Regular Exitoso (`es_primer_ingreso: false`)
Si el usuario ya configuró su contraseña previamente y el hash coincide mediante `bcrypt.compare`:

```json
{
  "message": "Inicio de sesión exitoso",
  "requiere_configuracion": false,
  "usuario": {
    "id": "60685e1f-3d41-42c2-b9a6-d71739856b22",
    "cedula": "0912345678",
    "nombre": "Carlos Mendoza",
    "correo": "carlos.mendoza@montepiedra.edu.ec",
    "rol": "alumno",
    "foto_url": "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Carlos"
  }
}
```

##### ❌ Respuestas de Error

###### Error 400 - Bad Request (Faltan campos obligatorios)
Se devuelve si no se proporciona el número de cédula o la contraseña en un inicio de sesión regular:

```json
{
  "error": "El campo 'cedula' es obligatorio."
}
```
o
```json
{
  "error": "El campo 'password' es obligatorio para el inicio de sesión regular."
}
```

###### Error 401 - Unauthorized (Contraseña incorrecta o credenciales inválidas)
Se devuelve cuando las credenciales no son válidas:

```json
{
  "error": "Credenciales inválidas. Contraseña incorrecta."
}
```

###### Error 404 - Not Found (Usuario no encontrado)
Se devuelve cuando no existe ningún usuario registrado con la cédula proporcionada:

```json
{
  "error": "Usuario no encontrado. Verifique la cédula ingresada."
}
```

###### Error 500 - Internal Server Error
Se devuelve ante fallos en la consulta a la base de datos o errores internos del servidor:

```json
{
  "error": "Error interno del servidor durante la autenticación",
  "details": "Mensaje técnico del error"
}
```

---

#### 2. Configurar Contraseña de Primer Ingreso

Permite al usuario registrar su contraseña definitiva durante su primer ingreso al sistema. Ofrece la opción de crear una nueva clave personalizada o conservar su número de cédula como contraseña.

- **Método:** `POST`
- **Ruta:** `/auth/primer-ingreso`
- **Encabezado requerido:** `Content-Type: application/json`

##### 📥 JSON que debe enviar el Frontend (Request Body)

###### Opción A: Crear una nueva contraseña personalizada
```json
{
  "cedula": "0912345678",
  "nueva_password": "miNuevaPasswordSegura2026",
  "conservar_cedula": false
}
```

###### Opción B: Conservar la cédula como contraseña
```json
{
  "cedula": "0912345678",
  "conservar_cedula": true
}
```

##### 📤 Respuestas de Éxito (Status 200 OK)

Si la contraseña se encripta con `bcrypt` (10 salt rounds) y se actualiza correctamente en Supabase (estableciendo `es_primer_ingreso: false`):

```json
{
  "message": "Contraseña configurada exitosamente. Ya puede iniciar sesión.",
  "usuario": {
    "id": "60685e1f-3d41-42c2-b9a6-d71739856b22",
    "cedula": "0912345678",
    "nombre": "Carlos Mendoza",
    "correo": "carlos.mendoza@montepiedra.edu.ec",
    "rol": "alumno"
  }
}
```

##### ❌ Respuestas de Error

###### Error 400 - Bad Request (Datos inválidos o incompletos)
Se devuelve cuando falta la cédula o cuando `conservar_cedula` es `false` y no se envió `nueva_password`:

```json
{
  "error": "Debe proporcionar el campo 'nueva_password' o marcar 'conservar_cedula' como verdadero."
}
```

###### Error 404 - Not Found (Usuario inexistente)
Se devuelve cuando la cédula no corresponde a ningún usuario registrado:

```json
{
  "error": "Usuario no encontrado. Verifique la cédula proporcionada."
}
```

###### Error 500 - Internal Server Error
Se devuelve ante fallos al guardar el hash en Supabase o errores inesperados:

```json
{
  "error": "Error al actualizar la contraseña del usuario en la base de datos",
  "details": "Mensaje técnico del error"
}
```

