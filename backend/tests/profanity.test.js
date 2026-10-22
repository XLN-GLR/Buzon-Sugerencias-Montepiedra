import assert from 'node:assert';
import leoProfanity from 'leo-profanity';

// Replicar las estructuras del motor para validación exhaustiva
leoProfanity.loadDictionary('es');

const FORBIDDEN_WORDS = [
  'mierda', 'mierdas', 'mierdoso', 'mierdosa',
  'puto', 'putos', 'puta', 'putas', 'putita', 'putitas', 'putito', 'putitos', 'puton', 'putona', 'putones', 'putonas',
  'pendejo', 'pendejos', 'pendeja', 'pendejas', 'pendejada', 'pendejadas',
  'cabron', 'cabrones', 'cabrona', 'cabronas', 'cabronada',
  'estupido', 'estupidos', 'estupida', 'estupidas', 'estupidez',
  'idiota', 'idiotas', 'idiotez',
  'imbecil', 'imbeciles', 'imbecilidad',
  'tarado', 'tarada', 'tarados', 'taradas',
  'culiao', 'culiaos', 'culiado', 'culiados', 'culo', 'culos', 'culon', 'culona',
  'malparido', 'malparida', 'malparidos', 'malparidas',
  'maricon', 'maricones', 'marica', 'maricas', 'mariconada',
  'cojudo', 'cojudos', 'cojuda', 'cojudas', 'cojudez', 'cojudezas',
  'careverga', 'carevergas', 'carepicha', 'carechimba',
  'verga', 'vergas', 'vergazo', 'vergon',
  'chucha', 'chuchas', 'chuchatumadre', 'conchatumadre', 'conchetumadre',
  'webon', 'webona', 'webonada', 'huevon', 'huevona', 'huevada', 'huevadas',
  'bastardo', 'bastardos', 'bastarda', 'bastardas',
  'zorra', 'zorras',
  'perra', 'perras',
  'maldito', 'maldita', 'malditos', 'malditas',
  'pelotudo', 'pelotuda', 'pelotudos', 'pelotudas',
  'boludo', 'boluda', 'boludos', 'boludas',
  'chingar', 'chingada', 'chingado', 'chingados',
  'mamaguevo', 'mamahuevo', 'mamabicho', 'mamapinga',
  'gonorrea', 'gonorreas',
  'carajo', 'carajos',
  'hdp'
];

leoProfanity.add(FORBIDDEN_WORDS);
const FORBIDDEN_WORDS_SET = new Set(FORBIDDEN_WORDS);

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

const SAFE_WORDS_SET = new Set([
  'computadora', 'computadoras', 'computador', 'computadores',
  'disputa', 'disputas', 'disputar',
  'reputacion', 'reputaciones',
  'diputado', 'diputados', 'diputada', 'diputadas',
  'imputar', 'imputado', 'imputada', 'imputacion', 'imputaciones',
  'calcular', 'calculo', 'calculos', 'calculadora', 'calculadoras',
  'acumular', 'acumulacion', 'acumulado', 'acumulada', 'acumulados', 'acumuladas', 'acumulador',
  'institucional', 'institucionales', 'institucion', 'instituciones', 'instituto', 'institutos',
  'constitucion', 'constitucional', 'constitucionales',
  'titular', 'titulares', 'subtitulo', 'subtitulos',
  'aptitud', 'aptitudes', 'actitud', 'actitudes',
  'escupir', 'escupitajo'
]);

const normalizeText = (text) => {
  if (!text) return '';
  const lower = String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return lower.replace(/[a-z0-9@$]+/g, (token) => {
    if (/[a-z]/.test(token)) {
      return token
        .replace(/0/g, 'o')
        .replace(/1/g, 'i')
        .replace(/3/g, 'e')
        .replace(/4/g, 'a')
        .replace(/@/g, 'a')
        .replace(/\$/g, 's');
    }
    return token;
  });
};

const checkLocalProfanity = (normalizedText) => {
  if (FORBIDDEN_PHRASES.some(regex => regex.test(normalizedText))) {
    return true;
  }

  const tokens = normalizedText.split(/[^a-z0-9]+/).filter(Boolean);

  for (const token of tokens) {
    if (SAFE_WORDS_SET.has(token)) {
      continue;
    }

    if (FORBIDDEN_WORDS_SET.has(token) || leoProfanity.check(token)) {
      return true;
    }

    if (token.endsWith('es')) {
      const singularEs = token.slice(0, -2);
      if (FORBIDDEN_WORDS_SET.has(singularEs) || leoProfanity.check(singularEs)) {
        return true;
      }
    }
    if (token.endsWith('s')) {
      const singularS = token.slice(0, -1);
      if (FORBIDDEN_WORDS_SET.has(singularS) || leoProfanity.check(singularS)) {
        return true;
      }
    }
  }

  return false;
};

