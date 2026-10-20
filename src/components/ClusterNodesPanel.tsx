import React, { useState } from 'react';
import { WorkerNode } from '../types';
import { api } from '../services/api';
import { Server, Plus, Trash2, Cpu, Layers, Activity, CheckCircle, Shield, Globe } from 'lucide-react';

interface ClusterNodesPanelProps {
  nodes: WorkerNode[];
  onRefreshNodes: () => void;
}

export const ClusterNodesPanel: React.FC<ClusterNodesPanelProps> = ({ nodes, onRefreshNodes }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [location, setLocation] = useState('Hetzner Falkenstein (FSN1-DC1)');
  const [totalVcpu, setTotalVcpu] = useState(16);
  const [totalRamMb, setTotalRamMb] = useState(32768);
  const [hasGpu, setHasGpu] = useState(true);
  const [gpuModel, setGpuModel] = useState('NVIDIA Tesla T4 (Vulkan Passthrough)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !endpoint.trim()) return;

    setIsSubmitting(true);
    try {
      await api.addNode({
        name,
        endpoint,
        location,
        totalVcpu,
        totalRamMb,
        hasGpu,
        gpuModel,
        hasKvm: true,
      });
      setShowAddModal(false);
      setName('');
      setEndpoint('');
      onRefreshNodes();
    } catch (err: any) {
      alert(err.message || 'Lỗi thêm node');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNode = async (id: string, nodeName: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa Worker Node "${nodeName}" khỏi cụm?`)) {
      try {
        await api.deleteNode(id);
        onRefreshNodes();
      } catch (err: any) {
        alert(err.message || 'Lỗi xóa node');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0f172a] rounded-xl border border-[#1e293b] p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#1e293b]">
          <div>
            <h2 className="text-base font-bold text-white">Quản lý Cụm Máy chủ Worker (Cluster Fleet)</h2>
            <p className="text-xs text-slate-400">
              Mở rộng hệ thống bằng cách kết nối các máy chủ Bare-metal Linux có KVM để chia tải máy ảo Android.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2f8bff] hover:bg-[#2575db] rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Worker Node mới</span>
          </button>
        </div>

        {/* Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {nodes.map((node) => (
            <div key={node.id} className="p-5 rounded-xl bg-[#070b14] border border-[#1e293b] space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0f172a] border border-[#1e293b] flex items-center justify-center">
                    <Server className="w-5 h-5 text-[#2f8bff]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white text-sm">{node.name}</h3>
                      {node.isLocal && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e293b] text-[#2f8bff] border border-[#334155]">
                          Local Host
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
                      <span>{node.endpoint}</span>
                      <span aria-hidden="true">·</span>
                      <span>{node.location}</span>
                    </div>
                  </div>
                </div>

                {!node.isLocal && (
                  <button
                    onClick={() => handleDeleteNode(node.id, node.name)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                    title="Xóa node này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Node Metrics */}
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#1e293b] text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Độ trễ Ping</span>
                  <span className="font-bold font-mono text-emerald-400">{node.latencyMs} ms</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">vCPU đã cấp</span>
                  <span className="font-bold font-mono text-slate-200">
                    {node.usedVcpu} / {node.totalVcpu} Cores
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Bộ nhớ RAM</span>
                  <span className="font-bold font-mono text-slate-200">
                    {(node.usedRamMb / 1024).toFixed(0)} / {(node.totalRamMb / 1024).toFixed(0)} GB
                  </span>
                </div>
              </div>

              {/* Capabilities */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>KVM Hardware Virtualization</span>
                </span>
                <span className="font-mono text-[11px]">
                  {node.activeInstances}/{node.maxInstances} Máy ảo
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Node Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Kết nối Worker Node Bare-Metal</h3>
            <p className="text-xs text-slate-400 mb-4">
              Nhập thông tin máy chủ Linux chạy Redroid hoặc QEMU KVM để thêm vào cụm.
            </p>

            <form onSubmit={handleAddNode} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Tên Node nhận diện</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Hetzner Baremetal Node 02"
                  className="w-full bg-[#070b14] border border-[#1e293b] rounded-lg px-3 py-2 text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Địa chỉ IP / Endpoint</label>
                <input
                  type="text"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="Ví dụ: 195.201.88.42 hoặc node2.moonstudio.cloud"
                  className="w-full bg-[#070b14] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Vị trí Data Center</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ví dụ: Singapore, Tokyo, hoặc Frankfurt"
                  className="w-full bg-[#070b14] border border-[#1e293b] rounded-lg px-3 py-2 text-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tổng vCPU</label>
                  <input
                    type="number"
                    value={totalVcpu}
                    onChange={(e) => setTotalVcpu(Number(e.target.value))}
                    className="w-full bg-[#070b14] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none"
                    min="4"
                    max="128"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tổng RAM (MB)</label>
                  <input
                    type="number"
                    value={totalRamMb}
                    onChange={(e) => setTotalRamMb(Number(e.target.value))}
                    className="w-full bg-[#070b14] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none"
                    min="8192"
                    step="4096"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-300 hover:text-white bg-[#1e293b] rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 font-semibold text-white bg-[#2f8bff] hover:bg-[#2575db] rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang kết nối...' : 'Lưu Node'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
