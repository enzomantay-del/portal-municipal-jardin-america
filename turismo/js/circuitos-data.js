/**
 * Circuitos turísticos — datos del primer circuito.
 * Coordenadas aproximadas (OSM / Maps); se pueden afinar después.
 */
window.TURISMO_CIRCUITOS = [
  {
    id: "yerba-historia",
    nombre: "La yerba en nuestra historia",
    modalidad: "Cicloturismo, con pequeñas caminatas",
    dificultad: "Media",
    duracion: "Aprox. 2 h 30 min",
    descripcion:
      "Un recorrido que une agroturismo, turismo religioso e historia local. Ideal para familias o para quienes quieren pedalear y conocer cómo la yerba mate marcó el desarrollo de Jardín América y de Misiones.",
    recomendaciones: [
      "Llevar agua para hidratarse",
      "Calzado cómodo para caminar",
      "Protección solar",
      "Cámara o celular para fotos",
      "Uso de casco recomendado",
    ],
    color: "#0f5c3a",
    imagenes: [
      "img/cooperativa-flor.webp",
      "img/parroquia-cristo-redentor-nueva.webp",
      "img/plaza-colon.webp",
    ],
    paradas: [
      {
        id: "cooperativa-flor",
        orden: 1,
        nombre: "Cooperativa Flor de Jardín",
        tiempo: "40 min",
        lat: -27.0502945,
        lng: -55.2468406,
        mapsUrl:
          "https://www.google.com/maps/search/?api=1&query=Cooperativa+Flor+de+Jard%C3%ADn+Ruta+12+Jard%C3%ADn+Am%C3%A9rica",
        imagen: "img/cooperativa-flor.webp",
        tip: "Puesto de ventas sobre Ruta Nacional 12, km 1436. Lun–sáb 8–12 y 14:30–18:30.",
        texto:
          "La Cooperativa de Productores Jardín América, conocida por su marca Yerba Mate Flor de Jardín, es uno de los pilares productivos y sociales del centro de Misiones.\n\nSe fundó el 3 de noviembre de 1973 en la Colonia Sol de Mayo, cuando un grupo de agricultores se unió para secar y moler la yerba en comunidad, con un precio justo y un canal de venta propio.\n\nCon el tiempo sumaron hortalizas, frutas y fécula de mandioca. Hoy reúne a más de 180 productores asociados.\n\nEn el puesto de ventas sobre la Ruta Nacional 12, kilómetro 1436, podés llevarte yerba mate de estacionamiento natural, pepinillos y encurtidos artesanales, dulces de frutas regionales y fécula de mandioca. Abren de lunes a sábado, de 8 a 12 y de 14:30 a 18:30.\n\nMás que una compra: es una puerta a la historia cooperativa y a las familias que ayudaron a formar Jardín América.",
      },
      {
        id: "iglesia-cristo",
        orden: 2,
        nombre: "Iglesia Cristo Redentor",
        tiempo: "20 min",
        lat: -27.0436,
        lng: -55.2282,
        mapsUrl:
          "https://www.google.com/maps/search/?api=1&query=Iglesia+Cristo+Redentor+Jard%C3%ADn+Am%C3%A9rica+Misiones",
        imagen: "img/parroquia-cristo-redentor-nueva.webp",
        tip: "Ingreso breve: respetá el silencio si hay misa u otra celebración.",
        texto:
          "Una parada breve en la Iglesia Cristo Redentor para observar la arquitectura local y comprender el papel de la fe en la vida cotidiana de las familias yerbateras y pioneras de la zona.",
      },
      {
        id: "plaza-colon",
        orden: 3,
        nombre: "Plaza Colón",
        tiempo: "15 min",
        lat: -27.0431348,
        lng: -55.2271373,
        mapsUrl:
          "https://www.google.com/maps/search/?api=1&query=Plaza+Col%C3%B3n+Jard%C3%ADn+Am%C3%A9rica+Misiones",
        imagen: "img/plaza-colon.webp",
        tip: "Buen lugar para la foto grupal y un descanso antes de volver.",
        texto:
          "Cierre en la Plaza Colón: un momento para la foto grupal y para reflexionar sobre la yerba mate como hilo conductor de la historia y la identidad de Jardín América.",
      },
    ],
  },
];
