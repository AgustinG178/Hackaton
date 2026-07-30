import { ChangeEvent, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  Check,
  ChevronLeft,
  LoaderCircle,
  Upload,
} from 'lucide-react';
import { LocalInferenceEngine } from '../services/LocalInferenceEngine';
import { MedicalDocument } from '../types';

interface AddDocumentScreenProps {
  engine: LocalInferenceEngine;
  onDocumentAdded: (document: MedicalDocument) => void;
  nextDocNumber: number;
}

export const AddDocumentScreen = ({
  engine,
  onDocumentAdded,
  nextDocNumber,
}: AddDocumentScreenProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MedicalDocument['category']>('Otro');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractedDocument, setExtractedDocument] = useState<MedicalDocument | null>(null);

  useEffect(() => {
    if (!selectedFile?.type.startsWith('image/')) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setTitle(file.name.replace(/\.[^/.]+$/, ''));
  };

  const analyze = async () => {
    setIsExtracting(true);
    setExtractionError(null);
    try {
      const result = await engine.extractDocument(title || 'Documento médico', category, selectedFile || undefined);
      const now = new Date();
      setExtractedDocument({
        ...result,
        id: `D${nextDocNumber}`,
        date: now.toLocaleDateString('es-AR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        isoDate: now.toISOString().slice(0, 10),
        title: title || result.title,
      });
    } catch (error) {
      setExtractionError(
        error instanceof Error ? error.message : 'No se pudo analizar el documento. Volvé a intentarlo.',
      );
    } finally {
      setIsExtracting(false);
    }
  };

  if (extractedDocument) {
    return (
      <div className="mx-auto max-w-lg space-y-5 px-4 pb-28 pt-5">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-[#087F73]">Paso 2 de 2</p>
          <h2 className="text-3xl font-black text-[#17243A]">Revisá antes de guardar</h2>
          <p className="mt-2 text-base leading-relaxed text-[#536273]">
            Corregí cualquier dato que no coincida con el documento.
          </p>
        </div>

        <div className="rounded-2xl border border-[#B9D9D4] bg-[#E7F5F2] p-4 text-base font-semibold text-[#174A45]">
          Gemma leyó esta foto localmente. Compará los datos con el documento antes de guardarlos.
        </div>

        <section className="space-y-4 rounded-2xl border border-[#D4DEDB] bg-white p-5 shadow-sm">
          <label className="block">
            <span className="mb-1.5 block text-sm font-extrabold text-[#334359]">Nombre del documento</span>
            <input
              value={extractedDocument.title}
              onChange={(event) =>
                setExtractedDocument({ ...extractedDocument, title: event.target.value })
              }
              className="min-h-13 w-full rounded-xl border-2 border-[#C8D5D2] px-3 text-base outline-none focus:border-[#087F73]"
            />
          </label>

          <div>
            <p className="mb-2 text-sm font-extrabold text-[#334359]">Datos encontrados</p>
            <div className="space-y-2">
              {extractedDocument.fields.map((field, index) => (
                <div key={`${field.label}-${index}`} className="rounded-xl bg-[#F1F5F4] p-3">
                  <p className="text-sm font-bold text-[#617080]">{field.label}</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <input
                      value={field.value}
                      onChange={(event) => {
                        const fields = [...extractedDocument.fields];
                        fields[index] = { ...field, value: event.target.value };
                        setExtractedDocument({ ...extractedDocument, fields });
                      }}
                      className="min-h-11 w-full rounded-lg border-2 border-transparent bg-transparent px-2 -mx-2 text-base font-extrabold text-[#17243A] outline-none focus:border-[#087F73] focus:bg-white"
                    />
                    {field.unit && (
                      <span className="shrink-0 text-base font-extrabold text-[#17243A]">{field.unit}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-extrabold text-[#334359]">Resumen</p>
            <textarea
              rows={4}
              value={extractedDocument.summary}
              onChange={(event) =>
                setExtractedDocument({ ...extractedDocument, summary: event.target.value })
              }
              className="w-full rounded-xl border-2 border-[#C8D5D2] p-3 text-base leading-relaxed outline-none focus:border-[#087F73]"
            />
          </div>
        </section>

        <div className="grid grid-cols-[auto_1fr] gap-3">
          <button
            onClick={() => setExtractedDocument(null)}
            className="flex min-h-14 items-center gap-2 rounded-2xl border-2 border-[#B8C6C3] bg-white px-4 text-base font-bold text-[#445365]"
          >
            <ChevronLeft className="h-5 w-5" />
            Volver
          </button>
          <button
            onClick={() => onDocumentAdded({ ...extractedDocument, confirmed: true })}
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#087F73] px-4 text-base font-extrabold text-white"
          >
            <Check className="h-6 w-6" />
            Confirmar y guardar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 pb-28 pt-5">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-[#087F73]">Paso 1 de 2</p>
        <h2 className="text-3xl font-black text-[#17243A]">Agregar documento</h2>
        <p className="mt-2 text-base leading-relaxed text-[#536273]">
          Sacá una foto clara o elegí una imagen de tu teléfono.
        </p>
      </div>

      <section className="rounded-2xl border-2 border-dashed border-[#8DBBB5] bg-white p-5 text-center">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Vista previa del documento"
            className="mx-auto mb-4 max-h-52 rounded-xl border border-[#D4DEDB] object-contain"
          />
        ) : (
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E0F2EF] text-[#087F73]">
            <Camera className="h-8 w-8" />
          </div>
        )}
        <h3 className="text-xl font-extrabold text-[#17243A]">
          {selectedFile ? selectedFile.name : 'Elegí una foto del documento'}
        </h3>
        <p className="mt-2 text-base text-[#536273]">Usá buena luz y evitá cortar los bordes.</p>
        <label className="mt-4 inline-flex min-h-14 cursor-pointer items-center gap-2 rounded-2xl bg-[#087F73] px-5 text-base font-extrabold text-white">
          <Upload className="h-5 w-5" />
          Seleccionar imagen
          <input type="file" accept="image/*" capture="environment" onChange={selectFile} className="hidden" />
        </label>
      </section>

      {extractionError && (
        <div className="flex gap-3 rounded-2xl border border-[#F1CD82] bg-[#FFF7E4] p-4 text-[#664A12]">
          <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0" />
          <p className="text-base font-semibold leading-relaxed">{extractionError}</p>
        </div>
      )}

      {selectedFile && (
        <section className="space-y-4 rounded-2xl border border-[#D4DEDB] bg-white p-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-extrabold text-[#334359]">Nombre</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="min-h-13 w-full rounded-xl border-2 border-[#C8D5D2] px-3 text-base outline-none focus:border-[#087F73]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-extrabold text-[#334359]">Tipo de documento</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as MedicalDocument['category'])}
              className="min-h-13 w-full rounded-xl border-2 border-[#C8D5D2] bg-white px-3 text-base outline-none focus:border-[#087F73]"
            >
              <option value="Análisis">Análisis</option>
              <option value="Imagenología">Imagenología</option>
              <option value="Especialista">Especialista</option>
              <option value="Receta">Receta</option>
              <option value="Otro">Otro</option>
            </select>
          </label>
        </section>
      )}

      <button
        disabled={!selectedFile || isExtracting}
        onClick={analyze}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#087F73] px-5 text-lg font-extrabold text-white disabled:bg-[#A8B5B2]"
      >
        {isExtracting ? (
          <>
            <LoaderCircle className="h-6 w-6 animate-spin" />
            Analizando…
          </>
        ) : (
          'Analizar en el dispositivo'
        )}
      </button>
    </div>
  );
};
