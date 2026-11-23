// [DATOS DE EJEMPLO] Simulación en memoria de funciones de backend para el prototipo.

import { FunctionDeclaration, Type } from '@google/genai';

export type ChatAgentStatusKey =
  | 'online'
  | 'analyzing'
  | 'processing'
  | 'writing'
  | 'connecting'
  | 'listening'
  | 'speaking'
  | 'toolAvailability'
  | 'toolBooking'
  | 'toolCancel'
  | 'toolReschedule'
  | 'toolLead'
  | 'toolEscalation'
  | 'toolEmail';

export function getStatusKeyForTool(toolName: string): ChatAgentStatusKey {
  switch (toolName) {
    case 'consultar_disponibilidad':
      return 'toolAvailability';
    case 'crear_cita':
      return 'toolBooking';
    case 'cancelar_cita':
      return 'toolCancel';
    case 'reprogramar_cita':
      return 'toolReschedule';
    case 'registrar_lead':
      return 'toolLead';
    case 'registrar_escalamiento':
      return 'toolEscalation';
    case 'enviar_confirmacion':
      return 'toolEmail';
    default:
      return 'processing';
  }
}

export interface AppointmentRecord {
  id: string;
  nombre: string;
  servicio: string;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:MM
  contacto: string;
  estado: 'confirmada' | 'cancelada';
  motivoCancelacion?: string;
  creadaEn: string;
}

export interface LeadRecord {
  id: string;
  nombre: string;
  contacto: string;
  interes: string;
  origen: string;
  creadoEn: string;
}

export interface EscalationRecord {
  id: string;
  resumen: string;
  prioridad: 'baja' | 'media' | 'alta';
  canal: string;
  creadoEn: string;
}

export interface ConfirmationRecord {
  id: string;
  tipo: string;
  destinatario: string;
  detalles: string;
  enviadoEn: string;
}

export type ToolResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; codigo?: string };

const WEEKDAY_SLOTS = ['09:00', '11:30', '16:00'] as const;
const SATURDAY_SLOTS = ['09:00', '11:30'] as const;

function parseIsoDateLocal(fecha: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const dt = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (
    Number.isNaN(dt.getTime()) ||
    dt.getFullYear() !== year ||
    dt.getMonth() !== month - 1 ||
    dt.getDate() !== day
  ) {
    return null;
  }
  return dt;
}

function getAllowedSlotsForDate(fecha: string): {
  validDate: boolean;
  dayType: 'weekday' | 'saturday' | 'sunday';
  slots: string[];
} {
  const dt = parseIsoDateLocal(fecha);
  if (!dt) {
    return { validDate: false, dayType: 'weekday', slots: [] };
  }
  const day = dt.getDay(); // 0 = Sunday, 6 = Saturday
  if (day === 0) {
    return { validDate: true, dayType: 'sunday', slots: [] };
  }
  if (day === 6) {
    return { validDate: true, dayType: 'saturday', slots: [...SATURDAY_SLOTS] };
  }
  return { validDate: true, dayType: 'weekday', slots: [...WEEKDAY_SLOTS] };
}

