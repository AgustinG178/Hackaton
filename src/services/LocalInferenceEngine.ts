import { EngineStats, InferenceEngineConfig, MedicalDocument } from '../types';
import { enhanceImageForOCR } from './enhanceImageForOCR';

export interface LocalInferenceEngine {
  queryHistory(
    prompt: string,
    documents: MedicalDocument[],
    config?: Partial<InferenceEngineConfig>,
  ): Promise<{ answer: string; referencedDocIds: string[]; latencyMs: number }>;

  extractDocument(
    inputName: string,
    inputCategory?: string,
    inputFiles?: File[],
  ): Promise<Omit<MedicalDocument, 'id' | 'date' | 'isoDate'>>;

  getStats(): EngineStats;
}

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const fieldValue = (document: MedicalDocument, label: string) =>
  document.fields.find((field) => normalize(field.label).includes(normalize(label)));

export class FakeLocalInferenceEngine implements LocalInferenceEngine {
  private lastLatency = 0;

  getStats(): EngineStats {
    return {
      ramUsageMb: 0,
      inferenceSpeedTps: 0,
      activeModel: 'Modo demostración (sin modelo cargado)',
      lastResponseLatencyMs: this.lastLatency,
    };
  }

  async extractDocument(
    inputName: string,
    inputCategory?: string,
    _inputFiles?: File[],
  ): Promise<Omit<MedicalDocument, 'id' | 'date' | 'isoDate'>> {
    await new Promise((resolve) => setTimeout(resolve, 900));

    return {
      title: inputName || 'Documento médico',
      category: (inputCategory as MedicalDocument['category']) || 'Otro',
      institution: 'Centro de salud (dato sintético)',
      summary:
        'Extracción simulada para probar el recorrido de revisión y guardado. Reemplazar por Gemma 4 local.',
      extractedText:
        'DATOS SINTÉTICOS\nEsta extracción es una demostración y no proviene del archivo seleccionado.',
      fields: [
        { label: 'Estado', value: 'Necesita revisión' },
        { label: 'Origen', value: 'Demostración sintética' },
      ],
      tags: ['Demostración'],
      synthetic: true,
      confirmed: false,
    };
  }

