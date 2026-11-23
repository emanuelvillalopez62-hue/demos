import test from 'node:test';
import assert from 'node:assert/strict';
import { createPharmacyStore, getStatusKeyForTool } from './pharmacyTools';

test('consultar_disponibilidad respects weekday, Saturday, and closed Sunday hours', () => {
  const store = createPharmacyStore(() => new Date('2026-11-23T10:00:00Z'));

  // 2026-11-25 is Wednesday
  const wed = store.consultar_disponibilidad('Vacunación contra la influenza', '2026-11-25');
  assert.equal(wed.ok, true);
  if (wed.ok) {
    assert.equal(wed.disponible, true);
    assert.deepEqual(wed.horarios, ['09:00', '11:30', '16:00']);
  }

  // 2026-11-28 is Saturday (9:00 to 14:00 -> no 16:00)
  const sat = store.consultar_disponibilidad('Vacunación contra la influenza', '2026-11-28');
  assert.equal(sat.ok, true);
  if (sat.ok) {
    assert.equal(sat.disponible, true);
    assert.deepEqual(sat.horarios, ['09:00', '11:30']);
  }

  // 2026-11-29 is Sunday (closed)
  const sun = store.consultar_disponibilidad('Vacunación contra la influenza', '2026-11-29');
  assert.equal(sun.ok, true);
  if (sun.ok) {
    assert.equal(sun.disponible, false);
    assert.deepEqual(sun.horarios, []);
  }
});

test('crear_cita generates sequential CITA IDs and removes booked slot from availability', () => {
  const store = createPharmacyStore(() => new Date('2026-11-23T10:00:00'));

  const created = store.crear_cita(
    'Ana López',
    'Vacunación contra la influenza',
    '2026-11-25',
    '11:30',
    'ana@ejemplo.com',
  );
  assert.equal(created.ok, true);
  if (created.ok) {
    assert.equal(created.id, 'CITA-0001');
    assert.equal(created.cita.estado, 'confirmada');
  }

  // Double-booking same slot fails
  const duplicate = store.crear_cita(
    'Carlos Ruiz',
    'Vacunación contra la influenza',
    '2026-11-25',
    '11:30',
    'carlos@ejemplo.com',
  );
  assert.equal(duplicate.ok, false);

  // Availability reflects remaining slots
  const avail = store.consultar_disponibilidad('Vacunación contra la influenza', '2026-11-25');
  assert.equal(avail.ok, true);
  if (avail.ok) {
    assert.deepEqual(avail.horarios, ['09:00', '16:00']);
  }
});

test('cancelar_cita enforces 2-hour policy', () => {
  // Current time: 2026-11-25 at 10:00 local
  let mockNow = new Date(2026, 10, 25, 10, 0, 0, 0);
  const store = createPharmacyStore(() => mockNow);

  const cita1 = store.crear_cita(
    'María Pérez',
    'Vacunación contra la influenza',
    '2026-11-25',
    '11:30',
    'maria@ejemplo.com',
  );
  assert.equal(cita1.ok, true);

  // 1.5 hours before 11:30 -> blocked
  if (cita1.ok) {
    const blocked = store.cancelar_cita(cita1.id, 'Imprevisto');
    assert.equal(blocked.ok, false);
    if (!blocked.ok) {
      assert.equal(blocked.codigo, 'POLITICA_2_HORAS');
    }
  }

  // Advance/rewind to 08:30 (3 hours before 11:30) -> allowed
  mockNow = new Date(2026, 10, 25, 8, 30, 0, 0);
  if (cita1.ok) {
    const allowed = store.cancelar_cita(cita1.id, 'Cambio de planes');
    assert.equal(allowed.ok, true);
    if (allowed.ok) {
      assert.equal(allowed.estado, 'cancelada');
    }
  }
});

test('reprogramar_cita, registrar_lead, registrar_escalamiento, and enviar_confirmacion work cleanly', () => {
  const store = createPharmacyStore(() => new Date('2026-11-23T09:00:00'));

  const cita = store.crear_cita(
    'Luis Gómez',
    'Vacunación contra la influenza',
    '2026-11-25',
    '09:00',
    'luis@ejemplo.com',
  );
  assert.equal(cita.ok, true);

  if (cita.ok) {
    // Reject Sunday
    const badResched = store.reprogramar_cita(cita.id, '2026-11-29', '09:00');
    assert.equal(badResched.ok, false);

    // Valid reschedule to Saturday 11:30
    const goodResched = store.reprogramar_cita(cita.id, '2026-11-28', '11:30');
    assert.equal(goodResched.ok, true);
    if (goodResched.ok) {
      assert.equal(goodResched.cita.fecha, '2026-11-28');
      assert.equal(goodResched.cita.hora, '11:30');
    }
  }

  const lead = store.registrar_lead('Sofía Demo', 'sofia@ejemplo.com', 'Entrega a domicilio', 'chat');
  assert.equal(lead.ok, true);
  if (lead.ok) assert.equal(lead.id, 'LEAD-0001');

  const esc = store.registrar_escalamiento('Solicita hablar con encargado', 'alta', 'correo');
  assert.equal(esc.ok, true);
  if (esc.ok) assert.equal(esc.id, 'ESC-0001');

  const conf = store.enviar_confirmacion('cita_vacunacion', 'luis@ejemplo.com', 'CITA-0001 confirmada');
  assert.equal(conf.ok, true);
  if (conf.ok) assert.equal(conf.id, 'ENV-0001');
});

test('getStatusKeyForTool maps simulated backend tools to real-time status keys', () => {
  assert.equal(getStatusKeyForTool('consultar_disponibilidad'), 'toolAvailability');
  assert.equal(getStatusKeyForTool('crear_cita'), 'toolBooking');
  assert.equal(getStatusKeyForTool('cancelar_cita'), 'toolCancel');
  assert.equal(getStatusKeyForTool('reprogramar_cita'), 'toolReschedule');
  assert.equal(getStatusKeyForTool('registrar_lead'), 'toolLead');
  assert.equal(getStatusKeyForTool('registrar_escalamiento'), 'toolEscalation');
  assert.equal(getStatusKeyForTool('enviar_confirmacion'), 'toolEmail');
  assert.equal(getStatusKeyForTool('unknown_tool'), 'processing');
});