const checkPurgoMalumApi = async (texto) => {
  const textForApi = String(texto).replace(/\b[a-zA-ZáéíóúÁÉÍÓÚñÑ]+\b/g, (w) => {
    const norm = w.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return SAFE_WORDS_SET.has(norm) ? 'objeto' : w;
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const url = `https://www.purgomalum.com/service/containsprofanity?text=${encodeURIComponent(textForApi)}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const body = (await response.text()).trim().toLowerCase();
    return body === 'true';
  } catch (err) {
    clearTimeout(timeoutId);
    return null;
  }
};

async function hasProfanity(texto) {
  if (!texto || typeof texto !== 'string' || !texto.trim()) {
    return false;
  }

  const normalized = normalizeText(texto);

  if (checkLocalProfanity(normalized)) {
    return true;
  }

  const apiResult = await checkPurgoMalumApi(texto);
  if (apiResult === true) {
    return true;
  }

  return false;
}

async function runTests() {
  console.log('🧪 Ejecutando suite de pruebas para hasProfanity y prevención de falsos positivos...\n');

  const testCases = [
    // Palabras válidas que causaban falsos positivos (deben retornar false)
    { text: 'computadora', expected: false, desc: 'Palabra legítima "computadora"' },
    { text: 'computadoras', expected: false, desc: 'Plural legítimo "computadoras"' },
    { text: 'disputa', expected: false, desc: 'Palabra legítima "disputa"' },
    { text: 'reputación', expected: false, desc: 'Palabra legítima "reputación" con tilde' },
    { text: 'calcular', expected: false, desc: 'Palabra legítima "calcular"' },
    { text: 'acumular', expected: false, desc: 'Palabra legítima "acumular"' },
    { text: 'institucional', expected: false, desc: 'Palabra legítima "institucional"' },
    { text: 'Mejorar la red del laboratorio de computadoras', expected: false, desc: 'Frase completa con computadora' },
    { text: 'aula 4 piso 3', expected: false, desc: 'Números aislados sin alteración leet' },

    // Lenguaje inapropiado directo (debe retornar true)
    { text: 'puta', expected: true, desc: 'Insulto directo "puta"' },
    { text: 'puto', expected: true, desc: 'Insulto directo "puto"' },
    { text: 'mierda', expected: true, desc: 'Insulto directo "mierda"' },
    { text: 'pendejo', expected: true, desc: 'Insulto directo "pendejo"' },
    { text: 'cojudo', expected: true, desc: 'Modismo ecuatoriano "cojudo"' },
    { text: 'verga', expected: true, desc: 'Modismo ecuatoriano "verga"' },
    { text: 'chucha', expected: true, desc: 'Modismo ecuatoriano "chucha"' },
    { text: 'hijo de puta', expected: true, desc: 'Frase compuesta "hijo de puta"' },
    { text: 'fuck you', expected: true, desc: 'Insulto en inglés capturado por PurgoMalum' },

    // Lenguaje inapropiado camuflado con leetspeak (debe retornar true)
    { text: 'p3nd3jo', expected: true, desc: 'Leetspeak "p3nd3jo"' },
    { text: 'm1erd@', expected: true, desc: 'Leetspeak "m1erd@"' },
    { text: 'put@', expected: true, desc: 'Leetspeak "put@"' },
    { text: 'c0judo', expected: true, desc: 'Leetspeak "c0judo"' },
    { text: 'v3rg@', expected: true, desc: 'Leetspeak "v3rg@"' }
  ];

  let passed = 0;
  for (const tc of testCases) {
    const result = await hasProfanity(tc.text);
    assert.strictEqual(
      result,
      tc.expected,
      `Fallo en caso: "${tc.desc}" (Texto: "${tc.text}"). Esperado: ${tc.expected}, Obtenido: ${result}`
    );
    console.log(`  ✅ PASÓ: [${tc.expected ? 'BLOQUEADO' : 'PERMITIDO'}] "${tc.text}" - ${tc.desc}`);
    passed++;
  }

  console.log(`\n🎉 Todos los ${passed} casos de prueba se ejecutaron exitosamente con CERO falsos positivos.`);
}

runTests().catch(err => {
  console.error('\n❌ Error en la suite de pruebas:', err.message);
  process.exit(1);
});
