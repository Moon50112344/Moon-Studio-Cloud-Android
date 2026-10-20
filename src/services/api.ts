import { HostDiagnostics, AndroidImage, WorkerNode, AndroidDevice } from '../types';

export interface EmulatorStatus {
  isRunning: boolean;
  pid: number | null;
  cpuPercent: number;
  memoryMb: number;
  imageExists: boolean;
  imagePath: string;
  imageSizeMb: number;
  hasKvm: boolean;
  vncPort: number;
  websockifyPort: number;
  websockifyRunning: boolean;
  adbPort: number;
  adbConnected: boolean;
  adbState: string;
  bootCompleted: boolean;
  lastLogs: string[];
}

export const api = {
  async getEmulatorStatus(): Promise<EmulatorStatus> {
    const res = await fetch('/api/emulator/status');
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch emulator status');
    return data.status;
  },

  async startEmulator(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/emulator/start', { method: 'POST' });
    return await res.json();
  },

  async stopEmulator(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/emulator/stop', { method: 'POST' });
    return await res.json();
  },

  async resetEmulator(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/emulator/reset', { method: 'POST' });
    return await res.json();
  },

  async sendKey(key: string): Promise<{ success: boolean; output: string }> {
    const res = await fetch('/api/emulator/key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });
    return await res.json();
  },

  async installApk(file: File): Promise<{ success: boolean; output: string }> {
    const formData = new FormData();
    formData.append('apk', file);
    const res = await fetch('/api/emulator/install-apk', {
      method: 'POST',
      body: formData,
    });
    return await res.json();
  },

  async executeAdb(command: string): Promise<{ success: boolean; output: string }> {
    const res = await fetch('/api/emulator/adb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command }),
    });
    return await res.json();
  },

  async getScreenFrame(): Promise<string> {
    const res = await fetch('/api/emulator/frame');
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'No frame');
    return data.frame;
  },

  async getHostDiagnostics(): Promise<HostDiagnostics> {
    const res = await fetch('/api/system/host-check');
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to inspect host');
    return data.diagnostics;
  },

  async getImages(): Promise<AndroidImage[]> {
    return [
      {
        id: 'android-x86-9',
        name: 'Android 9.0 Pie (x86_64)',
        version: '11',
        dockerTag: 'android-x86_64-9.0-r2.iso',
        architecture: 'x86_64',
        apiLevel: 28,
        verified: true,
        sizeGb: 0.9,
        notes: 'Bản phân phối Android OS chính thức cho x86_64, tối ưu cho QEMU emulator.',
        recommendedRamMb: 2048,
        recommendedVcpu: 2,
      },
    ];
  },

  async getNodes(): Promise<WorkerNode[]> {
    return [];
  },

  async addNode(nodeData: Partial<WorkerNode>): Promise<WorkerNode> {
    return {
      id: 'node-custom',
      name: nodeData.name || 'Custom Node',
      endpoint: nodeData.endpoint || '127.0.0.1',
      location: nodeData.location || 'Local',
      status: 'online',
      hasKvm: true,
      hasGpu: false,
      totalVcpu: 8,
      usedVcpu: 2,
      totalRamMb: 16384,
      usedRamMb: 4096,
      maxInstances: 4,
      activeInstances: 1,
      kernelVersion: '6.1.0-linux-kvm',
      latencyMs: 15,
      isLocal: false,
    };
  },

  async deleteNode(nodeId: string): Promise<void> {},

  async createDevice(deviceData: any): Promise<AndroidDevice> {
    return {
      id: 'vm-qemu-01',
      name: deviceData.name,
      androidVersion: '11',
      image: deviceData.image,
      arch: 'x86_64',
      status: 'running',
      resolution: { width: 1080, height: 1920, dpi: 420, orientation: 'portrait' },
      resources: { vcpu: 2, ramMb: 2048, diskGb: 32 },
      fps: 60,
      nodeId: 'node-local',
      adbPort: 5555,
      ipAddress: '127.0.0.1',
      installedApps: [],
      snapshots: [],
      uptimeSeconds: 100,
      createdAt: new Date().toISOString(),
      storageUsedMb: 4000,
      batteryLevel: 100,
      isCharging: true,
      cpuUsagePercent: 15,
      ramUsedMb: 1536,
      logs: [],
    };
  },
};
