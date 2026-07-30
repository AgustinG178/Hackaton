import { useRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onOpenDeveloperSetup: () => void;
  engineMode: 'fake' | 'gemma-local';
}

export const Header = ({ onOpenDeveloperSetup, engineMode }: HeaderProps) => {
  const [isPressing, setIsPressing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startPress = () => {
    setIsPressing(true);
    timerRef.current = setTimeout(onOpenDeveloperSetup, 5000);
  };

  const cancelPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsPressing(false);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#D8E2DF] bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onMouseDown={startPress}
            onMouseUp={cancelPress}
            onMouseLeave={cancelPress}
            onTouchStart={startPress}
            onTouchEnd={cancelPress}
            aria-label="Historia Clara"
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#087F73] text-lg font-black text-white shadow-sm transition-transform ${
              isPressing ? 'scale-95' : ''
            }`}
          >
            HC
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold tracking-tight text-[#17243A]">
              Historia Clara
            </h1>
            <p className="text-sm font-medium text-[#536273]">Tus documentos, fáciles de entender</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#B9D9D4] bg-[#E7F5F2] px-3 py-2 text-sm font-bold text-[#08665D]">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          <span className="hidden min-[390px]:inline">
            {engineMode === 'gemma-local' ? 'Gemma local' : 'Privado'}
          </span>
        </div>
      </div>
    </header>
  );
};
