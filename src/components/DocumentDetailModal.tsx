import { useState } from 'react';
import { Building2, CalendarDays, CheckCircle2, MessageCircle, X } from 'lucide-react';
import { MedicalDocument } from '../types';

interface DocumentDetailModalProps {
  document: MedicalDocument | null;
  onClose: () => void;
  onAskAboutDocument: (document: MedicalDocument) => void;
}

export const DocumentDetailModal = ({
  document,
  onClose,
  onAskAboutDocument,
}: DocumentDetailModalProps) => {
  const [showOriginal, setShowOriginal] = useState(false);
  if (!document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#17243A]/55 sm:items-center sm:p-4">
      <div className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-[#F5F8F7] shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3 border-b border-[#D4DEDB] bg-white p-5">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-lg bg-[#087F73] px-2.5 py-1 font-mono text-sm font-black text-white">
                {document.id}
              </span>
              <span className="text-sm font-extrabold text-[#087F73]">{document.category}</span>
            </div>
            <h2 className="text-2xl font-black leading-tight text-[#17243A]">{document.title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EDF1F0] text-[#3F4E60]"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto p-5">
          <div className="grid gap-3 rounded-2xl border border-[#D4DEDB] bg-white p-4">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 shrink-0 text-[#087F73]" />
              <div>
                <p className="text-sm font-bold text-[#657280]">Fecha</p>
                <p className="text-base font-extrabold text-[#26364B]">{document.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 shrink-0 text-[#087F73]" />
              <div>
                <p className="text-sm font-bold text-[#657280]">Institución</p>
                <p className="text-base font-extrabold text-[#26364B]">{document.institution}</p>
              </div>
            </div>
          </div>

          <section>
            <h3 className="mb-2 text-lg font-black text-[#17243A]">Resumen</h3>
            <p className="rounded-2xl border border-[#D4DEDB] bg-white p-4 text-base leading-relaxed text-[#334359]">
              {document.summary}
            </p>
          </section>

          <section>
            <h3 className="mb-2 text-lg font-black text-[#17243A]">Datos encontrados</h3>
            <div className="space-y-2">
              {document.fields.map((field, index) => (
                <div
                  key={`${field.label}-${index}`}
                  className="flex items-start justify-between gap-4 rounded-xl border border-[#D4DEDB] bg-white p-4"
                >
                  <span className="text-base font-semibold text-[#536273]">{field.label}</span>
                  <span className="text-right text-base font-black text-[#17243A]">
                    {field.value} {field.unit || ''}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <button
            onClick={() => setShowOriginal((current) => !current)}
            className="min-h-12 w-full rounded-xl border-2 border-[#AAC7C3] bg-white px-4 text-base font-bold text-[#285D57]"
          >
            {showOriginal ? 'Ocultar texto original' : 'Ver texto original'}
          </button>
          {showOriginal && (
            <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-2xl bg-[#E9EFED] p-4 text-sm leading-relaxed text-[#334359]">
              {document.extractedText}
            </pre>
          )}

          <div className="flex items-center gap-2 rounded-xl bg-[#E7F5F2] p-3 text-sm font-bold text-[#28615B]">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            Confirmado por la persona antes de guardar
          </div>
        </div>

        <div className="border-t border-[#D4DEDB] bg-white p-4">
          <button
            onClick={() => {
              onAskAboutDocument(document);
              onClose();
            }}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#087F73] px-4 text-base font-extrabold text-white"
          >
            <MessageCircle className="h-6 w-6" />
            Preguntar sobre este documento
          </button>
        </div>
      </div>
    </div>
  );
};
