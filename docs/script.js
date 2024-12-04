// Menú activo
const lista = document.getElementById('list_item');
lista.addEventListener('click', function(event) {

  if (event.target.tagName === 'LI') {
    // Remover la clase active
    const items = lista.getElementsByTagName('li');
    for (let item of items) {
      item.classList.remove('active');
    }
    // Agregar la clase active
    event.target.classList.add('active');
    
    // Obtener el value de los <li> clickeado
    const selectedValue = event.target.getAttribute('value');
    
    // Cambiar la cara visible del swiper en base al value
    swiper.slideTo(getSlideIndexByValue(selectedValue), 1000);
  }
});

// Función para obtener el índice del slide en base al value

function getSlideIndexByValue(value) {
  const slideIds = {
    "senatic": 0,
    "TalentoTech": 1,
    "AvanzaTec": 2,
    "Gobiernodigital": 3,
    "Yawa": 4
  };
  return slideIds[value] || 0;  // Valor predeterminado si no se encuentra
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
