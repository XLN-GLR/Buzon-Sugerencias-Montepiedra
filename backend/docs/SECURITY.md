# SECURITY: Políticas y Prácticas de Seguridad en el Backend

## 1. Principios de Seguridad del Backend
El backend del Buzón de Sugerencias Montepiedra actúa como la primera línea de defensa para la persistencia y la lógica institucional, implementando el principio de menor privilegio, validación estricta de entradas y resguardo de la privacidad de la comunidad estudiantil.

---

## 2. Checklist de Seguridad Implementado

### A. Validación Estricta de Entradas (Input Validation)
- [x] **Algoritmo de Módulo 10 para Cédulas Ecuatorianas:**
  - Valida longitud exacta de 10 caracteres numéricos.
  - Verifica código de provincia válido (01 a 24 o 30).
  - Valida que el tercer dígito corresponda a persona natural (< 6).
  - Aplica coeficientes `[2, 1, 2, 1, 2, 1, 2, 1, 2]` y comprueba el décimo dígito verificador.
  - Rechaza cualquier intento de inyección de valores adulterados antes de consultar la base de datos.
- [x] **Filtro de Contenido y Moderación Léxica:**
  - Array de palabras prohibidas (`FORBIDDEN_WORDS`) intercepta insultos y lenguaje soez.
  - Detiene inmediatamente la transacción retornando un código `400 Bad Request`.

### B. Criptografía y Gestión de Credenciales
- [x] **Almacenamiento Seguro de Contraseñas:**
  - Uso de biblioteca estándar de la industria `bcrypt`.
  - Factor de costo de hash (salt rounds): 10.
  - Cero contraseñas almacenadas en texto plano en la base de datos.
- [x] **Manejo de Variables de Entorno:**
  - Credenciales de Supabase (`SUPABASE_URL`, `SUPABASE_KEY`) inyectadas vía variables de entorno.
  - Verificación estricta al arranque en `config.js`: si faltan credenciales, el proceso no inicia.
  - El archivo `.env` está expresamente excluido en `.gitignore`.
  - Archivo `.env.example` provisto con valores ilustrativos sin exponer secretos.

### C. Control de Acceso y Autorización (RBAC)
- [x] **Verificación de Roles en Endpoints Sensibles:**
  - Endpoints de eliminación (`DELETE /sugerencias/:id`) y moderación oficial (`PATCH /sugerencias/:id/moderacion`) exigen rol de `admin`.
  - Gestión de nómina (`/usuarios`, `/usuarios/registro-masivo`) exige rol de `secretaria`.
  - Peticiones no autorizadas son interceptadas con código `403 Forbidden`.

### D. Privacidad y Anonimato de Datos
- [x] **Protección de Identidad Estudiantil:**
  - En la consulta general (`GET /sugerencias`), si una sugerencia posee `es_anonimo: true` y quien consulta no es `admin`, el objeto `usuarios` se reemplaza por `null`.
  - Impide que atacantes o terceros inspeccionen el tráfico de red para develar la identidad del alumno denunciante.

### E. Integridad de la Base de Datos (Supabase / PostgreSQL)
- [x] **Protección contra Cascadas Destructivas:**
  - Claves foráneas configuradas con `ON DELETE SET NULL` para preservar sugerencias históricas aun si el usuario es dado de baja institucionalmente.
  - Políticas de acceso RLS (Row-Level Security) en Supabase para proteger tablas contra lecturas anónimas directas no autorizadas.
