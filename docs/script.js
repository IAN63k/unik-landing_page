class AWaves extends HTMLElement {
  /**
   * Init
   */
  connectedCallback() {
    // Elements
    this.canvas = this.querySelector(".js-canvas");
    this.ctx = this.canvas.getContext("2d");

    // Properties
    this.mouse = {
      x: -10,
      y: 0,
      lx: 0,
      ly: 0,
      sx: 0,
      sy: 0,
      v: 0,
      vs: 0,
      a: 0,
      set: false,
    };

    this.lines = [];
    this.noise = new Noise(Math.random());

    // Init
    this.setSize();
    this.setLines();

    this.bindEvents();

    // RAF
    requestAnimationFrame(this.tick.bind(this));
  }

  /**
   * Bind events
   */
  bindEvents() {
    window.addEventListener("resize", this.onResize.bind(this));

    window.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.addEventListener("touchmove", this.onTouchMove.bind(this));
  }

  /**
   * Resize handler
   */
  onResize() {
    this.setSize();
    this.setLines();
  }

  /**
   * Mouse handler
   */
  onMouseMove(e) {
    this.updateMousePosition(e.pageX, e.pageY);
  }

  /**
   * Touch handler
   */
  onTouchMove(e) {
    e.preventDefault();

    const touch = e.touches[0];
    this.updateMousePosition(touch.clientX, touch.clientY);
  }

  /**
   * Update mouse position
   */
  updateMousePosition(x, y) {
    const { mouse } = this;

    mouse.x = x - this.bounding.left;
    mouse.y = y - this.bounding.top + window.scrollY;

    if (!mouse.set) {
      mouse.sx = mouse.x;
      mouse.sy = mouse.y;
      mouse.lx = mouse.x;
      mouse.ly = mouse.y;

      mouse.set = true;
    }
  }

  /**
   * Set size
   */
  setSize() {
    this.bounding = this.getBoundingClientRect();

    this.canvas.width = this.bounding.width;
    this.canvas.height = this.bounding.height;
  }

  /**
   * Set lines
   */
  setLines() {
    const { width, height } = this.bounding;

    this.lines = [];

    const xGap = 10;
    const yGap = 32;

    const oWidth = width + 200;
    const oHeight = height + 30;

    const totalLines = Math.ceil(oWidth / xGap);
    const totalPoints = Math.ceil(oHeight / yGap);

    const xStart = (width - xGap * totalLines) / 2;
    const yStart = (height - yGap * totalPoints) / 2;

    for (let i = 0; i <= totalLines; i++) {
      const points = [];

      for (let j = 0; j <= totalPoints; j++) {
        const point = {
          x: xStart + xGap * i,
          y: yStart + yGap * j,
          wave: { x: 0, y: 0 },
          cursor: { x: 0, y: 0, vx: 0, vy: 0 },
        };

        points.push(point);
      }

      // Add points
      this.lines.push(points);
    }
  }

  /**
   * Move points
   */
  movePoints(time) {
    const { lines, mouse, noise } = this;

    lines.forEach((points) => {
      points.forEach((p) => {
        // Wave movement
        const move =
          noise.perlin2(
            (p.x + time * 0.0125) * 0.002,
            (p.y + time * 0.005) * 0.0015
          ) * 12;
        p.wave.x = Math.cos(move) * 32;
        p.wave.y = Math.sin(move) * 16;

        // Mouse effect
        const dx = p.x - mouse.sx;
        const dy = p.y - mouse.sy;
        const d = Math.hypot(dx, dy);
        const l = Math.max(175, mouse.vs);

        if (d < l) {
          const s = 1 - d / l;
          const f = Math.cos(d * 0.001) * s;

          p.cursor.vx += Math.cos(mouse.a) * f * l * mouse.vs * 0.00065;
          p.cursor.vy += Math.sin(mouse.a) * f * l * mouse.vs * 0.00065;
        }

        p.cursor.vx += (0 - p.cursor.x) * 0.005; // String tension
        p.cursor.vy += (0 - p.cursor.y) * 0.005;

        p.cursor.vx *= 0.925; // Friction/duration
        p.cursor.vy *= 0.925;

        p.cursor.x += p.cursor.vx * 2; // Strength
        p.cursor.y += p.cursor.vy * 2;

        p.cursor.x = Math.min(100, Math.max(-100, p.cursor.x)); // Clamp movement
        p.cursor.y = Math.min(100, Math.max(-100, p.cursor.y));
      });
    });
  }

  /**
   * Get point coordinates with movement added
   */
  moved(point, withCursorForce = true) {
    const coords = {
      x: point.x + point.wave.x + (withCursorForce ? point.cursor.x : 0),
      y: point.y + point.wave.y + (withCursorForce ? point.cursor.y : 0),
    };

    // Round to 2 decimals
    coords.x = Math.round(coords.x * 10) / 10;
    coords.y = Math.round(coords.y * 10) / 10;

    return coords;
  }

  /**
   * Draw lines
   */
  drawLines() {
    const { lines, moved, ctx, bounding } = this;

    ctx.clearRect(0, 0, bounding.width, bounding.height);

    ctx.beginPath();
    ctx.strokeStyle = "#2a3f34";

    lines.forEach((points, lIndex) => {
      let p1 = moved(points[0], false);

      ctx.moveTo(p1.x, p1.y);

      points.forEach((p1, pIndex) => {
        const isLast = pIndex === points.length - 1;

        p1 = moved(p1, !isLast);

        const p2 = moved(
          points[pIndex + 1] || points[points.length - 1],
          !isLast
        );

        ctx.lineTo(p1.x, p1.y);
      });
    });

    ctx.stroke();
  }

  /**
   * Tick
   */
  tick(time) {
    const { mouse } = this;

    // Smooth mouse movement
    mouse.sx += (mouse.x - mouse.sx) * 0.1;
    mouse.sy += (mouse.y - mouse.sy) * 0.1;

    // Mouse velocity
    const dx = mouse.x - mouse.lx;
    const dy = mouse.y - mouse.ly;
    const d = Math.hypot(dx, dy);

    mouse.v = d;
    mouse.vs += (d - mouse.vs) * 0.1;
    mouse.vs = Math.min(100, mouse.vs);

    // Mouse last position
    mouse.lx = mouse.x;
    mouse.ly = mouse.y;

    // Mouse angle
    mouse.a = Math.atan2(dy, dx);

    // Animation
    this.style.setProperty("--x", `${mouse.sx}px`);
    this.style.setProperty("--y", `${mouse.sy}px`);

    this.movePoints(time);
    this.drawLines();

    requestAnimationFrame(this.tick.bind(this));
  }
}

