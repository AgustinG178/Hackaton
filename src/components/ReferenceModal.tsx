import { CalendarDays, ExternalLink, X } from 'lucide-react';
import { MedicalDocument } from '../types';

interface ReferenceModalProps {
  document: MedicalDocument | null;
  onClose: () => void;
  onOpenFullDoc: (document: MedicalDocument) => void;
}

export const ReferenceModal = ({
  document,
  onClose,
  onOpenFullDoc,
}: ReferenceModalProps) => {
  if (!document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17243A]/55 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex rounded-lg bg-[#087F73] px-2.5 py-1 font-mono text-sm font-black text-white">
              {document.id}
            </span>
            <h3 className="mt-2 text-xl font-black leading-tight text-[#17243A]">{document.title}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EDF1F0] text-[#445365]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 flex items-center gap-2 text-sm font-bold text-[#617080]">
          <CalendarDays className="h-4 w-4" />
          {document.date}
        </p>
        <p className="mt-4 rounded-2xl bg-[#F1F5F4] p-4 text-base leading-relaxed text-[#334359]">
          {document.summary}
        </p>

        <button
          onClick={() => {
            onOpenFullDoc(document);
            onClose();
          }}
          className="mt-4 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#087F73] px-4 text-base font-extrabold text-white"
        >
          Abrir documento
          <ExternalLink className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
