/**
 * Turismo i18n — ES / PT-BR / EN
 * Exposes window.TurismoI18n = { CONTENT, LABELS, apply }
 * IIFE, no modules.
 */
(function (global) {
  "use strict";

  var CONTENT = {
    "hero-title": {
      es: "Bienvenido a\nJardín América",
      pt: "Bem-vindo a\nJardín América",
      en: "Welcome to\nJardín América"
    },
    "info-title": {
      es: "Jardín América, la perla de la Ruta 12",
      pt: "Jardín América, a pérola da Rota 12",
      en: "Jardín América, the pearl of Route 12"
    },
    "p-donde-1": {
      es: "Jardín América está ubicada en el centro geográfico de la provincia de Misiones, sobre la Ruta Nacional 12, la arteria principal que conecta Posadas con Puerto Iguazú. Su nombre lo dice todo: es un verdadero jardín en medio de América.",
      pt: "Jardín América fica no centro geográfico da província de Misiones, sobre a Rota Nacional 12, a artéria principal que liga Posadas a Puerto Iguazú. O nome diz tudo: é um verdadeiro jardim no meio da América.",
      en: "Jardín América sits at the geographic center of Misiones Province, on National Route 12—the main artery linking Posadas to Puerto Iguazú. The name says it all: a true garden in the heart of the Americas."
    },
    "p-donde-2": {
      es: "Rodeada de una naturaleza exuberante propia de la selva paranaense, la ciudad es el punto de partida ideal para explorar los grandes atractivos de la provincia. A unos 30 minutos de las Reducciones Jesuíticas de San Ignacio y a 2 horas y media de las Cataratas del Iguazú.",
      pt: "Rodeada pela natureza exuberante da selva paranense, a cidade é o ponto de partida ideal para explorar os grandes atrativos da província. A cerca de 30 minutos das Reduções Jesuíticas de San Ignacio e a 2 horas e meia das Cataratas do Iguaçu.",
      en: "Surrounded by the lush Paranaense rainforest, the city is an ideal base for exploring the province’s major attractions. About 30 minutes from the Jesuit Ruins of San Ignacio and two and a half hours from Iguazú Falls."
    },
    "p-donde-3": {
      es: "Su entorno natural es notable: una gran variedad de aves y una rica flora subtropical con orquídeas y especies nativas de la selva misionera. A escasos kilómetros se encuentra el Parque Provincial Valle del Cuñá Pirú, hogar de los principales representantes de la fauna de la selva misionera.",
      pt: "Seu entorno natural é notável: grande variedade de aves e rica flora subtropical com orquídeas e espécies nativas da selva missioneira. A poucos quilômetros fica o Parque Provincial Valle del Cuñá Pirú, lar dos principais representantes da fauna da selva missioneira.",
      en: "Its natural setting is remarkable: a great variety of birds and rich subtropical flora with orchids and native rainforest species. Just a few kilometers away is Valle del Cuñá Pirú Provincial Park, home to key wildlife of the Misiones jungle."
    },
    "p-donde-4": {
      es: "El clima es subtropical cálido y húmedo durante todo el año, con lluvias distribuidas en todas las estaciones que mantienen verde e inundada de vida la selva que rodea la ciudad.",
      pt: "O clima é subtropical quente e úmido o ano todo, com chuvas em todas as estações que mantêm verde e cheia de vida a selva que cerca a cidade.",
      en: "The climate is warm and humid subtropical year-round, with rainfall in every season that keeps the surrounding rainforest green and full of life."
    },
    "p-cristo": {
      es: "Icónico monumento ubicado frente a la terminal de ómnibus. Fue tallado originalmente en una sola pieza de madera de timbó de 8,50 m por el escultor chileno Luis Javín Sizzara, e inaugurado el 20 de diciembre de 1998. Sobre un pedestal de hormigón alcanza los 18 metros de altura total. Es el primer símbolo que recibe al visitante al ingresar a la ciudad.",
      pt: "Monumento icônico em frente à rodoviária. Foi esculpido originalmente em uma única peça de madeira de timbó de 8,50 m pelo escultor chileno Luis Javín Sizzara e inaugurado em 20 de dezembro de 1998. Sobre um pedestal de concreto alcança 18 metros de altura total. É o primeiro símbolo que recebe o visitante ao entrar na cidade.",
      en: "An iconic monument opposite the bus terminal. Originally carved from a single 8.50 m timbó wood piece by Chilean sculptor Luis Javín Sizzara and unveiled on December 20, 1998. On a concrete pedestal it reaches 18 meters in total height. It is the first landmark that greets visitors entering the city."
    },
    "p-plaza": {
      es: "El corazón de Jardín América. Diseñada en 1967 por el arquitecto Fernando Juan Dasso, su geometría única combina cuadrados concéntricos con diagonales a 45°. Cuenta con cuatro pirámides de piedra basáltica con bajorrelieves históricos, espejo de agua y anfiteatro. Los domingos se convierte en escenario de los tradicionales Domingos Culturales con músicos, artesanos y emprendedores locales.",
      pt: "O coração de Jardín América. Projetada em 1967 pelo arquiteto Fernando Juan Dasso, sua geometria única combina quadrados concêntricos com diagonais a 45°. Conta com quatro pirâmides de pedra basáltica com baixos-relevos históricos, espelho d’água e anfiteatro. Aos domingos torna-se palco dos tradicionais Domingos Culturais, com músicos, artesãos e empreendedores locais.",
      en: "The heart of Jardín América. Designed in 1967 by architect Fernando Juan Dasso, its unique geometry combines concentric squares with 45° diagonals. It features four basalt-stone pyramids with historic bas-reliefs, a reflecting pool and an amphitheater. On Sundays it hosts the traditional Cultural Sundays with local musicians, artisans and entrepreneurs."
    },
    "p-cultura": {
      es: "Espacio institucional donde se concentra la vida cultural y artística de Jardín América. Organiza exposiciones, talleres, espectáculos y encuentros comunitarios, en articulación con el área de Cultura y Turismo Municipal y la Secretaría de Estado de Cultura de Misiones. También sede del Centro Social y Cultural Germano Argentino, activo en la comunidad desde hace décadas.",
      pt: "Espaço institucional onde se concentra a vida cultural e artística de Jardín América. Organiza exposições, oficinas, espetáculos e encontros comunitários, em articulação com a área de Cultura e Turismo Municipal e a Secretaria de Estado de Cultura de Misiones. Também sede do Centro Social e Cultural Germano-Argentino, ativo na comunidade há décadas.",
      en: "An institutional hub for Jardín América’s cultural and artistic life. It hosts exhibitions, workshops, shows and community gatherings, working with Municipal Culture and Tourism and the Misiones State Culture Secretariat. It is also home to the German-Argentine Social and Cultural Center, active in the community for decades."
    },
    "p-cooperativa": {
      es: "Fundada en 1973, es una de las cooperativas agroindustriales más importantes de Misiones, con más de 180 productores asociados. Ubicada sobre la Ruta 12, es parada obligada para conocer y comprar productos regionales a precio de origen: yerba mate, encurtidos (sus pepinillos son famosos en todo el país), dulces artesanales y fécula de mandioca.",
      pt: "Fundada em 1973, é uma das cooperativas agroindustriais mais importantes de Misiones, com mais de 180 produtores associados. Localizada sobre a Rota 12, é parada obrigatória para conhecer e comprar produtos regionais a preço de origem: erva-mate, conservas (seus pepinos são famosos em todo o país), doces artesanais e fécula de mandioca.",
      en: "Founded in 1973, it is one of Misiones’ most important agro-industrial cooperatives, with more than 180 associated producers. On Route 12, it is a must-stop to discover and buy regional products at origin prices: yerba mate, pickles (its gherkins are famous nationwide), artisanal sweets and cassava starch."
    },
    "p-badenbaden": {
      es: "Con más de 28 años de trayectoria, es el complejo recreativo más reconocido de la zona. Sobre la Ruta 12, ofrece piscinas con guardavidas, tirolesa, trekking, mountain bike, cabalgatas, quinchos, restaurante y alojamiento en cabañas y camping. Gestionado por una familia de origen alemán con fuerte compromiso ambiental y con la selva misionera.",
      pt: "Com mais de 28 anos de trajetória, é o complexo recreativo mais reconhecido da região. Sobre a Rota 12, oferece piscinas com salva-vidas, tirolesa, trekking, mountain bike, cavalgadas, quinchos, restaurante e hospedagem em cabanas e camping. Gerido por uma família de origem alemã com forte compromisso ambiental e com a selva missioneira.",
      en: "With more than 28 years of experience, it is the area’s best-known recreation complex. On Route 12 it offers lifeguarded pools, a zip line, trekking, mountain biking, horseback rides, covered grills, a restaurant and lodging in cabins and camping. Run by a German-origin family with a strong environmental commitment to the Misiones rainforest."
    },
    "p-paraiso": {
      es: "A solo 4 km del centro, sobre el km 1445 de la Ruta 12 a orillas del Arroyo Tabay. Cuenta con más de 20 cabañas con balcón y vista directa al arroyo y la cascada, piscina, restaurante y desayuno incluido. Desde el lodge se puede llegar caminando a los Saltos del Tabay en unos 25 minutos por sendero selvático.",
      pt: "A apenas 4 km do centro, no km 1445 da Rota 12, às margens do Arroyo Tabay. Conta com mais de 20 cabanas com varanda e vista direta para o riacho e a cachoeira, piscina, restaurante e café da manhã incluso. Do lodge é possível chegar a pé aos Saltos del Tabay em cerca de 25 minutos por trilha na selva.",
      en: "Just 4 km from downtown, at km 1445 of Route 12 on the banks of Arroyo Tabay. It has more than 20 cabins with balconies overlooking the stream and waterfall, a pool, restaurant and breakfast included. From the lodge you can walk to Saltos del Tabay in about 25 minutes along a rainforest trail."
    },
    "parroquia-title": {
      es: "Parroquia Cristo Redentor",
      pt: "Paróquia Cristo Redentor",
      en: "Cristo Redentor Parish"
    },
    "ysiry-title": {
      es: "Complejo Natural Ysirý",
      pt: "Complexo Natural Ysirý",
      en: "Ysirý Nature Complex"
    },
    "p-hero-desc": {
      es: "En el corazón de la selva misionera, donde la naturaleza cobra vida en cada rincón. Cascadas, selva virgen y una biodiversidad única en el mundo te esperan.",
      pt: "No coração da selva missioneira, onde a natureza ganha vida em cada canto. Cachoeiras, selva virgem e uma biodiversidade única no mundo esperam por você.",
      en: "In the heart of the Misiones rainforest, where nature comes alive in every corner. Waterfalls, virgin jungle and unique biodiversity await you."
    },
    "p-auto": {
      es: "Jardín América se encuentra sobre la Ruta Nacional 12, la principal vía de conexión entre Posadas y Puerto Iguazú. Desde Posadas: 100 km hacia el norte (~1 h 15 min). Desde Puerto Iguazú: 200 km hacia el sur (~2 h 30 min). La ruta está completamente pavimentada y en buen estado. Además, la Ruta Provincial N° 7 conecta el centro urbano con la Ruta Nacional 14 —el corredor que une Misiones con Corrientes y el resto del país por el este—, lo que convierte a Jardín América en un nodo de acceso desde ambas rutas nacionales.",
      pt: "Jardín América fica sobre a Rota Nacional 12, a principal via entre Posadas e Puerto Iguazú. De Posadas: 100 km ao norte (~1 h 15 min). De Puerto Iguazú: 200 km ao sul (~2 h 30 min). A rota é totalmente pavimentada e em bom estado. Além disso, a Rota Provincial nº 7 liga o centro urbano à Rota Nacional 14 — o corredor que une Misiones a Corrientes e ao resto do país pelo leste —, tornando Jardín América um nó de acesso a partir das duas rotas nacionais.",
      en: "Jardín América sits on National Route 12, the main link between Posadas and Puerto Iguazú. From Posadas: 100 km north (~1 h 15 min). From Puerto Iguazú: 200 km south (~2 h 30 min). The road is fully paved and in good condition. Provincial Route 7 also connects downtown to National Route 14—the eastern corridor linking Misiones with Corrientes and the rest of the country—making Jardín América a hub reachable from both national routes."
    },
    "p-colectivo": {
      es: "Hay servicios de larga distancia que pasan por Jardín América desde Posadas, Puerto Iguazú y otras ciudades de Misiones. La terminal de ómnibus se encuentra en el centro de la ciudad, frente al Cristo de la Hermandad. Empresas como Río Uruguay y Expreso Singer operan en este corredor.",
      pt: "Há serviços de longa distância que passam por Jardín América desde Posadas, Puerto Iguazú e outras cidades de Misiones. A rodoviária fica no centro da cidade, em frente ao Cristo de la Hermandad. Empresas como Río Uruguay e Expreso Singer operam nesse corredor.",
      en: "Long-distance buses stop in Jardín América from Posadas, Puerto Iguazú and other cities in Misiones. The bus terminal is downtown, opposite Cristo de la Hermandad. Companies such as Río Uruguay and Expreso Singer serve this corridor."
    },
    "p-avion": {
      es: "El aeropuerto más cercano es el Aeropuerto Internacional Libertador Gral. San Martín de Posadas (100 km), con vuelos diarios desde Buenos Aires. También puede usarse el Aeropuerto Internacional de Iguazú (200 km).",
      pt: "O aeroporto mais próximo é o Aeroporto Internacional Libertador Gral. San Martín de Posadas (100 km), com voos diários desde Buenos Aires. Também pode-se usar o Aeroporto Internacional de Iguaçu (200 km).",
      en: "The nearest airport is Libertador Gral. San Martín International Airport in Posadas (100 km), with daily flights from Buenos Aires. You can also use Iguazú International Airport (200 km)."
    },
    "local-title": {
      es: "Qué visitar en Jardín América",
      pt: "O que visitar em Jardín América",
      en: "What to visit in Jardín América"
    },
    "tabay-title": {
      es: "Saltos del Tabay",
      pt: "Saltos del Tabay",
      en: "Saltos del Tabay"
    },
    "p-tabay-1": {
      es: "El gran tesoro natural de Jardín América. Los Saltos del Tabay son una serie de cascadas y pozones escalonados en plena selva paranaense, donde el agua cae sobre rocas basálticas cubiertas de una vegetación exuberante.",
      pt: "O grande tesouro natural de Jardín América. Os Saltos del Tabay são uma série de cachoeiras e poços escalonados em plena selva paranense, onde a água cai sobre rochas basálticas cobertas de vegetação exuberante.",
      en: "Jardín América’s great natural treasure. The Saltos del Tabay are a series of stepped waterfalls and pools deep in the Paranaense rainforest, where water cascades over basalt rocks covered in lush vegetation."
    },
    "p-tabay-2": {
      es: "Un destino imperdible para los amantes de la naturaleza, el trekking y la fotografía. El entorno natural prácticamente intacto convierte a este lugar en una experiencia única, con sonidos de aves, el rumor del agua y el aroma de la selva húmeda.",
      pt: "Destino imperdível para amantes da natureza, trekking e fotografia. O entorno praticamente intacto torna o lugar uma experiência única, com sons de aves, o rumor da água e o aroma da selva úmida.",
      en: "A must for nature lovers, trekking and photography. The nearly untouched surroundings make it a unique experience—birdsong, rushing water and the scent of the humid forest."
    },
    "modal-tabay-title": {
      es: "🌊 Saltos del Tabay",
      pt: "🌊 Saltos del Tabay",
      en: "🌊 Saltos del Tabay"
    },
    "galeria-modal-title": {
      es: "🖼 Galería — Saltos del Tabay",
      pt: "🖼 Galeria — Saltos del Tabay",
      en: "🖼 Gallery — Saltos del Tabay"
    },
    "dormis-modal-title": {
      es: "🛖 Dormis — Saltos del Tabay",
      pt: "🛖 Dormis — Saltos del Tabay",
      en: "🛖 Cabins — Saltos del Tabay"
    },
    "cristo-title": {
      es: "Cristo de la Hermandad",
      pt: "Cristo de la Hermandad",
      en: "Cristo de la Hermandad"
    },
    "plaza-title": {
      es: "Plaza Colón",
      pt: "Praça Colón",
      en: "Plaza Colón"
    },
    "cultura-title": {
      es: "Casa de la Cultura",
      pt: "Casa da Cultura",
      en: "House of Culture"
    },
    "cooperativa-title": {
      es: "Cooperativa Flor de Jardín",
      pt: "Cooperativa Flor de Jardín",
      en: "Flor de Jardín Cooperative"
    },
    "badenbaden-title": {
      es: "Complejo Turístico Baden Baden",
      pt: "Complexo Turístico Baden Baden",
      en: "Baden Baden Tourism Complex"
    },
    "paraiso-title": {
      es: "Paraíso Lodge",
      pt: "Paraíso Lodge",
      en: "Paraíso Lodge"
    },
    "prov-title": {
      es: "Qué visitar desde Jardín América",
      pt: "O que visitar a partir de Jardín América",
      en: "What to visit from Jardín América"
    },
    "iguazu-title": {
      es: "Cataratas del Iguazú",
      pt: "Cataratas do Iguaçu",
      en: "Iguazú Falls"
    },
    "sanignacio-title": {
      es: "Reducciones de San Ignacio Mini",
      pt: "Reduções de San Ignacio Mini",
      en: "San Ignacio Mini Ruins"
    },
    "mocona-title": {
      es: "Saltos del Moconá",
      pt: "Saltos do Moconá",
      en: "Moconá Falls"
    },
    "wanda-title": {
      es: "Minas de Wanda",
      pt: "Minas de Wanda",
      en: "Wanda Mines"
    },
    "encantado-title": {
      es: "Salto Encantado",
      pt: "Salto Encantado",
      en: "Salto Encantado"
    },
    "santaana-title": {
      es: "Parque Temático de la Cruz",
      pt: "Parque Temático da Cruz",
      en: "Theme Park of the Cross"
    },
    "posadas-title": {
      es: "Posadas — Capital provincial",
      pt: "Posadas — Capital provincial",
      en: "Posadas — Provincial capital"
    },
    "festividades-title": {
      es: "Festividades de Jardín América",
      pt: "Festividades de Jardín América",
      en: "Festivals of Jardín América"
    },
    "fest-turista-title": {
      es: "Fiesta Provincial del Turista",
      pt: "Festa Provincial do Turista",
      en: "Provincial Tourist Festival"
    },
    "fest-viacrucis-title": {
      es: "Vía Crucis de la Selva",
      pt: "Via Sacra da Selva",
      en: "Stations of the Cross in the Jungle"
    },
    "fest-akimatsuri-title": {
      es: "Akimatsuri",
      pt: "Akimatsuri",
      en: "Akimatsuri"
    },
    "fest-folklore-title": {
      es: "Festival Provincial Infanto Juvenil del Folclore",
      pt: "Festival Provincial Infantojuvenil do Folclore",
      en: "Provincial Children and Youth Folklore Festival"
    },
    "fest-raices-title": {
      es: "Fiesta Provincial de las Raíces",
      pt: "Festa Provincial das Raízes",
      en: "Provincial Festival of Roots"
    },
    "info-util-title": {
      es: "Información de interés",
      pt: "Informações úteis",
      en: "Useful information"
    },
  };

  var LABELS = {
    "secInicioBadge": {
      es: "La ciudad",
      pt: "A cidade",
      en: "The city"
    },
    "secInicioSub": {
      es: "Una ciudad misionera que enamora con su naturaleza y su gente.",
      pt: "Uma cidade missioneira que encanta com sua natureza e sua gente.",
      en: "A Misiones city that charms with its nature and its people."
    },
    "secLocalBadge": {
      es: "Destino local",
      pt: "Destino local",
      en: "Local destination"
    },
    "secLocalSub": {
      es: "La selva que rodea la ciudad guarda tesoros naturales que sorprenden a cada visitante.",
      pt: "A selva que cerca a cidade guarda tesouros naturais que surpreendem cada visitante.",
      en: "The rainforest around the city holds natural treasures that surprise every visitor."
    },
    "secProvBadge": {
      es: "Excursiones desde aquí",
      pt: "Passeios a partir daqui",
      en: "Day trips from here"
    },
    "secProvSub": {
      es: "La Ruta 12 es tu autopista hacia las maravillas naturales e históricas de Misiones. Todos los grandes atractivos de la provincia están a poca distancia.",
      pt: "A Rota 12 é sua via para as maravilhas naturais e históricas de Misiones. Todos os grandes atrativos da província ficam a pouca distância.",
      en: "Route 12 is your gateway to the natural and historic wonders of Misiones. All the province’s major attractions are within easy reach."
    },
    "secFestBadge": {
      es: "Calendario anual",
      pt: "Calendário anual",
      en: "Yearly calendar"
    },
    "secFestSub": {
      es: "Las fiestas populares que dan identidad y color a la ciudad a lo largo del año.",
      pt: "As festas populares que dão identidade e cor à cidade ao longo do ano.",
      en: "The popular festivals that give the city its identity and color throughout the year."
    },
    "secInfoBadge": {
      es: "Jardín América",
      pt: "Jardín América",
      en: "Jardín América"
    },
    "secInfoSub": {
      es: "Horarios de colectivos, alojamientos y opciones gastronómicas en la ciudad.",
      pt: "Horários de ônibus, hospedagens e opções gastronômicas na cidade.",
      en: "Bus schedules, lodging and dining options in town."
    },
    "h2Donde": {
      es: "¿Dónde está y cómo es?",
      pt: "Onde fica e como é?",
      en: "Where is it and what is it like?"
    },
    "h2Llegar": {
      es: "¿Cómo llegar?",
      pt: "Como chegar?",
      en: "How to get here?"
    },
    "statUbicacion": {
      es: "Ubicación",
      pt: "Localização",
      en: "Location"
    },
    "statPoblacion": {
      es: "Población",
      pt: "População",
      en: "Population"
    },
    "statDesdePosadas": {
      es: "Desde Posadas",
      pt: "Desde Posadas",
      en: "From Posadas"
    },
    "statDesdeIguazu": {
      es: "Desde Puerto Iguazú",
      pt: "Desde Puerto Iguazú",
      en: "From Puerto Iguazú"
    },
    "statClima": {
      es: "Clima",
      pt: "Clima",
      en: "Climate"
    },
    "statProvincia": {
      es: "Provincia",
      pt: "Província",
      en: "Province"
    },
    "h3Auto": {
      es: "En auto",
      pt: "De carro",
      en: "By car"
    },
    "h3Colectivo": {
      es: "En colectivo",
      pt: "De ônibus",
      en: "By bus"
    },
    "h3Avion": {
      es: "En avión",
      pt: "De avião",
      en: "By plane"
    },
    "otrosAtractivos": {
      es: "Otros atractivos en los alrededores",
      pt: "Outros atrativos nos arredores",
      en: "Other nearby attractions"
    },
    "tabAloj": {
      es: "Alojamientos",
      pt: "Hospedagens",
      en: "Lodging"
    },
    "tabGastro": {
      es: "Gastronomía",
      pt: "Gastronomia",
      en: "Food"
    },
    "tabColec": {
      es: "Colectivos",
      pt: "Ônibus",
      en: "Buses"
    },
    "btnGaleria": {
      es: "🖼 Ver galería",
      pt: "🖼 Ver galeria",
      en: "🖼 View gallery"
    },
    "btnTarifas": {
      es: "💰 Tarifas",
      pt: "💰 Tarifas",
      en: "💰 Fees"
    },
    "btnDormis": {
      es: "🛖 Dormis",
      pt: "🛖 Dormis",
      en: "🛖 Cabins"
    },
    "olalaKicker": {
      es: "Agencia local habilitada",
      pt: "Agência local habilitada",
      en: "Licensed local agency"
    },
    "oficinaTurismo": {
      es: "Oficina de Turismo",
      pt: "Escritório de Turismo",
      en: "Tourism Office"
    },
    "colecPosadasTitle": {
      es: "📍 A Posadas — Todos los días",
      pt: "📍 Para Posadas — Todos os dias",
      en: "📍 To Posadas — Every day"
    },
    "colecIguazuTitle": {
      es: "📍 A Iguazú — Todos los días",
      pt: "📍 Para Iguaçu — Todos os dias",
      en: "📍 To Iguazú — Every day"
    },
    "colecRuta14Title": {
      es: "📍 A localidades de Ruta 14 — Todos los días",
      pt: "📍 Para localidades da Rota 14 — Todos os dias",
      en: "📍 To Route 14 towns — Every day"
    },
    "parroquia-desc": {
      es: "Fundada en 1952 y construida entre 1964 y 1967, es el templo más importante de la ciudad. Su rasgo más llamativo son sus 58 vitrales policromados que suman 125 m² de vidrio de color, diseñados por el arquitecto Fernando Dasso y fabricados en Porto Alegre. En su interior se venera una escultura del Cristo Redentor tallada en cedro colorado por el escultor tirolés Leo Moroder (1970), de 2,50 m y 300 kg.",
      pt: "Fundada em 1952 e construída entre 1964 e 1967, é o templo mais importante da cidade. Seu traço mais marcante são os 58 vitrais policromados que somam 125 m² de vidro colorido, desenhados pelo arquiteto Fernando Dasso e fabricados em Porto Alegre. Em seu interior venera-se uma escultura do Cristo Redentor talhada em cedro vermelho pelo escultor tirolês Leo Moroder (1970), de 2,50 m e 300 kg.",
      en: "Founded in 1952 and built between 1964 and 1967, it is the city’s most important church. Its most striking feature is 58 stained-glass windows totaling 125 m² of colored glass, designed by architect Fernando Dasso and made in Porto Alegre. Inside is a Cristo Redentor sculpture carved in red cedar by Tyrolean sculptor Leo Moroder (1970), 2.50 m tall and weighing 300 kg."
    },
    "ysiry-desc": {
      es: "\"Ysirý\" significa agua que corre en guaraní. Emprendimiento familiar inaugurado en 2018 en 15 hectáreas de naturaleza misionera. Cuenta con piscinas alimentadas por manantiales naturales, camping, cantina, animales en semilibertad y un salón de eventos climatizado para 220 personas. Abierto todos los días desde las 8 hs.",
      pt: "\"Ysirý\" significa água que corre em guarani. Empreendimento familiar inaugurado em 2018 em 15 hectares de natureza missioneira. Conta com piscinas alimentadas por nascentes naturais, camping, cantina, animais em semiliberdade e um salão de eventos climatizado para 220 pessoas. Aberto todos os dias a partir das 8h.",
      en: "\"Ysirý\" means running water in Guaraní. A family-run venture opened in 2018 across 15 hectares of Misiones nature. It features spring-fed pools, camping, a canteen, semi-free-roaming animals and a climate-controlled event hall for 220 people. Open every day from 8 AM."
    },
    "prov-iguazu-loc": {
      es: "Puerto Iguazú, Misiones",
      pt: "Puerto Iguazú, Misiones",
      en: "Puerto Iguazú, Misiones"
    },
    "prov-iguazu-desc": {
      es: "Una de las Siete Maravillas Naturales del Mundo y Patrimonio de la Humanidad (UNESCO). Más de 275 saltos de agua de hasta 80 metros de altura en plena selva subtropical. La Garganta del Diablo y los circuitos superior e inferior son experiencias imborrables.",
      pt: "Uma das Sete Maravilhas Naturais do Mundo e Patrimônio da Humanidade (UNESCO). Mais de 275 quedas d’água de até 80 metros de altura em plena selva subtropical. A Garganta do Diabo e os circuitos superior e inferior são experiências inesquecíveis.",
      en: "One of the Seven Natural Wonders of the World and a UNESCO World Heritage Site. More than 275 waterfalls up to 80 meters high in subtropical rainforest. Devil’s Throat and the upper and lower circuits are unforgettable experiences."
    },
    "prov-sanignacio-loc": {
      es: "San Ignacio, Misiones",
      pt: "San Ignacio, Misiones",
      en: "San Ignacio, Misiones"
    },
    "prov-sanignacio-desc": {
      es: "El sitio arqueológico más importante de Argentina y Patrimonio de la Humanidad (UNESCO). Las reducciones de esta misión jesuítica-guaraní del siglo XVII cuentan una historia fascinante. De noche, el espectáculo de luz y sonido es absolutamente imperdible.",
      pt: "O sítio arqueológico mais importante da Argentina e Patrimônio da Humanidade (UNESCO). As reduções desta missão jesuítico-guarani do século XVII contam uma história fascinante. À noite, o espetáculo de luz e som é absolutamente imperdível.",
      en: "Argentina’s most important archaeological site and a UNESCO World Heritage Site. The ruins of this 17th-century Jesuit-Guaraní mission tell a fascinating story. At night, the sound-and-light show is not to be missed."
    },
    "prov-mocona-loc": {
      es: "El Soberbio, Misiones",
      pt: "El Soberbio, Misiones",
      en: "El Soberbio, Misiones"
    },
    "prov-mocona-desc": {
      es: "Un fenómeno natural único en el mundo: cascatas longitudinales de hasta 3 km de largo sobre el río Uruguay. Ubicados en el Parque Provincial Moconá, en plena selva virgen. La mejor época para visitarlos es cuando el río baja su caudal.",
      pt: "Um fenômeno natural único no mundo: cachoeiras longitudinais de até 3 km de extensão sobre o rio Uruguai. Localizados no Parque Provincial Moconá, em plena selva virgem. A melhor época para visitá-los é quando o rio baixa sua vazão.",
      en: "A natural phenomenon unique in the world: longitudinal falls up to 3 km long on the Uruguay River. Located in Moconá Provincial Park, deep in virgin rainforest. The best time to visit is when the river’s flow drops."
    },
    "prov-wanda-loc": {
      es: "Wanda, Misiones",
      pt: "Wanda, Misiones",
      en: "Wanda, Misiones"
    },
    "prov-wanda-desc": {
      es: "Las únicas minas de piedras semipreciosas abiertas al turismo en Argentina. Amatistas, cuarzos, ágatas y otras gemas de extraordinaria belleza se extraen del subsuelo misionero. Un paseo geológico fascinante para toda la familia.",
      pt: "As únicas minas de pedras semipreciosas abertas ao turismo na Argentina. Ametistas, quartzos, ágatas e outras gemas de extraordinária beleza são extraídas do subsolo missioneiro. Um passeio geológico fascinante para toda a família.",
      en: "The only semiprecious-stone mines open to tourism in Argentina. Amethysts, quartz, agates and other gems of extraordinary beauty are mined from Misiones’ subsoil. A fascinating geological outing for the whole family."
    },
    "prov-encantado-loc": {
      es: "Aristóbulo del Valle, Misiones",
      pt: "Aristóbulo del Valle, Misiones",
      en: "Aristóbulo del Valle, Misiones"
    },
    "prov-encantado-desc": {
      es: "Una de las cascadas más impresionantes de Misiones, con una caída de 64 metros en el corazón del Parque Provincial Valle del Cuñá Pirú. Rodeada de selva nativa, es ideal para el trekking y la contemplación de la naturaleza en estado puro.",
      pt: "Uma das cachoeiras mais impressionantes de Misiones, com uma queda de 64 metros no coração do Parque Provincial Valle del Cuñá Pirú. Cercada de selva nativa, é ideal para trekking e contemplação da natureza em estado puro.",
      en: "One of Misiones’ most impressive waterfalls, with a 64-meter drop in the heart of Valle del Cuñá Pirú Provincial Park. Surrounded by native rainforest, it is ideal for trekking and contemplating nature in its purest form."
    },
    "prov-santaana-loc": {
      es: "Santa Ana, Misiones",
      pt: "Santa Ana, Misiones",
      en: "Santa Ana, Misiones"
    },
    "prov-santaana-desc": {
      es: "Un parque temático y espiritual ubicado en Santa Ana, con una imponente cruz que domina el paisaje misionero. Ofrece recorridos al aire libre, miradores con vistas a la selva y al río Paraná, y un entorno de paz ideal para visitas en familia o en grupo.",
      pt: "Um parque temático e espiritual em Santa Ana, com uma imponente cruz que domina a paisagem missioneira. Oferece percursos ao ar livre, mirantes com vistas para a selva e o rio Paraná, e um entorno de paz ideal para visitas em família ou em grupo.",
      en: "A thematic and spiritual park in Santa Ana, with an imposing cross overlooking the Misiones landscape. It offers outdoor paths, lookouts with views of the jungle and the Paraná River, and a peaceful setting ideal for family or group visits."
    },
    "prov-posadas-loc": {
      es: "Posadas, Misiones",
      pt: "Posadas, Misiones",
      en: "Posadas, Misiones"
    },
    "prov-posadas-desc": {
      es: "La capital provincial sobre el río Paraná, conocida por su vibrante costanera, la Bajada Vieja y la Pasarela Internacional que la une con Encarnación, Paraguay. Ciudad universitaria, cultural y gastronómica con amplia infraestructura turística.",
      pt: "A capital provincial às margens do rio Paraná, conhecida por sua vibrante orla, a Bajada Vieja e a Passarela Internacional que a une a Encarnación, no Paraguai. Cidade universitária, cultural e gastronômica, com ampla infraestrutura turística.",
      en: "The provincial capital on the Paraná River, known for its lively waterfront, the Bajada Vieja and the International Footbridge linking it to Encarnación, Paraguay. A university, cultural and food city with solid tourist infrastructure."
    },
    "fest-turista-when": {
      es: "📅 1.º fin de semana de enero · 3 días",
      pt: "📅 1.º fim de semana de janeiro · 3 dias",
      en: "📅 1st weekend of January · 3 days"
    },
    "fest-viacrucis-when": {
      es: "📅 Semana Santa · Abril",
      pt: "📅 Semana Santa · Abril",
      en: "📅 Holy Week · April"
    },
    "fest-akimatsuri-when": {
      es: "📅 Abril · 1 día",
      pt: "📅 Abril · 1 dia",
      en: "📅 April · 1 day"
    },
    "fest-folklore-when": {
      es: "📅 Septiembre",
      pt: "📅 Setembro",
      en: "📅 September"
    },
    "fest-raices-when": {
      es: "📅 Noviembre",
      pt: "📅 Novembro",
      en: "📅 November"
    },
    "fest-turista-desc": {
      es: "Celebrada cada verano durante el primer fin de semana de enero en el predio de los Saltos del Tabay, esta fiesta de jerarquía provincial convoca a miles de visitantes durante tres jornadas colmadas de shows artísticos en vivo, gastronomía regional y la emotiva elección y coronación de la Reina Provincial del Turista. El evento posiciona a Jardín América como referente del turismo misionero y es uno de los más esperados del verano en la Ruta 12. Año tras año, artistas de proyección nacional y regional se suman al escenario montado en plena selva para celebrar el espíritu viajero de la región.",
      pt: "Celebrada todo verão no primeiro fim de semana de janeiro no predio dos Saltos del Tabay, esta festa de hierarquia provincial reúne milhares de visitantes durante três jornadas repletas de shows artísticos ao vivo, gastronomia regional e a emocionante escolha e coroação da Rainha Provincial do Turista. O evento posiciona Jardín América como referência do turismo missioneiro e é um dos mais aguardados do verão na Rota 12. Ano após ano, artistas de projeção nacional e regional sobem ao palco montado em plena selva para celebrar o espírito viajante da região.",
      en: "Held every summer on the first weekend of January at the Saltos del Tabay grounds, this provincial-level festival draws thousands of visitors over three days packed with live shows, regional food and the emotional election and crowning of the Provincial Tourist Queen. The event positions Jardín América as a benchmark of Misiones tourism and is one of the most anticipated summer events on Route 12. Year after year, national and regional artists take the stage set deep in the rainforest to celebrate the region’s traveling spirit."
    },
    "fest-viacrucis-desc": {
      es: "En el entorno único de la selva paranaense, los Saltos del Tabay se transforman durante la Semana Santa en el escenario de este emotivo acto de fe. El Vía Crucis de la Selva recorre los senderos naturales del predio representando las catorce estaciones de la Pasión de Cristo, integrando devoción popular, naturaleza y comunidad en una ceremonia de profundo arraigo espiritual. La celebración convoca a fieles y peregrinos de toda la provincia y de localidades vecinas, consolidándose como uno de los actos religiosos más significativos de la región y una experiencia única que une la fe con la belleza del ambiente selvático misionero.",
      pt: "No entorno único da selva paranense, os Saltos del Tabay transformam-se durante a Semana Santa no cenário deste emotivo ato de fé. A Via Sacra da Selva percorre as trilhas naturais do predio representando as quatorze estações da Paixão de Cristo, integrando devoção popular, natureza e comunidade em uma cerimônia de profundo arraigo espiritual. A celebração reúne fiéis e peregrinos de toda a província e de localidades vizinhas, consolidando-se como um dos atos religiosos mais significativos da região e uma experiência única que une a fé à beleza do ambiente selvático missioneiro.",
      en: "In the unique setting of the Paranaense rainforest, Saltos del Tabay becomes the stage for this moving act of faith during Holy Week. The Stations of the Cross in the Jungle follows the site’s natural trails, representing the fourteen stations of the Passion of Christ and weaving popular devotion, nature and community into a ceremony of deep spiritual roots. The celebration draws worshippers and pilgrims from across the province and neighboring towns, standing as one of the region’s most significant religious events and a unique experience that joins faith with the beauty of the Misiones jungle."
    },
    "fest-akimatsuri-desc": {
      es: "Aki Matsuri significa literalmente \"Festival de Otoño\" y tiene sus raíces en la tradición japonesa de celebrar la finalización de la cosecha de arroz. Sus tres pilares son el agradecimiento por los frutos de la tierra, la petición de salud y prosperidad para la nueva etapa, y el vínculo cultural que une a la comunidad nipona con su tierra de origen.",
      pt: "Aki Matsuri significa literalmente \"Festival de Outono\" e tem suas raízes na tradição japonesa de celebrar o fim da colheita do arroz. Seus três pilares são o agradecimento pelos frutos da terra, o pedido de saúde e prosperidade para a nova etapa, e o vínculo cultural que une a comunidade nipo-brasileira/nipo-argentina à sua terra de origem.",
      en: "Aki Matsuri literally means \"Autumn Festival\" and has its roots in the Japanese tradition of celebrating the end of the rice harvest. Its three pillars are gratitude for the fruits of the land, prayers for health and prosperity in the new season, and the cultural bond that links the Japanese community to its homeland."
    },
    "fest-akimatsuri-desc2": {
      es: "En Jardín América, que alberga una de las colonias japonesas más importantes del interior argentino, el Akimatsuri se celebra cada abril con danzas tradicionales Eisa de Okinawa, los potentes tambores del grupo local Ryujin Daiko, yosakoi y gastronomía típica japonesa. Un encuentro abierto a toda la comunidad.",
      pt: "Em Jardín América, que abriga uma das colônias japonesas mais importantes do interior argentino, o Akimatsuri é celebrado todo abril com danças tradicionais Eisa de Okinawa, os potentes tambores do grupo local Ryujin Daiko, yosakoi e gastronomia típica japonesa. Um encontro aberto a toda a comunidade.",
      en: "In Jardín América, home to one of the most important Japanese colonies in inland Argentina, Akimatsuri is celebrated every April with traditional Okinawan Eisa dances, the powerful drums of the local Ryujin Daiko group, yosakoi and typical Japanese food. An open gathering for the whole community."
    },
    "fest-folklore-desc": {
      es: "Cada septiembre, Jardín América se convierte en la gran vidriera del talento folclórico infantil y juvenil de Misiones. En este festival de proyección provincial, pequeños y jóvenes bailarines y cantores de toda la provincia compiten ante un jurado especializado en distintas categorías de danza y canto nativo. El premio mayor es el pase para representar a Misiones en el prestigioso Festival Nacional de Folclore de Cosquín, Córdoba, el escenario más importante del folclore argentino. Una fiesta que celebra las raíces culturales y apuesta por las nuevas generaciones como custodias de la identidad popular.",
      pt: "Todo setembro, Jardín América torna-se a grande vitrine do talento folclórico infantil e juvenil de Misiones. Neste festival de projeção provincial, crianças e jovens dançarinos e cantores de toda a província competem perante um júri especializado em distintas categorias de dança e canto nativo. O grande prêmio é a vaga para representar Misiones no prestigioso Festival Nacional de Folclore de Cosquín, Córdoba, o palco mais importante do folclore argentino. Uma festa que celebra as raízes culturais e aposta nas novas gerações como guardiãs da identidade popular.",
      en: "Every September, Jardín América becomes the showcase of Misiones’ children and youth folklore talent. In this provincial festival, young dancers and singers from across the province compete before a specialized jury in native dance and song categories. The top prize is a place to represent Misiones at the prestigious National Folklore Festival of Cosquín, Córdoba—Argentina’s foremost folklore stage. A celebration of cultural roots that invests in new generations as custodians of popular identity."
    },
    "fest-raices-desc": {
      es: "Jardín América, ciudad forjada por el esfuerzo de inmigrantes de distintos continentes, celebra cada noviembre su riqueza cultural con la Fiesta Provincial de las Raíces. Las colectividades que dieron identidad a la ciudad —polaca, ucraniana, alemana, brasileña, paraguaya, italiana y otras— despliegan sus danzas típicas, músicas tradicionales, vestimentas ancestrales y gastronomía auténtica en un colorido festival que reafirma el crisol de razas que hace única a esta tierra misionera. Una celebración de memoria, orgullo y convivencia que invita a conocer las raíces profundas de cada familia que eligió este rincón de la selva para construir su hogar.",
      pt: "Jardín América, cidade forjada pelo esforço de imigrantes de distintos continentes, celebra todo novembro sua riqueza cultural com a Festa Provincial das Raízes. As coletividades que deram identidade à cidade — polonesa, ucraniana, alemã, brasileira, paraguaia, italiana e outras — exibem suas danças típicas, músicas tradicionais, trajes ancestrais e gastronomia autêntica em um colorido festival que reafirma o caldeirão de culturas que torna única esta terra missioneira. Uma celebração de memória, orgulho e convivência que convida a conhecer as raízes profundas de cada família que escolheu este canto da selva para construir seu lar.",
      en: "Jardín América, a city forged by immigrants from many continents, celebrates its cultural wealth every November with the Provincial Festival of Roots. The communities that shaped the city—Polish, Ukrainian, German, Brazilian, Paraguayan, Italian and others—share typical dances, traditional music, ancestral dress and authentic cuisine in a colorful festival that affirms the melting pot that makes this Misiones land unique. A celebration of memory, pride and coexistence that invites you to discover the deep roots of every family that chose this corner of the jungle to build a home."
    },
    "quickKicker": {
      es: "Empezá acá",
      pt: "Comece aqui",
      en: "Start here"
    },
    "quickTitle": {
      es: "¿Qué necesitás hoy?",
      pt: "O que você precisa hoje?",
      en: "What do you need today?"
    },
    "q1t": {
      es: "Saltos del Tabay",
      pt: "Saltos del Tabay",
      en: "Saltos del Tabay"
    },
    "q1d": {
      es: "Atractivo principal, tarifas y ubicación",
      pt: "Atração principal, tarifas e localização",
      en: "Main attraction, fees and location"
    },
    "q2t": {
      es: "Cómo llegar",
      pt: "Como chegar",
      en: "How to get here"
    },
    "q2d": {
      es: "Auto, colectivo y avión",
      pt: "Carro, ônibus e avião",
      en: "Car, bus and plane"
    },
    "q3t": {
      es: "Colectivos",
      pt: "Ônibus",
      en: "Buses"
    },
    "q3d": {
      es: "Horarios a Posadas, Iguazú y Ruta 14",
      pt: "Horários para Posadas, Iguaçu e Rota 14",
      en: "Schedules to Posadas, Iguazú and Route 14"
    },
    "q4t": {
      es: "Dónde dormir",
      pt: "Onde dormir",
      en: "Where to stay"
    },
    "q4d": {
      es: "Alojamientos registrados",
      pt: "Hospedagens registradas",
      en: "Registered lodging"
    },
    "portal": {
      es: "Portal municipal",
      pt: "Portal municipal",
      en: "Municipal portal"
    },
    "folleto": {
      es: "Folleto",
      pt: "Folheto",
      en: "Brochure"
    },
    "olalaTitle": {
      es: "Paquetes y tours receptivos",
      pt: "Pacotes e tours receptivos",
      en: "Packages and inbound tours"
    },
    "olalaText": {
      es: "Olalá Viajes es la agencia habilitada en Jardín América para la venta de paquetes turísticos. Consultá tours por Misiones y Esteros del Iberá.",
      pt: "Olalá Viajes é a agência habilitada em Jardín América para a venda de pacotes turísticos. Consulte tours por Missões e Esteros del Iberá.",
      en: "Olalá Viajes is the licensed agency in Jardín América for tour package sales. Browse tours around Misiones and the Iberá Wetlands."
    },
    "olalaCta": {
      es: "Ver paquetes receptivos",
      pt: "Ver pacotes receptivos",
      en: "View inbound packages"
    },
    "festLink": {
      es: "Ver agenda de eventos →",
      pt: "Ver agenda de eventos →",
      en: "See events agenda →"
    },
    "navInicio": {
      es: "Inicio",
      pt: "Início",
      en: "Home"
    },
    "navLocal": {
      es: "Qué visitar aquí",
      pt: "O que visitar aqui",
      en: "Visit here"
    },
    "navProv": {
      es: "Qué visitar desde aquí",
      pt: "O que visitar daqui",
      en: "Visit from here"
    },
    "navFest": {
      es: "Festividades",
      pt: "Festividades",
      en: "Festivals"
    },
    "navInfo": {
      es: "Información útil",
      pt: "Informação útil",
      en: "Useful info"
    },
  };

  var HERO_HTML = {
    es: "Bienvenido a<br><em>Jardín América</em>",
    pt: "Bem-vindo a<br><em>Jardín América</em>",
    en: "Welcome to<br><em>Jardín América</em>"
  };

  function pick(entry, lang) {
    if (!entry) return "";
    return entry[lang] || entry.es || "";
  }

  /**
   * Apply language to CONTENT (by id) and LABELS (by data-tm).
   * Provincial/local paragraphs without ids use data-tm keys injected in HTML:
   *   prov-*-loc / prov-*-desc, parroquia-desc, ysiry-desc, fest-*-when / fest-*-desc.
   * Without data-tm, after h3#iguazu-title the next two <p> siblings are
   * location then description (same pattern for other provincial title ids).
   */
  function apply(lang) {
    lang = lang === "pt" || lang === "en" ? lang : "es";

    Object.keys(CONTENT).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      if (id === "hero-title") {
        el.innerHTML = HERO_HTML[lang] || HERO_HTML.es;
        return;
      }
      el.textContent = pick(CONTENT[id], lang);
    });

    document.querySelectorAll("[data-tm]").forEach(function (el) {
      var key = el.getAttribute("data-tm");
      if (!key || !LABELS[key]) return;
      var text = pick(LABELS[key], lang);

      var rebuildIds = {
        "btn-abrir-galeria": 1,
        "btn-abrir-modal": 1,
        "btn-abrir-dormis": 1,
        "tab-alojamientos": 1,
        "tab-gastronomia": 1,
        "tab-colectivos": 1
      };
      if (el.id && rebuildIds[el.id]) {
        var icon = el.querySelector("[aria-hidden], .tab-icon");
        if (icon) {
          var parts = text.match(/^(\S+)\s+(.*)$/);
          var rest = parts ? parts[2] : text;
          el.textContent = "";
          el.appendChild(icon);
          el.appendChild(document.createTextNode(" " + rest));
        } else {
          el.textContent = text;
        }
        return;
      }

      el.textContent = text;
    });
  }

  global.TurismoI18n = {
    CONTENT: CONTENT,
    LABELS: LABELS,
    apply: apply
  };

})(typeof window !== "undefined" ? window : this);