customElements.define("a-waves", AWaves);

//modales ofertas de formacion

function setActive(element) {
  // Primero, elimina el desenfoque de todos los elementos
  const listItems = document.querySelectorAll("#ulModales li");
  listItems.forEach((item) => {
    item.classList.add("blur"); // Añade el blur a todos los elementos
  });

  // Elimina el desenfoque (clase 'blur') del elemento que fue clicado
  element.classList.remove("blur");
}

function OpenModal(id) {
  let modals = document.getElementById("modal");
  let bgModal = document.getElementById("bgModal");
  let ContModales = document.getElementById("ContModales");

  const Senatic = [
    {
      titulo:
        "https://www.uniajc.edu.co/wp-content/uploads/2016/11/Recurso-9.png",
      parrafo:
        "El proyecto Senatic ofrece la posibilidad de formación y certificación en cursos reconocidos por gigantes tecnológicos, abarcando diferentes líneas de acción para impulsar el desarrollo tecnológico y digital del país.",
      llamada: "¡Conócelos aquí!",
      urlllamada: "",
    },
  ];
  const tic = [
    {
      titulo:
        "https://www.uniajc.edu.co/wp-content/uploads/2016/11/Recurso-13-1.png",
      parrafo:
        "El proyecto Senatic ofrece la posibilidad de formación y certificación en cursos reconocidos por gigantes tecnológicos, abarcando diferentes líneas de acción para impulsar el desarrollo tecnológico y digital del país.",
      llamda: "¡Conócelos aquí!",
      urlllamada: "",
    },
  ];
  const tech = [
    {
      titulo: "image",
      parrafo: "rech ",
      llamda: "concenos",
      urlllamada: "https://",
    },
  ];

  const yawa = [
    {
      titulo: "image",
      parrafo: "yawa ",
      llamda: "concenos",
      urlllamada: "https://",
    },
  ];

  ContModales.style.height = "100px";
  modals.classList.add("open");
  bgModal.classList.add("bgModal");

  let parrafo = document.getElementById("parrafo");
  let tituloSenatic = document.getElementById("tituloSenatic");
  let modal = document.getElementById("modal");
  
  switch (id) {
    case "modalSenatic":
      Senatic.forEach((item) => {

        modal.style.backgroundImage =
          "url('https://www.uniajc.edu.co/wp-content/uploads/2016/11/Recurso-12.png')";
        modal.style.backgroundRepeat = "no-repeat";
        modal.style.backgroundSize = "cover";
        tituloSenatic.innerHTML = `<img src=${item.titulo} />`;
        parrafo.innerHTML = `<p>${item.parrafo}</p> <span><a href="${item.urlllamada}">${item.llamada}</a></span>`;
      });

      break;

    case "modalTic":
      tic.forEach((item) => {
        modal.style.backgroundImage =
          "url('https://www.uniajc.edu.co/wp-content/uploads/2016/11/Recurso-13.png')";
        modal.style.backgroundRepeat = "no-repeat";
        modal.style.backgroundSize = "cover";
        tituloSenatic.innerHTML = `<img src=${item.titulo} />`;
        parrafo.innerHTML = `<p>${item.parrafo}</p> <span><a href="${item.urlllamada}">${item.llamada}</a></span>`;
      });

      break;

    case "modaltech":

     Senatic.forEach((item) => {
       modal.style.backgroundImage =
         "url('https://www.uniajc.edu.co/wp-content/uploads/2016/11/Recurso-12.png')";
       modal.style.backgroundRepeat = "no-repeat";
       modal.style.backgroundSize = "cover";
       tituloSenatic.innerHTML = `<img src=${item.titulo} />`;
       parrafo.innerHTML = `<p>${item.parrafo}</p> <span><a href="${item.urlllamada}">${item.llamada}</a></span>`;
     });

     break;
    case "modalYawa":

       Senatic.forEach((item) => {
         modal.style.backgroundImage =
           "url('https://www.uniajc.edu.co/wp-content/uploads/2016/11/Recurso-12.png')";
         modal.style.backgroundRepeat = "no-repeat";
         modal.style.backgroundSize = "cover";
         tituloSenatic.innerHTML = `<img src=${item.titulo} />`;
         parrafo.innerHTML = `<p>${item.parrafo}</p> <span><a href="${item.urlllamada}">${item.llamada}</a></span>`;
       });

      break;
  }
}

