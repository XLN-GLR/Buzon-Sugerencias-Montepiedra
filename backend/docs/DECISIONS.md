# DECISIONS: Architecture Decision Records (ADRs) - Backend

Este documento registra las decisiones arquitectónicas fundamentales y permanentes tomadas para el desarrollo del backend del Buzón de Sugerencias Montepiedra.

---

## ADR-001: Adopción de Express.js con Node.js ES Modules
- **Estado:** Aceptado / En Producción
- **Contexto:** Se necesitaba un servidor REST ligero, eficiente, de rápida configuración y compatible con el ecosistema JavaScript moderno utilizado también en el frontend.
- **Decisión:** Utilizar Express.js v4 configurado con módulos nativos de ECMAScript (`"type": "module"` en `package.json`).
- **Consecuencias Positivas:**
  - Sintaxis homogénea (`import/export`) en todo el repositorio.
  - Baja curva de aprendizaje y alta compatibilidad con middlewares estándar (`cors`, `dotenv`).
  - Excelente rendimiento y mínima sobrecarga de memoria para el entorno local y de producción.

---

## ADR-002: Persistencia Relacional con Supabase (PostgreSQL BaaS)
- **Estado:** Aceptado / En Producción
- **Contexto:** Se requería una base de datos relacional potente con soporte para claves foráneas, integridad referencial y panel de administración en la nube sin la complejidad de gestionar servidores PostgreSQL locales dedicados.
- **Decisión:** Integrar Supabase a través del SDK oficial `@supabase/supabase-js`.
- **Consecuencias Positivas:**
  - Acceso inmediato a PostgreSQL administrado con capacidades de Row-Level Security (RLS).
  - Capacidad de consultar y mutar datos con una API fluida y tipada.
  - Facilidad de escalado y respaldos automáticos en la nube.

---

## ADR-003: Validación Obligatoria de Cédula Ecuatoriana mediante Módulo 10
- **Estado:** Aceptado / En Producción
- **Contexto:** En el registro de nómina y autenticación institucional, se detectaban cédulas ficticias o incompletas introducidas en pruebas de usuario.
- **Decisión:** Implementar la función `validateEcuadorianCedula` en el backend, aplicando el algoritmo matemático oficial de Módulo 10 tanto en `/auth/login`, `/auth/primer-ingreso` y `/usuarios`.
- **Consecuencias Positivas:**
  - Garantiza la validez legal y matemática de cada identidad registrada en la base de datos institucional.
  - Previene duplicidad de registros basada en cédulas adulteradas.

---

## ADR-004: Moderación Léxica Preventiva en Capa de Negocio
- **Estado:** Superado por ADR-007
- **Contexto:** Al ser una plataforma educativa para estudiantes, existía el riesgo de ingresos de sugerencias con lenguaje ofensivo o inapropiado.
- **Decisión Inicial:** Implementar una búsqueda simple de subcadenas con `FORBIDDEN_WORDS.some(word => lower.includes(word))` en `POST /sugerencias`.
- **Consecuencias:** Aunque bloqueaba insultos básicos, introdujo graves falsos positivos en palabras académicas legítimas como "computadora", "disputa", "calcular" y "reputación".

---

## ADR-005: Autorización Basada en Roles con Encabezado `x-user-role`
- **Estado:** Aceptado / En Producción
- **Contexto:** Se necesitaba una forma ágil y desacoplada de propagar el rol del usuario desde el frontend o herramientas de desarrollo hacia el backend, evitando la complejidad de decodificación de tokens asimétricos durante las etapas de desarrollo y testing.
- **Decisión:** Utilizar el encabezado HTTP `x-user-role` normalizado por la función `normalizeRole()`.
- **Consecuencias Positivas:**
  - Pruebas inmediatas y legibles en `pruebas.http` cambiando únicamente el valor de la cabecera.
  - Simplicidad en la integración cliente-servidor manteniendo el control de acceso en cada endpoint.

---

## ADR-006: Preservación de Historial con `ON DELETE SET NULL`
- **Estado:** Aceptado / En Producción
- **Contexto:** Si un estudiante se gradúa o se elimina su cuenta de usuario de la nómina, las sugerencias comunitarias o tareas de infraestructura reportadas por él no deben desaparecer de la base de datos.
- **Decisión:** Configurar las relaciones foráneas de `usuario_id` en `sugerencias` para establecerse en `NULL` al borrar el usuario, y proveer la etiqueta 'Usuario eliminado' al cliente.
- **Consecuencias Positivas:**
  - Conservación íntegra de la memoria histórica y trazabilidad de obras institucionales.

---

## ADR-007: Motor Híbrido de Moderación Léxica (Tokenización, Leetspeak y API PurgoMalum)
- **Estado:** Aceptado / En Producción (2026-10-21)
- **Contexto:** El enfoque ingenuo por subcadenas de ADR-004 bloqueaba sugerencias válidas como "Mejorar la red del laboratorio de computadoras" debido a la presencia de la subcadena "puta" en "computadoras".
- **Decisión:** Sustituir la búsqueda por subcadena por un motor híbrido asíncrono (`hasProfanity`):
  1. **Normalización NFD:** Descomposición de caracteres Unicode para retirar acentos y tildes sin alterar consonantes.
  2. **Decodificación Leetspeak:** Sustitución de caracteres camuflados (`@` -> `a`, `3` -> `e`, `1` -> `i`, `0` -> `o`, `$` -> `s`).
  3. **Tokenización por Palabras Completas:** Uso de `leo-profanity` configurado con modismos locales ecuatorianos (`cojudo`, `verga`, `chucha`, etc.) evaluando límites de palabra (`\b`), garantizando cero falsos positivos en términos como "computadora", "disputa", "reputación" o "calcular".
  4. **Fallback / API Externa de PurgoMalum:** Consulta asíncrona a la API de PurgoMalum para capturar insultos complejos y en inglés, protegida con `AbortController` y timeout estricto de 2.5 segundos para no degradar el tiempo de respuesta del servidor en caso de fallos de red.
- **Consecuencias Positivas:**
  - Erradicación total de falsos positivos en el vocabulario escolar y técnico.
  - Detección precisa de lenguaje ofensivo tanto en español como en inglés, inclusive con ofuscación leetspeak.
  - Resiliencia asegurada: si PurgoMalum no responde en 2.5s, el filtro local toma la decisión sin bloquear la petición.
