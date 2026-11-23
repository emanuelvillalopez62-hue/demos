// [DATOS DE EJEMPLO] Toda la información de este archivo es ficticia y solo para demostración.

export type Language = 'es' | 'en';

export interface ServiceItem {
  id: string;
  index: string;
  title: string;
  description: string;
  detail: string;
  featured?: boolean;
}

export interface PriceItem {
  id: string;
  service: string;
  price: string;
  note: string;
  highlighted?: boolean;
}

export interface CatalogItem {
  name: string;
  presentation: string;
  category: string;
  price: string;
  prescriptionRequired: boolean;
}

export interface ScheduleRow {
  days: string;
  hours: string;
  closed?: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface LocalizedPharmacyContent {
  metaTitle: string;
  skipToContent: string;
  brandName: string;
  nav: {
    servicios: string;
    consejos: string;
    precios: string;
    horarios: string;
    preguntas: string;
    contacto: string;
    cta: string;
    openMenu: string;
    closeMenu: string;
  };
  hero: {
    kicker: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    medicalNotice: string;
    figureCaption: string;
    imagePending: string;
    svgAria: string;
  };
  servicesSection: {
    kicker: string;
    title: string;
    subtitle: string;
    bookAction: string;
    items: ServiceItem[];
    catalogTitle: string;
    catalogSubtitle: string;
    otcLabel: string;
    rxLabel: string;
    catalogItems: CatalogItem[];
  };
  pricingSection: {
    kicker: string;
    title: string;
    subtitle: string;
    bookAction: string;
    items: PriceItem[];
    paymentTitle: string;
    paymentMethods: string[];
    policiesTitle: string;
    cancelPolicy: string;
    returnPolicy: string;
  };
  scheduleSection: {
    kicker: string;
    title: string;
    hoursHeading: string;
    rows: ScheduleRow[];
    address: string;
    phone: string;
    email: string;
    pharmacistNote: string;
    mapCaption: string;
    imagePending: string;
    mapLabel: string;
    mapAria: string;
  };
  healthTipsSection: {
    kicker: string;
    title: string;
    subtitle: string;
    todayLabel: string;
    focusLabel: string;
    focuses: {
      general: string;
      immunity: string;
      hydration: string;
      heart: string;
      skincare: string;
    };
    noteLabel: string;
    notePlaceholder: string;
    generateLabel: string;
    generatingLabel: string;
    refreshLabel: string;
    askSofiaLabel: string;
    askSofiaPromptPrefix: string;
    loadingMessage: string;
    errorFallback: string;
    retryLabel: string;
    medicalDisclaimer: string;
  };
  faqSection: {
    kicker: string;
    title: string;
    items: FaqItem[];
  };
  contactSection: {
    kicker: string;
    title: string;
    subtitle: string;
    privacyNote: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    submitLabel: string;
    submittingLabel: string;
    successTitlePrefix: string;
    errorName: string;
    errorEmail: string;
    errorMessage: string;
    errorGeneral: string;
    errorNetwork: string;
  };
  footer: {
    legalDisclaimer: string;
    medicalNotice: string;
  };
  chat: {
    launcherLabel: string;
    launcherResume: string;
    launcherOpenAria: string;
    dialogAria: string;
    headerTitle: string;
    privacyBanner: string;
    welcomeMessage: string;
    quickPromptsTitle: string;
    quickPrompts: string[];
    inputPlaceholder: string;
    inputAria: string;
    sendAria: string;
    micStartAria: string;
    micStopAria: string;
    callStartAria: string;
    callStopAria: string;
    minimizeAria: string;
    closeAria: string;
    liveActiveText: string;
    liveMutedText: string;
    muteLabel: string;
    unmuteLabel: string;
    hangupLabel: string;
    refPrefix: string;
    recordCompletedPrefix: string;
    statuses: {
      online: string;
      analyzing: string;
      processing: string;
      writing: string;
      connecting: string;
      listening: string;
      speaking: string;
      toolAvailability: string;
      toolBooking: string;
      toolCancel: string;
      toolReschedule: string;
      toolLead: string;
      toolEscalation: string;
      toolEmail: string;
    };
    errors: {
      noMicSupport: string;
      micDenied: string;
      connectionError: string;
      liveError: string;
      liveConnectError: string;
      fallbackServer: string;
    };
  };
}

// [DATOS DE EJEMPLO]
export const PHARMACY_COPY: Record<Language, LocalizedPharmacyContent> = {
  es: {
    metaTitle: 'Farmacia Vida Sana Ejemplo — Cuidado farmacéutico cercano',
    skipToContent: 'Saltar al contenido principal',
    brandName: 'Farmacia Vida Sana Ejemplo',
    nav: {
      servicios: 'Servicios',
      consejos: 'Consejos',
      precios: 'Precios',
      horarios: 'Horarios',
      preguntas: 'Preguntas',
      contacto: 'Contacto',
      cta: 'Agendar vacunación',
      openMenu: 'Abrir menú de navegación',
      closeMenu: 'Cerrar menú de navegación',
    },
    hero: {
      kicker: 'Col. Centro, Ciudad Demo · Atención de lunes a sábado',
      title: 'Tu farmacia de barrio con atención cercana y clara',
      subtitle:
        'Surtido responsable de medicamentos con y sin receta, vacunación contra la influenza con cita puntual, medición gratuita de presión arterial y entrega a domicilio en tu zona.',
      primaryCta: 'Agendar vacunación',
      secondaryCta: 'Ver servicios y precios',
      medicalNotice:
        'Aviso sanitario: la farmacia no sustituye la consulta médica. Los medicamentos con receta requieren presentar la receta médica original.',
      figureCaption: 'Mostrador de atención · Farmacia Vida Sana Ejemplo',
      imagePending: 'IMAGEN PENDIENTE',
      svgAria:
        'Ilustración arquitectónica de mostrador farmacéutico y botánica medicinal (imagen pendiente)',
    },
    servicesSection: {
      kicker: 'Servicios farmacéuticos',
      title: 'Atención integral pensada para tu bienestar diario',
      subtitle:
        'Contamos con orientación profesional en mostrador, seguimiento preventivo y entrega local en Ciudad Demo.',
      bookAction: 'Agendar',
      items: [
        {
          id: 'medicamentos',
          index: '01',
          title: 'Medicamentos con y sin receta',
          description:
            'Surtido responsable de tratamientos prescritos y medicamentos de libre venta con orientación clara sobre su conservación y entrega.',
          detail: 'Requiere receta médica original para fármacos con prescripción.',
          featured: true,
        },
        {
          id: 'vacunacion',
          index: '02',
          title: 'Vacunación contra la influenza',
          description:
            'Aplicación en consultorio farmacéutico con cita previa, cadena de frío supervisada y atención puntual.',
          detail: 'Cancelación sin cargo hasta 2 horas antes · $250 por aplicación.',
          featured: true,
        },
        {
          id: 'presion',
          index: '03',
          title: 'Medición de presión arterial',
          description:
            'Toma gratuita de presión arterial en sucursal con equipo digital calibrado y registro orientativo.',
          detail: 'Servicio gratuito en horario de atención sin necesidad de cita.',
        },
        {
          id: 'domicilio',
          index: '04',
          title: 'Entrega a domicilio',
          description:
            'Envío local seguro de medicamentos de libre venta y productos de cuidado personal hasta tu domicilio.',
          detail: '$50 dentro de 5 km · Gratis en compras mayores a $500.',
        },
        {
          id: 'cuidado-personal',
          index: '05',
          title: 'Asesoría de cuidado personal',
          description:
            'Recomendación práctica en dermocosmética, protección solar, higiene diaria y bienestar básico.',
          detail: 'Cambios hasta 15 días con ticket en productos cerrados.',
        },
        {
          id: 'recetas-linea',
          index: '06',
          title: 'Recetas en línea',
          description:
            'Revisión anticipada de disponibilidad de tu receta por canal digital para agilizar tu recolección en mostrador.',
          detail: 'La entrega de medicamento con receta requiere presentar el documento original.',
        },
      ],
      catalogTitle: 'Catálogo ilustrativo de mostrador (ejemplo)',
      catalogSubtitle:
        'Productos de demostración disponibles para consulta con Sofía o pedido a domicilio.',
      otcLabel: 'Libre venta',
      rxLabel: 'Con receta',
      catalogItems: [
        {
          name: 'Paracetamol 500 mg (ejemplo)',
          presentation: 'Caja con 20 tabletas',
          category: 'Analgésico de libre venta',
          price: '$65',
          prescriptionRequired: false,
        },
        {
          name: 'Suero rehidratante oral (ejemplo)',
          presentation: 'Botella 500 ml sabor manzana',
          category: 'Hidratación',
          price: '$38',
          prescriptionRequired: false,
        },
        {
          name: 'Protector solar facial FPS 50+ (ejemplo)',
          presentation: 'Tubo 50 ml toque seco',
          category: 'Cuidado personal',
          price: '$320',
          prescriptionRequired: false,
        },
        {
          name: 'Termómetro digital clínico (ejemplo)',
          presentation: 'Unidad con estuche',
          category: 'Equipo de monitoreo',
          price: '$180',
          prescriptionRequired: false,
        },
      ],
    },
    pricingSection: {
      kicker: 'Precios de ejemplo',
      title: 'Tarifas claras desde el primer contacto',
      subtitle: 'Valores demostrativos en moneda local · Sujetos a confirmación en negocio real',
      bookAction: 'Agendar vacunación',
      items: [
        {
          id: 'presion',
          service: 'Consulta de presión arterial',
          price: 'Gratis',
          note: 'Toma orientativa en sucursal dentro del horario de atención.',
        },
        {
          id: 'influenza',
          service: 'Vacuna contra la influenza',
          price: '$250',
          note: 'Incluye aplicación y cancelación sin cargo hasta 2 horas antes.',
          highlighted: true,
        },
        {
          id: 'domicilio',
          service: 'Entrega a domicilio (hasta 5 km)',
          price: '$50',
          note: 'Envío gratuito en compras mayores a $500.',
        },
      ],
      paymentTitle: 'Métodos de pago aceptados',
      paymentMethods: [
        'Efectivo',
        'Tarjeta de débito y crédito',
        'Transferencia bancaria',
      ],
      policiesTitle: 'Cancelación y devoluciones',
      cancelPolicy:
        'Cancelación de cita de vacunación sin cargo hasta 2 horas antes de la hora programada.',
      returnPolicy:
        'Por seguridad sanitaria, los medicamentos no se devuelven una vez entregados. Los productos de cuidado personal cuentan con 15 días para cambios o devoluciones presentando el ticket de compra.',
    },
    scheduleSection: {
      kicker: 'Horarios y ubicación',
      title: 'Visítanos en Colonia Centro',
      hoursHeading: 'Horario de atención',
      rows: [
        { days: 'Lunes a viernes', hours: '08:00 – 21:00' },
        { days: 'Sábados', hours: '09:00 – 14:00' },
        { days: 'Domingos', hours: 'Cerrado', closed: true },
      ],
      address: 'Calle Ejemplo 123, Col. Centro, Ciudad Demo, CP 00000',
      phone: '+00 555 123 456',
      email: 'contacto@ejemplo.com',
      pharmacistNote: 'Responsable sanitario (ejemplo): Q.F.B. Laura Méndez · Sucursal Centro',
      mapCaption: 'Mapa de ubicación · Radio de envío 5 km',
      imagePending: 'IMAGEN PENDIENTE',
      mapLabel: 'Calle Ejemplo 123',
      mapAria:
        'Mapa esquemático placeholder de Calle Ejemplo 123, Col. Centro, Ciudad Demo (imagen pendiente)',
    },
    healthTipsSection: {
      kicker: 'Bienestar diario con IA',
      title: 'Consejos personalizados para tu rutina de hoy',
      subtitle:
        'Elige un enfoque preventivo y, si lo deseas, agrega un breve contexto (sin datos médicos sensibles) para recibir recomendaciones prácticas generadas hoy.',
      todayLabel: 'Edición de hoy',
      focusLabel: 'Área de bienestar',
      focuses: {
        general: 'Bienestar diario',
        immunity: 'Inmunidad y vacunas',
        hydration: 'Hidratación y descanso',
        heart: 'Presión y corazón',
        skincare: 'Piel y protección solar',
      },
      noteLabel: 'Perfil o preferencia opcional (ejemplo: caminata diaria, oficina, adulto mayor)',
      notePlaceholder: 'Ej. Trabajo frente a computadora y quiero mejorar mi hidratación...',
      generateLabel: 'Personalizar consejos',
      generatingLabel: 'Generando con Gemini...',
      refreshLabel: 'Renovar hoy',
      askSofiaLabel: 'Consultar con Sofía',
      askSofiaPromptPrefix: 'Hola Sofía, cuéntame más sobre este consejo de hoy:',
      loadingMessage: 'Preparando tus consejos diarios de bienestar...',
      errorFallback:
        'No fue posible obtener los consejos diarios en este momento. Intenta de nuevo en unos segundos.',
      retryLabel: 'Reintentar',
      medicalDisclaimer:
        'Orientación preventiva general generada con IA para fines demostrativos. La farmacia no sustituye la consulta médica.',
    },
    faqSection: {
      kicker: 'Preguntas frecuentes',
      title: 'Resolvemos tus dudas antes de visitarnos',
      items: [
        {
          id: 'faq-receta',
          question: '¿Necesito presentar la receta física si envío mi receta en línea?',
          answer:
            'Sí. Nuestro servicio de recetas en línea te permite verificar disponibilidad y preparar tu pedido con anticipación, pero por normativa sanitaria los medicamentos con receta requieren presentar la receta original al momento de la entrega.',
        },
        {
          id: 'faq-cancelacion',
          question: '¿Puedo cancelar o cambiar mi cita de vacunación contra la influenza?',
          answer:
            'Sí. Puedes cancelar o reprogramar tu cita de vacunación sin ningún cargo hasta 2 horas antes del horario programado. Puedes gestionarlo directamente aquí con Sofía o llamando al +00 555 123 456.',
        },
        {
          id: 'faq-domicilio',
          question: '¿Cuál es el costo y alcance de la entrega a domicilio?',
          answer:
            'La entrega a domicilio tiene un costo de $50 dentro de un radio de 5 km alrededor de nuestra sucursal en Col. Centro. Si tu compra supera los $500, el envío es completamente gratis.',
        },
        {
          id: 'faq-pagos-devoluciones',
          question: '¿Qué métodos de pago aceptan y cuál es la política de devoluciones?',
          answer:
            'Aceptamos efectivo, tarjeta de débito y crédito, y transferencia bancaria. Por seguridad sanitaria, los medicamentos no admiten devolución una vez entregados. Los productos de cuidado personal tienen 15 días de garantía presentando el ticket.',
        },
        {
          id: 'faq-consulta',
          question: '¿La orientación farmacéutica sustituye una consulta médica?',
          answer:
            'No. Farmacia Vida Sana Ejemplo ofrece orientación farmacéutica y toma de presión arterial gratuita, pero esto nunca sustituye una valoración o diagnóstico médico profesional.',
        },
      ],
    },
    contactSection: {
      kicker: 'Contacto directo',
      title: 'Escríbenos para dudas o pedidos',
      subtitle:
        'Si prefieres que una persona del equipo te responda por correo electrónico, déjanos tus datos en este formulario demostrativo.',
      privacyNote:
        'Por tu privacidad, no envíes contraseñas, datos de tarjetas bancarias ni información médica sensible por este formulario.',
      nameLabel: 'Nombre completo',
      namePlaceholder: 'Ej. Ana López',
      emailLabel: 'Correo electrónico',
      emailPlaceholder: 'nombre@ejemplo.com',
      messageLabel: 'Mensaje o consulta',
      messagePlaceholder: 'Consulta sobre envíos, horarios o disponibilidad...',
      submitLabel: 'Enviar mensaje',
      submittingLabel: 'Enviando...',
      successTitlePrefix: 'Solicitud registrada',
      errorName: 'Ingresa tu nombre completo (mínimo 2 caracteres).',
      errorEmail: 'Ingresa un correo electrónico válido (ejemplo@dominio.com).',
      errorMessage: 'Cuéntanos brevemente en qué te podemos ayudar (mínimo 5 caracteres).',
      errorGeneral: 'No se pudo enviar tu mensaje. Intenta de nuevo.',
      errorNetwork: 'Error de conexión al enviar el formulario. Intenta nuevamente.',
    },
    footer: {
      legalDisclaimer:
        'Sitio web prototipo de demostración. Farmacia Vida Sana Ejemplo es un negocio ficticio; los datos de contacto, precios, disponibilidad y horarios son únicamente de ejemplo.',
      medicalNotice:
        'Aviso sanitario: la farmacia no sustituye la consulta médica. Los medicamentos con receta requieren presentar la receta médica original.',
    },
    chat: {
      launcherLabel: 'Hablar con Sofía',
      launcherResume: 'Continuar con Sofía',
      launcherOpenAria: 'Abrir chat con Sofía, asistente virtual',
      dialogAria: 'Asistente virtual Sofía · Farmacia Vida Sana Ejemplo',
      headerTitle: 'Sofía · Farmacia Vida Sana Ejemplo',
      privacyBanner:
        'Estás hablando con una asistente virtual con IA. Al continuar aceptas el aviso de privacidad (ejemplo).',
      welcomeMessage:
        'Hola, soy Sofía, la asistente virtual de Farmacia Vida Sana Ejemplo. ¿En qué te puedo ayudar?',
      quickPromptsTitle: 'Consultas frecuentes:',
      quickPrompts: [
        'Quiero agendar una vacuna contra la influenza',
        '¿Cuáles son sus horarios y precios?',
        '¿Qué productos de cuidado o libre venta tienen?',
      ],
      inputPlaceholder: 'Escribe tu mensaje...',
      inputAria: 'Escribe tu mensaje para Sofía',
      sendAria: 'Enviar mensaje',
      micStartAria: 'Hablar por micrófono con Sofía',
      micStopAria: 'Detener micrófono de voz',
      callStartAria: 'Iniciar llamada de voz en vivo',
      callStopAria: 'Colgar llamada de voz',
      minimizeAria: 'Minimizar ventana de chat',
      closeAria: 'Cerrar ventana de chat',
      liveActiveText: 'Voz en vivo activa · Habla ahora',
      liveMutedText: 'Micrófono silenciado',
      muteLabel: 'Silenciar',
      unmuteLabel: 'Activar',
      hangupLabel: 'Colgar',
      refPrefix: 'Ref:',
      recordCompletedPrefix: 'Registro completado:',
      statuses: {
        online: 'En línea',
        analyzing: 'Analizando consulta...',
        processing: 'Procesando mensaje...',
        writing: 'Escribiendo respuesta...',
        connecting: 'Conectando llamada...',
        listening: 'Escuchando...',
        speaking: 'Sofía hablando...',
        toolAvailability: 'Consultando agenda...',
        toolBooking: 'Registrando cita...',
        toolCancel: 'Procesando cancelación...',
        toolReschedule: 'Reprogramando cita...',
        toolLead: 'Guardando contacto...',
        toolEscalation: 'Canalizando al equipo...',
        toolEmail: 'Enviando confirmación...',
      },
      errors: {
        noMicSupport: 'Tu navegador no permite acceso al micrófono para llamadas en vivo.',
        micDenied:
          'No se otorgó permiso de micrófono. Puedes seguir conversando con Sofía por texto.',
        connectionError: 'Error de conexión con Sofía. Verifica tu red e intenta de nuevo.',
        liveError: 'Se interrumpió la conexión de voz en vivo.',
        liveConnectError: 'No se pudo conectar la llamada de voz en vivo con Sofía.',
        fallbackServer:
          'No pude obtener respuesta del servidor en este momento. Intenta nuevamente.',
      },
    },
  },

  en: {
    metaTitle: 'Farmacia Vida Sana Ejemplo — Neighborhood Pharmacy Care',
    skipToContent: 'Skip to main content',
    brandName: 'Farmacia Vida Sana Ejemplo',
    nav: {
      servicios: 'Services',
      consejos: 'Daily Tips',
      precios: 'Pricing',
      horarios: 'Hours',
      preguntas: 'FAQ',
      contacto: 'Contact',
      cta: 'Book vaccination',
      openMenu: 'Open navigation menu',
      closeMenu: 'Close navigation menu',
    },
    hero: {
      kicker: 'Col. Centro, Ciudad Demo · Open Monday to Saturday',
      title: 'Your neighborhood pharmacy with warm, transparent care',
      subtitle:
        'Responsible dispensing of prescription and over-the-counter medications, scheduled influenza vaccinations, free blood pressure checks, and local home delivery.',
      primaryCta: 'Book vaccination',
      secondaryCta: 'View services & pricing',
      medicalNotice:
        'Health notice: this pharmacy does not replace a medical consultation. Prescription medications require presenting the original paper prescription.',
      figureCaption: 'Pharmacy counter · Farmacia Vida Sana Ejemplo',
      imagePending: 'IMAGE PENDING',
      svgAria:
        'Architectural illustration of pharmacy counter and botanical motif (image pending)',
    },
    servicesSection: {
      kicker: 'Pharmacy services',
      title: 'Comprehensive care designed for everyday wellbeing',
      subtitle:
        'Professional counter guidance, preventive checkups, and reliable local delivery in Ciudad Demo.',
      bookAction: 'Book',
      items: [
        {
          id: 'medicamentos',
          index: '01',
          title: 'Prescription & OTC medications',
          description:
            'Responsible dispensing of prescribed treatments and over-the-counter remedies with clear storage and handling guidance.',
          detail: 'Original prescription required for prescription-only medicines.',
          featured: true,
        },
        {
          id: 'vacunacion',
          index: '02',
          title: 'Influenza vaccination',
          description:
            'Administered in our private pharmacy room by appointment, with monitored cold-chain storage and prompt care.',
          detail: 'Free cancellation up to 2 hours before · $250 per dose.',
          featured: true,
        },
        {
          id: 'presion',
          index: '03',
          title: 'Blood pressure monitoring',
          description:
            'Free in-store blood pressure reading using calibrated digital monitors with an informational log.',
          detail: 'Complimentary walk-in service during opening hours.',
        },
        {
          id: 'domicilio',
          index: '04',
          title: 'Home delivery',
          description:
            'Safe local delivery of over-the-counter medications and personal care items straight to your door.',
          detail: '$50 within 5 km · Free on orders over $500.',
        },
        {
          id: 'cuidado-personal',
          index: '05',
          title: 'Personal care guidance',
          description:
            'Practical advice on skincare, sun protection, daily hygiene, and essential wellness products.',
          detail: '15-day exchange or return on unopened items with receipt.',
        },
        {
          id: 'recetas-linea',
          index: '06',
          title: 'Online prescription check',
          description:
            'Pre-check stock availability for your prescription online to speed up pickup at the counter.',
          detail: 'Pickup of prescription items still requires the original document.',
        },
      ],
      catalogTitle: 'Illustrative counter catalog (example)',
      catalogSubtitle:
        'Sample items available to ask Sofía about or request for local delivery.',
      otcLabel: 'OTC',
      rxLabel: 'Rx required',
      catalogItems: [
        {
          name: 'Acetaminophen / Paracetamol 500 mg (example)',
          presentation: 'Box of 20 tablets',
          category: 'OTC Pain Relief',
          price: '$65',
          prescriptionRequired: false,
        },
        {
          name: 'Oral rehydration solution (example)',
          presentation: '500 ml apple bottle',
          category: 'Hydration',
          price: '$38',
          prescriptionRequired: false,
        },
        {
          name: 'Facial sunscreen SPF 50+ (example)',
          presentation: '50 ml dry-touch tube',
          category: 'Personal Care',
          price: '$320',
          prescriptionRequired: false,
        },
        {
          name: 'Clinical digital thermometer (example)',
          presentation: '1 unit with case',
          category: 'Home Monitoring',
          price: '$180',
          prescriptionRequired: false,
        },
      ],
    },
    pricingSection: {
      kicker: 'Example pricing',
      title: 'Clear rates from the very first inquiry',
      subtitle: 'Sample demonstration rates in local currency · Subject to real-store confirmation',
      bookAction: 'Book vaccination',
      items: [
        {
          id: 'presion',
          service: 'Blood pressure check',
          price: 'Free',
          note: 'Informational in-store check during opening hours.',
        },
        {
          id: 'influenza',
          service: 'Influenza vaccine',
          price: '$250',
          note: 'Includes administration and free cancellation up to 2 hours prior.',
          highlighted: true,
        },
        {
          id: 'domicilio',
          service: 'Home delivery (within 5 km)',
          price: '$50',
          note: 'Free delivery on purchases over $500.',
        },
      ],
      paymentTitle: 'Accepted payment methods',
      paymentMethods: ['Cash', 'Debit & credit cards', 'Bank transfer'],
      policiesTitle: 'Cancellation & return policy',
      cancelPolicy:
        'Vaccination appointments may be canceled free of charge up to 2 hours before the scheduled time.',
      returnPolicy:
        'For health safety reasons, medications cannot be returned once delivered. Personal care items have a 15-day return window with your receipt.',
    },
    scheduleSection: {
      kicker: 'Hours & location',
      title: 'Visit us in Colonia Centro',
      hoursHeading: 'Opening hours',
      rows: [
        { days: 'Monday – Friday', hours: '08:00 – 21:00' },
        { days: 'Saturdays', hours: '09:00 – 14:00' },
        { days: 'Sundays', hours: 'Closed', closed: true },
      ],
      address: 'Calle Ejemplo 123, Col. Centro, Ciudad Demo, CP 00000',
      phone: '+00 555 123 456',
      email: 'contacto@ejemplo.com',
      pharmacistNote: 'Lead Pharmacist (example): Laura Méndez, RPh · Centro Branch',
      mapCaption: 'Location map · 5 km delivery radius',
      imagePending: 'IMAGE PENDING',
      mapLabel: 'Calle Ejemplo 123',
      mapAria:
        'Schematic placeholder map of Calle Ejemplo 123, Col. Centro, Ciudad Demo (image pending)',
    },
    healthTipsSection: {
      kicker: 'Daily AI wellness',
      title: 'Personalized wellness tips for today',
      subtitle:
        'Choose a preventive focus and optionally add a brief routine note (no sensitive medical records) to get tailored recommendations generated for today.',
      todayLabel: "Today's edition",
      focusLabel: 'Wellness focus',
      focuses: {
        general: 'Daily wellness',
        immunity: 'Immunity & vaccines',
        hydration: 'Hydration & rest',
        heart: 'Heart & blood pressure',
        skincare: 'Skin & sun care',
      },
      noteLabel: 'Optional routine context (e.g. desk work, daily walk, older adult)',
      notePlaceholder: 'e.g. Desk job and trying to stay hydrated during busy afternoons...',
      generateLabel: 'Personalize tips',
      generatingLabel: 'Generating with Gemini...',
      refreshLabel: 'Refresh today',
      askSofiaLabel: 'Ask Sofía',
      askSofiaPromptPrefix: "Hi Sofía, tell me more about today's tip:",
      loadingMessage: 'Preparing your personalized daily wellness tips...',
      errorFallback:
        'Unable to generate daily wellness tips right now. Please try again in a few seconds.',
      retryLabel: 'Retry',
      medicalDisclaimer:
        'AI-generated general preventive wellness guidance for demonstration purposes. Pharmacy guidance never replaces a medical consultation.',
    },
    faqSection: {
      kicker: 'Frequently asked questions',
      title: 'Clear answers before you visit',
      items: [
        {
          id: 'faq-receta',
          question: 'Do I still need the paper prescription if I check stock online?',
          answer:
            'Yes. Our online prescription check lets us confirm stock and prepare your order ahead of time, but health regulations require presenting the original prescription at pickup.',
        },
        {
          id: 'faq-cancelacion',
          question: 'Can I cancel or reschedule my influenza vaccination appointment?',
          answer:
            'Yes. You can cancel or reschedule free of charge up to 2 hours before your scheduled time directly with Sofía in chat or by calling +00 555 123 456.',
        },
        {
          id: 'faq-domicilio',
          question: 'What is the cost and coverage of home delivery?',
          answer:
            'Home delivery is $50 within a 5 km radius of our Col. Centro store. Delivery is completely free on orders over $500.',
        },
        {
          id: 'faq-pagos-devoluciones',
          question: 'Which payment methods do you accept and what is your return policy?',
          answer:
            'We accept cash, debit and credit cards, and bank transfers. For health safety, medications cannot be returned once handed over. Personal care items have a 15-day exchange/return policy with a receipt.',
        },
        {
          id: 'faq-consulta',
          question: 'Does pharmacy guidance replace a doctor visit?',
          answer:
            'No. Farmacia Vida Sana Ejemplo provides pharmacy orientation and free blood pressure checks, which never replace a licensed medical consultation or diagnosis.',
        },
      ],
    },
    contactSection: {
      kicker: 'Direct contact',
      title: 'Write to us with questions or orders',
      subtitle:
        'If you prefer a team member to reply by email, leave your details in this demonstration contact form.',
      privacyNote:
        'For your safety, please do not share passwords, card numbers, or sensitive medical records in this form.',
      nameLabel: 'Full name',
      namePlaceholder: 'e.g. Ana López',
      emailLabel: 'Email address',
      emailPlaceholder: 'name@example.com',
      messageLabel: 'Message or inquiry',
      messagePlaceholder: 'Ask about delivery, opening hours, or availability...',
      submitLabel: 'Send message',
      submittingLabel: 'Sending...',
      successTitlePrefix: 'Request logged',
      errorName: 'Please enter your full name (at least 2 characters).',
      errorEmail: 'Please enter a valid email address (name@example.com).',
      errorMessage: 'Please write a brief message (at least 5 characters).',
      errorGeneral: 'Could not send your message. Please try again.',
      errorNetwork: 'Network error while sending the form. Please try again.',
    },
    footer: {
      legalDisclaimer:
        'Demonstration prototype website. Farmacia Vida Sana Ejemplo is a fictional business; contact info, prices, availability, and hours are examples only.',
      medicalNotice:
        'Health notice: the pharmacy does not replace a medical consultation. Prescription medications require presenting the original prescription.',
    },
    chat: {
      launcherLabel: 'Chat with Sofía',
      launcherResume: 'Resume with Sofía',
      launcherOpenAria: 'Open chat with Sofía, virtual assistant',
      dialogAria: 'Virtual assistant Sofía · Farmacia Vida Sana Ejemplo',
      headerTitle: 'Sofía · Farmacia Vida Sana Ejemplo',
      privacyBanner:
        'You are speaking with an AI virtual assistant. By continuing you accept the privacy notice (example).',
      welcomeMessage:
        'Hi! I am Sofía, the virtual assistant for Farmacia Vida Sana Ejemplo. How can I help you today?',
      quickPromptsTitle: 'Quick questions:',
      quickPrompts: [
        'I want to book an influenza vaccination',
        'What are your hours and prices?',
        'Which OTC or personal care items do you carry?',
      ],
      inputPlaceholder: 'Type your message...',
      inputAria: 'Type your message for Sofía',
      sendAria: 'Send message',
      micStartAria: 'Talk to Sofía using microphone',
      micStopAria: 'Stop voice microphone',
      callStartAria: 'Start live voice call',
      callStopAria: 'Hang up voice call',
      minimizeAria: 'Minimize chat window',
      closeAria: 'Close chat window',
      liveActiveText: 'Live voice active · Speak naturally',
      liveMutedText: 'Microphone muted',
      muteLabel: 'Mute',
      unmuteLabel: 'Unmute',
      hangupLabel: 'Hang up',
      refPrefix: 'Ref:',
      recordCompletedPrefix: 'Record saved:',
      statuses: {
        online: 'Online',
        analyzing: 'Analyzing request...',
        processing: 'Processing message...',
        writing: 'Typing reply...',
        connecting: 'Connecting call...',
        listening: 'Listening...',
        speaking: 'Sofía speaking...',
        toolAvailability: 'Checking schedule...',
        toolBooking: 'Booking appointment...',
        toolCancel: 'Processing cancellation...',
        toolReschedule: 'Rescheduling...',
        toolLead: 'Saving contact...',
        toolEscalation: 'Escalating to team...',
        toolEmail: 'Sending confirmation...',
      },
      errors: {
        noMicSupport: 'Your browser does not support microphone access for live voice calls.',
        micDenied:
          'Microphone permission was not granted. You can keep chatting with Sofía by text.',
        connectionError: 'Connection error with Sofía. Please check your network and try again.',
        liveError: 'Live voice connection was interrupted.',
        liveConnectError: 'Could not connect the live voice call with Sofía.',
        fallbackServer: 'Could not get a response from the server right now. Please try again.',
      },
    },
  },
};

export const BUSINESS_INFO = {
  name: 'Farmacia Vida Sana Ejemplo',
  address: 'Calle Ejemplo 123, Col. Centro, Ciudad Demo, CP 00000',
  phone: '+00 555 123 456',
  email: 'contacto@ejemplo.com',
} as const;
