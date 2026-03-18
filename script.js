/* ================================================================
   RULETA DE LA FELICIDAD — script.js
   ----------------------------------------------------------------
   Estructura de este archivo:
   1.  Datos editables: retos y mensajes "Y recuerda..."
   2.  Configuración de la ruleta (colores de segmentos, fuentes)
   3.  Referencias al DOM
   4.  Estado global de la app
   5.  Inicialización principal
   6.  Contador de personas felices (localStorage)
   7.  Dibujo de la ruleta con Canvas
   8.  Lógica del giro (animación)
   9.  Mostrar resultado
  10.  Resetear para nuevo giro
  11.  Confeti
  12.  Utilidades
================================================================ */


/* ================================================================
   1. DATOS EDITABLES
   ----------------------------------------------------------------
   Para personalizar la app, modifica los arreglos aquí abajo.
   Puedes añadir, quitar o cambiar cualquier elemento.
================================================================ */

/**
 * Lista de retos que aparecen en la ruleta.
 * Cada reto también es el texto que se muestra en el resultado.
 * Mantenlos cortos para que quepan bien en los segmentos.
 */
const RETOS = [
  "Sonríele a la siguiente persona que veas",
  "Mándale un mensaje bonito a alguien",
  "Tómate 2 min para respirar profundo",
  "Agradece algo que te haya pasado hoy",
  "Camina un minuto con actitud de protagonista",
  "Haz un cumplido sincero hoy",
  "Estírate y sigue conquistando el día",
  "Toma agua, programador feliz 💧",
  "Pregúntale a alguien cómo está, de verdad",
  "Ríete de algo, lo que sea",
];

/**
 * Lista de mensajes para la tarjeta "Y recuerda...".
 * Se elige uno al azar, independiente del reto obtenido.
 * Pueden ser más largos y emotivos.
 */
const MENSAJES_RECUERDA = [
  "…eres más capaz de lo que crees.",
  "…tu esfuerzo también cuenta aunque no siempre se vea.",
  "…hasta los mejores programas se construyen paso a paso.",
  "…descansar también es parte del progreso.",
  "…tu sonrisa puede mejorarle el día a alguien.",
  "…no tienes que resolver toda tu vida hoy.",
  "…vas mejor de lo que piensas.",
  "…incluso un pequeño momento feliz vale mucho.",
  "…los bugs de hoy son las historias de mañana.",
  "…el campus es mejor con gente como tú.",
];

/**
 * Colores de fondo para cada segmento de la ruleta.
 * El orden se repite cíclicamente si hay más retos que colores.
 * Todos son oscuros y vibrantes para contraste con texto blanco.
 */
const SEGMENT_COLORS = [
  "#f7c948",  /* Amarillo cálido */
  "#ff6b6b",  /* Coral */
  "#4ecdc4",  /* Turquesa */
  "#a78bfa",  /* Violeta */
  "#fb923c",  /* Naranja */
  "#34d399",  /* Verde menta */
  "#f472b6",  /* Rosa */
  "#60a5fa",  /* Azul */
  "#fbbf24",  /* Ámbar */
  "#818cf8",  /* Índigo */
];

/** Color del texto dentro de los segmentos de la ruleta */
const SEGMENT_TEXT_COLOR = "#1a1827";


/* ================================================================
   2. CONFIGURACIÓN DE LA RULETA
================================================================ */
const WHEEL_CONFIG = {
  /** Duración mínima del giro en milisegundos */
  spinDurationMin: 3000,
  /** Duración máxima del giro en milisegundos */
  spinDurationMax: 5000,
  /** Cantidad de vueltas completas mínimas antes de frenar */
  minFullRotations: 5,
  /** Fuente del texto en los segmentos */
  segmentFont: "bold 12px 'Nunito', sans-serif",
  /** Ancho máximo de caracteres por línea en segmentos */
  maxCharsPerLine: 12,
};


/* ================================================================
   3. REFERENCIAS AL DOM
================================================================ */
const canvas      = document.getElementById("wheel-canvas");
const ctx         = canvas.getContext("2d");
const spinBtn     = document.getElementById("spin-btn");
const resultSec   = document.getElementById("result-section");
const resultText  = document.getElementById("result-text");
const rememberTxt = document.getElementById("remember-text");
const counterNum  = document.getElementById("counter-number");