function normalizeTime(hora: string): string | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hora.trim());
  if (!match) return null;
  const hh = Number(match[1]);
  const mm = Number(match[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function createPharmacyStore(nowProvider: () => Date = () => new Date()) {
  let citaCounter = 0;
  let leadCounter = 0;
  let escCounter = 0;
  let envCounter = 0;

  const citas = new Map<string, AppointmentRecord>();
  const leads: LeadRecord[] = [];
  const escalamientos: EscalationRecord[] = [];
  const confirmaciones: ConfirmationRecord[] = [];

  function logBackend(fn: string, action: string, payload: unknown) {
    console.info(`[SIMULACIÓN BACKEND] ${fn} -> ${action}`, JSON.stringify(payload));
  }

  function consultar_disponibilidad(
    servicio: string,
    fecha: string,
  ): ToolResult<{
    servicio: string;
    fecha: string;
    disponible: boolean;
    horarios: string[];
    mensaje: string;
  }> {
    const cleanService = servicio.trim();
    const cleanDate = fecha.trim();
    if (!cleanService || !cleanDate) {
      return {
        ok: false,
        codigo: 'DATOS_INCOMPLETOS',
        error: 'Se requiere especificar el servicio y la fecha en formato YYYY-MM-DD.',
      };
    }

    const { validDate, dayType, slots } = getAllowedSlotsForDate(cleanDate);
    if (!validDate) {
      return {
        ok: false,
        codigo: 'FECHA_INVALIDA',
        error: 'La fecha debe tener el formato válido YYYY-MM-DD (ejemplo: 2026-11-25).',
      };
    }

    if (dayType === 'sunday') {
      logBackend('consultar_disponibilidad', 'Consultando Google Calendar (domingo cerrado)', {
        servicio: cleanService,
        fecha: cleanDate,
      });
      return {
        ok: true,
        servicio: cleanService,
        fecha: cleanDate,
        disponible: false,
        horarios: [],
        mensaje: 'Los domingos la farmacia permanece cerrada. Atendemos de lunes a sábado.',
      };
    }

    const ocupados = new Set(
      Array.from(citas.values())
        .filter((c) => c.fecha === cleanDate && c.estado === 'confirmada')
        .map((c) => c.hora),
    );
    const libres = slots.filter((slot) => !ocupados.has(slot));

    logBackend('consultar_disponibilidad', 'Consultando disponibilidad en Google Calendar y BD', {
      servicio: cleanService,
      fecha: cleanDate,
      horariosLibres: libres,
    });

    return {
      ok: true,
      servicio: cleanService,
      fecha: cleanDate,
      disponible: libres.length > 0,
      horarios: libres,
      mensaje:
        libres.length > 0
          ? `Horarios disponibles para ${cleanService} el ${cleanDate}: ${libres.join(', ')}.`
          : `No quedan horarios disponibles para el ${cleanDate}.`,
    };
  }

  function crear_cita(
    nombre: string,
    servicio: string,
    fecha: string,
    hora: string,
    contacto: string,
  ): ToolResult<{ id: string; cita: AppointmentRecord }> {
    const cleanNombre = nombre.trim();
    const cleanServicio = servicio.trim();
    const cleanFecha = fecha.trim();
    const cleanHora = normalizeTime(hora);
    const cleanContacto = contacto.trim();

    if (!cleanNombre || !cleanServicio || !cleanFecha || !cleanHora || !cleanContacto) {
      return {
        ok: false,
        codigo: 'CAMPOS_FALTANTES',
        error: 'Faltan datos obligatorios para registrar la cita (nombre, servicio, fecha, hora y contacto).',
      };
    }

    const { validDate, dayType, slots } = getAllowedSlotsForDate(cleanFecha);
    if (!validDate || dayType === 'sunday') {
      return {
        ok: false,
        codigo: 'DIA_NO_LABORAL',
        error: 'No es posible agendar en esa fecha; la farmacia abre de lunes a sábado.',
      };
    }

    if (!slots.includes(cleanHora)) {
      return {
        ok: false,
        codigo: 'HORARIO_NO_DISPONIBLE',
        error: `El horario ${cleanHora} no corresponde a los turnos disponibles (${slots.join(', ')}).`,
      };
    }

    const conflicto = Array.from(citas.values()).find(
      (c) => c.fecha === cleanFecha && c.hora === cleanHora && c.estado === 'confirmada',
    );
    if (conflicto) {
      return {
        ok: false,
        codigo: 'HORARIO_OCUPADO',
        error: `El horario ${cleanHora} del ${cleanFecha} ya fue reservado.`,
      };
    }

    citaCounter += 1;
    const id = `CITA-${String(citaCounter).padStart(4, '0')}`;
    const cita: AppointmentRecord = {
      id,
      nombre: cleanNombre,
      servicio: cleanServicio,
      fecha: cleanFecha,
      hora: cleanHora,
      contacto: cleanContacto,
      estado: 'confirmada',
      creadaEn: nowProvider().toISOString(),
    };
    citas.set(id, cita);

    logBackend('crear_cita', 'Insertando registro en BD y creando evento en Google Calendar', cita);

    return { ok: true, id, cita };
  }

  function cancelar_cita(
    id: string,
    motivo: string,
  ): ToolResult<{ id: string; estado: 'cancelada'; mensaje: string }> {
    const cleanId = id.trim().toUpperCase();
    const cita = citas.get(cleanId);
    if (!cita) {
      return {
        ok: false,
        codigo: 'CITA_NO_ENCONTRADA',
        error: `No se encontró ninguna cita con el identificador ${cleanId}.`,
      };
    }
    if (cita.estado === 'cancelada') {
      return {
        ok: false,
        codigo: 'YA_CANCELADA',
        error: `La cita ${cleanId} ya había sido cancelada previamente.`,
      };
    }

    const dt = parseIsoDateLocal(cita.fecha);
    if (dt) {
      const [hh, mm] = cita.hora.split(':').map(Number);
      const appointmentDate = new Date(
        dt.getFullYear(),
        dt.getMonth(),
        dt.getDate(),
        hh,
        mm,
        0,
        0,
      );
      const diffMs = appointmentDate.getTime() - nowProvider().getTime();
      const twoHoursMs = 2 * 60 * 60 * 1000;
      if (diffMs < twoHoursMs) {
        logBackend('cancelar_cita', 'Cancelación rechazada por política de 2 horas', {
          id: cleanId,
          motivo,
        });
        return {
          ok: false,
          codigo: 'POLITICA_2_HORAS',
          error:
            'La cancelación sin cargo aplica únicamente hasta 2 horas antes de la cita. Para asistencia especial, comunícate con nuestro equipo.',
        };
      }
    }

    cita.estado = 'cancelada';
    cita.motivoCancelacion = motivo.trim() || 'Solicitud del paciente';

    logBackend('cancelar_cita', 'Actualizando estado en BD y eliminando evento en Google Calendar', {
      id: cleanId,
      motivo: cita.motivoCancelacion,
    });

    return {
      ok: true,
      id: cleanId,
      estado: 'cancelada',
      mensaje: `La cita ${cleanId} fue cancelada sin cargo conforme a la política de 2 horas.`,
    };
  }

  function reprogramar_cita(
    id: string,
    nueva_fecha: string,
    nueva_hora: string,
  ): ToolResult<{ id: string; cita: AppointmentRecord }> {
    const cleanId = id.trim().toUpperCase();
    const cita = citas.get(cleanId);
    if (!cita) {
      return {
        ok: false,
        codigo: 'CITA_NO_ENCONTRADA',
        error: `No se encontró ninguna cita con el identificador ${cleanId}.`,
      };
    }
    if (cita.estado === 'cancelada') {
      return {
        ok: false,
        codigo: 'CITA_CANCELADA',
        error: `La cita ${cleanId} está cancelada y no puede reprogramarse.`,
      };
    }

    const cleanFecha = nueva_fecha.trim();
    const cleanHora = normalizeTime(nueva_hora);
    if (!cleanHora) {
      return {
        ok: false,
        codigo: 'HORA_INVALIDA',
        error: 'La nueva hora debe tener formato HH:MM (ejemplo: 11:30).',
      };
    }

    const { validDate, dayType, slots } = getAllowedSlotsForDate(cleanFecha);
    if (!validDate || dayType === 'sunday') {
      return {
        ok: false,
        codigo: 'DIA_NO_LABORAL',
        error: 'La farmacia atiende de lunes a sábado; los domingos permanece cerrada.',
      };
    }
    if (!slots.includes(cleanHora)) {
      return {
        ok: false,
        codigo: 'HORARIO_NO_DISPONIBLE',
        error: `Horarios disponibles para esa fecha: ${slots.join(', ')}.`,
      };
    }

    const conflicto = Array.from(citas.values()).find(
      (c) =>
        c.id !== cleanId &&
        c.fecha === cleanFecha &&
        c.hora === cleanHora &&
        c.estado === 'confirmada',
    );
    if (conflicto) {
      return {
        ok: false,
        codigo: 'HORARIO_OCUPADO',
        error: `El horario ${cleanHora} del ${cleanFecha} ya está ocupado.`,
      };
    }

    cita.fecha = cleanFecha;
    cita.hora = cleanHora;

    logBackend('reprogramar_cita', 'Actualizando cita en BD y reagendando en Google Calendar', cita);

    return { ok: true, id: cleanId, cita };
  }

  function registrar_lead(
    nombre: string,
    contacto: string,
    interes: string,
    origen: string,
  ): ToolResult<{ id: string; lead: LeadRecord }> {
    const cleanNombre = nombre.trim();
    const cleanContacto = contacto.trim();
    if (!cleanNombre || !cleanContacto) {
      return {
        ok: false,
        codigo: 'DATOS_INCOMPLETOS',
        error: 'Se requiere nombre y un medio de contacto para registrar el seguimiento.',
      };
    }

    leadCounter += 1;
    const id = `LEAD-${String(leadCounter).padStart(4, '0')}`;
    const lead: LeadRecord = {
      id,
      nombre: cleanNombre,
      contacto: cleanContacto,
      interes: interes.trim() || 'Consulta general',
      origen: origen.trim() || 'chat_sofia',
      creadoEn: nowProvider().toISOString(),
    };
    leads.push(lead);

    logBackend('registrar_lead', 'Guardando lead en CRM / Base de datos', lead);

    return { ok: true, id, lead };
  }

  function registrar_escalamiento(
    resumen: string,
    prioridad: 'baja' | 'media' | 'alta',
    canal: string,
  ): ToolResult<{ id: string; escalamiento: EscalationRecord }> {
    const cleanResumen = resumen.trim();
    if (!cleanResumen) {
      return {
        ok: false,
        codigo: 'RESUMEN_VACIO',
        error: 'Se requiere un breve resumen para canalizar el caso al equipo humano.',
      };
    }

    escCounter += 1;
    const id = `ESC-${String(escCounter).padStart(4, '0')}`;
    const validPriority: 'baja' | 'media' | 'alta' =
      prioridad === 'alta' || prioridad === 'baja' ? prioridad : 'media';

    const escalamiento: EscalationRecord = {
      id,
      resumen: cleanResumen,
      prioridad: validPriority,
      canal: canal.trim() || 'correo',
      creadoEn: nowProvider().toISOString(),
    };
    escalamientos.push(escalamiento);

    logBackend(
      'registrar_escalamiento',
      'Creando ticket de atención humana (<24h SLA) y notificando al equipo',
      escalamiento,
    );

    return { ok: true, id, escalamiento };
  }

  function enviar_confirmacion(
    tipo: string,
    destinatario: string,
    detalles: string,
  ): ToolResult<{ id: string; confirmacion: ConfirmationRecord }> {
    const cleanDest = destinatario.trim();
    if (!cleanDest) {
      return {
        ok: false,
        codigo: 'DESTINATARIO_VACIO',
        error: 'Se requiere un correo o contacto destinatario para enviar la confirmación.',
      };
    }

    envCounter += 1;
    const id = `ENV-${String(envCounter).padStart(4, '0')}`;
    const confirmacion: ConfirmationRecord = {
      id,
      tipo: tipo.trim() || 'cita_vacunacion',
      destinatario: cleanDest,
      detalles: detalles.trim(),
      enviadoEn: nowProvider().toISOString(),
    };
    confirmaciones.push(confirmacion);

    logBackend(
      'enviar_confirmacion',
      'Enviando correo transaccional simulado (en producción: Resend API)',
      confirmacion,
    );

    return { ok: true, id, confirmacion };
  }

  function executeToolCall(name: string, args: Record<string, unknown> = {}): ToolResult {
    switch (name) {
      case 'consultar_disponibilidad':
        return consultar_disponibilidad(
          String(args.servicio ?? ''),
          String(args.fecha ?? ''),
        );
      case 'crear_cita':
        return crear_cita(
          String(args.nombre ?? ''),
          String(args.servicio ?? ''),
          String(args.fecha ?? ''),
          String(args.hora ?? ''),
          String(args.contacto ?? ''),
        );
      case 'cancelar_cita':
        return cancelar_cita(String(args.id ?? ''), String(args.motivo ?? ''));
      case 'reprogramar_cita':
        return reprogramar_cita(
          String(args.id ?? ''),
          String(args.nueva_fecha ?? ''),
          String(args.nueva_hora ?? ''),
        );
      case 'registrar_lead':
        return registrar_lead(
          String(args.nombre ?? ''),
          String(args.contacto ?? ''),
          String(args.interes ?? ''),
          String(args.origen ?? 'chat_sofia'),
        );
      case 'registrar_escalamiento':
        return registrar_escalamiento(
          String(args.resumen ?? ''),
          (String(args.prioridad ?? 'media') as 'baja' | 'media' | 'alta'),
          String(args.canal ?? 'correo'),
        );
      case 'enviar_confirmacion':
        return enviar_confirmacion(
          String(args.tipo ?? ''),
          String(args.destinatario ?? ''),
          String(args.detalles ?? ''),
        );
      default:
        return {
          ok: false,
          codigo: 'HERRAMIENTA_DESCONOCIDA',
          error: `La función ${name} no está registrada.`,
        };
    }
  }

  return {
    consultar_disponibilidad,
    crear_cita,
    cancelar_cita,
    reprogramar_cita,
    registrar_lead,
    registrar_escalamiento,
    enviar_confirmacion,
    executeToolCall,
    getSnapshot: () => ({
      citas: Array.from(citas.values()),
      leads: [...leads],
      escalamientos: [...escalamientos],
      confirmaciones: [...confirmaciones],
    }),
  };
}

export const PHARMACY_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'consultar_disponibilidad',
    description:
      'Consulta horarios libres de ejemplo (9:00, 11:30, 16:00 en semana; 9:00 y 11:30 sábados; domingos cerrado) para un servicio y fecha en formato YYYY-MM-DD.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        servicio: {
          type: Type.STRING,
          description: 'Nombre del servicio, por ejemplo: Vacunación contra la influenza.',
        },
        fecha: {
          type: Type.STRING,
          description: 'Fecha solicitada en formato YYYY-MM-DD.',
        },
      },
      required: ['servicio', 'fecha'],
    },
  },
  {
    name: 'crear_cita',
    description:
      'Crea una cita confirmada en el sistema después de que el usuario dijo "sí" explícitamente al resumen final.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        nombre: { type: Type.STRING, description: 'Nombre completo del paciente.' },
        servicio: { type: Type.STRING, description: 'Servicio solicitado.' },
        fecha: { type: Type.STRING, description: 'Fecha en formato YYYY-MM-DD.' },
        hora: { type: Type.STRING, description: 'Hora en formato HH:MM (ej. 09:00, 11:30, 16:00).' },
        contacto: { type: Type.STRING, description: 'Correo electrónico o teléfono.' },
      },
      required: ['nombre', 'servicio', 'fecha', 'hora', 'contacto'],
    },
  },
  {
    name: 'cancelar_cita',
    description: 'Cancela una cita existente aplicando la política de hasta 2 horas antes sin cargo.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: 'ID de la cita, por ejemplo CITA-0001.' },
        motivo: { type: Type.STRING, description: 'Motivo de cancelación.' },
      },
      required: ['id', 'motivo'],
    },
  },
  {
    name: 'reprogramar_cita',
    description: 'Reprograma una cita existente a una nueva fecha y hora disponibles.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: 'ID de la cita, por ejemplo CITA-0001.' },
        nueva_fecha: { type: Type.STRING, description: 'Nueva fecha en formato YYYY-MM-DD.' },
        nueva_hora: { type: Type.STRING, description: 'Nueva hora en formato HH:MM.' },
      },
      required: ['id', 'nueva_fecha', 'nueva_hora'],
    },
  },
  {
    name: 'registrar_lead',
    description:
      'Registra un contacto interesado solo DESPUÉS de pedir consentimiento explícito con el aviso de privacidad.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        nombre: { type: Type.STRING, description: 'Nombre de la persona.' },
        contacto: { type: Type.STRING, description: 'Correo electrónico o teléfono.' },
        interes: { type: Type.STRING, description: 'Tema o servicio de interés.' },
        origen: { type: Type.STRING, description: 'Canal de origen (ej. chat_texto, chat_voz).' },
      },
      required: ['nombre', 'contacto', 'interes', 'origen'],
    },
  },
  {
    name: 'registrar_escalamiento',
    description:
      'Registra un caso para atención por una persona del equipo (si el usuario pide hablar con un humano, está molesto o tiene un problema de pago).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        resumen: { type: Type.STRING, description: 'Resumen claro del caso.' },
        prioridad: {
          type: Type.STRING,
          description: 'Prioridad del caso: baja, media o alta.',
        },
        canal: { type: Type.STRING, description: 'Canal preferido de contacto (ej. correo).' },
      },
      required: ['resumen', 'prioridad', 'canal'],
    },
  },
  {
    name: 'enviar_confirmacion',
    description:
      'Simula el envío de un correo de confirmación al paciente después de crear una cita.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        tipo: { type: Type.STRING, description: 'Tipo de confirmación, ej. cita_vacunacion.' },
        destinatario: { type: Type.STRING, description: 'Correo o contacto del paciente.' },
        detalles: { type: Type.STRING, description: 'Resumen de fecha, hora, servicio e ID.' },
      },
      required: ['tipo', 'destinatario', 'detalles'],
    },
  },
];
