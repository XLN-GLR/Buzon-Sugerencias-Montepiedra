import leoProfanity from 'leo-profanity';
import { GoogleGenAI } from '@google/genai';

/**
 * ============================================================================
 * MOTOR ALGORÍTMICO LOCAL DE FILTRADO DE LENGUAJE OFENSIVO (COSTO CERO)
 * Solución definitiva al "Problema de Scunthorpe" y detección de evasiones.
 * ============================================================================
 */

// Inicializar diccionario de leo-profanity si está disponible
try {
  leoProfanity.loadDictionary('es');
} catch {
  // Manejo silencioso en caso de no estar disponible en el entorno
}

// 1. Listado completo de insultos en español y modismos locales (Ecuador y Latinoamérica)
const BASE_FORBIDDEN_WORDS = [
  'mierda', 'mierdoso',
  'puto', 'puta', 'putita', 'putito', 'puton', 'putona',
  'pendejo', 'pendeja', 'pendejada',
  'cabron', 'cabrona', 'cabronada',
  'estupido', 'estupida', 'estupidez',
  'idiota', 'idiotez',
  'imbecil', 'imbecilidad',
  'tarado', 'tarada',
  'culiao', 'culiaos', 'culiado', 'culiada', 'culo', 'culon', 'culona',
  'malparido', 'malparida',
  'maricon', 'maricona', 'marica', 'mariconada',
  'cojudo', 'cojuda', 'cojudez', 'cojudezas',
  'careverga', 'carepicha', 'carechimba',
  'verga', 'vergazo', 'vergon', 'vergona',
  'chucha', 'chuchatumadre', 'conchatumadre', 'conchetumadre',
  'webon', 'webona', 'webonada', 'huevon', 'huevona', 'huevada',
  'bastardo', 'bastarda',
  'zorra', 'zorrero',
  'perra',
  'maldito', 'maldita',
  'pelotudo', 'pelotuda', 'pelotudez',
  'boludo', 'boluda', 'boludez',
  'chingar', 'chingada', 'chingado', 'chinga', 'chingon',
  'mamaguevo', 'mamahuevo', 'mamabicho', 'mamapinga',
  'gonorrea',
  'carajo',
  'hdp', 'mrd', 'vrg', 'vrga', 'pto', 'pta', 'csm', 'alv',
  'gil', 'gilipollas', 'capullo',
  'chupaverga', 'chupamela', 'chupamelo', 'chupame', 'tragasables',
  'pinga', 'conchudo', 'conchuda', 'soplapollas', 'comemierda',
  'hijueputa', 'hijaputa', 'hijadeputa', 'hijodeputa'
];

// Palabras legítimas en español que jamás deben generar falsos positivos
// (incluye palabras que contienen subcadenas como 'puta', 'cum', 'tit', 'asno', etc.)
const SAFE_WORDS = [
  'computadora', 'computador', 'disputa', 'disputar',
  'reputacion', 'diputado', 'imputar', 'imputacion',
  'calcular', 'calculo', 'calculadora', 'acumular', 'acumulacion', 'acumulado', 'acumulador',
  'institucional', 'institucion', 'instituto', 'constitucion', 'constitucional',
  'titular', 'subtitulo', 'aptitud', 'actitud', 'escupir', 'escupitajo',
  'asno', 'negro', 'negra', 'sexo', 'tit'
];

