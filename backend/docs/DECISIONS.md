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
- **Estado:** Aceptado / En Producción
- **Contexto:** Al ser una plataforma educativa para estudiantes, existía el riesgo de ingresos de sugerencias con lenguaje ofensivo o inapropiado.
- **Decisión:** Implementar la función `hasProfanity` con una lista negra de términos comunes (`FORBIDDEN_WORDS`) en `POST /sugerencias`.
- **Consecuencias Positivas:**
  - Bloqueo inmediato en el backend con respuesta HTTP `400 Bad Request` sin persistir contenido degradante en la base de datos.
  - Disminución de la carga de trabajo del moderador institucional.

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
