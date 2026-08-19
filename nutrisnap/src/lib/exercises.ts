import type { WorkoutMode } from './types';
import type { SessionType } from './training';

/* ── Base de ejercicios ────────────────────────────────────────────────────
   Decisión importante: NO sugerimos kilos concretos.

   Un peso absoluto ("Press banca: 60 kg") es adivinar sobre alguien de quien
   no sabemos su fuerza, y equivocarse por arriba es cómo se lesiona la
   gente. Lo que sí funciona, y es como entrena cualquiera con criterio, es
   el esfuerzo percibido: RPE 8 significa "podrías haber hecho 2 repeticiones
   más". Eso es válido para todo el mundo desde el primer día.
   ------------------------------------------------------------------------ */

export interface Exercise {
  id: string;
  name: string;
  muscle: string;
  sets: number;
  reps: string;
  /** Esfuerzo percibido, 1-10. 8 = quedan ~2 repeticiones en el tanque. */
  rpe: number;
  session: SessionType;
  mode: WorkoutMode | 'ambos';
  /** Pista de ejecución, no de carga. */
  cue?: string;
}

export const EXERCISES: Exercise[] = [
  // ── Empuje ──
  { id: 'press-banca', name: 'Press de banca', muscle: 'Pecho', sets: 4, reps: '6-8', rpe: 8, session: 'empuje', mode: 'gimnasio', cue: 'Escápulas retraídas, barra a la línea del pezón.' },
  { id: 'press-inclinado-mancuerna', name: 'Press inclinado con mancuernas', muscle: 'Pecho superior', sets: 3, reps: '8-10', rpe: 8, session: 'empuje', mode: 'gimnasio' },
  { id: 'press-militar', name: 'Press militar', muscle: 'Hombro', sets: 4, reps: '6-8', rpe: 8, session: 'empuje', mode: 'gimnasio', cue: 'Glúteo apretado, sin arquear la espalda.' },
  { id: 'elevaciones-laterales', name: 'Elevaciones laterales', muscle: 'Deltoides medio', sets: 3, reps: '12-15', rpe: 9, session: 'empuje', mode: 'gimnasio' },
  { id: 'fondos-triceps', name: 'Fondos en paralelas', muscle: 'Tríceps y pecho', sets: 3, reps: '8-12', rpe: 8, session: 'empuje', mode: 'ambos' },
  { id: 'flexiones', name: 'Flexiones', muscle: 'Pecho y tríceps', sets: 4, reps: '10-20', rpe: 8, session: 'empuje', mode: 'calistenia', cue: 'Cuerpo en línea recta, codos a 45°.' },
  { id: 'flexiones-diamante', name: 'Flexiones diamante', muscle: 'Tríceps', sets: 3, reps: '8-15', rpe: 8, session: 'empuje', mode: 'calistenia' },
  { id: 'pike-push-up', name: 'Pike push-up', muscle: 'Hombro', sets: 3, reps: '8-12', rpe: 8, session: 'empuje', mode: 'calistenia' },

  // ── Tirón ──
  { id: 'dominadas', name: 'Dominadas', muscle: 'Dorsal', sets: 4, reps: '5-10', rpe: 8, session: 'tiron', mode: 'ambos', cue: 'Pecho hacia la barra, sin balanceo.' },
  { id: 'remo-barra', name: 'Remo con barra', muscle: 'Espalda media', sets: 4, reps: '8-10', rpe: 8, session: 'tiron', mode: 'gimnasio' },
  { id: 'jalon-pecho', name: 'Jalón al pecho', muscle: 'Dorsal', sets: 3, reps: '10-12', rpe: 8, session: 'tiron', mode: 'gimnasio' },
  { id: 'curl-biceps', name: 'Curl de bíceps', muscle: 'Bíceps', sets: 3, reps: '10-12', rpe: 9, session: 'tiron', mode: 'gimnasio' },
  { id: 'face-pull', name: 'Face pull', muscle: 'Deltoides posterior', sets: 3, reps: '15-20', rpe: 8, session: 'tiron', mode: 'gimnasio' },
  { id: 'remo-invertido', name: 'Remo invertido', muscle: 'Espalda media', sets: 4, reps: '10-15', rpe: 8, session: 'tiron', mode: 'calistenia', cue: 'Cuanto más horizontal el cuerpo, más difícil.' },
  { id: 'australian-chin', name: 'Chin-up australiano', muscle: 'Bíceps y dorsal', sets: 3, reps: '10-15', rpe: 8, session: 'tiron', mode: 'calistenia' },

  // ── Pierna ──
  { id: 'sentadilla', name: 'Sentadilla trasera', muscle: 'Cuádriceps y glúteo', sets: 4, reps: '6-8', rpe: 8, session: 'pierna', mode: 'gimnasio', cue: 'Rodillas siguiendo la punta del pie.' },
  { id: 'peso-muerto-rumano', name: 'Peso muerto rumano', muscle: 'Isquios y glúteo', sets: 4, reps: '8-10', rpe: 8, session: 'pierna', mode: 'gimnasio', cue: 'Cadera atrás, espalda neutra, barra pegada.' },
  { id: 'hip-thrust', name: 'Hip thrust', muscle: 'Glúteo', sets: 4, reps: '10-12', rpe: 8, session: 'pierna', mode: 'gimnasio' },
  { id: 'zancadas', name: 'Zancadas', muscle: 'Cuádriceps y glúteo', sets: 3, reps: '10-12 por pierna', rpe: 8, session: 'pierna', mode: 'ambos' },
  { id: 'elevacion-gemelos', name: 'Elevación de gemelos', muscle: 'Gemelos', sets: 4, reps: '12-15', rpe: 9, session: 'pierna', mode: 'ambos' },
  { id: 'sentadilla-bulgara', name: 'Sentadilla búlgara', muscle: 'Cuádriceps y glúteo', sets: 3, reps: '10-12 por pierna', rpe: 8, session: 'pierna', mode: 'calistenia' },
  { id: 'puente-gluteo', name: 'Puente de glúteo a una pierna', muscle: 'Glúteo', sets: 3, reps: '12-15 por lado', rpe: 8, session: 'pierna', mode: 'calistenia' },
  { id: 'sentadilla-pistol', name: 'Sentadilla pistol asistida', muscle: 'Cuádriceps', sets: 3, reps: '6-10 por pierna', rpe: 8, session: 'pierna', mode: 'calistenia' },

  // ── Cuerpo completo ──
  { id: 'peso-muerto', name: 'Peso muerto convencional', muscle: 'Cadena posterior', sets: 3, reps: '5', rpe: 8, session: 'full-body', mode: 'gimnasio', cue: 'Si la espalda se redondea, baja el peso.' },
  { id: 'goblet-squat', name: 'Sentadilla goblet', muscle: 'Piernas', sets: 3, reps: '10-12', rpe: 7, session: 'full-body', mode: 'gimnasio' },
  { id: 'burpees', name: 'Burpees', muscle: 'Cuerpo completo', sets: 4, reps: '10-12', rpe: 8, session: 'full-body', mode: 'ambos' },
  { id: 'plancha', name: 'Plancha frontal', muscle: 'Core', sets: 3, reps: '40-60 s', rpe: 8, session: 'full-body', mode: 'ambos' },
  { id: 'sentadilla-aire', name: 'Sentadilla libre', muscle: 'Piernas', sets: 4, reps: '15-20', rpe: 7, session: 'full-body', mode: 'calistenia' },

  // ── HIIT ──
  { id: 'hiit-sprint', name: 'Sprints en intervalos', muscle: 'Cardiovascular', sets: 8, reps: '20 s fuerte / 40 s suave', rpe: 9, session: 'hiit', mode: 'ambos', cue: 'Si puedes hablar durante el intervalo fuerte, no es fuerte.' },
  { id: 'hiit-mountain', name: 'Escaladores', muscle: 'Core y cardio', sets: 4, reps: '30 s', rpe: 8, session: 'hiit', mode: 'ambos' },
  { id: 'hiit-jump-squat', name: 'Sentadilla con salto', muscle: 'Piernas', sets: 4, reps: '15', rpe: 9, session: 'hiit', mode: 'ambos' },
  { id: 'hiit-burpee', name: 'Burpees', muscle: 'Cuerpo completo', sets: 4, reps: '30 s', rpe: 9, session: 'hiit', mode: 'ambos' },

  // ── Cardio ──
  { id: 'cardio-zona2', name: 'Trote o caminata rápida', muscle: 'Cardiovascular', sets: 1, reps: '30-35 min', rpe: 5, session: 'cardio', mode: 'ambos', cue: 'Ritmo en el que puedas mantener una conversación.' },
  { id: 'cardio-bici', name: 'Bicicleta estática', muscle: 'Cardiovascular', sets: 1, reps: '30 min', rpe: 5, session: 'cardio', mode: 'ambos' },

  // ── Movilidad ──
  { id: 'mov-cadera', name: 'Apertura de cadera 90/90', muscle: 'Cadera', sets: 2, reps: '8 por lado', rpe: 3, session: 'movilidad', mode: 'ambos' },
  { id: 'mov-gato-camello', name: 'Gato-camello', muscle: 'Columna', sets: 2, reps: '10', rpe: 3, session: 'movilidad', mode: 'ambos' },
  { id: 'mov-hombro', name: 'Dislocaciones de hombro con banda', muscle: 'Hombro', sets: 2, reps: '12', rpe: 3, session: 'movilidad', mode: 'ambos' },
  { id: 'mov-sentadilla-profunda', name: 'Sentadilla profunda sostenida', muscle: 'Cadera y tobillo', sets: 3, reps: '30 s', rpe: 3, session: 'movilidad', mode: 'ambos' },
];

/** Ejercicios de una sesión filtrados por modalidad. */
export function exercisesFor(session: SessionType, mode: WorkoutMode): Exercise[] {
  if (session === 'descanso') return [];
  return EXERCISES.filter(
    (e) => e.session === session && (e.mode === mode || e.mode === 'ambos'),
  ).slice(0, 6);
}
