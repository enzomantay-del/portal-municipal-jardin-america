/**
 * Catálogo de trámites de Bromatología (Municipalidad de Jardín América).
 */
(function () {
  "use strict";

  var INTENDENTE = "MMO. César Daniel Araujo";

  var TRAMITES = [
    {
      id: "habilitacion-negocio",
      titulo: "Habilitación de negocio",
      resumen: "Solicitá la habilitación municipal de un local comercial.",
      tipo: "solicitud",
      icono: "🏪",
      pasos: [
        "Completá los datos del negocio y del titular.",
        "Adjuntá la documentación pedida (podés subir fotos o PDF).",
        "Enviá la solicitud. Vas a poder imprimir la nota con membrete.",
        "Bromatología revisa y te contacta. La inspección y el pago se hacen después.",
      ],
      campos: [
        { name: "rubro", label: "Rubro del negocio", type: "text", required: true, maxlength: 120 },
        { name: "denominacion", label: "Nombre / denominación del negocio", type: "text", required: true, maxlength: 160 },
        { name: "calle", label: "Calle", type: "text", required: true, maxlength: 120 },
        { name: "numero", label: "Número", type: "text", required: true, maxlength: 20 },
        { name: "lote", label: "Lote", type: "text", required: false, maxlength: 40 },
        { name: "manzana", label: "Manzana", type: "text", required: false, maxlength: 40 },
      ],
      documentos: [
        { key: "dni", label: "Fotocopia de DNI", required: true },
        { key: "cuil", label: "CUIL", required: true },
        { key: "libreta", label: "Libreta sanitaria", required: true },
        { key: "plano", label: "Aprobación de plano y/o final de obra (Obras Privadas)", required: true },
        { key: "titulo", label: "Título o boleto de compra-venta", required: false },
        { key: "contrato", label: "Contrato de locación", required: false },
        { key: "tgi", label: "Impuesto TGI al día", required: true },
        { key: "sr310", label: "Formulario SR-310 libre de deudas (Rentas Provincial)", required: true },
        { key: "matafuegos", label: "Constancia de matafuegos", required: true },
        { key: "bomberos", label: "Certificado de Bomberos de la Provincia de Misiones", required: true },
        { key: "contingencia", label: "Plan de contingencia", required: true },
      ],
      notaIntro:
        "Solicito se me conceda la HABILITACIÓN de un negocio según el detalle que se indica a continuación.",
    },
    {
      id: "libreta-sanitaria",
      titulo: "Libreta sanitaria",
      resumen: "Consultá los requisitos para sacar o renovar la libreta sanitaria.",
      tipo: "info",
      icono: "🩺",
      pasos: [
        "Reuní la documentación de la lista.",
        "Presentala en la oficina de Bromatología.",
        "La renovación debe hacerse cada año.",
      ],
      requisitos: [
        "Foto 4 x 4 (dos)",
        "Fotocopia de DNI (1.ª y 2.ª hoja)",
        "Examen de clínica general (certificado médico)",
        "Prueba de serología (V.D.R.L.)",
        "Certificado de la B.C.G.",
      ],
      notaPresencial:
        "Este trámite se completa de forma presencial en Bromatología. En el sitio solo consultás los requisitos.",
    },
    {
      id: "evento-publico",
      titulo: "Autorización de evento público",
      resumen: "Pedí autorización para realizar un evento público en la ciudad.",
      tipo: "solicitud",
      icono: "🎉",
      pasos: [
        "Completá organizador, tipo de evento, lugar y horarios.",
        "Adjuntá los contratos pedidos.",
        "Enviá la solicitud e imprimí la nota.",
        "Policía Adicional y Bomberos intervienen después (no se reemplazan por el sitio).",
      ],
      campos: [
        { name: "organizador", label: "Organizador", type: "text", required: true, maxlength: 160 },
        { name: "tipoEvento", label: "Tipo de evento", type: "text", required: true, maxlength: 120 },
        { name: "lugar", label: "Dirección y/o local", type: "text", required: true, maxlength: 200 },
        { name: "fechaEvento", label: "Fecha del evento", type: "date", required: true },
        { name: "horaDesde", label: "Horario desde", type: "time", required: true },
        { name: "horaHasta", label: "Horario hasta", type: "time", required: true },
        { name: "animadoPor", label: "Evento animado por", type: "text", required: false, maxlength: 160 },
        { name: "domicilio", label: "Domicilio del solicitante", type: "text", required: true, maxlength: 200 },
      ],
      documentos: [
        { key: "contratoSalon", label: "Contrato con el club y/o propietario del salón", required: true },
        { key: "contratoAnimador", label: "Contrato con el grupo animador", required: false },
      ],
      notaIntro:
        "Solicito autorización para la realización de un evento público según el siguiente detalle. Se deja establecido que se deslinda de responsabilidad civil y/o penal a la Municipalidad de Jardín América por cualquier accidente o siniestro con ocasión del evento.",
      avisoExtra:
        "Después del envío, el expediente debe pasar por Policía Adicional UR IX y Bomberos (protección contra incendios). El sitio inicia el pedido; esos sellos se gestionan aparte.",
    },
    {
      id: "transporte-alimentos",
      titulo: "Transporte de sustancias alimenticias",
      resumen: "Habilitación de un vehículo para transportar alimentos.",
      tipo: "solicitud",
      icono: "🚚",
      pasos: [
        "Completá los datos del vehículo y la mercadería.",
        "Adjuntá la documentación.",
        "Enviá e imprimí la solicitud.",
        "Bromatología inspecciona el vehículo después.",
      ],
      campos: [
        { name: "marca", label: "Marca", type: "text", required: true, maxlength: 80 },
        { name: "dominio", label: "Dominio / patente", type: "text", required: true, maxlength: 20 },
        { name: "tipoVehiculo", label: "Tipo de vehículo", type: "text", required: true, maxlength: 80 },
        { name: "modeloAnio", label: "Modelo / año", type: "text", required: true, maxlength: 40 },
        { name: "mercaderia", label: "Mercadería de transporte", type: "text", required: true, maxlength: 200 },
      ],
      documentos: [
        { key: "dni", label: "Fotocopia de DNI del propietario", required: true },
        { key: "titulo", label: "Título del automotor radicado en el municipio", required: true },
        { key: "vtv", label: "Verificación técnica municipal y/o provincial", required: true },
        { key: "libreDeuda", label: "Libre de deuda municipal / impuesto provincial del automotor", required: true },
        { key: "libreta", label: "Libreta sanitaria", required: true },
        { key: "desinfeccion", label: "Certificado de desinfección del vehículo", required: true },
      ],
      notaIntro:
        "Solicito se me conceda la HABILITACIÓN DE TRANSPORTE DE SUSTANCIAS ALIMENTICIAS para el vehículo indicado.",
    },
    {
      id: "remis-taxi",
      titulo: "Remis, radio, taxis y transporte escolar",
      resumen: "Habilitación de vehículo de remis, radio, taxi o transporte escolar.",
      tipo: "solicitud",
      icono: "🚕",
      pasos: [
        "Completá rubro, datos del vehículo y de la empresa.",
        "Adjuntá la documentación (algunas firmas certificadas se completan en persona).",
        "Enviá e imprimí la solicitud.",
        "Si falta algún papel con firma certificada, lo entregás en la oficina.",
      ],
      campos: [
        { name: "rubro", label: "Rubro (remis / radio / taxi / transporte escolar)", type: "text", required: true, maxlength: 80 },
        { name: "marca", label: "Marca", type: "text", required: true, maxlength: 80 },
        { name: "modelo", label: "Modelo", type: "text", required: true, maxlength: 80 },
        { name: "anio", label: "Año", type: "text", required: true, maxlength: 10 },
        { name: "motor", label: "Motor", type: "text", required: false, maxlength: 80 },
        { name: "color", label: "Color", type: "text", required: true, maxlength: 40 },
        { name: "dominio", label: "Dominio / patente", type: "text", required: true, maxlength: 20 },
        { name: "empresa", label: "Empresa", type: "text", required: true, maxlength: 160 },
        { name: "domicilioEmpresa", label: "Domicilio de la empresa", type: "text", required: true, maxlength: 200 },
      ],
      documentos: [
        { key: "dni", label: "Fotocopia de DNI", required: true },
        { key: "titularidad", label: "Constancia de ser titular del vehículo", required: true },
        { key: "titulo", label: "Título del vehículo radicado en Jardín América", required: true },
        { key: "patente", label: "Último recibo de patente", required: true },
        { key: "carnet", label: "Carnet de conductor y categoría (M.J.A.)", required: true },
        { key: "seguro", label: "Seguro (transportados, equipajes y chofer)", required: true },
        { key: "libreta", label: "Libreta sanitaria (M.J.A.)", required: true },
        { key: "rto", label: "Revisión técnica provincial", required: true },
        { key: "desinfeccion", label: "Desinfección certificada por veterinario", required: true },
        { key: "cuit", label: "CUIT con firma del titular de la empresa", required: true },
        { key: "jubilacion", label: "Último aporte de jubilación de la empresa", required: true },
        { key: "contrato", label: "Contrato con la empresa (firmas certificadas)", required: true },
      ],
      notaIntro:
        "Solicito se me conceda la HABILITACIÓN del vehículo en el rubro indicado, afectado a la empresa detallada.",
    },
    {
      id: "cambio-domicilio",
      titulo: "Cambio de domicilio de comercio",
      resumen: "Comunicá el traslado de tu local comercial a una nueva dirección.",
      tipo: "solicitud",
      icono: "📦",
      pasos: [
        "Indicá el local y el domicilio anterior y el nuevo.",
        "Adjuntá la documentación y recordá que el cartón original se entrega en oficina.",
        "Enviá e imprimí la nota.",
        "Llevá el cartón de habilitación original a Bromatología cuando te indiquen.",
      ],
      campos: [
        { name: "denominacion", label: "Denominación del local", type: "text", required: true, maxlength: 160 },
        { name: "calleAnterior", label: "Calle (domicilio actual)", type: "text", required: true, maxlength: 120 },
        { name: "manzanaAnterior", label: "Manzana (actual)", type: "text", required: false, maxlength: 40 },
        { name: "parcelaAnterior", label: "Parcela (actual)", type: "text", required: false, maxlength: 40 },
        { name: "partidaAnterior", label: "Partida N° (actual)", type: "text", required: false, maxlength: 40 },
        { name: "calleNueva", label: "Calle (nuevo domicilio)", type: "text", required: true, maxlength: 120 },
        { name: "manzanaNueva", label: "Manzana (nueva)", type: "text", required: false, maxlength: 40 },
        { name: "parcelaNueva", label: "Parcela (nueva)", type: "text", required: false, maxlength: 40 },
        { name: "partidaNueva", label: "Partida N° (nueva)", type: "text", required: false, maxlength: 40 },
      ],
      documentos: [
        { key: "contrato", label: "Fotocopia de contrato de locación", required: true },
        { key: "tgi", label: "Impuesto TGI al día", required: true },
        { key: "sr310", label: "Formulario SR-310 (DGR)", required: true },
        { key: "seguridad", label: "Elementos de seguridad", required: true },
        { key: "carton", label: "Foto del cartón de habilitación (el original se entrega en oficina)", required: true },
      ],
      notaIntro:
        "Comunico el cambio de domicilio de mi local comercial según el detalle indicado, adjuntando la documentación requerida.",
      avisoExtra:
        "El cartón de habilitación original debe entregarse en la oficina de Bromatología para completar el trámite.",
    },
  ];

  function getById(id) {
    for (var i = 0; i < TRAMITES.length; i++) {
      if (TRAMITES[i].id === id) return TRAMITES[i];
    }
    return null;
  }

  window.MuniBromoTramitesData = {
    INTENDENTE: INTENDENTE,
    TRAMITES: TRAMITES,
    getById: getById,
  };
})();
