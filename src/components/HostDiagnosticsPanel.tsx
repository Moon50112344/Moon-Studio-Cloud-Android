import React from 'react';
import { HostDiagnostics } from '../types';
import {
  Cpu,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  Server,
  Layers,
  HardDrive,
  Info,
  ShieldCheck,
} from 'lucide-react';

interface HostDiagnosticsPanelProps {
  diagnostics: HostDiagnostics | null;
  onRefresh: () => void;
  isLoading: boolean;
}

export const HostDiagnosticsPanel: React.FC<HostDiagnosticsPanelProps> = ({
  diagnostics,
  onRefresh,
  isLoading,
}) => {
  if (!diagnostics) {
    return (
      <div className="p-8 text-center bg-[#0f172a] rounded-xl border border-[#1e293b]">
        <RotateCw className="w-8 h-8 text-[#2f8bff] animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-400">Đang kiểm tra phần cứng máy chủ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-[#0f172a] rounded-xl border border-[#1e293b] p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#1e293b]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#070b14] border border-[#2f8bff]/30 flex items-center justify-center">
              <Cpu className="w-6 h-6 text-[#2f8bff]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Chẩn đoán Hạ tầng & Ảo hóa Phần cứng</h2>
              <p className="text-xs text-slate-400">
                Kiểm tra trực tiếp module nhân Linux KVM, Binderfs IPC và tài nguyên hệ thống.
              </p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-[#1e293b] hover:bg-[#334155] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Kiểm tra lại phần cứng</span>
          </button>
        </div>

        {/* Diagnostic Status Banner */}
        <div className="mt-5 p-4 rounded-xl bg-[#070b14] border border-[#1e293b] flex items-start gap-3.5">
          <Info className="w-5 h-5 text-[#2f8bff] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white">Báo cáo tình trạng tương thích máy chủ</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{diagnostics.diagnosticsSummary}</p>
            <div className="pt-2 flex items-center gap-2 text-xs">
              <span className="text-slate-400">Chế độ vận hành khuyến nghị:</span>
              <span className="font-mono font-semibold px-2 py-0.5 rounded bg-[#1e293b] text-[#2f8bff] border border-[#334155]">
                {diagnostics.recommendedMode.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Hardware Capability Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {/* 1. KVM Hardware Acceleration */}
          <div className="p-4 rounded-xl bg-[#070b14] border border-[#1e293b] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">KVM (/dev/kvm)</span>
              {diagnostics.kvmPathExists && diagnostics.kvmAccessible ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div className="text-sm font-bold font-mono text-white">
              {diagnostics.kvmPathExists && diagnostics.kvmAccessible ? 'Sẵn sàng (Hardware Passthrough)' : 'Chưa bật KVM'}
            </div>
            <p className="text-[11px] text-slate-500">
              {diagnostics.kvmPathExists
                ? 'QEMU & Redroid có thể tăng tốc phần cứng trực tiếp.'
                : 'Cần bật Intel VT-x / AMD-V hoặc nested virtualization.'}
            </p>
          </div>

          {/* 2. Binderfs Android IPC */}
          <div className="p-4 rounded-xl bg-[#070b14] border border-[#1e293b] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Android Binderfs</span>
              {diagnostics.hasBinder ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div className="text-sm font-bold font-mono text-white">
              {diagnostics.hasBinder ? 'Đã nạp (/dev/binderfs)' : 'Chưa có driver'}
            </div>
            <p className="text-[11px] text-slate-500">Giao thức IPC nội bộ của hệ điều hành Android.</p>
          </div>

          {/* 3. Host Memory Capacity */}
          <div className="p-4 rounded-xl bg-[#070b14] border border-[#1e293b] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Bộ nhớ RAM máy chủ</span>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-sm font-bold font-mono text-white">
              {(diagnostics.freeMemoryMb / 1024).toFixed(1)} GB trống / {(diagnostics.totalMemoryMb / 1024).toFixed(1)} GB
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2f8bff]"
                style={{ width: `${(diagnostics.usedMemoryMb / diagnostics.totalMemoryMb) * 100}%` }}
              />
            </div>
          </div>

          {/* 4. Maximum Instance Capacity */}
          <div className="p-4 rounded-xl bg-[#070b14] border border-[#1e293b] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Giới hạn máy ảo đồng thời</span>
              <Server className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-sm font-bold font-mono text-emerald-400">
              Tối đa ~{diagnostics.maxLocalVmCapacity} máy ảo
            </div>
            <p className="text-[11px] text-slate-500">Tính toán dựa trên 2.5GB RAM khả dụng cho mỗi máy.</p>
          </div>
        </div>

        {/* Detailed Host Hardware Specs */}
        <div className="mt-6 pt-5 border-t border-[#1e293b]">
          <h3 className="text-xs font-bold text-white mb-3">Thông số kỹ thuật phần cứng máy chủ</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 bg-[#070b14] rounded-lg border border-[#1e293b]">
              <span className="text-slate-400 block text-[11px]">Bộ vi xử lý (CPU)</span>
              <span className="text-slate-200 truncate block mt-0.5 font-sans font-medium">
                {diagnostics.cpuModel}
              </span>
              <span className="text-slate-500 text-[11px] mt-0.5 block">{diagnostics.cpuCores} Cores ({diagnostics.arch})</span>
            </div>
            <div className="p-3 bg-[#070b14] rounded-lg border border-[#1e293b]">
              <span className="text-slate-400 block text-[11px]">Hệ điều hành Host</span>
              <span className="text-slate-200 block mt-0.5">{diagnostics.platform}</span>
              <span className="text-slate-500 text-[11px] mt-0.5 block">Kernel: {diagnostics.kernelRelease}</span>
            </div>
            <div className="p-3 bg-[#070b14] rounded-lg border border-[#1e293b]">
              <span className="text-slate-400 block text-[11px]">Android Debug Bridge (ADB)</span>
              <span className="text-slate-200 block mt-0.5">
                {diagnostics.adbInstalled ? `Version ${diagnostics.adbVersion || 'Ready'}` : 'Chưa cài đặt CLI'}
              </span>
              <span className="text-slate-500 text-[11px] mt-0.5 block">Daemon port: 5037</span>
            </div>
          </div>
        </div>

        {/* Missing Requirements List if not fully ready */}
        {diagnostics.missingRequirements.length > 0 && (
          <div className="mt-6 pt-5 border-t border-[#1e293b]">
            <h3 className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Yêu cầu cần cấu hình nếu muốn chạy trực tiếp trên máy chủ này</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {diagnostics.missingRequirements.map((req, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