// Helper para convertir a minúsculas y remover diacríticos / tildes (NFD)
const normalizeBasic = (str) => {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

// Generador de variantes morfológicas (singular, plural y género)
function expandGrammarVariants(word) {
  const norm = normalizeBasic(word);
  const variants = new Set([norm]);

  if (norm.endsWith('o')) {
    const stem = norm.slice(0, -1);
    variants.add(stem + 'a');
    variants.add(stem + 'os');
    variants.add(stem + 'as');
  } else if (norm.endsWith('a')) {
    const stem = norm.slice(0, -1);
    variants.add(norm + 's');
    variants.add(stem + 'o');
    variants.add(stem + 'os');
  } else if (norm.endsWith('on')) {
    const stem = norm.slice(0, -2);
    variants.add(norm + 'es');
    variants.add(stem + 'ona');
    variants.add(stem + 'onas');
    variants.add(stem + 'ones');
  } else if (norm.endsWith('z')) {
    const stem = norm.slice(0, -1);
    variants.add(stem + 'ces');
  } else if (/[bcdfghjklmnprstvwxyz]$/.test(norm)) {
    variants.add(norm + 'es');
    variants.add(norm + 's');
  } else {
    variants.add(norm + 's');
  }

  return Array.from(variants);
}

// ============================================================================
// CONSTRUCCIÓN DEL DICCIONARIO BAD_WORDS_SET (O(1) Exact Match)
// ============================================================================
export const BAD_WORDS_SET = new Set();

// 1. Integrar diccionario de leo-profanity
try {
  const leoList = leoProfanity.list() || [];
  for (const w of leoList) {
    const norm = normalizeBasic(w);
    // Filtrar términos demasiado cortos o palabras legítimas del español
    if (norm && norm.length > 2) {
      BAD_WORDS_SET.add(norm);
    }
  }
} catch {
  // Ignorar si leo-profanity no inicializa lista
}

// 2. Integrar modismos en español con todas sus variantes de género y número
for (const baseWord of BASE_FORBIDDEN_WORDS) {
  const expanded = expandGrammarVariants(baseWord);
  for (const item of expanded) {
    BAD_WORDS_SET.add(item);
  }
}

// 3. Garantizar que palabras legítimas nunca estén en BAD_WORDS_SET
for (const safe of SAFE_WORDS) {
  const safeExpanded = expandGrammarVariants(safe);
  for (const s of safeExpanded) {
    BAD_WORDS_SET.delete(s);
  }
}

// Frases obscenas compuestas evaluadas con delimitadores de palabra (\b)
const FORBIDDEN_PHRASES = [
  /\bhijo\s+de\s+puta\b/i,
  /\bhija\s+de\s+puta\b/i,
  /\bhijos\s+de\s+puta\b/i,
  /\bhijas\s+de\s+puta\b/i,
  /\bconcha\s+de\s+tu\s+madre\b/i,
  /\bchucha\s+de\s+tu\s+madre\b/i,
  /\bmama\s+huevo\b/i,
  /\bmama\s+guevo\b/i
];

// Tabla de sustitución Leetspeak (0->o, 1->i, 3->e, 4->a, 5->s, 7->t, @->a, $->s)
const LEET_MAP = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  '$': 's'
};

const applyLeetspeak = (str) => {
  return str.replace(/[013457@$]/g, (ch) => LEET_MAP[ch] || ch);
};

/**
 * Regla 4: Normalización inteligente por Token (Leetspeak y colapso de repetición de letras)
 */
export function getTokenVariants(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') return [];

  const base = normalizeBasic(rawToken);
  const variants = new Set();
  variants.add(base);

  // Variante con sustitución Leetspeak
  const leet = applyLeetspeak(base);
  variants.add(leet);

  // Para cada forma base y leet, generar versiones con colapso de letras repetidas
  for (const str of Array.from(variants)) {
    // Reducción de 2 o más letras repetidas a 1 sola (ej. puuuutaaaa -> puta)
    const collapsedSingle = str.replace(/(.)\1+/g, (_, c) => c);
    variants.add(collapsedSingle);

    // Reducción preservando 'rr' o 'll' si se repiten 2 o más veces (ej. zoooorrrraaaa -> zorra)
    const collapsedDoubleR = str
      .replace(/([^rl])\1+/g, (_, c) => c)
      .replace(/([rl])\1+/g, (_, c) => c + c);
    variants.add(collapsedDoubleR);
  }

  return Array.from(variants);
}