/* ================================================================
   4. ESTADO GLOBAL DE LA APP
================================================================ */
const state = {
  /** Ángulo actual de rotación de la ruleta en radianes */
  currentAngle: 0,
  /** Si la ruleta está girando ahora mismo */
  isSpinning: false,
  /** Índice del reto ganador tras el giro */
  winningIndex: -1,
};


/* ================================================================
   5. INICIALIZACIÓN
================================================================ */

/** Punto de entrada: se llama cuando el DOM está listo */
function init() {
  drawWheel(state.currentAngle);
  initCounter();
}

// Esperamos a que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", init);


/* ================================================================
   6. CONTADOR DE PERSONAS FELICES
   ----------------------------------------------------------------
   NOTA: Este contador es LOCAL (por navegador) usando localStorage.
   No puede sumar visitas reales de todos los estudiantes porque
   eso requiere un backend (servidor + base de datos).

   Para conectar un backend en el futuro:
   - Crea un endpoint POST /api/spin en tu servidor.
   - En la función incrementCounter(), reemplaza la lógica de
     localStorage por un fetch() a ese endpoint.
   - El servidor incrementa el contador global del día y lo devuelve.
   - Muestra el valor recibido en counterNum.textContent.

   Por ahora, el contador persiste entre recargas del mismo dispositivo
   y se reinicia automáticamente cuando cambia el día.
================================================================ */

const STORAGE_KEY_DATE    = "felicidad_fecha";
const STORAGE_KEY_COUNT   = "felicidad_contador";
const STORAGE_KEY_SPUN    = "felicidad_girado_hoy";

/** Lee el contador del día desde localStorage y lo muestra */
function initCounter() {
  const today          = getTodayString();
  const savedDate      = localStorage.getItem(STORAGE_KEY_DATE);

  // Si es un día diferente, reseteamos el contador y la bandera de giro
  if (savedDate !== today) {
    localStorage.setItem(STORAGE_KEY_DATE,  today);
    localStorage.setItem(STORAGE_KEY_COUNT, "0");
    localStorage.setItem(STORAGE_KEY_SPUN,  "false");
  }

  const savedCount = parseInt(localStorage.getItem(STORAGE_KEY_COUNT) || "0", 10);
  counterNum.textContent = savedCount;
}

/**
 * Incrementa el contador si la persona no ha girado hoy.
 * Llama a esto una sola vez por sesión de giro.
 */
function incrementCounter() {
  const hasSpunToday = localStorage.getItem(STORAGE_KEY_SPUN) === "true";

  if (!hasSpunToday) {
    let count = parseInt(localStorage.getItem(STORAGE_KEY_COUNT) || "0", 10);
    count += 1;
    localStorage.setItem(STORAGE_KEY_COUNT, String(count));
    localStorage.setItem(STORAGE_KEY_SPUN, "true");

    // Actualizar visualmente con animación
    animateCounterUpdate(count);
  }
}

/** Actualiza el número en pantalla con un pequeño efecto visual */
function animateCounterUpdate(newValue) {
  counterNum.textContent = newValue;
  counterNum.classList.remove("bump");
  // Forzamos reflow para reiniciar la animación si ya estaba activa
  void counterNum.offsetWidth;
  counterNum.classList.add("bump");

  // Quitamos la clase al terminar para poder reutilizarla
  counterNum.addEventListener("animationend", () => {
    counterNum.classList.remove("bump");
  }, { once: true });
}

/** Devuelve la fecha actual en formato YYYY-MM-DD */
function getTodayString() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Rellena con cero a la izquierda para fechas */
function pad(n) {
  return String(n).padStart(2, "0");
}


/* ================================================================
   7. DIBUJO DE LA RULETA CON CANVAS
================================================================ */

/**
 * Dibuja la ruleta completa en el canvas.
 * Se llama en la inicialización y en cada frame de la animación.
 *
 * @param {number} rotationAngle - Ángulo de rotación actual en radianes
 */
function drawWheel(rotationAngle) {
  const total    = RETOS.length;
  const arcSize  = (2 * Math.PI) / total;   // Ángulo de cada segmento
  const cx       = canvas.width  / 2;        // Centro X
  const cy       = canvas.height / 2;        // Centro Y
  const radius   = cx - 4;                   // Radio del círculo (con margen)

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dibujar cada segmento
  for (let i = 0; i < total; i++) {
    const startAngle = rotationAngle + i * arcSize;
    const endAngle   = startAngle + arcSize;
    const color      = SEGMENT_COLORS[i % SEGMENT_COLORS.length];

    // --- Fondo del segmento ---
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // --- Borde entre segmentos ---
    ctx.strokeStyle = "rgba(10,9,20,0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // --- Texto del segmento ---
    drawSegmentText(ctx, RETOS[i], cx, cy, radius, startAngle, arcSize);
  }

  // Centro decorativo (círculo oscuro)
  drawCenterHub(ctx, cx, cy);
}

