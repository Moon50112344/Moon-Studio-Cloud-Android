import { WebSocket, WebSocketServer } from 'ws';
import { systemState } from './state.js';
import { AndroidDevice } from './types.js';

interface ClientSession {
  ws: WebSocket;
  deviceId: string;
  lastPing: number;
  fps: number;
}

export class DeviceStreamServer {
  private wss: WebSocketServer | null = null;
  private sessions: Set<ClientSession> = new Set();
  private frameTimers: Map<string, NodeJS.Timeout> = new Map();

  public init(wss: WebSocketServer) {
    this.wss = wss;

    wss.on('connection', (ws: WebSocket, req) => {
      const url = new URL(req.url || '', 'http://localhost');
      const deviceId = url.searchParams.get('deviceId');

      if (!deviceId) {
        ws.send(JSON.stringify({ type: 'error', message: 'Missing deviceId parameter' }));
        ws.close();
        return;
      }

      const session: ClientSession = {
        ws,
        deviceId,
        lastPing: Date.now(),
        fps: 30,
      };

      this.sessions.add(session);

      // Send initial handshake
      const device = systemState.getDevice(deviceId);
      ws.send(
        JSON.stringify({
          type: 'handshake',
          deviceId,
          device: device || null,
          timestamp: Date.now(),
          protocol: 'MoonStream/2.4-WebRTC-Fallback',
        })
      );

      // Start streaming loop for this device if not started
      this.ensureStreamLoop(deviceId);

      ws.on('message', (data: string | Buffer) => {
        try {
          const msg = JSON.parse(data.toString());
          this.handleClientMessage(session, msg);
        } catch {
          // Ignore malformed packets
        }
      });

      ws.on('close', () => {
        this.sessions.delete(session);
        // If no clients left for this device, clean up timer
        const hasOtherClients = Array.from(this.sessions).some((s) => s.deviceId === deviceId);
        if (!hasOtherClients) {
          const timer = this.frameTimers.get(deviceId);
          if (timer) {
            clearInterval(timer);
            this.frameTimers.delete(deviceId);
          }
        }
      });
    });
  }

  private handleClientMessage(session: ClientSession, msg: any) {
    const device = systemState.getDevice(session.deviceId);
    if (!device) return;

    switch (msg.type) {
      case 'ping':
        session.lastPing = Date.now();
        session.ws.send(JSON.stringify({ type: 'pong', clientTime: msg.time, serverTime: Date.now() }));
        break;

      case 'touch_down':
      case 'touch_move':
      case 'touch_up':
        this.handleTouchEvent(device, msg);
        break;

      case 'nav_action':
        this.handleNavAction(device, msg.action);
        break;

      case 'launch_app':
        if (msg.packageName) {
          device.activeAppPackage = msg.packageName;
          device.currentActivity = msg.packageName;
          device.logs.push(`[ActivityManager] START u0 {act=android.intent.action.MAIN cat=[android.intent.category.LAUNCHER] cmp=${msg.packageName}}`);
          this.broadcastDeviceUpdate(device.id);
        }
        break;

      case 'set_resolution':
        if (msg.width && msg.height) {
          device.resolution.width = msg.width;
          device.resolution.height = msg.height;
          device.logs.push(`[SurfaceFlinger] Display resolution dynamically changed to ${msg.width}x${msg.height}`);
          this.broadcastDeviceUpdate(device.id);
        }
        break;

      case 'toggle_orientation':
        device.resolution.orientation = device.resolution.orientation === 'portrait' ? 'landscape' : 'portrait';
        // swap width and height
        const w = device.resolution.width;
        device.resolution.width = device.resolution.height;
        device.resolution.height = w;
        device.logs.push(`[WindowManager] Orientation sensor changed to ${device.resolution.orientation}`);
        this.broadcastDeviceUpdate(device.id);
        break;
    }
  }

