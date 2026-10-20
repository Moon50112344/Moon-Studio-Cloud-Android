export type AndroidVersion = '11' | '12' | '13' | '14';

export type DeviceStatus = 'stopped' | 'starting' | 'booting' | 'running' | 'paused' | 'error' | 'restarting';

export interface DeviceResolution {
  width: number;
  height: number;
  dpi: number;
  orientation: 'portrait' | 'landscape';
}

export interface DeviceResources {
  vcpu: number;
  ramMb: number;
  diskGb: number;
}

export interface InstalledApp {
  packageName: string;
  appName: string;
  version: string;
  icon: string;
  sizeMb: number;
  installDate: string;
  isSystem: boolean;
}

export interface DeviceSnapshot {
  id: string;
  name: string;
  createdAt: string;
  sizeMb: number;
  description?: string;
}

export interface AndroidDevice {
  id: string;
  name: string;
  androidVersion: AndroidVersion;
  image: string;
  arch: 'x86_64' | 'arm64';
  status: DeviceStatus;
  resolution: DeviceResolution;
  resources: DeviceResources;
  fps: number;
  nodeId: string;
  adbPort: number;
  ipAddress: string;
  installedApps: InstalledApp[];
  snapshots: DeviceSnapshot[];
  bootTime?: string;
  uptimeSeconds: number;
  createdAt: string;
  currentActivity?: string;
  activeAppPackage?: string;
  storageUsedMb: number;
  batteryLevel: number;
  isCharging: boolean;
  cpuUsagePercent: number;
  ramUsedMb: number;
  logs: string[];
}

export interface WorkerNode {
  id: string;
  name: string;
  endpoint: string;
  location: string;
  status: 'online' | 'offline' | 'degraded';
  hasKvm: boolean;
  hasGpu: boolean;
  gpuModel?: string;
  totalVcpu: number;
  usedVcpu: number;
  totalRamMb: number;
  usedRamMb: number;
  maxInstances: number;
  activeInstances: number;
  kernelVersion: string;
  latencyMs: number;
  isLocal: boolean;
}

export interface HostDiagnostics {
  platform: string;
  arch: string;
  hostname: string;
  kernelRelease: string;
  cpuModel: string;
  cpuCores: number;
  totalMemoryMb: number;
  freeMemoryMb: number;
  usedMemoryMb: number;
  hasKvm: boolean;
  kvmPathExists: boolean;
  kvmAccessible: boolean;
  hasBinder: boolean;
  hasAshmem: boolean;
  dockerSocketExists: boolean;
  adbInstalled: boolean;
  adbVersion?: string;
  nativeVirtualizationReady: boolean;
  recommendedMode: 'native_kvm' | 'remote_cluster' | 'hybrid';
  maxLocalVmCapacity: number;
  diagnosticsSummary: string;
  missingRequirements: string[];
}

export interface AndroidImage {
  id: string;
  name: string;
  version: AndroidVersion;
  dockerTag: string;
  architecture: 'x86_64' | 'arm64';
  apiLevel: number;
  verified: boolean;
  sizeGb: number;
  notes: string;
  recommendedRamMb: number;
  recommendedVcpu: number;
}