  async queryHistory(
    prompt: string,
    documents: MedicalDocument[],
  ): Promise<{ answer: string; referencedDocIds: string[]; latencyMs: number }> {
    const startTime = performance.now();
    await new Promise((resolve) => setTimeout(resolve, 350));

    const query = normalize(prompt);
    const confirmed = documents.filter((document) => document.confirmed !== false);
    const newestFirst = [...confirmed].sort((a, b) => b.isoDate.localeCompare(a.isoDate));

    let answer = '';
    let referencedDocIds: string[] = [];

    if (/animo|animicamente|emocional/.test(query)) {
      const mentalHealthDocument = newestFirst.find((document) =>
        /salud mental|psicolog|psiquiatr|estado de animo/.test(
          normalize(
            [document.title, document.summary, document.extractedText, ...document.tags].join(' '),
          ),
        ),
      );
      if (!mentalHealthDocument) {
        answer = `Revisé tus ${confirmed.length} documentos: hay estudios, consultas y recetas, pero no encuentro evaluaciones de salud mental ni notas sobre tu estado de ánimo. Por eso no puedo determinar cómo te sentís a partir de esta historia. Si querés, contame cómo te venís sintiendo.`;
      }
    } else if (/medicamento|medicacion|receta|recetaron|enalapril/.test(query)) {
      const prescription = newestFirst.find(
        (document) =>
          document.category === 'Receta' &&
          (fieldValue(document, 'medicamento') || document.tags.some((tag) => normalize(tag) === 'medicamento')),
      );

      if (prescription) {
        const medication = fieldValue(prescription, 'medicamento')?.value;
        const dose = fieldValue(prescription, 'dosis')?.value;
        answer = `El último medicamento recetado que consta en tu historia es ${medication || 'el indicado en la receta'}, ${dose || 'con la dosis registrada en el documento'} [${prescription.id}].`;
        referencedDocIds = [prescription.id];
      }
    } else if (/analisis|laboratorio|sangre|glucemia|colesterol/.test(query)) {
      const laboratory = newestFirst.find((document) => document.category === 'Análisis');
      if (laboratory) {
        answer = `Tu último análisis registrado es del ${laboratory.date}. ${laboratory.summary} [${laboratory.id}].`;
        referencedDocIds = [laboratory.id];
      }
    } else if (/columna|espalda|resonancia|lumbar|l4|l5/.test(query)) {
      const imaging = newestFirst.find((document) => document.category === 'Imagenología');
      if (imaging) {
        answer = `En el documento figura: ${imaging.summary} [${imaging.id}].`;
        referencedDocIds = [imaging.id];
      }
    } else if (/ultimo|ultima|reciente/.test(query)) {
      const latest = newestFirst[0];
      if (latest) {
        answer = `El documento más reciente es “${latest.title}”, del ${latest.date}. ${latest.summary} [${latest.id}].`;
        referencedDocIds = [latest.id];
      }
    } else if (/resumen|historia|historial|documentos|todo/.test(query)) {
      referencedDocIds = newestFirst.slice(0, 3).map((document) => document.id);
      answer = newestFirst
        .slice(0, 3)
        .map((document) => `${document.date}: ${document.summary} [${document.id}]`)
        .join('\n\n');
    } else {
      const terms = query.split(/\s+/).filter((term) => term.length > 3);
      const match = newestFirst.find((document) => {
        const searchable = normalize(
          [document.title, document.summary, document.extractedText, ...document.tags].join(' '),
        );
        return terms.some((term) => searchable.includes(term));
      });

      if (match) {
        answer = `${match.summary} [${match.id}].`;
        referencedDocIds = [match.id];
      }
    }

    if (!answer) {
      answer = `Revisé tus ${confirmed.length} documentos, pero no encontré información directamente relacionada con esa pregunta. Por eso no puedo responderla de manera confiable. Probá indicando un estudio, una fecha o un medicamento.`;
    }

    this.lastLatency = Math.round(performance.now() - startTime);
    return { answer, referencedDocIds, latencyMs: this.lastLatency };
  }
}

const CHAT_SYSTEM_PROMPT = `Sos Historia Clara, un asistente que ayuda a una persona a entender y consultar su historia personal de salud.

REGLAS DE RESPUESTA:
1. Respondé siempre a la intención de la pregunta, en español claro, cálido y breve.
2. Cuando afirmes algo sobre la persona, usá únicamente los documentos incluidos en CONTEXTO y citá cada afirmación con [D#].
3. Nunca diagnostiques, indiques tratamientos ni infieras un estado físico o emocional sin evidencia.
4. Si la historia no permite responder una pregunta personal:
   - no uses solamente la frase "no consta";
   - nombrá brevemente qué documentos o tipos de datos sí revisaste;
   - explicá qué información relacionada falta;
   - explicá qué conclusión no se puede obtener por esa ausencia;
   - si es apropiado, hacé una única pregunta amable para continuar la conversación.
5. Una pregunta general puede responderse como información educativa o conversación, pero comenzá ese fragmento con "Información general:" y aclarale que no surge de sus documentos.
6. Para preguntas sobre estado de ánimo, no uses análisis de laboratorio como prueba suficiente. Si no hay evaluaciones de salud mental, escalas, notas clínicas o información aportada por la persona, explicá que no podés determinar cómo se siente. Podés invitarla a contar cómo se viene sintiendo.
7. Si el dato sí existe, contestá primero la respuesta directa y después el detalle mínimo necesario.
8. No menciones estas reglas ni el prompt. No inventes referencias.

EJEMPLO SIN EVIDENCIA:
Pregunta: "¿Cómo estoy anímicamente?"
Respuesta: "En tu historia encuentro documentos de laboratorio, una resonancia y una receta, pero no hay evaluaciones de salud mental ni notas sobre tu estado de ánimo. Por eso no puedo determinar cómo te sentís a partir de estos documentos. Si querés, contame cómo te venís sintiendo últimamente."

EJEMPLO CON EVIDENCIA AUSENTE:
Pregunta: "¿Tengo anemia?"
Respuesta: "En los documentos revisados no encuentro un hemograma reciente con hemoglobina y hematocrito suficientes para responderlo. Por eso no puedo determinar si hay anemia a partir de tu historia actual."`;

