import assert from 'node:assert';
import { hasProfanity } from '../profanityFilter.js';

async function runTests() {
  console.log('🧪 Ejecutando suite de pruebas para hasProfanity (Solución definitiva Problema de Scunthorpe)...\n');

  const testCases = [
    // ------------------------------------------------------------------------
    // 1. PALABRAS LEGÍTIMAS (Deben retornar FALSE - CERO Falsos Positivos)
    // ------------------------------------------------------------------------
    { text: 'Computadora', expected: false, desc: 'Capitalización estándar "Computadora"' },
    { text: 'computadora', expected: false, desc: 'Minúsculas "computadora"' },
    { text: 'COMPUTADORA', expected: false, desc: 'Mayúsculas completas "COMPUTADORA"' },
    { text: 'computadoras', expected: false, desc: 'Plural "computadoras"' },
    { text: 'computador', expected: false, desc: 'Singular "computador"' },
    { text: 'computadores', expected: false, desc: 'Plural "computadores"' },
    { text: 'disputa', expected: false, desc: 'Palabra legítima "disputa"' },
    { text: 'disputas', expected: false, desc: 'Plural "disputas"' },
    { text: 'reputación', expected: false, desc: 'Palabra legítima "reputación" con tilde' },
    { text: 'reputacion', expected: false, desc: 'Palabra legítima "reputacion" sin tilde' },
    { text: 'reputaciones', expected: false, desc: 'Plural "reputaciones"' },
    { text: 'diputado', expected: false, desc: 'Palabra legítima "diputado"' },
    { text: 'diputados', expected: false, desc: 'Plural "diputados"' },
    { text: 'diputada', expected: false, desc: 'Femenino "diputada"' },
    { text: 'asno', expected: false, desc: 'Palabra legítima "asno"' },
    { text: 'asnos', expected: false, desc: 'Plural legítimo "asnos"' },
    { text: 'calcular', expected: false, desc: 'Palabra legítima "calcular"' },
    { text: 'calculadora', expected: false, desc: 'Palabra legítima "calculadora"' },
    { text: 'acumular', expected: false, desc: 'Palabra legítima "acumular"' },
    { text: 'institucional', expected: false, desc: 'Palabra legítima "institucional"' },
    { text: 'escupitajo', expected: false, desc: 'Palabra legítima "escupitajo"' },
    { text: 'Mejorar la red del laboratorio de computadoras', expected: false, desc: 'Frase con computadoras' },
    { text: 'El diputado participó en la disputa por el presupuesto', expected: false, desc: 'Frase con diputado y disputa' },
    { text: 'aula 4 piso 3', expected: false, desc: 'Números aislados sin alteración leet' },

    // ------------------------------------------------------------------------
    // 2. REGLA 2: CAMUFLAJE POR MAYÚSCULAS/MINÚSCULAS (Case-Transition Splitting)
    // ------------------------------------------------------------------------
    { text: 'comPUTAdora', expected: true, desc: 'Insulto incrustado en mayúsculas "comPUTAdora"' },
    { text: 'disPUTA', expected: true, desc: 'Insulto incrustado en mayúsculas "disPUTA"' },
    { text: 'rePUTAción', expected: true, desc: 'Insulto incrustado en mayúsculas "rePUTAción"' },
    { text: 'diPUTAdo', expected: true, desc: 'Insulto incrustado en mayúsculas "diPUTAdo"' },

    // ------------------------------------------------------------------------
    // 3. REGLA 3: TOKENIZACIÓN Y SEPARADORES (Símbolos, puntos, guiones y deletreo espaciado)
    // ------------------------------------------------------------------------
    { text: 'com-puta-dora', expected: true, desc: 'Separado por guiones "com-puta-dora"' },
    { text: 'com.puta.dora', expected: true, desc: 'Separado por puntos "com.puta.dora"' },
    { text: 'p.u.t.a', expected: true, desc: 'Deletreo punteado "p.u.t.a"' },
    { text: 'p u t a', expected: true, desc: 'Deletreo espaciado "p u t a"' },
    { text: 'p-u-t-a', expected: true, desc: 'Deletreo con guion "p-u-t-a"' },
    { text: 'p_u_t_a', expected: true, desc: 'Deletreo con guion bajo "p_u_t_a"' },
    { text: 'p . u . t . a', expected: true, desc: 'Deletreo combinado espacio y punto "p . u . t . a"' },
    { text: 'm i e r d a', expected: true, desc: 'Deletreo espaciado "m i e r d a"' },
    { text: 'h.d.p', expected: true, desc: 'Abreviatura punteada "h.d.p"' },

    // ------------------------------------------------------------------------
    // 4. REGLA 4: LEETSPEAK Y REPETICIÓN EXCESIVA DE LETRAS
    // ------------------------------------------------------------------------
    { text: 'p3nd3j0', expected: true, desc: 'Leetspeak completo "p3nd3j0"' },
    { text: 'p3nd3jo', expected: true, desc: 'Leetspeak parcial "p3nd3jo"' },
    { text: 'm1erd@', expected: true, desc: 'Leetspeak "m1erd@"' },
    { text: 'put@', expected: true, desc: 'Leetspeak "put@"' },
    { text: 'c0judo', expected: true, desc: 'Leetspeak "c0judo"' },
    { text: 'c0jud0', expected: true, desc: 'Leetspeak "c0jud0"' },
    { text: 'v3rg@', expected: true, desc: 'Leetspeak "v3rg@"' },
    { text: 'v3rg@s', expected: true, desc: 'Leetspeak plural "v3rg@s"' },
    { text: 'puuuuta', expected: true, desc: 'Alargamiento intencional "puuuuta"' },
    { text: 'puuuutaaaa', expected: true, desc: 'Alargamiento múltiple "puuuutaaaa"' },
    { text: 'zoooorrrraaaa', expected: true, desc: 'Alargamiento con "rr" "zoooorrrraaaa"' },

    // ------------------------------------------------------------------------
    // 5. INSULTOS DIRECTOS Y FRASES COMPUESTAS
    // ------------------------------------------------------------------------
    { text: 'puta', expected: true, desc: 'Insulto directo "puta"' },
    { text: 'puto', expected: true, desc: 'Insulto directo "puto"' },
    { text: 'mierda', expected: true, desc: 'Insulto directo "mierda"' },
    { text: 'pendejo', expected: true, desc: 'Insulto directo "pendejo"' },
    { text: 'cojudo', expected: true, desc: 'Modismo ecuatoriano "cojudo"' },
    { text: 'verga', expected: true, desc: 'Modismo ecuatoriano "verga"' },
    { text: 'chucha', expected: true, desc: 'Modismo ecuatoriano "chucha"' },
    { text: 'hdp', expected: true, desc: 'Abreviatura ofensiva "hdp"' },
    { text: 'HDP', expected: true, desc: 'Abreviatura ofensiva mayúscula "HDP"' },
    { text: 'hijo de puta', expected: true, desc: 'Frase compuesta "hijo de puta"' },
    { text: 'concha de tu madre', expected: true, desc: 'Frase compuesta "concha de tu madre"' },
    { text: 'fuck you', expected: true, desc: 'Insulto en inglés "fuck you"' },

    // ------------------------------------------------------------------------
    // 6. ENTRADAS VACÍAS O NULAS
    // ------------------------------------------------------------------------
    { text: '', expected: false, desc: 'Cadena vacía' },
    { text: '   ', expected: false, desc: 'Solo espacios en blanco' },
    { text: null, expected: false, desc: 'Valor null' },
    { text: undefined, expected: false, desc: 'Valor undefined' }
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
