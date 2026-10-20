import { AndroidDevice, AndroidVersion, DeviceSnapshot, InstalledApp, WorkerNode } from './types.js';

class SystemState {
  public devices: Map<string, AndroidDevice> = new Map();
  public nodes: Map<string, WorkerNode> = new Map();

  constructor() {
    this.seedDefaultNodes();
    this.seedDefaultDevices();
  }

  private seedDefaultNodes() {
    const localNode: WorkerNode = {
      id: 'node-local',
      name: 'Moon Studio Cloud Node (Primary Host)',
      endpoint: '127.0.0.1',
      location: 'Hanoi, Vietnam (DC-01)',
      status: 'online',
      hasKvm: true,
      hasGpu: true,
      gpuModel: 'NVIDIA Tesla T4 (Vulkan/GLES 3.2 Passthrough)',
      totalVcpu: 16,
      usedVcpu: 4,
      totalRamMb: 32768,
      usedRamMb: 8192,
      maxInstances: 8,
      activeInstances: 2,
      kernelVersion: '6.1.0-cloud-amd64',
      latencyMs: 8,
      isLocal: true,
    };

    const edgeNode: WorkerNode = {
      id: 'node-sg-01',
      name: 'Moon Edge Node (Singapore Equinix SG1)',
      endpoint: '178.128.84.21',
      location: 'Singapore (Equinix SG1)',
      status: 'online',
      hasKvm: true,
      hasGpu: true,
      gpuModel: 'Intel Iris Xe Max (SwiftShader Hardware)',
      totalVcpu: 32,
      usedVcpu: 6,
      totalRamMb: 65536,
      usedRamMb: 12288,
      maxInstances: 16,
      activeInstances: 3,
      kernelVersion: '6.6.14-redroid-kvm',
      latencyMs: 24,
      isLocal: false,
    };

    this.nodes.set(localNode.id, localNode);
    this.nodes.set(edgeNode.id, edgeNode);
  }

  private getDefaultApps(androidVersion: AndroidVersion): InstalledApp[] {
    return [
      {
        packageName: 'com.android.settings',
        appName: 'Settings',
        version: `${androidVersion}.0`,
        icon: 'settings',
        sizeMb: 42.5,
        installDate: '2026-10-15',
        isSystem: true,
      },
      {
        packageName: 'com.android.chrome',
        appName: 'Chrome',
        version: '130.0.6723',
        icon: 'chrome',
        sizeMb: 112.4,
        installDate: '2026-10-15',
        isSystem: true,
      },
      {
        packageName: 'com.android.documentsui',
        appName: 'Files',
        version: '14.0',
        icon: 'folder',
        sizeMb: 18.2,
        installDate: '2026-10-15',
        isSystem: true,
      },
      {
        packageName: 'com.android.terminal',
        appName: 'Terminal ADB',
        version: '2.1.0',
        icon: 'terminal',
        sizeMb: 9.8,
        installDate: '2026-10-16',
        isSystem: true,
      },
      {
        packageName: 'com.moonstudio.appstore',
        appName: 'Moon AppStore',
        version: '3.4.0',
        icon: 'store',
        sizeMb: 36.1,
        installDate: '2026-10-17',
        isSystem: true,
      },
      {
        packageName: 'com.android.camera2',
        appName: 'Camera',
        version: '3.5.0',
        icon: 'camera',
        sizeMb: 24.0,
        installDate: '2026-10-15',
        isSystem: true,
      },
      {
        packageName: 'com.android.calculator2',
        appName: 'Calculator',
        version: '8.4.1',
        icon: 'calculator',
        sizeMb: 6.3,
        installDate: '2026-10-15',
        isSystem: true,
      },
    ];
  }

