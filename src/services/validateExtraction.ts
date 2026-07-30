import { DocumentField } from '../types';

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.,;:()\[\]/\\'"_+-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const stripSpaces = (value: string) => normalize(value).replace(/\s/g, '');

export interface FieldValidationResult {
  verifiedFields: DocumentField[];
  rejectedFields: DocumentField[];
}

/**
 * Verifica cada campo extraído contra la transcripción literal de la imagen.
 *
 * Regla: el valor del campo, completo, tiene que aparecer en la transcripción.
 * No alcanza con que coincidan dígitos sueltos — así es como se colaban
 * valores inventados ("12.5 g/dL" pasaba porque el 12 aparecía en una fecha
 * y el 5 en otra parte). La comparación se hace sobre el valor entero, con y
 * sin espacios, para tolerar diferencias de formato ("100 mg" vs "100mg").
 *
 * Es la red de seguridad principal contra que el modelo complete un panel de
 * laboratorio típico que no existe en el documento.
 */
export const validateFieldsAgainstTranscription = (
  fields: DocumentField[],
  transcription: string,
): FieldValidationResult => {
  const haystack = normalize(transcription);
  const haystackTight = stripSpaces(transcription);

  const verifiedFields: DocumentField[] = [];
  const rejectedFields: DocumentField[] = [];

  fields.forEach((field) => {
    const value = normalize(field.value);

    // Sin contenido verificable (ej. "(ilegible)", "No informada") no hay
    // ningún dato concreto que contrastar: se conserva.
    if (!value || value.length < 2 || /^(ilegible|no informada|n a|nd)$/.test(value)) {
      verifiedFields.push(field);
      return;
    }

    const appears =
      haystack.includes(value) || haystackTight.includes(stripSpaces(field.value));

    if (appears) {
      verifiedFields.push(field);
      return;
    }

    // Segunda chance: el valor puede venir reordenado o con la unidad
    // separada. Se acepta solo si TODAS sus palabras significativas
    // (4+ caracteres, no genéricas) aparecen en la transcripción.
    const words = (value.match(/[a-z]{4,}/g) || []).filter((word) => !GENERIC.has(word));
    if (words.length > 0 && words.every((word) => haystack.includes(word))) {
      verifiedFields.push(field);
      return;
    }

    rejectedFields.push(field);
  });

  return { verifiedFields, rejectedFields };
};

const GENERIC = new Set([
  'dato',
  'datos',
  'valor',
  'valores',
  'normal',
  'rango',
  'para',
  'como',
  'este',
  'esta',
  'segun',
]);
