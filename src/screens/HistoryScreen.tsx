import { useState } from 'react';
import { FilePlus2, FolderOpen, Search, ShieldCheck } from 'lucide-react';
import { MedicalDocument } from '../types';
import { DocumentCard } from '../components/DocumentCard';

interface HistoryScreenProps {
  documents: MedicalDocument[];
  onSelectDocument: (document: MedicalDocument) => void;
  onNavigateToAdd: () => void;
}

export const HistoryScreen = ({
  documents,
  onSelectDocument,
  onNavigateToAdd,
}: HistoryScreenProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const categories = ['Todos', 'Análisis', 'Imagenología', 'Especialista', 'Receta'];
  const query = searchQuery.trim().toLowerCase();

  const filteredDocuments = documents.filter((document) => {
    const matchesText =
      !query ||
      [
        document.id,
        document.title,
        document.summary,
        document.institution,
        ...document.tags,
      ].some((value) => value.toLowerCase().includes(query));
    return matchesText && (selectedCategory === 'Todos' || document.category === selectedCategory);
  });

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 pb-28 pt-5">
      <section>
        <div className="mb-1 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-[#087F73]">Mi historia</p>
            <h2 className="text-3xl font-black tracking-tight text-[#17243A]">Tus documentos</h2>
          </div>
          <button
            onClick={onNavigateToAdd}
            className="flex min-h-12 items-center gap-2 rounded-xl bg-[#087F73] px-4 text-base font-bold text-white shadow-sm hover:bg-[#076A61]"
          >
            <FilePlus2 className="h-5 w-5" />
            Agregar
          </button>
        </div>
        <p className="mt-2 text-base leading-relaxed text-[#536273]">
          Ordenados del más reciente al más antiguo.
        </p>
      </section>

      <div className="flex items-start gap-3 rounded-2xl border border-[#F1CD82] bg-[#FFF7E4] p-4 text-[#664A12]">
        <span className="mt-0.5 rounded-md bg-[#F2B544] px-2 py-1 text-xs font-black text-[#3D2A05]">
          DEMO
        </span>
        <p className="text-sm font-semibold leading-relaxed">
          Todos los datos que ves son sintéticos y se usan solo para demostrar la aplicación.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-[#B9D9D4] bg-[#E7F5F2] p-4">
        <ShieldCheck className="h-7 w-7 shrink-0 text-[#087F73]" />
        <div>
          <p className="text-base font-extrabold text-[#174A45]">Tus datos quedan en el teléfono</p>
          <p className="mt-0.5 text-sm text-[#40625F]">La aplicación está pensada para funcionar sin nube.</p>
        </div>
      </div>

      <div className="space-y-3">
        <label className="relative block">
          <span className="sr-only">Buscar en mis documentos</span>
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#617080]" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar medicamento, estudio o fecha"
            className="min-h-14 w-full rounded-2xl border-2 border-[#C8D5D2] bg-white pl-12 pr-4 text-base text-[#17243A] outline-none placeholder:text-[#6D7986] focus:border-[#087F73]"
          />
        </label>

        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filtrar por tipo">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`min-h-11 whitespace-nowrap rounded-full border px-4 text-sm font-bold ${
                selectedCategory === category
                  ? 'border-[#087F73] bg-[#087F73] text-white'
                  : 'border-[#C8D5D2] bg-white text-[#445365]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-extrabold text-[#17243A]">Más recientes</h3>
        <span className="text-sm font-bold text-[#5B6877]">
          {filteredDocuments.length} {filteredDocuments.length === 1 ? 'documento' : 'documentos'}
        </span>
      </div>

      {filteredDocuments.length ? (
        <div className="space-y-3">
          {filteredDocuments.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              onClick={onSelectDocument}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#D4DEDB] bg-white p-8 text-center">
          <FolderOpen className="mx-auto h-12 w-12 text-[#7E8B98]" />
          <h3 className="mt-3 text-xl font-extrabold text-[#17243A]">No encontramos resultados</h3>
          <p className="mt-2 text-base text-[#536273]">Probá con otra palabra o quitá el filtro.</p>
        </div>
      )}
    </div>
  );
};