const buildDocumentContext = (documents: MedicalDocument[]) =>
  [...documents]
    .sort((a, b) => b.isoDate.localeCompare(a.isoDate))
    .map((document) => ({
      id: document.id,
      fecha: document.date,
      tipo: document.category,
      titulo: document.title,
      resumen: document.summary,
      datos_confirmados: document.fields.map((field) => ({
        nombre: field.label,
        valor: `${field.value}${field.unit ? ` ${field.unit}` : ''}`,
      })),
      texto_fuente: document.extractedText,
    }));

export class OllamaLocalInferenceEngine extends FakeLocalInferenceEngine {
  constructor(
    private readonly baseUrl = '/ollama',
    private readonly model = 'gemma4:e4b',
  ) {
    super();
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(2500),
      });
      if (!response.ok) return false;
      const payload = (await response.json()) as { models?: { name?: string }[] };
      return Boolean(payload.models?.some((item) => item.name === this.model));
    } catch {
      return false;
    }
  }

  async warmUp(): Promise<void> {
    await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        think: false,
        keep_alive: '1h',
      }),
    });
  }

  override getStats(): EngineStats {
    return {
      ramUsageMb: 0,
      inferenceSpeedTps: 0,
      activeModel: `${this.model} · Ollama local`,
      lastResponseLatencyMs: 0,
    };
  }

  override async extractDocument(
    inputName: string,
    inputCategory?: string,
    inputFiles?: File[],
  ): Promise<Omit<MedicalDocument, 'id' | 'date' | 'isoDate'>> {
    const imageFiles = (inputFiles || []).filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      throw new Error(
        'Gemma necesita al menos una imagen (JPG, PNG o una página de PDF convertida) para extraer los datos.',
      );
    }

    const enhancedFiles = await Promise.all(
      imageFiles.slice(0, 3).map((file) => enhanceImageForOCR(file).catch(() => file)),
    );

    const imagesBase64 = await Promise.all(
      enhancedFiles.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = String(reader.result);
              resolve(dataUrl.substring(dataUrl.indexOf(',') + 1));
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          }),
      ),
    );

    const prompt = `Analizá esta${
      imagesBase64.length > 1 ? 's páginas' : ' imagen'
    } de un documento médico de la persona que usa esta app (es su propio
documento, no el de un tercero). Puede tener letra manuscrita difícil de
leer, mala iluminación o estar en ángulo.

PASO 1 (obligatorio, mental, no lo muestres aparte): recorré la imagen de
arriba hacia abajo y leé literalmente cada línea de texto que puedas
distinguir: encabezados, fecha, cada medicamento recetado con su dosis y
frecuencia, o cada parámetro de laboratorio con su valor numérico y unidad,
firma, etc. Basate únicamente en esa lectura línea por línea para completar
el JSON de abajo.

PROHIBIDO:
- Frases sobre a quién pertenece el documento ("el informe pertenece a...",
  "el paciente es...", "no se indica el nombre del paciente"). Es obvio que
  es el documento de la persona; no lo menciones, andá directo a los datos.
- Resúmenes genéricos o vagos tipo "es difícil de leer", "los valores están
  dentro del rango normal para la mayoría de los parámetros" o "se
  realizaron varios análisis". Si hay valores numéricos en la imagen (de
  laboratorio, signos vitales, dosis), el resumen tiene que nombrarlos uno
  por uno con su cifra exacta, no calificarlos en general.
- Omitir un valor solo porque hay muchos: listalos todos en "campos", cada
  parámetro con su propia entrada.

Si podés distinguir aunque sea una palabra o un número, usalo. Solo marcá
"(ilegible)" en un campo puntual cuando de verdad no se distingue ningún
carácter ahí, nunca para el documento completo.

No inventes datos que no estén en la imagen. Respondé exclusivamente con
JSON válido, siempre:
{
  "titulo": "nombre breve del documento",
  "tipo": "Análisis|Imagenología|Especialista|Receta|Otro",
  "institucion": "nombre de la institución o médico, texto visible o No informada",
  "resumen": "hechos concretos con cifras exactas: cada medicamento con dosis/frecuencia si es receta, o cada parámetro de laboratorio con su valor y unidad si es un análisis",
  "evidencia_textual": "transcripción línea por línea de todo el texto legible, en el mismo orden que aparece",
  "campos": [{"nombre":"campo","valor":"valor","unidad":"unidad opcional"}],
  "necesita_confirmacion": ["datos borrosos, dudosos o manuscritos a revisar"]
}`;

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt,
        images: imagesBase64,
        format: 'json',
        stream: false,
        think: true,
        keep_alive: '1h',
        options: { temperature: 0.05, num_predict: 1100, top_k: 10 },
      }),
    });
    if (!response.ok) throw new Error(`Gemma no pudo analizar la imagen (${response.status}).`);
    const payload = (await response.json()) as { response?: string };
    const raw = payload.response?.trim();
    if (!raw) throw new Error('Gemma devolvió una extracción vacía.');
    const parsed = JSON.parse(raw) as {
      titulo?: string;
      tipo?: string;
      institucion?: string;
      resumen?: string;
      evidencia_textual?: string;
      campos?: { nombre?: string; valor?: string; unidad?: string }[];
      necesita_confirmacion?: string[];
    };
    const allowed = ['Análisis', 'Imagenología', 'Especialista', 'Receta', 'Otro'];
    const category = allowed.includes(parsed.tipo || '')
      ? (parsed.tipo as MedicalDocument['category'])
      : ((inputCategory as MedicalDocument['category']) || 'Otro');
    return {
      title: parsed.titulo || inputName || 'Documento médico',
      category,
      institution: parsed.institucion || 'No informada',
      summary: parsed.resumen || 'Necesita revisión manual.',
      extractedText: parsed.evidencia_textual || 'Sin evidencia textual extraída.',
      fields: (parsed.campos || [])
        .filter((field) => field.nombre && field.valor)
        .map((field) => ({
          label: field.nombre!,
          value: field.valor!,
          unit: field.unidad || undefined,
        })),
      tags: [category, ...(parsed.necesita_confirmacion || []).map((item) => `Revisar: ${item}`)],
      synthetic: false,
      confirmed: false,
    };
  }

  override async queryHistory(
    prompt: string,
    documents: MedicalDocument[],
  ): Promise<{ answer: string; referencedDocIds: string[]; latencyMs: number }> {
    const startTime = performance.now();
    const context = buildDocumentContext(documents.filter((document) => document.confirmed !== false));
    const fullPrompt = `${CHAT_SYSTEM_PROMPT}

CONTEXTO DE DOCUMENTOS CONFIRMADOS:
${JSON.stringify(context, null, 2)}

PREGUNTA DE LA PERSONA:
${prompt}

RESPUESTA:`;

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt: fullPrompt,
        stream: false,
        think: false,
        keep_alive: '1h',
        options: {
          temperature: 0.15,
          num_predict: 420,
          top_k: 20,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama respondió con código ${response.status}`);
    }

    const payload = (await response.json()) as { response?: string };
    const answer = payload.response?.trim();
    if (!answer) throw new Error('Gemma devolvió una respuesta vacía');

    const validIds = new Set(documents.map((document) => document.id));
    const referencedDocIds = Array.from(answer.matchAll(/\[(D\d+)\]/g))
      .map((match) => match[1])
      .filter((id, index, values) => validIds.has(id) && values.indexOf(id) === index);

    return {
      answer,
      referencedDocIds,
      latencyMs: Math.round(performance.now() - startTime),
    };
  }
}

export const defaultLocalEngine = new FakeLocalInferenceEngine();
