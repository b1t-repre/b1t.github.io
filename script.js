/* ================================================================
   RULETA DE LA FELICIDAD — script.js
   Estilo institucional ITAM
   ----------------------------------------------------------------
   Secciones:
   1.  Datos editables: retos y mensajes "Y recuerda..."
   2.  Configuración de la ruleta
   3.  Referencias al DOM
   4.  Estado global
   5.  Inicialización
   6.  Dibujo de la ruleta
   7.  Lógica del giro
   8.  Mostrar resultado
   9.  Resetear para nuevo giro
  10.  Confeti
  11.  Utilidades
================================================================ */


/* ================================================================
   1. DATOS EDITABLES
   ----------------------------------------------------------------
   ► Para cambiar los retos: edita el arreglo RETOS.
   ► Para cambiar los mensajes: edita MENSAJES_RECUERDA.
   ► Puedes añadir o quitar elementos libremente; la ruleta se
     adapta sola a cualquier cantidad de retos.
================================================================ */

/**
 * Retos que puede salir al girar la ruleta.
 * Se muestran en el resultado, NO dentro de la ruleta.
 */
const RETOS = [
  "Sonríele a la siguiente persona que veas",
  "Mándale un mensaje bonito a alguien",
  "Tómate 2 minutos para respirar profundo",
  "Agradece algo que te haya pasado hoy",
  "Camina un minuto con actitud de protagonista",
  "Haz un cumplido sincero hoy",
  "Estírate un poquito y sigue conquistando el día",
  "Toma agua, programador feliz 💧",
  "Pregúntale a alguien cómo está, de verdad",
  "Ríete de algo, lo que sea",
];

/**
 * Mensajes para la tarjeta "Y recuerda...".
 * Se elige uno al azar, independiente del reto.
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
 * Colores de los segmentos de la ruleta.
 * Paleta ITAM: alternan azul marino y dorado con variaciones.
 * Se repiten cíclicamente si hay más retos que colores.
 *
 * ► Para cambiar los colores de la ruleta, edita este arreglo.
 */
const SEGMENT_COLORS = [
  "#003865",   /* Azul marino ITAM */
  "#C8A45A",   /* Dorado ITAM */
  "#0a4f87",   /* Azul ITAM más claro */
  "#e8c47a",   /* Dorado más claro */
  "#002a4d",   /* Azul muy oscuro */
  "#d4aa6a",   /* Dorado medio */
  "#005a9e",   /* Azul medio */
  "#b8943e",   /* Dorado oscuro */
  "#003865",
  "#C8A45A",
];

/** Color del texto del hub central de la ruleta */
const HUB_TEXT_COLOR = "#C8A45A";


/* ================================================================
   2. CONFIGURACIÓN DE LA RULETA
================================================================ */
const WHEEL_CONFIG = {
  spinDurationMin:  3200,   /* ms mínimo del giro */
  spinDurationMax:  5000,   /* ms máximo del giro */
  minFullRotations: 5,      /* vueltas completas mínimas */
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


/* ================================================================
   4. ESTADO GLOBAL
================================================================ */
const state = {
  currentAngle: 0,      /* Ángulo actual de rotación en radianes */
  isSpinning:   false,  /* Si la ruleta está en movimiento */
  winningIndex: -1,     /* Índice del reto ganador */
};


/* ================================================================
   5. INICIALIZACIÓN
================================================================ */
document.addEventListener("DOMContentLoaded", () => {
  drawWheel(state.currentAngle);
});


/* ================================================================
   6. DIBUJO DE LA RULETA CON CANVAS
   ----------------------------------------------------------------
   La ruleta NO muestra texto en los segmentos para evitar que
   se apriete. Solo muestra colores + un marcador decorativo
   (número romano) en el centro de cada segmento.
================================================================ */

/**
 * Dibuja la ruleta completa.
 * Se llama en la inicialización y en cada frame de la animación.
 *
 * @param {number} rotationAngle - Ángulo de rotación actual (rad)
 */
function drawWheel(rotationAngle) {
  const total   = RETOS.length;
  const arcSize = (2 * Math.PI) / total;
  const cx      = canvas.width  / 2;
  const cy      = canvas.height / 2;
  const radius  = cx - 4;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < total; i++) {
    const startAngle = rotationAngle + i * arcSize;
    const endAngle   = startAngle + arcSize;
    const color      = SEGMENT_COLORS[i % SEGMENT_COLORS.length];

    /* Fondo del segmento */
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    /* Borde entre segmentos: línea muy fina blanca */
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth   = 1.5;
    ctx.stroke();

  }

  /* Hub central decorativo */
  drawCenterHub(ctx, cx, cy);
}

/**
 * Dibuja el hub central de la ruleta.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx
 * @param {number} cy
 */
function drawCenterHub(ctx, cx, cy) {
  /* Sombra del hub */
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur  = 10;

  /* Círculo base */
  ctx.beginPath();
  ctx.arc(cx, cy, 26, 0, 2 * Math.PI);
  ctx.fillStyle = "#FAFAF8";
  ctx.fill();

  /* Borde dorado */
  ctx.strokeStyle = "#C8A45A";
  ctx.lineWidth   = 2.5;
  ctx.stroke();

  ctx.shadowBlur = 0;

  /* Estrella/símbolo decorativo central */
  ctx.font         = "bold 15px 'Times New Roman', serif";
  ctx.fillStyle    = "#003865";
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("✦", cx, cy);
}


/* ================================================================
   7. LÓGICA DEL GIRO
================================================================ */