/**
 * Dibuja el texto de un segmento, rotado y centrado en su arco.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text       - Texto del reto
 * @param {number} cx         - Centro X del canvas
 * @param {number} cy         - Centro Y del canvas
 * @param {number} radius     - Radio de la ruleta
 * @param {number} startAngle - Ángulo inicial del segmento
 * @param {number} arcSize    - Tamaño angular del segmento
 */
function drawSegmentText(ctx, text, cx, cy, radius, startAngle, arcSize) {
  const midAngle  = startAngle + arcSize / 2;  // Ángulo central del segmento
  const textRadius = radius * 0.62;            // Distancia del texto al centro

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(midAngle);

  ctx.font      = WHEEL_CONFIG.segmentFont;
  ctx.fillStyle = SEGMENT_TEXT_COLOR;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Partir el texto en líneas cortas para que quepa en el segmento
  const lines = wrapText(text, WHEEL_CONFIG.maxCharsPerLine);
  const lineHeight = 14;
  const totalHeight = lines.length * lineHeight;
  const startY = textRadius - totalHeight / 2 + lineHeight / 2;

  lines.forEach((line, idx) => {
    ctx.fillText(line, startY + idx * lineHeight, 0);
  });

  ctx.restore();
}

/**
 * Dibuja el "hub" central de la ruleta (círculo decorativo).
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx
 * @param {number} cy
 */
function drawCenterHub(ctx, cx, cy) {
  // Sombra
  ctx.shadowColor   = "rgba(0,0,0,0.5)";
  ctx.shadowBlur    = 12;

  // Círculo oscuro
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, 2 * Math.PI);
  ctx.fillStyle = "#0f0e17";
  ctx.fill();
  ctx.strokeStyle = "rgba(247, 201, 72, 0.6)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.shadowBlur = 0;

  // Emoji o símbolo central
  ctx.font = "20px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("⭐", cx, cy);
}

/**
 * Divide un texto largo en un array de líneas cortas.
 *
 * @param {string} text       - Texto a partir
 * @param {number} maxChars   - Caracteres máximos por línea
 * @returns {string[]}
 */
function wrapText(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (test.length <= maxChars) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}


/* ================================================================
   8. LÓGICA DEL GIRO
================================================================ */

/** Manejador del clic en el botón principal de girar */
function handleSpinClick() {
  if (state.isSpinning) return;

  // Ocultar resultado anterior si había alguno
  resultSec.classList.add("hidden");

  state.isSpinning = true;
  spinBtn.disabled = true;

  // Elegir segmento ganador al azar
  state.winningIndex = getRandomInt(0, RETOS.length - 1);

  // Calcular el ángulo final de rotación
  const totalSegments    = RETOS.length;
  const arcSize          = (2 * Math.PI) / totalSegments;

  // Ángulo al centro del segmento ganador (apuntando hacia arriba = -π/2)
  // El puntero está arriba, así que la ruleta debe girar hasta que ese
  // segmento quede exactamente debajo del puntero (ángulo -π/2).
  const targetAngleInWheel = -(state.winningIndex * arcSize + arcSize / 2);
  const pointer            = -Math.PI / 2;

  // Calculamos cuánto falta girar para llegar al segmento desde la posición actual
  let deltaToTarget = (pointer - targetAngleInWheel - state.currentAngle) % (2 * Math.PI);
  if (deltaToTarget < 0) deltaToTarget += 2 * Math.PI;

  // Sumamos vueltas completas para que se vea un giro largo
  const fullRotations = WHEEL_CONFIG.minFullRotations + getRandomInt(0, 3);
  const totalDelta    = fullRotations * 2 * Math.PI + deltaToTarget;

  const duration = getRandomInt(WHEEL_CONFIG.spinDurationMin, WHEEL_CONFIG.spinDurationMax);

  animateSpin(state.currentAngle, state.currentAngle + totalDelta, duration);
}

/**
 * Anima el giro de la ruleta usando requestAnimationFrame.
 * Usa una curva de easing (ease-out cúbica) para que decelere suavemente.
 *
 * @param {number} startAngle - Ángulo inicial (rad)
 * @param {number} endAngle   - Ángulo final (rad)
 * @param {number} duration   - Duración total en ms
 */