  private seedDefaultDevices() {
    const dev1: AndroidDevice = {
      id: 'vm-moon-01',
      name: 'Moon Pixel 7 Pro (Prod-01)',
      androidVersion: '14',
      image: 'redroid/redroid:14.0.0-latest',
      arch: 'x86_64',
      status: 'running',
      resolution: {
        width: 1080,
        height: 1920,
        dpi: 420,
        orientation: 'portrait',
      },
      resources: {
        vcpu: 4,
        ramMb: 4096,
        diskGb: 64,
      },
      fps: 60,
      nodeId: 'node-local',
      adbPort: 5555,
      ipAddress: '172.18.0.101',
      installedApps: this.getDefaultApps('14'),
      snapshots: [
        {
          id: 'snap-clean-01',
          name: 'Clean Install State',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          sizeMb: 2840,
          description: 'AOSP Android 14 freshly deployed with standard drivers.',
        },
      ],
      bootTime: new Date(Date.now() - 3600000 * 2).toISOString(),
      uptimeSeconds: 7200,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      activeAppPackage: 'com.android.launcher3',
      currentActivity: 'LauncherHome',
      storageUsedMb: 6840,
      batteryLevel: 98,
      isCharging: true,
      cpuUsagePercent: 14,
      ramUsedMb: 2140,
      logs: [
        '[Init] Redroid container initialized with KVM hw-acceleration.',
        '[Kernel] 6.1.0-cloud-amd64 mounted binderfs at /dev/binderfs',
        '[SurfaceFlinger] Initializing display composer 1080x1920 @ 60Hz',
        '[Zygote] Preloading 64-bit Android classes and resources',
        '[SystemServer] ActivityManager, WindowManager, PackageManager online',
        '[SystemUI] Navigation bar and notification shade registered',
        '[AdbDaemon] adbd listening on 0.0.0.0:5555',
        '[BootCompleted] Action: android.intent.action.BOOT_COMPLETED dispatched',
      ],
    };

    const dev2: AndroidDevice = {
      id: 'vm-moon-02',
      name: 'Moon Gaming Phone (Test-13)',
      androidVersion: '13',
      image: 'redroid/redroid:13.0.0-latest',
      arch: 'x86_64',
      status: 'stopped',
      resolution: {
        width: 1080,
        height: 1920,
        dpi: 400,
        orientation: 'portrait',
      },
      resources: {
        vcpu: 2,
        ramMb: 3072,
        diskGb: 32,
      },
      fps: 60,
      nodeId: 'node-local',
      adbPort: 5557,
      ipAddress: '172.18.0.102',
      installedApps: this.getDefaultApps('13'),
      snapshots: [],
      uptimeSeconds: 0,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      storageUsedMb: 4210,
      batteryLevel: 100,
      isCharging: false,
      cpuUsagePercent: 0,
      ramUsedMb: 0,
      logs: ['[System] Device shut down cleanly.'],
    };

    this.devices.set(dev1.id, dev1);
    this.devices.set(dev2.id, dev2);
  }

  public getAllDevices(): AndroidDevice[] {
    return Array.from(this.devices.values());
  }

  public getDevice(id: string): AndroidDevice | undefined {
    return this.devices.get(id);
  }

  public createDevice(data: {
    name: string;
    androidVersion: AndroidVersion;
    image: string;
    vcpu: number;
    ramMb: number;
    diskGb: number;
    width?: number;
    height?: number;
    nodeId?: string;
  }): AndroidDevice {
    const id = `vm-moon-${Date.now().toString(36)}`;
    const port = 5550 + Math.floor(Math.random() * 900);
    const assignedNode = data.nodeId && this.nodes.has(data.nodeId) ? data.nodeId : 'node-local';

    const newDevice: AndroidDevice = {
      id,
      name: data.name || `Moon Phone ${data.androidVersion}`,
      androidVersion: data.androidVersion || '14',
      image: data.image || 'redroid/redroid:14.0.0-latest',
      arch: 'x86_64',
      status: 'stopped',
      resolution: {
        width: data.width || 1080,
        height: data.height || 1920,
        dpi: 420,
        orientation: 'portrait',
      },
      resources: {
        vcpu: data.vcpu || 2,
        ramMb: data.ramMb || 3072,
        diskGb: data.diskGb || 32,
      },
      fps: 60,
      nodeId: assignedNode,
      adbPort: port,
      ipAddress: `172.18.0.${Math.floor(110 + Math.random() * 100)}`,
      installedApps: this.getDefaultApps(data.androidVersion),
      snapshots: [],
      uptimeSeconds: 0,
      createdAt: new Date().toISOString(),
      storageUsedMb: 3500,
      batteryLevel: 100,
      isCharging: true,
      cpuUsagePercent: 0,
      ramUsedMb: 0,
      logs: [`[Provisioning] Storage volume allocated (${data.diskGb || 32}GB ext4)`],
    };

    this.devices.set(id, newDevice);
    return newDevice;
  }

  public startDevice(id: string): boolean {
    const dev = this.devices.get(id);
    if (!dev) return false;

    dev.status = 'starting';
    dev.logs.push(`[${new Date().toLocaleTimeString()}] [KVM] Starting vCPU cores (${dev.resources.vcpu}) and QEMU/Redroid hypervisor...`);

    // Simulated multi-stage boot sequence
    setTimeout(() => {
      if (this.devices.has(id)) {
        dev.status = 'booting';
        dev.logs.push(`[${new Date().toLocaleTimeString()}] [Linux] Kernel boot complete. Launching init process (PID 1).`);
        dev.logs.push(`[${new Date().toLocaleTimeString()}] [Android] SurfaceFlinger compositor initialized: ${dev.resolution.width}x${dev.resolution.height}@60fps`);
      }
    }, 1500);

    setTimeout(() => {
      if (this.devices.has(id)) {
        dev.status = 'running';
        dev.bootTime = new Date().toISOString();
        dev.uptimeSeconds = 1;
        dev.cpuUsagePercent = 18;
        dev.ramUsedMb = Math.round(dev.resources.ramMb * 0.45);
        dev.activeAppPackage = 'com.android.launcher3';
        dev.currentActivity = 'LauncherHome';
        dev.logs.push(`[${new Date().toLocaleTimeString()}] [SystemUI] Android OS booted successfully. ADB listening on port ${dev.adbPort}`);
      }
    }, 3200);

    return true;
  }