/** Manejador del clic en el botón de girar */
function handleSpinClick() {
  if (state.isSpinning) return;

  /* Ocultar resultado anterior */
  resultSec.classList.add("hidden");

  state.isSpinning  = true;
  spinBtn.disabled  = true;

  /* Elegir segmento ganador al azar */
  state.winningIndex = getRandomInt(0, RETOS.length - 1);

  /* Calcular ángulo final
     El puntero apunta hacia arriba (−π/2).
     Necesitamos rotar la ruleta para que el centro del segmento
     ganador quede exactamente debajo del puntero. */
  const arcSize          = (2 * Math.PI) / RETOS.length;
  const targetAngle      = -(state.winningIndex * arcSize + arcSize / 2);
  const pointer          = -Math.PI / 2;

  let deltaToTarget = (pointer - targetAngle - state.currentAngle) % (2 * Math.PI);
  if (deltaToTarget < 0) deltaToTarget += 2 * Math.PI;

  const fullRotations = WHEEL_CONFIG.minFullRotations + getRandomInt(0, 3);
  const totalDelta    = fullRotations * 2 * Math.PI + deltaToTarget;
  const duration      = getRandomInt(WHEEL_CONFIG.spinDurationMin, WHEEL_CONFIG.spinDurationMax);

  animateSpin(state.currentAngle, state.currentAngle + totalDelta, duration);
}

/**
 * Anima el giro con requestAnimationFrame y easing ease-out cúbico.
 * La ruleta empieza rápido y desacelera suavemente hasta detenerse.
 *
 * @param {number} startAngle - Ángulo de inicio (rad)
 * @param {number} endAngle   - Ángulo final (rad)
 * @param {number} duration   - Duración total en ms
 */
function animateSpin(startAngle, endAngle, duration) {
  const startTime = performance.now();

  function frame(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);

    /* Easing ease-out cúbico: 1 - (1-t)^3 */
    const eased = 1 - Math.pow(1 - progress, 3);

    state.currentAngle = startAngle + (endAngle - startAngle) * eased;
    drawWheel(state.currentAngle);

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      /* Normalizar ángulo al rango [0, 2π] */
      state.currentAngle = state.currentAngle % (2 * Math.PI);
      onSpinComplete();
    }
  }

  requestAnimationFrame(frame);
}

/** Se ejecuta cuando la animación de giro termina */
function onSpinComplete() {
  state.isSpinning = false;
  spinBtn.disabled = false;

  showResult(state.winningIndex);
  launchConfetti();
}


/* ================================================================
   8. MOSTRAR RESULTADO
================================================================ */

/**
 * Muestra el reto ganador y un mensaje aleatorio de "Y recuerda...".
 *
 * @param {number} index - Índice del reto ganado en RETOS[]
 */
function showResult(index) {
  resultText.textContent  = RETOS[index];
  rememberTxt.textContent = pickRandom(MENSAJES_RECUERDA);

  /* Mostrar sección y reiniciar animación CSS */
  resultSec.classList.remove("hidden");
  resultSec.style.animation = "none";
  void resultSec.offsetWidth;   /* Forzar reflow */
  resultSec.style.animation     = "";

  /* Scroll suave al resultado en móvil */
  setTimeout(() => {
    resultSec.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, 100);
}


/* ================================================================
   9. RESETEAR PARA NUEVO GIRO
================================================================ */

/**
 * Oculta la zona de resultado y vuelve el foco a la ruleta.
 */
function resetForNewSpin() {
  resultSec.classList.add("hidden");
  canvas.scrollIntoView({ behavior: "smooth", block: "center" });
}


/* ================================================================
  10. CONFETI
  ----------------------------------------------------------------
  Partículas ligeras hechas en CSS+JS puro.
  Colores de confeti: azul marino, dorado y blanco ITAM.
================================================================ */

const CONFETTI_COLORS = [
  "#003865",   /* Navy ITAM */
  "#C8A45A",   /* Dorado ITAM */
  "#0a4f87",   /* Azul claro */
  "#e8c47a",   /* Dorado claro */
  "#FFFFFF",   /* Blanco */
  "#005a9e",   /* Azul medio */
];

/**
 * Lanza una lluvia de confeti generando elementos DOM temporales.
 * Cada partícula se auto-elimina al terminar su animación.
 */
function launchConfetti() {
  const container = document.getElementById("confetti-container");
  const count     = 60;

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const piece = document.createElement("div");
      piece.classList.add("confetti-piece");

      /* Posición horizontal aleatoria */
      piece.style.left = `${Math.random() * 100}%`;

      /* Color aleatorio ITAM */
      piece.style.background = pickRandom(CONFETTI_COLORS);

      /* Tamaño variable */
      const w = getRandomFloat(7, 13);
      const h = getRandomFloat(7, 18);
      piece.style.width  = `${w}px`;
      piece.style.height = `${h}px`;

      /* Forma: cuadrado o círculo */
      piece.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";

      /* Duración de caída */
      const duration = getRandomFloat(1.6, 3.2);
      piece.style.animationDuration = `${duration}s`;

      /* Rotación inicial */
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;

      container.appendChild(piece);

      /* Limpiar el DOM después de la caída */
      setTimeout(() => piece.remove(), duration * 1000 + 100);

    }, i * 20);   /* Escalonar partículas 20ms entre sí */
  }
}


/* ================================================================
  11. UTILIDADES
================================================================ */

/**
 * Elige un elemento aleatorio de un arreglo.
 * @template T
 * @param {T[]} arr
 * @returns {T}
 */
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Entero aleatorio entre min y max (ambos inclusivos).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Float aleatorio entre min y max.
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}