function animateSpin(startAngle, endAngle, duration) {
  const startTime = performance.now();

  function frame(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing: ease-out cúbica — empieza rápido y desacelera al final
    const eased    = 1 - Math.pow(1 - progress, 3);

    state.currentAngle = startAngle + (endAngle - startAngle) * eased;
    drawWheel(state.currentAngle);

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      // Normalizar el ángulo al rango [0, 2π] para futuros giros
      state.currentAngle = state.currentAngle % (2 * Math.PI);
      onSpinComplete();
    }
  }

  requestAnimationFrame(frame);
}

/** Se llama cuando la animación de giro termina */
function onSpinComplete() {
  state.isSpinning = false;
  spinBtn.disabled = false;

  // Incrementar el contador (solo la primera vez en el día)
  incrementCounter();

  // Mostrar resultado
  showResult(state.winningIndex);

  // Lanzar confeti 🎉
  launchConfetti();
}


/* ================================================================
   9. MOSTRAR RESULTADO
================================================================ */

/**
 * Muestra el reto ganador y un mensaje aleatorio de "Y recuerda...".
 *
 * @param {number} index - Índice del reto en el arreglo RETOS
 */
function showResult(index) {
  const reto     = RETOS[index];
  const recuerda = pickRandom(MENSAJES_RECUERDA);

  resultText.textContent  = reto;
  rememberTxt.textContent = recuerda;

  // Mostrar la sección con animación (removemos hidden y reiniciamos anim)
  resultSec.classList.remove("hidden");
  resultSec.style.animation = "none";
  void resultSec.offsetWidth;  // Forzar reflow para reiniciar animación CSS
  resultSec.style.animation = "";

  // Hacer scroll suave hasta el resultado en móvil
  setTimeout(() => {
    resultSec.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, 100);
}


/* ================================================================
  10. RESETEAR PARA NUEVO GIRO
================================================================ */

/**
 * Oculta el resultado y permite girar de nuevo.
 * No borra el contador (ya se registró el giro del día).
 */
function resetForNewSpin() {
  resultSec.classList.add("hidden");
  // Scroll suave de vuelta a la ruleta
  canvas.scrollIntoView({ behavior: "smooth", block: "center" });
}


/* ================================================================
  11. CONFETI
  ----------------------------------------------------------------
  Generamos partículas CSS puras para no depender de librerías.
================================================================ */

const CONFETTI_COLORS = [
  "#f7c948", "#ff6b6b", "#4ecdc4",
  "#a78bfa", "#fb923c", "#34d399",
  "#f472b6", "#60a5fa",
];

/**
 * Lanza una lluvia de confeti generando elementos DOM temporales.
 * Se limpian solos al terminar su animación.
 */
function launchConfetti() {
  const container = document.getElementById("confetti-container");
  const count = 70;  // Número de partículas

  for (let i = 0; i < count; i++) {
    // Pequeño delay escalonado para efecto de explosión
    setTimeout(() => {
      const piece = document.createElement("div");
      piece.classList.add("confetti-piece");

      // Posición horizontal aleatoria
      piece.style.left     = `${Math.random() * 100}%`;

      // Color aleatorio
      piece.style.background = pickRandom(CONFETTI_COLORS);

      // Tamaño ligeramente variable
      const size = getRandomFloat(8, 14);
      piece.style.width  = `${size}px`;
      piece.style.height = `${size * getRandomFloat(0.5, 1.5)}px`;

      // Forma variable (cuadrado o círculo)
      piece.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";

      // Duración y delay de caída aleatorios
      const duration = getRandomFloat(1.5, 3.5);
      piece.style.animationDuration = `${duration}s`;
      piece.style.animationDelay    = "0s";

      // Rotación inicial aleatoria
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;

      container.appendChild(piece);

      // Eliminar del DOM después de la animación para no acumular nodos
      setTimeout(() => {
        piece.remove();
      }, duration * 1000 + 100);

    }, i * 18);  // Escalonar las partículas ~18ms entre sí
  }
}


/* ================================================================
  12. UTILIDADES
================================================================ */

/**
 * Devuelve un elemento aleatorio de un arreglo.
 * @template T
 * @param {T[]} arr
 * @returns {T}
 */
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Devuelve un entero aleatorio entre min y max (inclusivos).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Devuelve un número float aleatorio entre min y max.
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}
