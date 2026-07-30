import { ChangeEvent, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  Check,
  ChevronLeft,
  FileImage,
  LoaderCircle,
  Upload,
} from 'lucide-react';
import { SAMPLE_NEW_DOCUMENTS } from '../data/initialData';
import { LocalInferenceEngine } from '../services/LocalInferenceEngine';
import { pdfFileToImages } from '../services/pdfToImages';
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
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [pdfPageFiles, setPdfPageFiles] = useState<File[]>([]);
  const [isConvertingPdf, setIsConvertingPdf] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<(typeof SAMPLE_NEW_DOCUMENTS)[number] | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MedicalDocument['category']>('Otro');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedDocument, setExtractedDocument] = useState<MedicalDocument | null>(null);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedPreset(null);
    setTitle(file.name.replace(/\.[^/.]+$/, ''));

    if (file.type === 'application/pdf') {
      setIsConvertingPdf(true);
      try {
        const pages = await pdfFileToImages(file);
        setSelectedFile(pages[0]?.file ?? file);
        setPreviewUrls(pages.map((page) => page.dataUrl));
        setPdfPageFiles(pages.map((page) => page.file));
      } finally {
        setIsConvertingPdf(false);
      }
    } else {
      setSelectedFile(file);
      setPdfPageFiles([]);
      setPreviewUrls([URL.createObjectURL(file)]);
    }
  };

  const selectPreset = (preset: (typeof SAMPLE_NEW_DOCUMENTS)[number]) => {
    setSelectedPreset(preset);
    setSelectedFile(null);
    setPdfPageFiles([]);
    setPreviewUrls([]);
    setTitle(preset.title);
    setCategory(preset.category);
  };

  const analyze = async () => {
    setIsExtracting(true);
    try {
      const filesForGemma = pdfPageFiles.length > 0 ? pdfPageFiles : selectedFile ? [selectedFile] : [];
      const result = selectedPreset
        ? { ...selectedPreset, synthetic: true, confirmed: false }
        : await engine.extractDocument(title || 'Documento médico', category, filesForGemma);
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
        imagePreviewUrls: selectedPreset ? undefined : previewUrls,
      });
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

        {extractedDocument.synthetic ? (
          <div className="flex gap-3 rounded-2xl border border-[#F1CD82] bg-[#FFF7E4] p-4 text-[#664A12]">
            <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0" />
            <p className="text-base font-semibold leading-relaxed">
              Extracción sintética: Gemma local no está conectado. No guardes estos datos como reales.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#B9D9D4] bg-[#E7F5F2] p-4 text-base font-semibold text-[#174A45]">
            Gemma leyó esta foto localmente. Compará los datos con el documento antes de guardarlos.
          </div>
        )}

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
                  <p className="mt-0.5 text-base font-extrabold text-[#17243A]">
                    {field.value} {field.unit || ''}
                  </p>
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
        {isConvertingPdf ? (
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E0F2EF] text-[#087F73]">
            <LoaderCircle className="h-8 w-8 animate-spin" />
          </div>
        ) : previewUrls.length > 0 ? (
          <div className="mx-auto mb-4 flex max-h-52 gap-2 overflow-x-auto">
            {previewUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Página ${index + 1} del documento`}
                className="h-52 shrink-0 rounded-xl border border-[#D4DEDB] object-contain"
              />
            ))}
          </div>
        ) : (
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E0F2EF] text-[#087F73]">
            <Camera className="h-8 w-8" />
          </div>
        )}
        <h3 className="text-xl font-extrabold text-[#17243A]">
          {isConvertingPdf
            ? 'Convirtiendo PDF…'
            : selectedFile
              ? selectedFile.name
              : 'Elegí una foto o un PDF del documento'}
        </h3>
        <p className="mt-2 text-base text-[#536273]">
          Usá buena luz y evitá cortar los bordes. También podés subir un PDF escaneado.
        </p>
        <label className="mt-4 inline-flex min-h-14 cursor-pointer items-center gap-2 rounded-2xl bg-[#087F73] px-5 text-base font-extrabold text-white">
          <Upload className="h-5 w-5" />
          Seleccionar imagen o PDF
          <input type="file" accept="image/*,application/pdf" onChange={selectFile} className="hidden" />
        </label>
      </section>

      <div>
        <p className="mb-2 text-sm font-extrabold text-[#526171]">O usá un documento sintético</p>
        <div className="space-y-2">
          {SAMPLE_NEW_DOCUMENTS.map((preset) => (
            <button
              key={preset.title}
              onClick={() => selectPreset(preset)}
              className={`flex min-h-14 w-full items-center gap-3 rounded-xl border-2 p-3 text-left ${
                selectedPreset?.title === preset.title
                  ? 'border-[#087F73] bg-[#E7F5F2]'
                  : 'border-[#D4DEDB] bg-white'
              }`}
            >
              <FileImage className="h-6 w-6 shrink-0 text-[#087F73]" />
              <span>
                <span className="block text-base font-extrabold text-[#26364B]">{preset.title}</span>
                <span className="block text-sm text-[#5D6A78]">{preset.category}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {(selectedFile || selectedPreset) && (
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
        disabled={(!selectedFile && !selectedPreset) || isExtracting || isConvertingPdf}
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
