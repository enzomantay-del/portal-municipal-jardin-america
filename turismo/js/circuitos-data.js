/**
 * Circuitos turísticos — datos del primer circuito (ES / PT / EN).
 * Coordenadas aproximadas (OSM / Maps); se pueden afinar después.
 */
window.TURISMO_CIRCUITOS = [
  {
    id: "yerba-historia",
    color: "#1a5c3c",
    imagenes: [
      "img/plaza-colon.webp",
      "img/parroquia-cristo-redentor-nueva.webp",
      "img/cooperativa-flor.webp",
    ],
    nombre: {
      es: "La yerba en nuestra historia",
      pt: "A erva-mate na nossa história",
      en: "Yerba mate in our history",
    },
    modalidad: {
      es: "Cicloturismo, con pequeñas caminatas",
      pt: "Cicloturismo, com pequenas caminhadas",
      en: "Bike tour, with short walks",
    },
    dificultad: {
      es: "Media",
      pt: "Média",
      en: "Medium",
    },
    duracion: {
      es: "Aprox. 2 h 30 min",
      pt: "Aprox. 2 h 30 min",
      en: "Approx. 2 h 30 min",
    },
    descripcion: {
      es: "Un recorrido que une agroturismo, turismo religioso e historia local. Ideal para familias o para quienes quieren pedalear y conocer cómo la yerba mate marcó el desarrollo de Jardín América y de Misiones.",
      pt: "Um percurso que une agroturismo, turismo religioso e história local. Ideal para famílias ou para quem quer pedalar e conhecer como a erva-mate marcou o desenvolvimento de Jardín América e de Misiones.",
      en: "A route that brings together agrotourism, religious tourism and local history. Ideal for families or anyone who wants to bike and discover how yerba mate shaped the growth of Jardín América and Misiones.",
    },
    recomendaciones: {
      es: [
        "Llevar agua para hidratarse",
        "Calzado cómodo para caminar",
        "Protección solar",
        "Cámara o celular para fotos",
        "Uso de casco recomendado",
      ],
      pt: [
        "Levar água para se hidratar",
        "Calçado confortável para caminhar",
        "Proteção solar",
        "Câmera ou celular para fotos",
        "Uso de capacete recomendado",
      ],
      en: [
        "Bring water to stay hydrated",
        "Comfortable walking shoes",
        "Sun protection",
        "Camera or phone for photos",
        "Helmet use recommended",
      ],
    },
    paradas: [
      {
        id: "cooperativa-flor",
        orden: 1,
        nombre: {
          es: "Cooperativa Flor de Jardín",
          pt: "Cooperativa Flor de Jardín",
          en: "Flor de Jardín Cooperative",
        },
        tiempo: {
          es: "40 min",
          pt: "40 min",
          en: "40 min",
        },
        lat: -27.0502945,
        lng: -55.2468406,
        mapsUrl:
          "https://www.google.com/maps/search/?api=1&query=-27.0502945,-55.2468406",
        imagen: "img/cooperativa-flor.webp",
        tip: {
          es: "Puesto de ventas sobre Ruta Nacional 12, km 1436. Lun–sáb 8–12 y 14:30–18:30.",
          pt: "Ponto de vendas na Rota Nacional 12, km 1436. Seg–sáb 8–12 e 14:30–18:30.",
          en: "Sales stand on National Route 12, km 1436. Mon–Sat 8–12 and 2:30–6:30 PM.",
        },
        texto: {
          es: "La Cooperativa de Productores Jardín América, conocida por su marca Yerba Mate Flor de Jardín, es uno de los pilares productivos y sociales del centro de Misiones.\n\nSe fundó el 3 de noviembre de 1973 en la Colonia Sol de Mayo, cuando un grupo de agricultores se unió para secar y moler la yerba en comunidad, con un precio justo y un canal de venta propio.\n\nCon el tiempo sumaron hortalizas, frutas y fécula de mandioca. Hoy reúne a más de 180 productores asociados.\n\nEn el puesto de ventas sobre la Ruta Nacional 12, kilómetro 1436, podés llevarte yerba mate de estacionamiento natural, pepinillos y encurtidos artesanales, dulces de frutas regionales y fécula de mandioca. Abren de lunes a sábado, de 8 a 12 y de 14:30 a 18:30.\n\nMás que una compra: es una puerta a la historia cooperativa y a las familias que ayudaron a formar Jardín América.",
          pt: "A Cooperativa de Produtores Jardín América, conhecida pela marca Yerba Mate Flor de Jardín, é um dos pilares produtivos e sociais do centro de Misiones.\n\nFoi fundada em 3 de novembro de 1973 na Colonia Sol de Mayo, quando um grupo de agricultores se uniu para secar e moer a erva em comunidade, com preço justo e canal de venda próprio.\n\nCom o tempo somaram hortaliças, frutas e fécula de mandioca. Hoje reúne mais de 180 produtores associados.\n\nNo ponto de vendas sobre a Rota Nacional 12, quilômetro 1436, você pode levar erva-mate de estacionamento natural, pepinos e conservas artesanais, doces de frutas regionais e fécula de mandioca. Abrem de segunda a sábado, das 8 às 12 e das 14:30 às 18:30.\n\nMais do que uma compra: é uma porta para a história cooperativa e para as famílias que ajudaram a formar Jardín América.",
          en: "The Jardín América Producers Cooperative, known for its Yerba Mate Flor de Jardín brand, is one of the productive and social pillars of central Misiones.\n\nIt was founded on November 3, 1973 in Colonia Sol de Mayo, when a group of farmers joined to dry and mill yerba together, with fair prices and their own sales channel.\n\nOver time they added vegetables, fruit and cassava starch. Today it brings together more than 180 associated producers.\n\nAt the sales stand on National Route 12, kilometer 1436, you can take home naturally aged yerba mate, artisanal pickles, regional fruit preserves and cassava starch. Open Monday to Saturday, 8–12 and 2:30–6:30 PM.\n\nMore than a purchase: it is a window into cooperative history and the families that helped build Jardín América.",
        },
      },
      {
        id: "iglesia-cristo",
        orden: 2,
        nombre: {
          es: "Iglesia Cristo Redentor",
          pt: "Igreja Cristo Redentor",
          en: "Cristo Redentor Church",
        },
        tiempo: {
          es: "20 min",
          pt: "20 min",
          en: "20 min",
        },
        lat: -27.0433207,
        lng: -55.2261022,
        mapsUrl:
          "https://www.google.com/maps/place/Iglesia+Cristo+Redentor/@-27.0433207,-55.2261022,17z",
        imagen: "img/parroquia-cristo-redentor-nueva.webp",
        tip: {
          es: "Ingreso breve: respetá el silencio si hay misa u otra celebración.",
          pt: "Visita breve: respeite o silêncio se houver missa ou outra celebração.",
          en: "Short visit: please keep quiet if a mass or other celebration is underway.",
        },
        texto: {
          es: "Una parada breve en la Iglesia Cristo Redentor para observar la arquitectura local y comprender el papel de la fe en la vida cotidiana de las familias yerbateras y pioneras de la zona.",
          pt: "Uma parada breve na Igreja Cristo Redentor para observar a arquitetura local e compreender o papel da fé na vida cotidiana das famílias ervateiras e pioneiras da região.",
          en: "A short stop at Cristo Redentor Church to observe the local architecture and understand the role of faith in the everyday life of yerba-growing and pioneer families in the area.",
        },
      },
      {
        id: "plaza-colon",
        orden: 3,
        nombre: {
          es: "Plaza Colón",
          pt: "Praça Colón",
          en: "Plaza Colón",
        },
        tiempo: {
          es: "15 min",
          pt: "15 min",
          en: "15 min",
        },
        lat: -27.0431348,
        lng: -55.2271373,
        mapsUrl:
          "https://www.google.com/maps/search/?api=1&query=Plaza+Col%C3%B3n+Jard%C3%ADn+Am%C3%A9rica+Misiones",
        imagen: "img/plaza-colon.webp",
        tip: {
          es: "Buen lugar para la foto grupal y un descanso antes de volver.",
          pt: "Bom lugar para a foto em grupo e um descanso antes de voltar.",
          en: "A good spot for a group photo and a rest before heading back.",
        },
        texto: {
          es: "Cierre en la Plaza Colón: un momento para la foto grupal y para reflexionar sobre la yerba mate como hilo conductor de la historia y la identidad de Jardín América.",
          pt: "Encerramento na Praça Colón: um momento para a foto em grupo e para refletir sobre a erva-mate como fio condutor da história e da identidade de Jardín América.",
          en: "Closing stop at Plaza Colón: time for a group photo and to reflect on yerba mate as the thread running through the history and identity of Jardín América.",
        },
      },
    ],
  },
];