  public stopDevice(id: string): boolean {
    const dev = this.devices.get(id);
    if (!dev) return false;

    dev.status = 'stopped';
    dev.cpuUsagePercent = 0;
    dev.ramUsedMb = 0;
    dev.uptimeSeconds = 0;
    dev.logs.push(`[${new Date().toLocaleTimeString()}] [PowerManager] Shutdown broadcasted. Storage synchronized.`);
    return true;
  }

  public restartDevice(id: string): boolean {
    const dev = this.devices.get(id);
    if (!dev) return false;

    dev.status = 'restarting';
    dev.logs.push(`[${new Date().toLocaleTimeString()}] [PowerManager] Soft reboot initiated...`);
    setTimeout(() => {
      this.startDevice(id);
    }, 1200);
    return true;
  }

  public deleteDevice(id: string): boolean {
    return this.devices.delete(id);
  }

  public installApp(deviceId: string, app: { packageName: string; appName: string; version: string; sizeMb: number }): boolean {
    const dev = this.devices.get(deviceId);
    if (!dev) return false;

    const existingIndex = dev.installedApps.findIndex(a => a.packageName === app.packageName);
    const newApp: InstalledApp = {
      packageName: app.packageName,
      appName: app.appName,
      version: app.version,
      icon: 'box',
      sizeMb: app.sizeMb,
      installDate: new Date().toISOString().split('T')[0],
      isSystem: false,
    };

    if (existingIndex >= 0) {
      dev.installedApps[existingIndex] = newApp;
    } else {
      dev.installedApps.push(newApp);
    }

    dev.storageUsedMb += app.sizeMb;
    dev.logs.push(`[${new Date().toLocaleTimeString()}] [PackageManager] Success installing APK: ${app.packageName} (v${app.version})`);
    return true;
  }

  public createSnapshot(deviceId: string, name: string, description?: string): DeviceSnapshot | null {
    const dev = this.devices.get(deviceId);
    if (!dev) return null;

    const snapshot: DeviceSnapshot = {
      id: `snap-${Date.now().toString(36)}`,
      name: name || `Snapshot ${dev.snapshots.length + 1}`,
      createdAt: new Date().toISOString(),
      sizeMb: Math.round(dev.storageUsedMb * 0.8),
      description: description || 'Point-in-time VM filesystem copy',
    };

    dev.snapshots.push(snapshot);
    dev.logs.push(`[${new Date().toLocaleTimeString()}] [Storage] Created CoW snapshot: ${snapshot.name}`);
    return snapshot;
  }

  public restoreSnapshot(deviceId: string, snapshotId: string): boolean {
    const dev = this.devices.get(deviceId);
    if (!dev) return false;

    const snap = dev.snapshots.find(s => s.id === snapshotId);
    if (!snap) return false;

    dev.logs.push(`[${new Date().toLocaleTimeString()}] [Storage] Restored filesystem snapshot: ${snap.name}`);
    return true;
  }

  public addNode(nodeData: Partial<WorkerNode>): WorkerNode {
    const id = `node-${Date.now().toString(36)}`;
    const node: WorkerNode = {
      id,
      name: nodeData.name || 'Custom Worker Node',
      endpoint: nodeData.endpoint || '10.0.0.1',
      location: nodeData.location || 'Dedicated Server',
      status: 'online',
      hasKvm: nodeData.hasKvm ?? true,
      hasGpu: nodeData.hasGpu ?? false,
      gpuModel: nodeData.gpuModel || 'Software SwiftShader',
      totalVcpu: nodeData.totalVcpu || 16,
      usedVcpu: 0,
      totalRamMb: nodeData.totalRamMb || 32768,
      usedRamMb: 0,
      maxInstances: nodeData.maxInstances || 8,
      activeInstances: 0,
      kernelVersion: nodeData.kernelVersion || '6.1.0-linux-kvm',
      latencyMs: Math.floor(15 + Math.random() * 20),
      isLocal: false,
    };
    this.nodes.set(id, node);
    return node;
  }
}

export const systemState = new SystemState();
