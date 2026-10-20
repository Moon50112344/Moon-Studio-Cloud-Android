/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DeviceViewer } from './components/DeviceViewer';
import { HostDiagnosticsPanel } from './components/HostDiagnosticsPanel';
import { DeploymentDocs } from './components/DeploymentDocs';
import { api } from './services/api';
import { HostDiagnostics } from './types';
import { Smartphone, Cpu, BookOpen } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'emulator' | 'diagnostics' | 'docs'>('emulator');
  const [diagnostics, setDiagnostics] = useState<HostDiagnostics | null>(null);
  const [isRefreshingDiag, setIsRefreshingDiag] = useState(false);

  const handleRefreshDiagnostics = async () => {
    setIsRefreshingDiag(true);
    try {
      const diag = await api.getHostDiagnostics();
      setDiagnostics(diag);
    } catch (err) {
      console.error('Failed to refresh diagnostics:', err);
    } finally {
      setIsRefreshingDiag(false);
    }
  };

  React.useEffect(() => {
    handleRefreshDiagnostics();
  }, []);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      {/* Top Header - Strict 3-zone contract */}
      <header className="sticky top-0 z-40 bg-[#070b14]/90 backdrop-blur-md border-b border-[#1e293b] px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-[#0f172a] border border-[#2f8bff]/30 flex items-center justify-center shadow-inner">
              <Smartphone className="w-5 h-5 text-[#2f8bff]" />
            </div>
            <div className="flex items-center text-lg font-bold tracking-tight">
              <span className="text-white">Moon</span>
              <span className="text-[#2f8bff] ml-1">Studio</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-[#1e293b] text-slate-300 border border-[#334155]">
                Real Cloud Android
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => setActiveTab('emulator')}
              className={`flex items-center gap-2 pb-0.5 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'emulator'
                  ? 'text-[#2f8bff] font-semibold border-b-2 border-[#2f8bff]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Máy ảo Android thật (Live VM)</span>
            </button>

            <button
              onClick={() => setActiveTab('diagnostics')}
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
              onClick={() => setActiveTab('docs')}
              className={`flex items-center gap-2 pb-0.5 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'docs'
                  ? 'text-[#2f8bff] font-semibold border-b-2 border-[#2f8bff]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Tài liệu KVM Bare-Metal</span>
            </button>
          </nav>

          {/* Zone 3: Direct status indicator */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-slate-300 hidden sm:inline">QEMU x86_64 Active</span>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {activeTab === 'emulator' && <DeviceViewer />}
        {activeTab === 'diagnostics' && (
          <HostDiagnosticsPanel
            diagnostics={diagnostics}
            onRefresh={handleRefreshDiagnostics}
            isLoading={isRefreshingDiag}
          />
        )}
        {activeTab === 'docs' && <DeploymentDocs />}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1e293b] py-5 px-4 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Moon Studio Cloud Android</span>
            <span aria-hidden="true">·</span>
            <span>Hệ máy ảo QEMU x86_64 / Redroid Live</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 font-mono">
            <span>VNC: 5900</span>
            <span aria-hidden="true">·</span>
            <span>WS: 6080</span>
            <span aria-hidden="true">·</span>
            <span>ADB: 5555</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
