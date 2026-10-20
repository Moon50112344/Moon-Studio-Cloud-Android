import { execSync, spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

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

class QemuManager {
  private qemuProcess: ChildProcess | null = null;
  private websockifyProcess: ChildProcess | null = null;
  private monitorSocketPath = '/tmp/qemu-monitor.sock';
  private imagePath = '/var/android/android-x86.iso';
  private vncPort = 5900;
  private websockifyPort = 6080;
  private adbPort = 5555;
  private logs: string[] = [];

  constructor() {
    this.ensureDirectories();
    this.detectRunningProcesses();
  }

  private log(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    const formatted = `[${timestamp}] ${message}`;
    console.log(formatted);
    this.logs.push(formatted);
    if (this.logs.length > 100) this.logs.shift();
  }

  private ensureDirectories() {
    if (!fs.existsSync('/var/android')) {
      try {
        fs.mkdirSync('/var/android', { recursive: true });
      } catch (err) {
        console.error('Failed to create /var/android', err);
      }
    }
  }

  public detectRunningProcesses(): boolean {
    try {
      const psOutput = execSync('ps aux | grep qemu-system-x86_64 | grep -v grep || true', {
        encoding: 'utf-8',
      }).trim();

      if (psOutput) {
        const parts = psOutput.split(/\s+/);
        const pid = parseInt(parts[1], 10);
        this.log(`Detected existing QEMU process (PID ${pid})`);
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }

  public getStatus(): EmulatorStatus {
    const hasKvm = fs.existsSync('/dev/kvm');
    const imageExists = fs.existsSync(this.imagePath);
    let imageSizeMb = 0;

    if (imageExists) {
      try {
        const stat = fs.statSync(this.imagePath);
        imageSizeMb = Math.round(stat.size / (1024 * 1024));
      } catch {
        imageSizeMb = 0;
      }
    }

    let isRunning = false;
    let pid: number | null = null;
    let cpuPercent = 0;
    let memoryMb = 0;

    try {
      const psOutput = execSync('ps aux | grep qemu-system-x86_64 | grep -v grep || true', {
        encoding: 'utf-8',
      }).trim();

      if (psOutput) {
        const parts = psOutput.split(/\s+/);
        pid = parseInt(parts[1], 10);
        cpuPercent = parseFloat(parts[2]) || 0;
        const rssKb = parseInt(parts[5], 10) || 0;
        memoryMb = Math.round(rssKb / 1024);
        isRunning = true;
      }
    } catch {
      isRunning = false;
    }

    let websockifyRunning = false;
    try {
      const wsOutput = execSync('ps aux | grep websockify | grep -v grep || true', {
        encoding: 'utf-8',
      }).trim();
      websockifyRunning = !!wsOutput;
    } catch {
      websockifyRunning = false;
    }

    let adbConnected = false;
    let adbState = 'disconnected';
    let bootCompleted = false;

    if (isRunning) {
      try {
        const adbDevices = execSync('adb devices', { timeout: 1500, encoding: 'utf-8' });
        if (adbDevices.includes('localhost:5555') || adbDevices.includes('127.0.0.1:5555')) {
          if (adbDevices.includes('device')) {
            adbConnected = true;
            adbState = 'device';
          } else if (adbDevices.includes('offline')) {
            adbState = 'offline';
          }
        }
      } catch {
        adbConnected = false;
      }

      if (adbConnected) {
        try {
          const bootProp = execSync('adb -s 127.0.0.1:5555 shell getprop sys.boot_completed', {
            timeout: 1500,
            encoding: 'utf-8',
          }).trim();
          bootCompleted = bootProp === '1';
        } catch {
          bootCompleted = false;
        }
      }
    }

    return {
      isRunning,
      pid,
      cpuPercent,
      memoryMb,
      imageExists,
      imagePath: this.imagePath,
      imageSizeMb,
      hasKvm,
      vncPort: this.vncPort,
      websockifyPort: this.websockifyPort,
      websockifyRunning,
      adbPort: this.adbPort,
      adbConnected,
      adbState,
      bootCompleted,
      lastLogs: this.logs.slice(-20),
    };
  }

  public ensureWebsockify() {
    try {
      const running = execSync('ps aux | grep websockify | grep -v grep || true', {
        encoding: 'utf-8',
      }).trim();
      if (!running) {
        this.log('Starting websockify bridge (6080 -> 5900)...');
        execSync(`websockify -D 127.0.0.1:${this.websockifyPort} 127.0.0.1:${this.vncPort}`);
      }
    } catch (err: any) {
      this.log(`Websockify start error: ${err.message}`);
    }
  }

  public startEmulator(): { success: boolean; message: string } {
    if (!fs.existsSync(this.imagePath)) {
      return {
        success: false,
        message: `Không tìm thấy file Android system image tại ${this.imagePath}. Vui lòng tải về hoặc cấu hình đường dẫn image.`,
      };
    }

    if (this.detectRunningProcesses()) {
      this.ensureWebsockify();
      return {
        success: true,
        message: 'Máy ảo Android QEMU đã đang chạy trên máy chủ.',
      };
    }

    try {
      if (fs.existsSync(this.monitorSocketPath)) {
        fs.unlinkSync(this.monitorSocketPath);
      }

      const hasKvm = fs.existsSync('/dev/kvm');
      const accel = hasKvm ? 'kvm' : 'tcg';

      const cmd = `qemu-system-x86_64 -m 1536M -smp 2 -accel ${accel} -cdrom ${this.imagePath} -boot d -vnc 127.0.0.1:0 -monitor unix:${this.monitorSocketPath},server,nowait -net nic,model=virtio -net user,hostfwd=tcp::${this.adbPort}-:5555 -daemonize`;

      this.log(`Launching real QEMU emulator: ${cmd}`);
      execSync(cmd);

      // Start websockify bridge
      this.ensureWebsockify();

      // Automatically send 'ret' (Enter) after 2 seconds to select Live CD
      setTimeout(() => {
        this.sendKey('ret');
        this.log('Selected default Android Live CD boot option in GRUB.');
      }, 2000);

      return {
        success: true,
        message: `Đã khởi động tiến trình QEMU Android Emulator (${accel.toUpperCase()} Mode) thành công.`,
      };
    } catch (err: any) {
      this.log(`QEMU Start failed: ${err.message}`);
      return {
        success: false,
        message: `Lỗi khởi động QEMU: ${err.message}`,
      };
    }
  }

  public stopEmulator(): { success: boolean; message: string } {
    try {
      this.log('Terminating QEMU process...');
      execSync('killall -9 qemu-system-x86_64 || pkill -9 qemu-system || true');
      if (fs.existsSync(this.monitorSocketPath)) {
        fs.unlinkSync(this.monitorSocketPath);
      }
      return { success: true, message: 'Đã dừng máy ảo Android thành công.' };
    } catch (err: any) {
      return { success: false, message: `Lỗi khi dừng máy ảo: ${err.message}` };
    }
  }

  public resetEmulator(): { success: boolean; message: string } {
    try {
      this.sendMonitorCommand('system_reset');
      this.log('Sent system_reset signal to QEMU monitor.');
      return { success: true, message: 'Đã khởi động lại máy ảo (system_reset).' };
    } catch (err: any) {
      return { success: false, message: `Lỗi reset máy ảo: ${err.message}` };
    }
  }

  public sendMonitorCommand(cmd: string): string {
    if (!fs.existsSync(this.monitorSocketPath)) {
      throw new Error('QEMU Monitor socket không khả dụng. Máy ảo có thể đang tắt.');
    }
    try {
      return execSync(`echo "${cmd}" | socat - UNIX-CONNECT:${this.monitorSocketPath}`, {
        timeout: 2000,
        encoding: 'utf-8',
      });
    } catch (err: any) {
      throw new Error(`Monitor command failed: ${err.message}`);
    }
  }

  public sendKey(key: string): { success: boolean; output: string } {
    try {
      const res = this.sendMonitorCommand(`sendkey ${key}`);
      return { success: true, output: res };
    } catch (err: any) {
      return { success: false, output: err.message };
    }
  }

  public executeAdb(command: string): { success: boolean; output: string } {
    const trimmed = command.trim();
    try {
      // Connect first if needed
      execSync(`adb connect 127.0.0.1:${this.adbPort} 2>&1 || true`, { timeout: 2000 });
      const fullCmd = trimmed.startsWith('adb')
        ? trimmed
        : `adb -s 127.0.0.1:${this.adbPort} shell ${trimmed}`;

      const output = execSync(fullCmd, { timeout: 10000, encoding: 'utf-8' });
      return { success: true, output };
    } catch (err: any) {
      return {
        success: false,
        output: err.stdout || err.stderr || err.message,
      };
    }
  }

  public installApk(apkPath: string): { success: boolean; output: string } {
    try {
      execSync(`adb connect 127.0.0.1:${this.adbPort} 2>&1 || true`, { timeout: 2000 });
      const cmd = `adb -s 127.0.0.1:${this.adbPort} install -r "${apkPath}"`;
      this.log(`Executing real APK installation: ${cmd}`);
      const output = execSync(cmd, { timeout: 30000, encoding: 'utf-8' });
      return { success: true, output };
    } catch (err: any) {
      return {
        success: false,
        output: err.stdout || err.stderr || err.message,
      };
    }
  }

  public dumpScreenFrame(): string | null {
    try {
      const ppmPath = '/tmp/qemu_screendump.ppm';
      const pngPath = '/tmp/qemu_screendump.png';
      this.sendMonitorCommand(`screendump ${ppmPath}`);
      execSync(`ffmpeg -y -i ${ppmPath} ${pngPath} 2>/dev/null`);
      if (fs.existsSync(pngPath)) {
        const buffer = fs.readFileSync(pngPath);
        return `data:image/png;base64,${buffer.toString('base64')}`;
      }
    } catch (err) {
      // ignore
    }
    return null;
  }
}

export const qemuManager = new QemuManager();
