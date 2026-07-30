import { Clock3, FilePlus2, MessageCircle } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  documentCount: number;
}

export const BottomNav = ({ activeTab, onSelectTab, documentCount }: BottomNavProps) => {
  const tabs = [
    { id: 'history' as const, label: 'Mi historia', icon: Clock3, badge: documentCount },
    { id: 'add' as const, label: 'Agregar', icon: FilePlus2 },
    { id: 'chat' as const, label: 'Preguntar', icon: MessageCircle },
  ];

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[#CCD9D6] bg-white px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-6px_24px_rgba(23,36,58,0.08)]"
    >
      <div className="mx-auto flex max-w-lg justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              aria-current={active ? 'page' : undefined}
              className={`relative flex min-h-14 min-w-[96px] flex-col items-center justify-center rounded-2xl px-3 py-1 text-sm font-bold transition-colors ${
                active
                  ? 'bg-[#E0F2EF] text-[#086E64]'
                  : 'text-[#526171] hover:bg-[#F0F4F3]'
              }`}
            >
              <Icon className="mb-0.5 h-6 w-6" strokeWidth={active ? 2.6 : 2} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="absolute right-4 top-1 rounded-full bg-[#087F73] px-1.5 text-xs text-white">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
