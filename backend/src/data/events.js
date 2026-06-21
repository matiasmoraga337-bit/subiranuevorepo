export const fixedEvents = {
  0: {
    day: 0,
    title: 'ALERTA NACIONAL',
    location: 'casa',
    image: 'noticiadia0',
    segments: [
      {
        text: 'La pantalla de la televisión parpadea con interferencia. De repente, una transmisión de emergencia interrumpe toda programación...',
      },
      {
        text: '"ATENCIÓN CIUDADANOS. UN BROTE INCONTROLABLE ESTÁ TRANSFORMANDO A LAS PERSONAS EN SERES AGRESIVOS. NO SALGA DE SU HOGAR. RACIONE COMIDA Y AGUA."',
      },
      {
        text: '"UN OPERATIVO DE EVACUACIÓN SERÁ REALIZADO EN 15 DÍAS. MANTÉNGASE VIVO. QUÉDATE EN CASA. EL RESCATE VIENE."',
      },
      {
        text: 'La pantalla vuelve a la normalidad. Miras por la ventana: las calles están vacías. Solo se escuchan gritos lejanos...',
      },
    ],
    type: 'intro',
  },

  // ============================================================
  // DÍA 1: DECISIÓN MORAL — Dejar entrar a la madre e hijo
  // ============================================================
  1: {
    day: 1,
    title: 'DECISIÓN MORAL',
    location: 'casa',
    image: 'casadia1',
    segments: [
      {
        text: 'Es tu primer día completo en el refugio. El silencio es interrumpido por golpes desesperados en la puerta.',
      },
      {
        text: 'Miras por la mirilla: una mujer con su hijo pequeño, ambos demacrados, con miedo en los ojos. La mujer susurra: "Por favor... mi hijo tiene hambre..."',
      },
    ],
    decisions: [
      {
        text: 'Dejar entrar',
        effects: { food: -1, water: 0, health: 0, morale: 18 },
        result: 'La mujer entra llorando de gratitud. Su hijo se esconde detrás de ella. Ahora no estás solo.',
        setsFlag: 'refugees',
      },
      {
        text: 'No abrir',
        effects: { food: 0, water: 0, health: -2, morale: -12 },
        result: 'Escuchas los pasos alejarse. Los gritos del niño te perseguirán toda la noche. El silencio vuelve, pero algo se rompió dentro de ti.',
        setsFlag: 'd1_solo',
      },
    ],
  },

  // ============================================================
  // DÍA 2: RACIONAMIENTO (con refugiados) / EL SILENCIO (solo)
  // ============================================================
  2: [
    {
      day: 2,
      title: 'RACIONAMIENTO',
      location: 'casa',
      image: 'casadia1',
      requiresFlag: 'refugees',
      segments: [
        {
          text: 'La mujer y su hijo se acomodaron en un rincón. El niño tiene fiebre. Ella te mira mientras revisas las pocas provisiones que quedan.',
        },
        {
          text: 'El niño tose. "¿Hay suficiente para todos?", pregunta ella con voz temblorosa. Sabes que si compartes, los recursos se agotarán mucho más rápido.',
        },
      ],
      decisions: [
        {
          text: 'Compartir honestamente',
          effects: { food: -2, water: -1, health: 0, morale: 15 },
          result: 'Compartes lo que tienes. Ella asiente, agradecida. "No lo olvidaré", dice. La confianza entre ustedes se fortalece. Pero los recursos bajan.',
          setsFlag: 'd2_share',
        },
        {
          text: 'Mentir sobre las provisiones',
          effects: { food: 0, water: 0, health: 0, morale: -8 },
          result: 'Escondes algunas latas. Le dices que es todo lo que hay. Ella te mira fijamente... quizás lo sabe. La incomodidad se instala.',
          setsFlag: 'd2_lie',
        },
      ],
    },
    {
      day: 2,
      title: 'EL SILENCIO',
      location: 'casa',
      image: 'casadia1',
      requiresNoFlag: 'refugees',
      segments: [
        {
          text: 'El silencio en el departamento es absoluto. Ya no se escuchan los gritos del niño ni los ruegos de la madre.',
        },
        {
          text: 'Revisas tus provisiones. Suficiente para una persona. Te preguntas si tomaste la decisión correcta. Afuera, la ciudad arde.',
        },
      ],
    },
  ],

  // ============================================================
  // DÍA 3: SUPERMERCADO — Tres ramas distintas
  // ============================================================
  3: [
    {
      day: 3,
      title: 'SILENCIO INCÓMODO',
      location: 'supermercado',
      image: 'superme',
      requiresFlag: 'd2_lie',
      segments: [
        {
          text: 'La atmósfera es tensa. Ella apenas te habla. El niño llora de hambre. Las mentiras empiezan a pesar.',
        },
        {
          text: 'A dos cuadras hay un supermercado. esta bastante destruido. Podrías ir a buscar provisiones... pero es arriesgado.',
        },
      ],
      decisions: [
        {
          text: 'Ir al supermercado',
          effects: { food: 5, water: 3, health: -3, morale: 3 },
          result: 'Vas solo al anochecer. Encuentras latas y botellas entre los escombros. Vuelves antes del amanecer con los brazos cargados.',
          setsFlag: 'd3_super',
        },
        {
          text: 'Quedarte a fortificar la casa',
          effects: { food: 0, water: 0, health: 2, morale: -3 },
          result: 'Clavas tablones en las ventanas. La casa está más segura... pero el hambre no desaparece.',
          setsFlag: 'd3_stay',
        },
      ],
    },
    {
      day: 3,
      title: 'RECURSOS A CERO',
      location: 'supermercado',
      image: 'superme',
      requiresFlag: 'd2_share',
      segments: [
        {
          text: 'La mesa está vacía. Lo diste todo. El niño ya no llora, solo respira débilmente. Necesitas provisiones urgentemente.',
        },
        {
          text: 'Ella se acerca. "Conozco el vecindario. Si vamos juntos al supermercado, podemos traer el doble". Sus ojos reflejan determinación.',
        },
      ],
      decisions: [
        {
          text: 'Ir juntos al supermercado',
          effects: { food: 8, water: 5, health: -2, morale: 15 },
          result: 'Salen juntos al anochecer. Ella conoce atajos. Entre los dos cargan el doble de provisiones. La confianza se consolida.',
          setsFlag: 'd3_super_allies',
        },
        {
          text: 'Ir solo',
          effects: { food: 5, water: 3, health: -4, morale: -2 },
          result: 'Ella insiste en acompañarte pero te niegas. Vas solo al supermercado. Encuentras provisiones, pero no sabes si sera suficiente.',
          setsFlag: 'd3_super',
        },
      ],
    },
    {
      day: 3,
      title: 'DECISIÓN SUPERMERCADO',
      location: 'supermercado',
      image: 'superme',
      requiresNoFlag: 'refugees',
      segments: [
        {
          text: 'Tus provisiones se agotan. El estómago te gruñe. A dos cuadras hay un supermercado bastante destruido.',
        },
        {
          text: 'No tienes a nadie que te ayude. Si no consigues comida pronto, no sobrevivirás.',
        },
      ],
      decisions: [
        {
          text: 'Ir al supermercado',
          effects: { food: 5, water: 3, health: -3, morale: 3 },
          result: 'Vas solo. Encuentras latas y agua entre los escombros. Una figura te observa desde la oscuridad pero logras escapar.',
          setsFlag: 'd3_super',
        },
        {
          text: 'No ir (quedarse)',
          effects: { food: 0, water: 0, health: -100, morale: 0 },
          result: 'Te quedas en casa. Sin recursos. El hambre te consume. No sobrevives a la noche.',
        },
      ],
    },
  ],

  // ============================================================
  // DÍA 4: VUELTA AL HOGAR / DISCUSIÓN POR HAMBRE
  // ============================================================
  4: [
    {
      day: 4,
      title: 'VUELTA AL HOGAR',
      location: 'casa',
      image: 'casa_con_tablones',
      requiresFlags: ['d3_super', 'refugees'],
      segments: [
        {
          text: 'Vuelves al refugio con provisiones. Ella te recibe con alivio. El niño sonríe por primera vez.',
        },
        {
          text: 'Organizan las latas y el agua. Por un momento, casi se siente como un hogar. Pero sabes que esto es solo el principio.',
        },
      ],
    },
    {
      day: 4,
      title: 'VUELTA AL HOGAR',
      location: 'casa',
      image: 'casa_con_tablones',
      requiresFlags: ['d3_super', 'd1_solo'],
      segments: [
        {
          text: 'Vuelves solo a tu refugio. Dejas las latas sobre la mesa. El silencio te recibe como siempre.',
        },
        {
          text: 'Al menos tienes comida para unos días más. Pero la soledad pesa cada vez más.',
        },
      ],
    },
    {
      day: 4,
      title: 'VUELTA AL HOGAR',
      location: 'casa',
      image: 'casa_con_tablones',
      requiresFlags: ['d3_super_allies'],
      segments: [
        {
          text: 'Vuelven juntos al refugio, cargados de provisiones. La mujer sonríe por primera vez desde que llegó.',
        },
        {
          text: 'El niño juega con una lata vacía. Por un instante, casi parece un día normal. Pero el mundo allá afuera sigue ardiendo.',
        },
      ],
    },
    {
      day: 4,
      title: 'DISCUSIÓN POR HAMBRE',
      location: 'casa',
      image: 'casa_con_tablones',
      requiresFlag: 'd3_stay',
      segments: [
        {
          text: 'No fuiste al supermercado. Las provisiones escasean. El niño llora de hambre y la mujer te mira con desesperación.',
        },
        {
          text: '"¡No tenemos nada!", grita ella. "Mi hijo se está muriendo y tu no hiciste nada". La tensión explota en el refugio.',
        },
      ],
      decisions: [
        {
          text: 'Ignorar la discusión',
          effects: { food: 0, water: 0, health: 0, morale: -6 },
          result: 'Te das la vuelta y no dices nada. Ella sigue gritando. La situación solo empeora. La desconfianza crece como una grieta en la pared.',
          setsFlag: 'd4_ignore',
        },
        {
          text: 'Echarlos del refugio',
          effects: { food: 1, water: 1, health: -3, morale: -12 },
          result: '"¡Fuera!", gritas. La mujer toma a su hijo y sale a la calle, entre lágrimas. Te quedas solo otra vez. El silencio es peor que antes.',
          setsFlag: 'd4_kick',
        },
      ],
    },
  ],

  // ============================================================
  // DÍA 5: Minijuego — Recoger Agua de Lluvia (en minigameEvents)
  // ============================================================

  // ============================================================
  // DÍA 6: LA RADIO / CONFRONTACIÓN
  // ============================================================
  6: [
    {
      day: 6,
      title: 'LA RADIO',
      location: 'casa',
      image: 'casa_con_tablones',
      requiresFlags: ['refugees', 'd2_share'],
      segments: [
        {
          text: 'Encuentras una radio de emergencia entre los escombros. Funciona. Una voz metálica anuncia: "El rescate está en camino. Mantengan la calma."',
        },
        {
          text: 'La mujer se sienta a tu lado. "Vamos a salir de esta", dice. Su voz es cálida. Por primera vez en días, sientes esperanza.',
        },
        {
          text: 'Ella te prepara un poco de agua con las últimas gotas. "Gracias por confiar en nosotros", susurra.',
        },
      ],
      decisions: [
        {
          text: 'Agradecer y consolarse mutuamente',
          effects: { food: 0, water: 0, health: 0, morale: 20 },
          result: 'Comparten un momento de calma. Hablan de sus vidas antes del apocalipsis. La moral del grupo se fortalece.',
          setsFlag: 'd6_consuelo',
        },
      ],
    },
    {
      day: 6,
      title: 'CONFRONTACIÓN',
      location: 'casa',
      image: 'casa_con_tablones',
      requiresFlags: ['refugees', 'd2_lie'],
      segments: [
        {
          text: 'La radio de emergencia anuncia el rescate. Pero notas algo raro: falta una lata de comida. La mujer evita tu mirada.',
        },
        {
          text: '"¿Dónde está la lata que faltaba?", preguntas. Ella se tensa. El niño empieza a llorar. Algo no está bien.',
        },
      ],
      decisions: [
        {
          text: 'Enfadarte y pedir explicaciones',
          effects: { food: 0, water: 0, health: -2, morale: -10 },
          result: 'Gritas. Ella confiesa entre lágrimas que se la dio al niño porque tenía hambre. La discusión sube de tono. Terminas echándolos del refugio.',
          setsFlag: 'd6_kicked',
        },
        {
          text: 'Callar y perdonar',
          effects: { food: -1, water: 0, health: 0, morale: -3 },
          result: 'Respiras hondo y no dices nada. Ella baja la mirada. "Lo siento", susurra. La confianza está dañada pero al menos siguen juntos.',
          setsFlag: 'd6_perdon',
        },
      ],
    },
    {
      day: 6,
      title: 'TE ROBAN Y SE VAN',
      location: 'casa',
      image: 'casa_con_tablones',
      requiresFlag: 'd4_ignore',
      segments: [
        {
          text: 'Despiertas y algo no está bien. La mujer y el niño ya no están. Revisas tus provisiones: se llevaron la mitad.',
        },
        {
          text: 'Sobre la mesa, una nota garabateada: "Perdón. Mi hijo no podía más." Estás solo otra vez, y con menos recursos.',
        },
      ],
      decisions: [
        {
          text: 'Seguir adelante',
          effects: { food: -2, water: -1, health: -3, morale: -8 },
          result: 'No hay nada que hacer. Se fueron. Te quedas mirando la nota. La soledad es absoluta.',
          setsFlag: 'd6_alone',
        },
      ],
    },
    {
      day: 6,
      title: 'LA RADIO',
      location: 'casa',
      image: 'casa_con_tablones',
      requiresFlags: ['d1_solo'],
      segments: [
        {
          text: 'Encuentras una radio de emergencia entre los escombros. Una voz metálica dice: "El rescate está en camino."',
        },
        {
          text: 'Estás solo. Nadie celebra la noticia contigo. Pero al menos hay una esperanza.',
        },
      ],
      decisions: [
        {
          text: 'Escuchar la radio',
          effects: { food: 0, water: 0, health: 0, morale: 5 },
          result: 'La radio crepita. Escuchas mensajes de otros supervivientes. No estás completamente solo en el mundo.',
        },
      ],
    },
    {
      day: 6,
      title: 'DESPUÉS DE LA TORMENTA',
      location: 'casa',
      image: 'casa_con_tablones',
      requiresFlag: 'd4_kick',
      segments: [
        {
          text: 'Ya no están. Los echaste. Por un lado, tienes más comida para ti. Por otro, el silencio es ensordecedor.',
        },
        {
          text: 'La radio de emergencia anuncia el rescate. "Ojalá estén bien allá afuera".',
        },
      ],
      decisions: [
        {
          text: 'Seguir adelante solo',
          effects: { food: 0, water: 0, health: 0, morale: -5 },
          result: 'Estás solo. Es lo que querías, ¿no? Pero la culpa no te abandona.',
          setsFlag: 'd6_alone',
        },
      ],
    },
  ],

  // ============================================================
  // DÍA 7: BOMBARDEO NOCTURNO
  // ============================================================
  7: {
    day: 7,
    title: 'BOMBARDEO NOCTURNO',
    location: 'casa',
    image: 'casa_con_tablones',
    segments: [
      {
        text: 'Una noche, el cielo se ilumina de naranja. Explosiones sacuden la ciudad. Los cristales de las ventanas vibran.',
      },
      {
        text: 'El bombardeo se acerca. Tienes que decidir rápido dónde refugiarte. Cada decisión tiene consecuencias.',
      },
    ],
    decisions: [
      {
        text: 'Refugiarte en el sótano',
        effects: { food: -1, water: 0, health: 6, morale: 0 },
        result: 'Bajas al sótano justo a tiempo. Las explosiones sacuden el edificio pero estás a salvo. Perdiste algunas provisiones en la carrera.',
        setsFlag: 'd7_sotano',
      },
      {
        text: 'Quedarte en la casa',
        effects: { food: 0, water: 0, health: -6, morale: -5 },
        result: 'Te quedas protegiendo las provisiones. Una explosión cercana derrumba parte del techo. Sales lastimado pero conservaste todo.',
        setsFlag: 'd7_casa',
      },
    ],
  },

  // ============================================================
  // DÍA 8: FIEBRE POR RADIACIÓN
  // ============================================================
  8: [
    {
      day: 8,
      title: 'FIEBRE POR RADIACIÓN',
      location: 'casa',
      image: 'casa_con_tablones',
      requiresFlag: 'refugees',
      segments: [
        {
          text: 'Te despiertas empapado en sudor. La radiación del bombardeo te pasó factura. Fiebre alta. Apenas puedes moverte.',
        },
        {
          text: 'La mujer coloca un trapo húmedo en tu frente. "No te voy a dejar solo", dice. Su hijo te trae un poco de agua.',
        },
        {
          text: 'Gracias a sus cuidados, la fiebre no es tan grave. Te recuperas más rápido de lo esperado.',
        },
      ],
      decisions: [
        {
          text: 'Aceptar su ayuda',
          effects: { food: -1, water: -1, health: 5, morale: 10 },
          result: 'Ella te cuida durante la noche. Te da agua y te limpia el sudor. "Estamos juntos en esto", dice. Te recuperas.',
        },
      ],
    },
    {
      day: 8,
      title: 'FIEBRE POR RADIACIÓN',
      location: 'casa',
      image: 'casa_con_tablones',
      requiresNoFlag: 'refugees',
      segments: [
        {
          text: 'Te despiertas ardiendo en fiebre. La radiación del bombardeo te golpeó fuerte. No puedes levantarte de la cama.',
        },
        {
          text: 'Estás solo. No hay nadie que te traiga agua ni te cuide. Las horas pasan y la fiebre no cede.',
        },
      ],
      decisions: [
        {
          text: 'Resistir como puedas',
          effects: { food: -1, water: -1, health: -8, morale: -5 },
          result: 'La fiebre te consume. Pasas el día en cama. Apenas puedes beber agua. Pero sobrevives... por ahora.',
        },
      ],
    },
  ],

  // ============================================================
  // DÍA 9: VIAJE A LA FARMACIA
  // ============================================================
  9: {
    day: 9,
    title: 'VIAJE A LA FARMACIA',
    location: 'farmacia',
    image: 'FARMACIA1',
    segments: [
      {
        text: 'Necesitas medicina urgente. La fiebre bajó pero la tos persiste. A tres cuadras hay una farmacia.',
      },
      {
        text: 'Pero salir de día es peligroso: hay saqueadores. Ir de noche es más seguro pero no verás bien. ¿Qué haces?',
      },
    ],
    decisions: [
      {
        text: 'Ir de día (+visibilidad, más riesgo)',
        effects: {
          success: { food: 0, water: 0, health: 15, morale: 5 },
          failure: { food: -1, water: 0, health: -12, morale: -6 },
        },
        successRate: 0.5,
        successResult: 'Encuentras la farmacia. Agarras medicina y vendas. Logras escapar antes de que lleguen los saqueadores.',
        failureResult: 'Los saqueadores te ven. Te golpean y te roban. Vuelves al refugio herido y sin medicina.',
        random: true,
        setsFlag: 'd9_day',
      },
      {
        text: 'Ir de noche (-visibilidad, menos riesgo)',
        effects: { food: 0, water: 0, health: 8, morale: 3 },
        result: 'Vas de noche. Cuesta encontrar lo que necesitas en la oscuridad, pero al menos no hay saqueadores. Vuelves con algo de medicina.',
        setsFlag: 'd9_night',
      },
    ],
  },

  // ============================================================
  // DÍA 10: Minijuego — Evitar Asaltantes (en minigameEvents)
  // ============================================================

  // ============================================================
  // DÍA 11: RADIO - RESCATE EN 4 DÍAS
  // ============================================================
  11: {
    day: 11,
    title: 'RADIO: RESCATE EN 4 DÍAS',
    location: 'casa',
    image: 'casa_con_tablones',
    segments: [
      {
        text: 'La radio crepita con fuerza. Una voz clara: "Equipo de rescate en camino. Helicóptero llegará en 4 días. Repito: 4 días."',
      },
      {
        text: 'Tu corazón se acelera. El rescate está cerca. Pero... ¿deberías responder? Revelar tu posición podría atraer a otros.',
      },
    ],
    decisions: [
      {
        text: 'Responder a la radio',
        effects: { food: 0, water: 0, health: 0, morale: 10 },
        result: '"¡Aquí hay supervivientes!", gritas por la radio. Una voz responde: "Recibido. Vamos hacia allá." Pero también alertaste a otros de tu presencia.',
        setsFlag: 'd11_responded',
      },
      {
        text: 'Solo escuchar',
        effects: { food: 0, water: 0, health: 0, morale: 3 },
        result: 'Escuchas en silencio. Anotas las coordenadas. Al menos nadie más sabe dónde estás.',
        setsFlag: 'd11_listened',
      },
    ],
  },

  // ============================================================
  // DÍA 12: BANDIDOS
  // ============================================================
  12: [
    {
      day: 12,
      title: 'BANDIDOS',
      location: 'casa',
      image: 'casa_con_tablones',
      requiresFlag: 'refugees',
      segments: [
        {
          text: 'Golpes fuertes en la puerta. Tres hombres armados con palos y cadenas. "¡Sabemos que tienen comida! ¡Abran o tiramos la puerta!"',
        },
        {
          text: 'La mujer toma al niño y se esconde en el rincón. Te mira. Están juntos en esto. Podemos pelear... o negociar.',
        },
      ],
      decisions: [
        {
          text: 'Pelear',
          effects: { food: 0, water: 0, health: -15, morale: 8 },
          result: 'Agarras lo que encuentras y peleas. Con ayuda de la mujer, logran repelerlos. Estás herido pero conservaste los suministros.',
          setsFlag: 'd12_fought',
        },
        {
          text: 'Negociar',
          effects: { food: -3, water: -2, health: -2, morale: -10 },
          result: 'Les das casi todo a cambio de que se vayan. Se llevan la mayoría de tus provisiones. El niño llora de hambre. Pero están vivos.',
          setsFlag: 'd12_negotiated',
        },
      ],
    },
    {
      day: 12,
      title: 'BANDIDOS',
      location: 'casa',
      image: 'casa_con_tablones',
      requiresNoFlag: 'refugees',
      segments: [
        {
          text: 'La puerta se sacude. Tres hombres armados. "¡Sabemos que estás solo! ¡Danos todo o te matamos!"',
        },
        {
          text: 'Estás solo. No hay nadie que te ayude. Pelear sería un suicidio, puedo intentarlo. o negociar, que significa quedarte sin nada.',
        },
      ],
      decisions: [
        {
          text: 'Pelear',
          effects: { food: 0, water: 0, health: -100, morale: 0 },
          result: 'Intentas pelear pero te superan en número. Los bandidos no tienen piedad. Es el fin.',
        },
        {
          text: 'Negociar',
          effects: { food: -3, water: -2, health: -2, morale: -10 },
          result: 'Les das todo. Se ríen y se van. Te quedas solo, sin provisiones y con el orgullo destrozado.',
          setsFlag: 'd12_negotiated_solo',
        },
      ],
    },
  ],

  // ============================================================
  // DÍA 13: ÚLTIMAS RESERVAS
  // ============================================================
  13: [
    {
      day: 13,
      title: 'ÚLTIMAS RESERVAS',
      location: 'casa',
      image: 'casa_con_tablones',
      requiresFlags: ['refugees', 'd12_fought'],
      segments: [
        {
          text: 'Estás molido por la pelea. Los puntos de sutura improvisados duelen. Pero lo lograron: conservaron los suministros.',
        },
        {
          text: 'Es un día de reposo forzado. La mujer te ayuda a cambiar los vendajes. "Solo dos días más", dice. El rescate está cerca.',
        },
      ],
      decisions: [
        {
          text: 'Descansar',
          effects: { food: 0, water: 0, health: 8, morale: 8 },
          result: 'Pasas el día descansando. El cuerpo se recupera lentamente. Mañana será otro día. Solo dos días para el rescate.',
          setsFlag: 'd13_rest',
        },
      ],
    },
    {
      day: 13,
      title: 'ÚLTIMAS RESERVAS',
      location: 'casa',
      image: 'casa_con_tablones',
      requiresFlags: ['refugees', 'd12_negotiated'],
      segments: [
        {
          text: 'Solo queda una lata escondida que los bandidos no encontraron. La pones sobre la mesa. Tres personas, una lata.',
        },
        {
          text: 'El niño está pálido. Tiene fiebre y apenas puede mantenerse despierto. La madre te mira. "Por favor... dale la mitad a mi hijo."',
        },
      ],
      decisions: [
        {
          text: 'Darle la lata al niño',
          effects: { food: 0, water: 0, health: -5, morale: 20 },
          result: 'Le das la lata al niño. Come despacio. La madre te abraza llorando. Te quedas sin comer, pero tu conciencia está limpia.',
          setsFlag: 'd13_gave',
        },
        {
          text: 'Dividirla entre los tres',
          effects: { food: -1, water: 0, health: -6, morale: -30 },
          result: 'Divides la lata en tres porciones diminutas. Nadie se llena, pero al menos es algo. El niño sigue débil.',
          setsFlag: 'd13_divided',
        },
      ],
    },
    {
      day: 13,
      title: 'ÚLTIMAS RESERVAS',
      location: 'casa',
      image: 'casa_con_tablones',
      requiresFlags: ['d12_negotiated_solo'],
      segments: [
        {
          text: 'Solo queda una lata. La escondiste bien y los bandidos no la encontraron. Es todo lo que tienes.',
        },
        {
          text: 'Estás solo. La moral está por los suelos. Pero el rescate llegará en dos días. Tienes que resistir.',
        },
      ],
      decisions: [
        {
          text: 'Comer ahora',
          effects: { food: 0, water: 0, health: 3, morale: 2 },
          result: 'Abres la lata y comes. Sabe a gloria. Pero ya no tienes nada para mañana.',
          setsFlag: 'd13_ate',
        },
        {
          text: 'Racionar para mañana',
          effects: { food: 0, water: 0, health: -3, morale: -2 },
          result: 'Guardas la lata para mañana. El hambre te consume, pero al menos tendrás algo después.',
          setsFlag: 'd13_rationed',
        },
      ],
    },
  ],

  // ============================================================
  // DÍA 14: LLUVIA NEGRA
  // ============================================================
  14: [
    {
      day: 14,
      title: 'LLUVIA NEGRA',
      location: 'casa',
      image: 'antes_final',
      requiresFlag: 'd13_rest',
      segments: [
        {
          text: 'Afuera cae una lluvia oscura, radioactiva. No se puede salir. El refugio es lo único que los protege.',
        },
        {
          text: 'Todavía estás adolorido por la pelea con los bandidos, pero gracias al día de reposo puedes moverte. La mujer y el niño están a salvo.',
        },
        {
          text: '"Mañana es el día", dice ella. "El helicóptero viene mañana." Se toman de las manos. Solo queda resistir una noche más.',
        },
      ],
    },
    {
      day: 14,
      title: 'LLUVIA NEGRA',
      location: 'casa',
      image: 'antes_final',
      requiresFlags: ['refugees', 'd12_negotiated'],
      segments: [
        {
          text: 'La lluvia negra golpea las ventanas. No se puede salir. Pero adentro, la situación es peor.',
        },
        {
          text: 'El niño ha empeorado. La fiebre, el hambre y la deshidratación le pasaron factura. La madre lo sostiene en brazos.',
        },
        {
          text: 'No hay nada que puedas hacer. El niño cierra los ojos y no los vuelve a abrir. La madre grita, llora, se derrumba.',
        },
      ],
    },
    {
      day: 14,
      title: 'LLUVIA NEGRA',
      location: 'casa',
      image: 'antes_final',
      requiresFlags: ['d12_negotiated_solo'],
      segments: [
        {
          text: 'La lluvia negra golpea las ventanas. No se puede salir. Estás solo, encerrado en tu refugio.',
        },
        {
          text: 'Te sientas en un rincón y esperas. El sonido de la lluvia es hipnótico. Mañana es el día del rescate.',
        },
        {
          text: 'Solo una noche más. Lo has logrado. Contra todo pronóstico, llegaste hasta aquí.',
        },
      ],
    },
  ],

  // ============================================================
  // DÍA 15: Minijuego — Escape Final (en minigameEvents)
  // ============================================================
}

