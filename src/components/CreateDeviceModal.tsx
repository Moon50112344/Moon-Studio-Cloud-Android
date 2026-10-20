import React, { useState, useEffect } from 'react';
import { AndroidImage, HostDiagnostics, WorkerNode } from '../types';
import { api } from '../services/api';
import { X, Smartphone, Cpu, Layers, HardDrive, Server, AlertCircle } from 'lucide-react';

interface CreateDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceCreated: (newDevice: any) => void;
  diagnostics: HostDiagnostics | null;
  nodes: WorkerNode[];
}

export const CreateDeviceModal: React.FC<CreateDeviceModalProps> = ({
  isOpen,
  onClose,
  onDeviceCreated,
  diagnostics,
  nodes,
}) => {
  const [images, setImages] = useState<AndroidImage[]>([]);
  const [name, setName] = useState('Moon Phone Pro');
  const [selectedImageId, setSelectedImageId] = useState('redroid-14');
  const [vcpu, setVcpu] = useState(2);
  const [ramMb, setRamMb] = useState(3072);
  const [diskGb, setDiskGb] = useState(32);
  const [resolution, setResolution] = useState('1080x1920');
  const [selectedNodeId, setSelectedNodeId] = useState('node-local');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getImages().then(setImages).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedImage = images.find((i) => i.id === selectedImageId) || images[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên thiết bị');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const [width, height] = resolution.split('x').map(Number);

    try {
      const newDev = await api.createDevice({
        name,
        androidVersion: selectedImage?.version || '14',
        image: selectedImage?.dockerTag || 'redroid/redroid:14.0.0-latest',
        vcpu,
        ramMb,
        diskGb,
        width,
        height,
        nodeId: selectedNodeId,
      });
      onDeviceCreated(newDev);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi khởi tạo máy ảo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#070b14] border border-[#2f8bff]/30 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-[#2f8bff]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Khởi tạo máy ảo Android mới</h3>
              <p className="text-xs text-slate-400">Chạy trên hạ tầng KVM Linux và Redroid Container</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1e293b] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Device Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tên thiết bị</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Moon Pixel 8 Pro, Gaming Phone 14..."
              className="w-full bg-[#070b14] border border-[#1e293b] rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#2f8bff]"
              required
            />
          </div>

          {/* Android OS Image Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Hệ điều hành Android ROM (Image)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {images.map((img) => (
                <div
                  key={img.id}
                  onClick={() => {
                    setSelectedImageId(img.id);
                    setRamMb(img.recommendedRamMb);
                    setVcpu(img.recommendedVcpu);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedImageId === img.id
                      ? 'bg-[#1e293b] border-[#2f8bff] text-white ring-1 ring-[#2f8bff]'
                      : 'bg-[#070b14] border-[#1e293b] text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="text-white">{img.name}</span>
                    <span className="text-[11px] text-[#2f8bff] font-mono">API {img.apiLevel}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{img.notes}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hardware Allocation */}
          <div className="p-4 bg-[#070b14] rounded-xl border border-[#1e293b] space-y-3">
            <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-[#2f8bff]" />
              <span>Phân bổ tài nguyên phần cứng</span>
            </h4>

            {/* vCPU */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Số nhân CPU (vCPU):</span>
                <span className="font-mono font-semibold text-white">{vcpu} Cores</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={vcpu}
                onChange={(e) => setVcpu(Number(e.target.value))}
                className="w-full accent-[#2f8bff] cursor-pointer"
              />
            </div>

            {/* RAM */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Bộ nhớ RAM ảo:</span>
                <span className="font-mono font-semibold text-white">{(ramMb / 1024).toFixed(1)} GB ({ramMb} MB)</span>
              </div>
              <input
                type="range"
                min="2048"
                max="8192"
                step="1024"
                value={ramMb}
                onChange={(e) => setRamMb(Number(e.target.value))}
                className="w-full accent-[#2f8bff] cursor-pointer"
              />
            </div>

            {/* Disk Storage */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Dung lượng lưu trữ (ext4 /data):</span>
                <span className="font-mono font-semibold text-white">{diskGb} GB</span>
              </div>
              <input
                type="range"
                min="16"
                max="128"
                step="16"
                value={diskGb}
                onChange={(e) => setDiskGb(Number(e.target.value))}
                className="w-full accent-[#2f8bff] cursor-pointer"
              />
            </div>
          </div>

          {/* Resolution & Node Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Độ phân giải hiển thị</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full bg-[#070b14] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none"
              >
                <option value="1080x1920">1080 x 1920 (FHD 420 DPI - Chuẩn)</option>
                <option value="720x1280">720 x 1280 (HD 320 DPI - Tiết kiệm)</option>
                <option value="1440x2560">1440 x 2560 (2K QHD 560 DPI)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Cụm máy chủ (Worker Node)</label>
              <select
                value={selectedNodeId}
                onChange={(e) => setSelectedNodeId(e.target.value)}
                className="w-full bg-[#070b14] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.location})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#1e293b] hover:bg-[#334155] rounded-lg transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#2f8bff] hover:bg-[#2575db] rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Đang khởi tạo VM...' : 'Tạo máy ảo ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
