import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildHealthTipsPrompt,
  normalizeHealthTipsRequest,
  parseHealthTipsJson,
} from './healthTips';

test('normalizeHealthTipsRequest validates focus, lang, and note length', () => {
  const valid = normalizeHealthTipsRequest({
    lang: 'en',
    focus: 'heart',
    patientNote: '  Office worker, walks 20 minutes  ',
  });
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.value.lang, 'en');
    assert.equal(valid.value.focus, 'heart');
    assert.equal(valid.value.patientNote, 'Office worker, walks 20 minutes');
  }

  const badFocus = normalizeHealthTipsRequest({ lang: 'es', focus: 'surgery' });
  assert.equal(badFocus.ok, false);

  const tooLong = normalizeHealthTipsRequest({
    lang: 'es',
    focus: 'general',
    patientNote: 'a'.repeat(185),
  });
  assert.equal(tooLong.ok, false);
});

test('buildHealthTipsPrompt keeps safety rules and focus alignment', () => {
  const { systemInstruction, prompt } = buildHealthTipsPrompt(
    { lang: 'es', focus: 'immunity', patientNote: 'Adulto mayor' },
    '2026-11-23',
  );
  assert.match(systemInstruction, /Farmacia Vida Sana Ejemplo/);
  assert.match(systemInstruction, /Nunca des diagnósticos/);
  assert.match(prompt, /2026-11-23/);
  assert.match(prompt, /Adulto mayor/);
});

test('parseHealthTipsJson extracts up to 3 tips and strips markdown', () => {
  const raw = JSON.stringify({
    dailyHeadline: '**Cuida** tu # bienestar hoy',
    tips: [
      {
        category: 'Prevención',
        title: '**Vacuna** estacional',
        advice: 'Agenda tu vacuna con anticipación y mantén reposo ligero.',
        pharmacyNote: 'Disponible por **$250** previa cita.',
      },
      {
        category: 'Hidratación',
        title: 'Agua constante',
        advice: 'Toma agua durante el día en intervalos regulares.',
        pharmacyNote: 'Suero oral disponible en mostrador.',
      },
    ],
  });

  const parsed = parseHealthTipsJson(
    raw,
    { lang: 'es', focus: 'immunity', patientNote: '' },
    '2026-11-23',
  );
  assert.ok(parsed);
  assert.equal(parsed.dailyHeadline, 'Cuida tu bienestar hoy');
  assert.equal(parsed.tips.length, 2);
  assert.equal(parsed.tips[0].title, 'Vacuna estacional');
  assert.equal(parsed.tips[0].pharmacyNote, 'Disponible por $250 previa cita.');
});

test('parseHealthTipsJson rejects malformed JSON safely', () => {
  const parsed = parseHealthTipsJson(
    'not valid json',
    { lang: 'en', focus: 'general', patientNote: '' },
    '2026-11-23',
  );
  assert.equal(parsed, null);
});
