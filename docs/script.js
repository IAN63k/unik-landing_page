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
const liModals = document.querySelectorAll("#liModal");

liModals.forEach((li) => {
  li.addEventListener("click", function () {
    setActive(li);
  });
});

const setActive = (element) => {
  // Primero, elimina el desenfoque de todos los elementos
  const listItems = document.querySelectorAll("#ulModales li");
  listItems.forEach((item) => {
    item.classList.add("blur"); // Añade el blur a todos los elementos
    item.style.zIndex = 1;
  });

  // Elimina el desenfoque (clase 'blur') del elemento que fue clicado
  element.style.zIndex = 10;
  element.classList.remove("blur");
}

function OpenModal(id) {
  let modals = document.getElementById("modal");
  let bgModal = document.getElementById("bgModal");
  let ContModales = document.getElementById("ContModales");

  //Contenido superior de modal

  const Senatic = [
    {
      titulo:
        "https://www.uniajc.edu.co/wp-content/uploads/2016/11/Recurso-9.png",
      parrafo:
        "El proyecto Senatic ofrece la posibilidad de formación y certificación en cursos reconocidos <br> por gigantes tecnológicos, abarcando diferentes líneas de acción para impulsar el desarrollo <br> tecnológico y digital del país. <a href='#'>¡Conócelos aquí!</a> ",
      llamada: "",
      urlllamada: "",
    },
  ];
  const tic = [
    {
      titulo:
        "https://www.uniajc.edu.co/wp-content/uploads/2016/11/Recurso-13-1.png",
      parrafo:
        "Si eres un curioso de los temas digitales y te interesa aprender, este es el lugar y momento indicados. Únete y transforma tu curiosidad en conocimiento práctico. <a href='#'>¡Conócelos aquí!</a>",
      llamada: "",
      urlllamada: "",
    },
  ];
  const tech = [
    {
      titulo:
        "https://www.uniajc.edu.co/wp-content/uploads/2016/11/Recurso-20.png",
      parrafo:
        "Talento Tech es un programa de formación que busca mediante un entrenamiento intensivo bajo la metodología de bootcamps, preparar a los nuevos talentos digitales del país en habilidades digitales avanzadas,capacitándolos para ingresar al mercado laboral tecnológico. <a href='#'>Descúbrelos aquí!</a>  ",
      llamada: "",
      urlllamada: "https://",
    },
  ];

  const yawa = [
    {
      titulo:
        "https://www.uniajc.edu.co/wp-content/uploads/2016/11/Recurso-21.png",
      parrafo:
        "En YAWA encontrarás un espacio que impulsa tus ideas y expande tus horizontes, combinando ciencia, arte y tecnología. Desde su Planetario de tercera generación hasta Salas de Motion Capture y Laboratorios de Innovación, el conocimiento aquí se transforma en una herramienta poderosa. ",
      llamada: "",
      urlllamada: "#",
    },
  ];

  //Contenido de tarjetas por modal de cada oferta

  const SenaticCards = [
    {
      portada:
        "https://www.uniajc.edu.co/wp-content/uploads/2016/11/Recurso-15-100.jpg",
      titulo: "Análisis de datos de Google",
      tipo: "Avanza hacia un título universitario",
      reconocimiento: "Certificado profesional",
    },
    {
      portada:
        "https://www.uniajc.edu.co/wp-content/uploads/2016/11/Recurso-15-100.jpg",
      titulo: "Gestión de proyectos de Google",
      tipo: "Avanza hacia un título universitario ",
      reconocimiento: "Certificado profesional",
    },
    {
      portada:
        "https://www.uniajc.edu.co/wp-content/uploads/2016/11/Recurso-15-100.jpg",
      titulo: "Soporte de TI de googlev",
      tipo: "Avanza hacia un título universitario ",
      reconocimiento: "Certificado profesional",
    },
    {
      portada:
        "https://www.uniajc.edu.co/wp-content/uploads/2016/11/Recurso-15-100.jpg",
      titulo: "Diseño de experiencia del usuario (UX) de Google",
      tipo: "Avanza hacia un título universitario ",
      reconocimiento: "Certificado profesional",
    },
  ];

  const ticCards = [
    {
      portada: "https://www.uniajc.edu.co/wp-content/uploads/2016/11/Recurso-16-100.jpg",
      titulo: "WhatsApp Bussines para emprendedores",
      tipo: "Taller ",
      reconocimiento: "Certificado",
    },
    {
      portada: "https://www.uniajc.edu.co/wp-content/uploads/2016/11/Recurso-15-100-1.jpg",
      titulo: "Uso básico de herramientas digitales",
      tipo: "Taller ",
      reconocimiento: "Certificado",
    },
    {
      portada: "https://www.uniajc.edu.co/wp-content/uploads/2016/11/Recurso-13-100.jpg",
      titulo: "Excel para principiantes",
      tipo: "Taller ",
      reconocimiento: "Certificado",
    },
    {
      portada: "https://www.uniajc.edu.co/wp-content/uploads/2016/11/Recurso-14-100-1.jpg",
      titulo: "WhatsApp web para la vida digital",
      tipo: "Taller ",
      reconocimiento: "Certificado",
    },
  ];

  const techCards = [
    {
      portada:
        "https://www.uniajc.edu.co/wp-content/uploads/2016/11/Recurso-12-100.jpg",
      titulo: "Desarrollo web full stack",
      tipo: "Bootcamps",
      reconocimiento: "Certificado",
    },
    {
      portada:
        "https://www.uniajc.edu.co/wp-content/uploads/2016/11/Recurso-11-100.jpg",
      titulo: "Inteligencia artificial",
      tipo: "Bootcamps",
      reconocimiento: "Certificado",
    },
    {
      portada:
        "https://www.uniajc.edu.co/wp-content/uploads/2016/11/Recurso-10-100.jpg",
      titulo: "Arquitectura en la nube",
      tipo: "Bootcamps",
      reconocimiento: "Certificado",
    },
    {
      portada:
        "https://www.uniajc.edu.co/wp-content/uploads/2016/11/Recurso-9-100.jpg",
      titulo: "Blockchain",
      tipo: "Bootcamps",
      reconocimiento: "Certificado",
    },
  ];

  const yawaCards = [
    {
      portada:
        "https://www.uniajc.edu.co/wp-content/uploads/2016/11/Recurso-14-100.jpg",
      titulo: "Motion Graphics en After Effects",
      tipo: "Curso ",
      reconocimiento: "Certificado",
    },
    {
      portada:
        "https://www.uniajc.edu.co/wp-content/uploads/2016/11/Recurso-15-100.jpg",
      titulo: "Modelado de personajes para animación 3D",
      tipo: "Curso ",
      reconocimiento: "Certificado",
    },
  ];

  ContModales.style.height = "100px";
  modals.classList.add("open");
  bgModal.classList.add("bgModal");
  bgModal.style.display = "flex";

  const parrafo = document.getElementById("parrafo");
  const tituloSenatic = document.getElementById("tituloSenatic");
  const modal = document.getElementById("modal");
  // Creamos un objeto para llevar el control de las tarjetas generadas por cada caso
  let tarjetasGeneradasPorModal = {
    modalSenatic: false,
    modalTic: false,
    modaltech: false,
    modalYawa: false,
  };

  switch (id) {
    case "modalSenatic":
      // Limpiar el contenedor de tarjetas cuando se cambia de modal
      const containerSenatic = document.getElementById("ContenidoCardsModal");
      containerSenatic.innerHTML = ""; // Esto limpia las tarjetas existentes

      // Si las tarjetas no se han generado aún para este modal
      if (!tarjetasGeneradasPorModal.modalSenatic) {
        // Establecemos el fondo del modal
        modal.style.backgroundImage =
          "url('https://www.uniajc.edu.co/wp-content/uploads/2016/11/Recurso-17-100.jpg')";
        modal.style.backgroundRepeat = "no-repeat";
        modal.style.backgroundSize = "cover";
        tituloSenatic.innerHTML = `<img loading="lazy" class="animate__animated animate__fadeInUp" src="${Senatic[0].titulo}" />`;
        parrafo.innerHTML = `<p class="animate__animated animate__fadeInDown">${Senatic[0].parrafo}</p><span class="animate__animated animate__fadeInLeft"><a id="llamda" href="${Senatic[0].urlllamada}">${Senatic[0].llamada}</a></span>`;

        // Iteramos sobre el arreglo SenaticCards y creamos las tarjetas
        SenaticCards.forEach((item) => {
          const card = document.createElement("div");
          card.classList.add("card");

          // Creamos el contenido de la tarjeta
          card.innerHTML = `
          <figure>
            <img loading="lazy" class="animate__animated animate__zoomIn" src="${item.portada}" alt="Imagen del proyecto">
          </figure>
          <h2>${item.titulo}</h2>
          <span><p><?xml version='1.0' encoding='UTF-8'?><svg id='Layer_2' data-name='Layer 2' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 13.43 10.5'><g id='mintic_ventanas_2' data-name='mintic ventanas 2'><g><path style='fill: #2355be;stroke-width: 0px;' d='M0,0v10.5h13.43V0H0ZM12.82,9.89H.61V.61h12.21v9.28Z' /><path style='fill: #2355be;stroke-width: 0px;' d='M7.2,5.69v2.65c0,.14.09.27.22.33.13.06.28.03.39-.08l.8-.8.8.8c.07.07.16.1.25.1.05,0,.09,0,.14-.03.13-.05.22-.18.22-.33v-2.65c.48-.4.79-1.01.79-1.69,0-1.21-.99-2.2-2.2-2.2s-2.2.99-2.2,2.2c0,.68.31,1.29.79,1.69ZM9.4,7.72l-.79-.79-.79.79v-1.67c.25.1.51.15.79.15s.55-.05.79-.15v1.67ZM8.61,2.41c.88,0,1.59.71,1.59,1.59s-.71,1.59-1.59,1.59-1.59-.71-1.59-1.59.71-1.59,1.59-1.59Z' /></g></g></svg> ${item.tipo}</p></span>
          <p>${item.reconocimiento}</p>
        `;

          // Añadimos la tarjeta al contenedor
          containerSenatic.appendChild(card);
        });

        // Marcamos que las tarjetas ya fueron generadas para este modal
        tarjetasGeneradasPorModal.modalSenatic = true;
      }
      break;

    case "modalTic":
      // Limpiar el contenedor de tarjetas cuando se cambia de modal
      const containerTic = document.getElementById("ContenidoCardsModal");
      containerTic.innerHTML = ""; // Esto limpia las tarjetas existentes

      // Si las tarjetas no se han generado aún para este modal
      if (!tarjetasGeneradasPorModal.modalTic) {
        // Establecemos el fondo del modal
        modal.style.backgroundImage =
          "url('https://res.cloudinary.com/dwca35nsw/image/upload/v1733951518/UNIK/qmw1eqkbhk0w6hlz89md.webp')";
        modal.style.backgroundRepeat = "no-repeat";
        modal.style.backgroundSize = "cover";
        tituloSenatic.innerHTML = `<img loading="lazy" class="animate__animated animate__fadeInUp" src="${tic[0].titulo}" />`;
        parrafo.innerHTML = `<p class="animate__animated animate__fadeInDown">${tic[0].parrafo}</p><span class="animate__animated animate__fadeInLeft"><a id="llamda" href="${tic[0].urlllamada}">${tic[0].llamada}</a></span>`;

        // Iteramos sobre el arreglo ticCards y creamos las tarjetas
        ticCards.forEach((item) => {
          const card = document.createElement("div");
          card.classList.add("card");

          // Creamos el contenido de la tarjeta
          card.innerHTML = `
        <figure>
            <img loading="lazy" class="animate__animated animate__zoomIn" src="${item.portada}" alt="Imagen del proyecto">
          </figure>
          <h2>${item.titulo}</h2>
          <span><p>${item.tipo}</p></span>
          <p>${item.reconocimiento}</p>
        `;

          // Añadimos la tarjeta al contenedor
          containerTic.appendChild(card);
        });

        // Marcamos que las tarjetas ya fueron generadas para este modal
        tarjetasGeneradasPorModal.modalTic = true;
      }
      break;

    case "modaltech":
      // Limpiar el contenedor de tarjetas cuando se cambia de modal
      const containerTech = document.getElementById("ContenidoCardsModal");
      containerTech.innerHTML = ""; // Esto limpia las tarjetas existentes

      // Si las tarjetas no se han generado aún para este modal
      if (!tarjetasGeneradasPorModal.modaltech) {
        // Establecemos el fondo del modal
        modal.style.backgroundImage =
          "url('https://www.uniajc.edu.co/wp-content/uploads/2016/11/Recurso-19-100.jpg')";
        modal.style.backgroundRepeat = "no-repeat";
        modal.style.backgroundSize = "cover";
        tituloSenatic.innerHTML = `<img loading="lazy" class="animate__animated animate__fadeInUp" src="${tech[0].titulo}" />`;
        parrafo.innerHTML = `<p class="animate__animated animate__fadeInDown">${tech[0].parrafo}</p><span class="animate__animated animate__fadeInLeft"><a id="llamda" href="${tech[0].urlllamada}">${tech[0].llamada}</a></span>`;

        // Iteramos sobre el arreglo techCards y creamos las tarjetas
        techCards.forEach((item) => {
          const card = document.createElement("div");
          card.classList.add("card");

          // Creamos el contenido de la tarjeta
          card.innerHTML = `
            <figure>
            <img loading="lazy" class="animate__animated animate__zoomIn" src="${item.portada}" alt="Imagen del proyecto">
          </figure>
          <h2>${item.titulo}</h2>
          <span><p>${item.tipo}</p></span>
          <p>${item.reconocimiento}</p>
        `;

          // Añadimos la tarjeta al contenedor
          containerTech.appendChild(card);
        });

        // Marcamos que las tarjetas ya fueron generadas para este modal
        tarjetasGeneradasPorModal.modaltech = true;
      }
      break;

    case "modalYawa":
      // Limpiar el contenedor de tarjetas cuando se cambia de modal
      const containerYawa = document.getElementById("ContenidoCardsModal");
      containerYawa.innerHTML = ""; // Esto limpia las tarjetas existentes

      // Si las tarjetas no se han generado aún para este modal
      if (!tarjetasGeneradasPorModal.modalYawa) {
        // Establecemos el fondo del modal
        modal.style.backgroundImage =
          "url('https://www.uniajc.edu.co/wp-content/uploads/2016/11/Recurso-20-100.jpg')";
        modal.style.backgroundRepeat = "no-repeat";
        modal.style.backgroundSize = "cover";
        tituloSenatic.innerHTML = `<img loading="lazy" class="animate__animated animate__fadeInUp" src="${yawa[0].titulo}" />`;
        parrafo.innerHTML = `<p class="animate__animated animate__fadeInDown">${yawa[0].parrafo}</p><span class="animate__animated animate__fadeInLeft"><a id="llamda" href="${yawa[0].urlllamada}">${yawa[0].llamada}</a></span>`;

        // Iteramos sobre el arreglo yawaCards y creamos las tarjetas
        yawaCards.forEach((item) => {
          const card = document.createElement("div");
          card.classList.add("card");

          // Creamos el contenido de la tarjeta
          card.innerHTML = `
          <figure>
            <img loading="lazy" class="animate__animated animate__zoomIn" src="${item.portada}" alt="Imagen del proyecto">
          </figure>
          <h2>${item.titulo}</h2>
          <span><p>${item.tipo}</p></span>
          <p>${item.reconocimiento}</p>
        `;

          // Añadimos la tarjeta al contenedor
          containerYawa.appendChild(card);
        });
        // Marcamos que las tarjetas ya fueron generadas para este modal
        tarjetasGeneradasPorModal.modalYawa = true;
      }
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
  bgModal.style.display = "none";

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
