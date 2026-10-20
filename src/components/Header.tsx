import React from 'react';
import { Smartphone, Server, Cpu, BookOpen, Plus } from 'lucide-react';

interface HeaderProps {
  activeTab: 'fleet' | 'diagnostics' | 'nodes' | 'docs';
  onSelectTab: (tab: 'fleet' | 'diagnostics' | 'nodes' | 'docs') => void;
  onOpenCreateModal: () => void;
  deviceCount: number;
  runningCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenCreateModal,
  deviceCount,
  runningCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#070b14]/90 backdrop-blur-md border-b border-[#1e293b] px-4 lg:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#2f8bff]/30 flex items-center justify-center shadow-inner">
            <Smartphone className="w-5 h-5 text-[#2f8bff]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center text-lg font-bold tracking-tight">
              <span className="text-white">Moon</span>
              <span className="text-[#2f8bff] ml-1">Studio</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-[#1e293b] text-slate-300 border border-[#334155]">
                Cloud Android
              </span>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Single line, anti-pill, clean typography) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => onSelectTab('fleet')}
            className={`flex items-center gap-2 pb-0.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'fleet'
                ? 'text-[#2f8bff] font-semibold border-b-2 border-[#2f8bff]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Thiết bị ({runningCount}/{deviceCount})</span>
          </button>

          <button
            onClick={() => onSelectTab('diagnostics')}
            className={`flex items-center gap-2 pb-0.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'diagnostics'
                ? 'text-[#2f8bff] font-semibold border-b-2 border-[#2f8bff]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Hạ tầng & KVM</span>
          </button>

          <button
            onClick={() => onSelectTab('nodes')}
            className={`flex items-center gap-2 pb-0.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'nodes'
                ? 'text-[#2f8bff] font-semibold border-b-2 border-[#2f8bff]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Cụm máy chủ (Nodes)</span>
          </button>

          <button
            onClick={() => onSelectTab('docs')}
            className={`flex items-center gap-2 pb-0.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'docs'
                ? 'text-[#2f8bff] font-semibold border-b-2 border-[#2f8bff]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Hướng dẫn KVM & Bare-Metal</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2f8bff] hover:bg-[#2575db] active:bg-[#1d63c2] rounded-lg transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo máy ảo mới</span>
          </button>
        </div>
      </div>
    </header>
  );
};