// Patrones de formato normal según Regla 2
const PATTERN_LOWERCASE = /^[a-záéíóúüñ0-9]+$/;
const PATTERN_UPPERCASE = /^[A-ZÁÉÍÓÚÜÑ0-9]+$/;
const PATTERN_TITLECASE = /^[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ0-9]+$/;

export function isNormalCasing(word) {
  return PATTERN_LOWERCASE.test(word) || PATTERN_UPPERCASE.test(word) || PATTERN_TITLECASE.test(word);
}

// Regla 3: Detección de evasión por deletreo espaciado o punteado
const SPACED_SPELLING_REGEX = /\b([a-zA-ZáéíóúüñÁÉÍÓÚÜÑ][\s.\-_*\/~|]+){2,}[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]\b/g;

// ============================================================================
// CAPA DE INTELIGENCIA ARTIFICIAL (Google Gemini Flash)
// ============================================================================
let geminiClient = null;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey: apiKey.trim() });
  }
  return geminiClient;
}

/**
 * Consulta semántica a Google Gemini Flash con timeout estricto de 2.5s mediante AbortController.
 * Devuelve boolean (true = ofensivo, false = permitido) o null si falla.
 */
async function checkGeminiProfanity(texto) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) return null;

  const controller = new AbortController();
  const timeoutMs = 2500;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const ai = getGeminiClient();
    if (!ai) return null;

    const systemInstruction = `Eres un moderador estricto pero justo de lenguaje para una plataforma educativa institucional escolar (Buzón de Sugerencias Montepiedra).
Tu tarea es clasificar si el texto ingresado por un usuario contiene lenguaje inapropiado, ofensivo o institucionalmente inaceptable.

REGLAS DE CLASIFICACIÓN:
1. PERMITIR (is_inappropriate: false):
   - Palabras legítimas del español que contienen sílabas coincidentes con insultos (Problema de Scunthorpe): "Computadora", "computadora", "COMPUTADORA", "disputa", "reputación", "diputado", "cálculo", "acumular", "asno", etc.
   - Términos anatómicos o biológicos en contexto formal, biológico o neutro (pene, vagina, senos).
   - Sugerencias y críticas constructivas sobre las instalaciones o docentes expresadas con respeto.

2. BLOQUEAR (is_inappropriate: true):
   - Insultos, groserías, vulgaridades, descalificaciones, términos denigrantes u hostiles en español o inglés (puta, mierda, pendejo, cabrón, idiota, estúpido, etc.).
   - Modismos vulgares locales (cojudo, verga, chucha, huevón, etc.).
   - Evasiones deliberadas con mayúsculas anómalas para resaltar insultos dentro de palabras legítimas (ejemplo: "comPUTAdora", "disPUTA", "rePUTAción").
   - Evasiones por deletreo espaciado o punteado (p.u.t.a, p u t a, m i e r d a) o leetspeak (p3nd3jo).

Responde ÚNICAMENTE en formato JSON válido con la siguiente estructura exacta:
{ "is_inappropriate": boolean }`;

    const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

    const generatePromise = ai.models.generateContent({
      model: modelName,
      contents: String(texto),
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.1,
        abortSignal: controller.signal
      }
    });

    const timeoutPromise = new Promise((_, reject) => {
      controller.signal.addEventListener('abort', () => {
        reject(new Error(`Timeout de Gemini excedido (${timeoutMs}ms)`));
      });
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);
    clearTimeout(timeoutId);

    const rawText = response.text?.trim() || '{}';
    const parsed = JSON.parse(rawText);

    if (typeof parsed.is_inappropriate === 'boolean') {
      return parsed.is_inappropriate;
    }
    return null;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Motor algorítmico local de alta disponibilidad (Costo cero y Fallback resiliente).
 * Conserva intactas todas las reglas: Case-transition splitting, frases compuestas,
 * detección de deletreo espaciado/punteado, normalización NFD, leetspeak, colapso de
 * repeticiones y verificación O(1) con BAD_WORDS_SET.
 *
 * @param {string} texto
 * @returns {boolean}
 */
export function checkLocalProfanity(texto) {
  if (!texto || typeof texto !== 'string' || !texto.trim()) {
    return false;
  }

  const str = texto.trim();

  // ==========================================================================
  // PASO 1: ANÁLISIS DE MAYÚSCULAS ANÓMALAS (Case-Transition Splitting)
  // Se evalúa DIRECTAMENTE sobre el texto original antes de cualquier conversión a minúsculas
  // ==========================================================================
  const rawWords = str.split(/[^a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ@$]+/).filter(Boolean);

  for (const palabra of rawWords) {
    // Si la palabra NO cumple con el formato estándar (todo minúsculas, todo MAYÚSCULAS o Capitalizada)
    if (!isNormalCasing(palabra)) {
      const subTokens = palabra.match(/[A-ZÁÉÍÓÚÜÑ]+|[a-záéíóúüñ]+/g) || [];
      for (const subToken of subTokens) {
        const normSub = normalizeBasic(subToken);
        if (normSub && BAD_WORDS_SET.has(normSub)) {
          return true; // Bloqueo inmediato: insulto resaltado con mayúsculas anómalas
        }
        const subVariants = getTokenVariants(subToken);
        for (const variant of subVariants) {
          if (variant && BAD_WORDS_SET.has(variant)) {
            return true;
          }
        }
      }
    }
  }

  // ==========================================================================
  // PASO 2: VERIFICACIÓN DE FRASES COMPUESTAS OBSCENAS
  // ==========================================================================
  const normalizedStr = normalizeBasic(str);
  if (FORBIDDEN_PHRASES.some((regex) => regex.test(normalizedStr))) {
    return true;
  }

  const tokensToCheck = [];

  // ==========================================================================
  // PASO 3: DETECCIÓN DE DELETREO ESPACIADO O PUNTEADO (ej. p u t a, p.u.t.a)
  // ==========================================================================
  const spacedMatches = str.match(SPACED_SPELLING_REGEX);
  if (spacedMatches) {
    for (const match of spacedMatches) {
      const united = match.replace(/[\s.\-_*\/~|]+/g, '');
      if (united.length >= 3) {
        tokensToCheck.push(united);
      }
    }
  }

  // ==========================================================================
  // PASO 4: EVALUACIÓN ESTÁNDAR DE TOKENS (Palabras completas y variantes)
  // ==========================================================================
  for (const word of rawWords) {
    tokensToCheck.push(word);
  }

  // Evaluación de coincidencia exacta O(1) con BAD_WORDS_SET
  for (const token of tokensToCheck) {
    const variants = getTokenVariants(token);
    for (const variant of variants) {
      if (variant && BAD_WORDS_SET.has(variant)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Función principal para evaluar si un texto contiene lenguaje ofensivo o inapropiado.
 * 1. Capa IA: Si existe GEMINI_API_KEY, consulta semánticamente a Google Gemini Flash con timeout de 2.5s.
 * 2. Fallback de Alta Disponibilidad: Si no hay clave, o si Gemini falla/tarda, recurre al motor local existente.
 *
 * @param {string} texto
 * @returns {Promise<boolean>}
 */
export async function hasProfanity(texto) {
  if (!texto || typeof texto !== 'string' || !texto.trim()) {
    return false;
  }

  // 1. Capa IA: Si existe API key, consultar a Google Gemini Flash
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    try {
      const isBlocked = await checkGeminiProfanity(texto);
      if (typeof isBlocked === 'boolean') {
        return isBlocked;
      }
    } catch (err) {
      console.warn('[PROFANITY] Gemini falló o tardó demasiado, pasando al motor local existente:', err.message);
    }
  }

  // 2. Fallback de Alta Disponibilidad: Motor local existente
  return checkLocalProfanity(texto);
}