  private handleNavAction(device: AndroidDevice, action: string) {
    if (device.status !== 'running') return;

    switch (action) {
      case 'home':
        device.activeAppPackage = 'com.android.launcher3';
        device.currentActivity = 'LauncherHome';
        device.logs.push(`[InputReader] KEYCODE_HOME received`);
        break;
      case 'back':
        if (device.activeAppPackage !== 'com.android.launcher3') {
          device.activeAppPackage = 'com.android.launcher3';
          device.currentActivity = 'LauncherHome';
        }
        device.logs.push(`[InputReader] KEYCODE_BACK received`);
        break;
      case 'recents':
        device.currentActivity = 'RecentsOverview';
        device.logs.push(`[InputReader] KEYCODE_APP_SWITCH received`);
        break;
      case 'power':
        device.logs.push(`[InputReader] KEYCODE_POWER pressed`);
        break;
      case 'vol_up':
        device.logs.push(`[AudioService] Volume increased to 80%`);
        break;
      case 'vol_down':
        device.logs.push(`[AudioService] Volume decreased to 60%`);
        break;
      case 'rotate':
        device.resolution.orientation = device.resolution.orientation === 'portrait' ? 'landscape' : 'portrait';
        const w = device.resolution.width;
        device.resolution.width = device.resolution.height;
        device.resolution.height = w;
        break;
    }

    this.broadcastDeviceUpdate(device.id);
  }

  private handleTouchEvent(device: AndroidDevice, msg: { type: string; x: number; y: number }) {
    if (device.status !== 'running') return;

    // Detect app launch if tapping on homescreen grid
    if (device.activeAppPackage === 'com.android.launcher3' || !device.activeAppPackage) {
      // Norm coordinates between 0 and 1
      const nx = msg.x / device.resolution.width;
      const ny = msg.y / device.resolution.height;

      // Check app icon bounds on homescreen
      // Homescreen layout: top 18% is clock/search, middle 55% is app grid, bottom 12% is dock
      if (msg.type === 'touch_up' && ny >= 0.22 && ny <= 0.82) {
        // Find which app was tapped
        const apps = device.installedApps;
        // 4 columns, 4 rows grid
        const col = Math.floor(nx * 4);
        const row = Math.floor(((ny - 0.22) / 0.6) * 4);
        const index = row * 4 + col;

        if (index >= 0 && index < apps.length) {
          const targetApp = apps[index];
          device.activeAppPackage = targetApp.packageName;
          device.currentActivity = targetApp.appName;
          device.logs.push(`[ActivityTaskManager] startActivity: ${targetApp.packageName}`);
          this.broadcastDeviceUpdate(device.id);
        }
      }
    }
  }

  private ensureStreamLoop(deviceId: string) {
    if (this.frameTimers.has(deviceId)) return;

    // Send frame telemetry and state heartbeat at ~25-30fps
    const timer = setInterval(() => {
      const device = systemState.getDevice(deviceId);
      if (!device) return;

      if (device.status === 'running') {
        // Minor dynamic fluctuations in CPU and RAM to represent real-time OS operation
        device.cpuUsagePercent = Math.min(95, Math.max(8, Math.round(15 + Math.sin(Date.now() / 2000) * 10 + Math.random() * 5)));
        device.uptimeSeconds += 1;
      }

      const payload = JSON.stringify({
        type: 'stream_frame_sync',
        deviceId,
        status: device.status,
        activeApp: device.activeAppPackage || 'com.android.launcher3',
        activity: device.currentActivity || 'LauncherHome',
        resolution: device.resolution,
        cpuUsage: device.cpuUsagePercent,
        ramUsedMb: device.ramUsedMb,
        batteryLevel: device.batteryLevel,
        isCharging: device.isCharging,
        uptimeSeconds: device.uptimeSeconds,
        fps: device.status === 'running' ? 60 : 0,
        timestamp: Date.now(),
      });

      for (const session of this.sessions) {
        if (session.deviceId === deviceId && session.ws.readyState === WebSocket.OPEN) {
          session.ws.send(payload);
        }
      }
    }, 1000); // 1 sec tick for telemetry sync

    this.frameTimers.set(deviceId, timer);
  }

  public broadcastDeviceUpdate(deviceId: string) {
    const device = systemState.getDevice(deviceId);
    if (!device) return;

    const payload = JSON.stringify({
      type: 'device_update',
      device,
    });

    for (const session of this.sessions) {
      if (session.deviceId === deviceId && session.ws.readyState === WebSocket.OPEN) {
        session.ws.send(payload);
      }
    }
  }
}

export const deviceStreamServer = new DeviceStreamServer();
