import { CalendarDays, ChevronRight, CircleCheck, FileText } from 'lucide-react';
import { MedicalDocument } from '../types';

interface DocumentCardProps {
  document: MedicalDocument;
  onClick: (document: MedicalDocument) => void;
}

const badgeClass: Record<MedicalDocument['category'], string> = {
  Análisis: 'border-[#B7CDEB] bg-[#EDF4FC] text-[#285987]',
  Imagenología: 'border-[#D5C6EA] bg-[#F5F0FB] text-[#684592]',
  Especialista: 'border-[#E8CEA7] bg-[#FFF6E8] text-[#80561D]',
  Receta: 'border-[#AED8C7] bg-[#EAF7F1] text-[#27674F]',
  Otro: 'border-[#CBD4DA] bg-[#F1F4F6] text-[#526171]',
};

export const DocumentCard = ({ document, onClick }: DocumentCardProps) => (
  <button
    onClick={() => onClick(document)}
    className="w-full rounded-2xl border border-[#D4DEDB] bg-white p-4 text-left shadow-[0_2px_10px_rgba(23,36,58,0.05)] transition hover:border-[#87BDB6] hover:shadow-md active:scale-[0.99]"
  >
    <div className="flex items-start gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E7F5F2] text-[#087F73]">
        <FileText className="h-6 w-6" />
      </div>
      <div className="min-w-0 grow">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-xs font-extrabold ${badgeClass[document.category]}`}>
            {document.category}
          </span>
          <span className="flex items-center gap-1 text-sm font-semibold text-[#617080]">
            <CalendarDays className="h-4 w-4" />
            {document.date}
          </span>
        </div>
        <h4 className="mt-2 text-lg font-extrabold leading-snug text-[#17243A]">{document.title}</h4>
        <p className="mt-2 line-clamp-2 text-base leading-relaxed text-[#445365]">{document.summary}</p>
        <div className="mt-3 flex items-center gap-2 text-sm font-bold text-[#39736C]">
          <CircleCheck className="h-4 w-4" />
          Información confirmada
        </div>
      </div>
      <ChevronRight className="mt-3 h-6 w-6 shrink-0 text-[#6D7A87]" />
    </div>
  </button>
);
