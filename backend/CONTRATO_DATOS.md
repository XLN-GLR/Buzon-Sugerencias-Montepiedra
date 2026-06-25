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
  "usuario_id": "60685e1f-3d41-42c2-b9a6-d71739856b22"
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
    "usuario_id": "60685e1f-3d41-42c2-b9a6-d71739856b22"
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

###### Error 500 - Internal Server Error
Se devuelve cuando ocurre un fallo interno en el servidor o un error de base de datos (por ejemplo, errores de claves foráneas o políticas de seguridad RLS):

```json
{
  "error": "Error interno del servidor al crear la sugerencia",
  "details": "new row violates row-level security policy for table \"sugerencias\""
}
```
