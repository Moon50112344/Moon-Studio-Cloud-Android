import React, { useState } from 'react';
import { AndroidDevice } from '../types';
import {
  Smartphone,
  Play,
  Square,
  RotateCw,
  Trash2,
  ExternalLink,
  Cpu,
  HardDrive,
  Layers,
  BatteryCharging,
  Battery,
  Search,
  Plus,
  Terminal,
} from 'lucide-react';

interface DeviceListProps {
  devices: AndroidDevice[];
  onOpenDevice: (device: AndroidDevice) => void;
  onStartDevice: (id: string) => Promise<void>;
  onStopDevice: (id: string) => Promise<void>;
  onRestartDevice: (id: string) => Promise<void>;
  onDeleteDevice: (id: string) => Promise<void>;
  onOpenCreateModal: () => void;
  isLoading: boolean;
}

export const DeviceList: React.FC<DeviceListProps> = ({
  devices,
  onOpenDevice,
  onStartDevice,
  onStopDevice,
  onRestartDevice,
  onDeleteDevice,
  onOpenCreateModal,
  isLoading,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped'>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const filteredDevices = devices.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.androidVersion.includes(search) ||
      d.image.toLowerCase().includes(search.toLowerCase());
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'running') return matchesSearch && (d.status === 'running' || d.status === 'booting' || d.status === 'starting');
    if (statusFilter === 'stopped') return matchesSearch && d.status === 'stopped';
    return matchesSearch;
  });

  const handleAction = async (id: string, action: () => Promise<void>) => {
    setActionLoadingId(id);
    try {
      await action();
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: AndroidDevice['status']) => {
    switch (status) {
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Đang hoạt động (Running)
          </span>
        );
      case 'starting':
      case 'booting':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Đang khởi động ({status === 'booting' ? 'Boot OS' : 'Init KVM'})
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            Tạm dừng
          </span>
        );
      case 'restarting':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-spin"></span>
            Khởi động lại...
          </span>
        );
      case 'stopped':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-600"></span>
            Đã tắt (Stopped)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#0f172a] p-4 rounded-xl border border-[#1e293b]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên thiết bị, phiên bản Android, ROM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#070b14] border border-[#1e293b] rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#2f8bff] transition-colors"
          />
        </div>

        {/* Segmented status filter */}
        <div className="flex items-center gap-1 p-1 bg-[#070b14] rounded-lg border border-[#1e293b] self-start sm:self-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#1e293b] text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tất cả ({devices.length})
          </button>
          <button
            onClick={() => setStatusFilter('running')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'running'
                ? 'bg-[#1e293b] text-emerald-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Đang chạy ({devices.filter((d) => d.status === 'running' || d.status === 'booting').length})
          </button>
          <button
            onClick={() => setStatusFilter('stopped')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'stopped'
                ? 'bg-[#1e293b] text-slate-200'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Đã tắt ({devices.filter((d) => d.status === 'stopped').length})
          </button>
        </div>
      </div>

      {/* Device Cards Grid */}
      {filteredDevices.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[#0f172a] rounded-xl border border-[#1e293b]">
          <Smartphone className="w-12 h-12 mx-auto text-slate-500 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Chưa có máy ảo Android nào phù hợp</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            Khởi tạo ngay một máy ảo Android chạy trên môi trường Linux KVM / Redroid với đầy đủ tính năng truyền màn hình và cảm ứng.
          </p>
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#2f8bff] hover:bg-[#2575db] rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Khởi tạo máy ảo đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredDevices.map((device) => {
            const isBusy = actionLoadingId === device.id;
            const isRunning = device.status === 'running';

            return (
              <div
                key={device.id}
                className="bg-[#0f172a] rounded-xl border border-[#1e293b] hover:border-[#334155] p-5 flex flex-col justify-between transition-all shadow-sm"
              >
                <div>
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-[#070b14] border border-[#1e293b] flex items-center justify-center shrink-0">
                        <Smartphone className="w-6 h-6 text-[#2f8bff]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white text-base leading-snug">{device.name}</h3>
                          <span className="text-xs px-2 py-0.5 rounded bg-[#1e293b] text-[#2f8bff] font-mono border border-[#334155]">
                            Android {device.androidVersion}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                          <span>ID: {device.id}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{device.image}</span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(device.status)}
                  </div>

                  {/* Hardware & Spec indicators */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#1e293b] my-4 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-slate-400" />
                      <div>
                        <span className="text-slate-400 block text-[11px]">vCPU</span>
                        <span className="font-semibold font-mono">{device.resources.vcpu} Cores</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-slate-400" />
                      <div>
                        <span className="text-slate-400 block text-[11px]">RAM</span>
                        <span className="font-semibold font-mono">{(device.resources.ramMb / 1024).toFixed(1)} GB</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-slate-400" />
                      <div>
                        <span className="text-slate-400 block text-[11px]">Lưu trữ</span>
                        <span className="font-semibold font-mono">{device.resources.diskGb} GB</span>
                      </div>
                    </div>
                  </div>

                  {/* Network & Battery telemetry */}
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-4 font-mono">
                    <div className="flex items-center gap-3">
                      <span>IP: {device.ipAddress}</span>
                      <span>ADB: :{device.adbPort}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {device.isCharging ? (
                        <BatteryCharging className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Battery className="w-4 h-4 text-slate-400" />
                      )}
                      <span>{device.batteryLevel}%</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons row */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#1e293b]">
                  <div className="flex items-center gap-2">
                    {device.status === 'stopped' ? (
                      <button
                        onClick={() => handleAction(device.id, () => onStartDevice(device.id))}
                        disabled={isBusy}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Khởi động</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleAction(device.id, () => onStopDevice(device.id))}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#1e293b] hover:bg-[#334155] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Square className="w-3.5 h-3.5 text-rose-400" />
                          <span>Tắt</span>
                        </button>
                        <button
                          onClick={() => handleAction(device.id, () => onRestartDevice(device.id))}
                          disabled={isBusy}
                          title="Khởi động lại máy ảo"
                          className="p-1.5 text-slate-400 hover:text-white bg-[#1e293b] hover:bg-[#334155] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => {
                        if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn máy ảo "${device.name}"?`)) {
                          handleAction(device.id, () => onDeleteDevice(device.id));
                        }
                      }}
                      disabled={isBusy}
                      title="Xóa máy ảo"
                      className="p-1.5 text-slate-400 hover:text-rose-400 bg-[#1e293b] hover:bg-[#334155] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Main Launch / View button */}
                  <button
                    onClick={() => onOpenDevice(device)}
                    className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-white bg-[#2f8bff] hover:bg-[#2575db] rounded-lg transition-colors cursor-pointer shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Mở máy ảo</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