//modales ofertas de formacion

function closeModal(id) {
  let modals = document.getElementById("modal");
  let bgModal = document.getElementById("bgModal");
  let ContModales = document.getElementById("ContModales");

  modals.classList.remove("open");
  ContModales.style.height = "200px";
  bgModal.classList.remove("bgModal");

  setTimeout(noRender, 300);
  function noRender() {
    modals.style.display = "none";
  }

  const listItems = document.querySelectorAll("#ulModales li");
  listItems.forEach((item) => {
    item.classList.remove("blur"); // Añade el blur a todos los elementos
  });
}

//********************************************************** */

// Menú activo
const lista = document.getElementById("list_item");
lista.addEventListener("click", function (event) {
  if (event.target.tagName === "LI") {
    // Remover la clase active
    const items = lista.getElementsByTagName("li");
    for (let item of items) {
      item.classList.remove("active");
    }
    // Agregar la clase active
    event.target.classList.add("active");

    // Obtener el value de los <li> clickeado
    const selectedValue = event.target.getAttribute("value");

    // Cambiar la cara visible del swiper en base al value
    swiper.slideTo(getSlideIndexByValue(selectedValue), 1000);
  }
});

// Función para obtener el índice del slide en base al value

function getSlideIndexByValue(value) {
  const slideIds = {
    senatic: 0,
    TalentoTech: 1,
    AvanzaTec: 2,
    Gobiernodigital: 3,
    Yawa: 4,
  };
  return slideIds[value] || 0; // Valor predeterminado si no se encuentra
}

// Swiper (cubo)
var swiper = new Swiper(".swiper", {
  effect: "cube",
  grabCursor: true,
  loop: true,
  speed: 1000,
  cubeEffect: {
    shadow: false,
    slideShadows: true,
    shadowOffset: 10,
    shadowScale: 0.94,
  },
  // autoplay: {
  //   delay: 2600,
  //   pauseOnMouseEnter: true,
  // },
});

// Inicializa el fondo de partículas (si es necesario)
tsParticles.load("tsparticles", {
  fpsLimit: 60,
  backgroundMode: {
    enable: true,
    zIndex: -1,
  },
  particles: {
    number: {
      value: 30,
      density: {
        enable: true,
        area: 800,
      },
    },
    color: {
      value: [
        "#3998D0",
        "#2EB6AF",
        "#A9BD33",
        "#FEC73B",
        "#F89930",
        "#F45623",
        "#D62E32",
      ],
    },
    shape: {
      type: "circle",
      stroke: {
        width: 0,
        color: "#000000",
      },
    },
    size: {
      value: 8,
      random: {
        enable: true,
        minimumValue: 4,
      },
    },
    move: {
      enable: true,
      speed: 7,
      direction: "none",
    },
  },
  detectRetina: true,
});