export const randomEvents = [
  {
    title: 'Mochila abandonada',
    segments: [
      { text: 'Encuentras una mochila militar abandonada. Dentro hay latas de comida, botellas de agua y unas vendas.' },
    ],
    effects: { food: 2, water: 1, health: 2, morale: 3 },
    location: 'calle',
  },
  {
    title: 'Extraño amable',
    segments: [
      { text: 'Un anciano en la ventana de enfrente te hace señas. Te ofrece un plato de sopa caliente a través de la reja.' },
    ],
    effects: { food: 0, water: 0, health: 8, morale: 10 },
    location: 'casa',
  },
  {
    title: 'Botiquín',
    segments: [
      { text: 'Debajo de un auto volcado encuentras un botiquín de primeros auxilios casi intacto.' },
    ],
    effects: { food: 0, water: 0, health: 18, morale: 5 },
    location: 'calle',
  },
  {
    title: 'Lluvia',
    segments: [
      { text: 'Una tormenta fuerte cae sobre la ciudad. Colocas recipientes para recoger agua de lluvia. El sonido es relajante.' },
    ],
    effects: { food: 0, water: 3, health: 2, morale: 4 },
    location: 'casa',
  },
  {
    title: 'Rata muerta',
    segments: [
      { text: 'Encuentras una rata muerta cerca de tu refugio. Podrías comerla... pero el riesgo de enfermedad es alto.' },
    ],
    effects: { food: 1, water: 0, health: -7, morale: -9 },
    location: 'calle',
  },
  {
    title: 'Radio funcional',
    segments: [
      { text: 'Entre los escombros encuentras una radio de emergencia funcional. Captas música y mensajes de otros supervivientes.' },
    ],
    effects: { food: 0, water: 0, health: 3, morale: 12 },
    location: 'casa',
  },
]

export const minigameEvents = {
  5: {
    day: 5,
    type: 'catchRain',
    title: 'RECOGER AGUA DE LLUVIA',
    location: 'casa',
    image: 'casadia1',
    win: { water: 3, morale: 5, message: 'Recolectaste suficiente agua de lluvia.' },
    lose: { water: -1, morale: -5, message: 'No juntaste suficiente agua.' },
  },
  10: {
    day: 10,
    type: 'findCans',
    title: 'EVITAR ASALTANTES',
    location: 'supermercado',
    image: 'superme',
    win: { food: 4, morale: 8, message: 'Esquivaste a los asaltantes y conseguiste provisiones.' },
    lose: { food: -2, morale: -5, message: 'Los asaltantes te atraparon. Perdiste provisiones.' },
  },
  15: {
    day: 15,
    type: 'escape',
    title: 'ESCAPE FINAL',
    location: 'calle',
    image: 'helicóptero_irse',
    win: { health: 5, morale: 15, message: 'Esquivaste las bombas y llegaste al helicóptero. ¡RESCATADO!' },
    lose: { health: -20, morale: -10, message: 'Una bomba te golpeó de lleno.' },
  },
}