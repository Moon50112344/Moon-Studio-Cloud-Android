import React, { useState, useEffect, useRef } from 'react';
import RFB from '@novnc/novnc';
import { api, EmulatorStatus } from '../services/api';
import {
  Play,
  Square,
  RotateCw,
  Terminal,
  Upload,
  Cpu,
  Layers,
  HardDrive,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Maximize2,
  Minimize2,
  ArrowLeft,
  ChevronLeft,
  Circle,
  Square as SquareIcon,
  CornerDownLeft,
  Shield,
  Smartphone,
} from 'lucide-react';

interface DeviceViewerProps {
  onBack?: () => void;
}

export const DeviceViewer: React.FC<DeviceViewerProps> = ({ onBack }) => {
  const [status, setStatus] = useState<EmulatorStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vncConnected, setVncConnected] = useState(false);
  const [vncError, setVncError] = useState<string | null>(null);
  const [fallbackFrame, setFallbackFrame] = useState<string | null>(null);
  const [useFallbackStream, setUseFallbackStream] = useState(false);

  // APK installer state
  const [isUploadingApk, setIsUploadingApk] = useState(false);
  const [apkResult, setApkResult] = useState<{ success: boolean; output: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ADB console state
  const [adbInput, setAdbInput] = useState('adb devices');
  const [adbOutput, setAdbOutput] = useState('Moon Studio Real ADB Bridge. Kết nối trực tiếp vào máy chủ.');
  const [isExecutingAdb, setIsExecutingAdb] = useState(false);

  // RFB / noVNC references
  const vncContainerRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<any>(null);

  // Poll emulator status every 2.5s
  const fetchStatus = async () => {
    try {
      const s = await api.getEmulatorStatus();
      setStatus(s);
    } catch (err: any) {
      console.error('Status fetch error', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2500);
    return () => clearInterval(interval);
  }, []);

  // Connect RFB client when emulator is running
  useEffect(() => {
    if (!status?.isRunning || !vncContainerRef.current) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const vncUrl = `${protocol}//${window.location.host}/ws/vnc`;

    try {
      // Clean up previous instance
      if (rfbRef.current) {
        try {
          rfbRef.current.disconnect();
        } catch {}
      }

      vncContainerRef.current.innerHTML = '';
      const rfb = new RFB(vncContainerRef.current, vncUrl, {
        credentials: { password: '' },
      });

      rfb.scaleViewport = true;
      rfb.resizeSession = false;

      rfb.addEventListener('connect', () => {
        setVncConnected(true);
        setVncError(null);
      });

      rfb.addEventListener('disconnect', (e: any) => {
        setVncConnected(false);
        if (e.detail?.clean === false) {
          setVncError('Mất kết nối RFB đến VNC server của QEMU.');
          setUseFallbackStream(true);
        }
      });

      rfb.addEventListener('securityfailure', (e: any) => {
        setVncError(`Lỗi bảo mật VNC: ${e.detail?.reason || 'Security failure'}`);
        setUseFallbackStream(true);
      });

      rfbRef.current = rfb;
    } catch (err: any) {
      console.error('noVNC initialization error:', err);
      setVncError(err.message);
      setUseFallbackStream(true);
    }

    return () => {
      if (rfbRef.current) {
        try {
          rfbRef.current.disconnect();
        } catch {}
      }
    };
  }, [status?.isRunning]);

  // Fallback frame poller if WebSockets VNC is blocked
  useEffect(() => {
    if (!status?.isRunning || !useFallbackStream) return;

    const interval = setInterval(async () => {
      try {
        const frame = await api.getScreenFrame();
        setFallbackFrame(frame);
      } catch {}
    }, 1000);

    return () => clearInterval(interval);
  }, [status?.isRunning, useFallbackStream]);

  // Key sender
  const handleSendKey = async (key: string) => {
    try {
      await api.sendKey(key);
      // Also try sending via ADB if running
      if (key === 'ret') {
        api.executeAdb('input keyevent 66').catch(() => {});
      } else if (key === 'esc') {
        api.executeAdb('input keyevent 4').catch(() => {});
      } else if (key === 'home') {
        api.executeAdb('input keyevent 3').catch(() => {});
      } else if (key === 'menu') {
        api.executeAdb('input keyevent 187').catch(() => {});
      }
    } catch (err: any) {
      alert(`Lỗi gửi phím: ${err.message}`);
    }
  };

  // APK Upload & Installation
  const handleApkSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingApk(true);
    setApkResult(null);

    try {
      const res = await api.installApk(file);
      setApkResult(res);
      fetchStatus();
    } catch (err: any) {
      setApkResult({ success: false, output: err.message || 'Lỗi cài đặt APK' });
    } finally {
      setIsUploadingApk(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Run ADB command
  const handleRunAdb = async (cmdToRun?: string) => {
    const cmd = cmdToRun || adbInput;
    if (!cmd.trim()) return;

    setIsExecutingAdb(true);
    try {
      const res = await api.executeAdb(cmd);
      setAdbOutput((prev) => `${prev}\n\n$ ${cmd}\n${res.output}`);
    } catch (err: any) {
      setAdbOutput((prev) => `${prev}\n\n$ ${cmd}\n[Error] ${err.message}`);
    } finally {
      setIsExecutingAdb(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Toolbar */}
      <div className="bg-[#0f172a] rounded-xl border border-[#1e293b] p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-slate-400 hover:text-white bg-[#070b14] hover:bg-[#1e293b] rounded-lg transition-colors cursor-pointer border border-[#1e293b]"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Máy ảo Android Thật (QEMU Virtual Device)</h2>
              <span
                className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
                  status?.isRunning
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {status?.isRunning ? 'EMULATOR RUNNING' : 'STOPPED'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-[#1e293b] text-[#2f8bff] font-mono border border-[#334155]">
                {status?.hasKvm ? 'KVM Hardware' : 'TCG Software Emulation'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
              <span>PID: {status?.pid || 'N/A'}</span>
              <span aria-hidden="true">·</span>
              <span>RAM: {status?.memoryMb || 0} MB</span>
              <span aria-hidden="true">·</span>
              <span>CPU: {status?.cpuPercent || 0}%</span>
              <span aria-hidden="true">·</span>
              <span>ADB: {status?.adbConnected ? 'Connected (Port 5555)' : status?.adbState}</span>
            </div>
          </div>
        </div>

        {/* Emulator Control Actions */}
        <div className="flex items-center gap-2">
          {!status?.isRunning ? (
            <button
              onClick={async () => {
                setIsLoading(true);
                await api.startEmulator();
                await fetchStatus();
                setIsLoading(false);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>Khởi động Emulator</span>
            </button>
          ) : (
            <>
              <button
                onClick={async () => {
                  if (confirm('Khởi động lại máy ảo (system_reset)?')) {
                    await api.resetEmulator();
                    await fetchStatus();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#1e293b] hover:bg-[#334155] rounded-lg transition-colors cursor-pointer"
                title="Gửi tín hiệu system_reset"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
              <button
                onClick={async () => {
                  if (confirm('Dừng tiến trình Android Emulator trên máy chủ?')) {
                    await api.stopEmulator();
                    await fetchStatus();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-300 bg-[#1e293b] hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Dừng máy ảo</span>
              </button>
            </>
          )}

          <button
            onClick={fetchStatus}
            title="Làm mới trạng thái"
            className="p-2 text-slate-400 hover:text-white bg-[#070b14] hover:bg-[#1e293b] rounded-lg border border-[#1e293b] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Real Framebuffer Screen on Left (Cols 7), Controls & ADB on Right (Cols 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Real QEMU / Android Display Stream */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-[#0f172a] rounded-xl border border-[#1e293b] p-4">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1e293b] text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    vncConnected ? 'bg-emerald-500' : status?.isRunning ? 'bg-amber-500 animate-pulse' : 'bg-slate-600'
                  }`}
                />
                <span className="font-semibold text-white">
                  Màn hình QEMU Framebuffer (RFB / VNC Port 5900)
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                <span>{vncConnected ? 'Stream Active (60fps)' : 'Stream Connecting'}</span>
                <span aria-hidden="true">·</span>
                <button
                  onClick={() => setUseFallbackStream(!useFallbackStream)}
                  className="text-[#2f8bff] hover:underline cursor-pointer"
                >
                  {useFallbackStream ? 'Chế độ RFB' : 'Chế độ Snapshot'}
                </button>
              </div>
            </div>

            {/* Direct Screen Canvas Container */}
            <div className="relative bg-black rounded-lg overflow-hidden border border-slate-900 aspect-[4/3] flex items-center justify-center">
              {!status?.isRunning ? (
                <div className="p-8 text-center space-y-3">
                  <XCircle className="w-12 h-12 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Android Emulator hiện chưa chạy</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Nhấn nút "Khởi động Emulator" phía trên để nạp tệp Android ISO và chạy hệ điều hành thật.
                  </p>
                  <button
                    onClick={async () => {
                      setIsLoading(true);
                      await api.startEmulator();
                      await fetchStatus();
                      setIsLoading(false);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg cursor-pointer transition-colors shadow-lg"
                  >
                    <Play className="w-4 h-4" />
                    <span>Bật máy ảo Android ngay</span>
                  </button>
                </div>
              ) : useFallbackStream && fallbackFrame ? (
                <img
                  src={fallbackFrame}
                  alt="Real QEMU Screen Frame"
                  className="w-full h-full object-contain select-none"
                />
              ) : (
                <div
                  ref={vncContainerRef}
                  className="w-full h-full flex items-center justify-center cursor-crosshair overflow-hidden"
                />
              )}
            </div>

            {/* Real Hardware Keyboard & Android Action Dispatcher */}
            <div className="mt-4 pt-3 border-t border-[#1e293b] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-mono text-[11px] mr-1">Điều khiển thật:</span>

                {/* Enter / Select */}
                <button
                  onClick={() => handleSendKey('ret')}
                  disabled={!status?.isRunning}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#1e293b] hover:bg-[#2575db] hover:text-white rounded text-slate-200 transition-colors font-mono cursor-pointer disabled:opacity-50"
                  title="Nhấn phím Enter để chọn mục trong menu khởi động Android"
                >
                  <CornerDownLeft className="w-3.5 h-3.5 text-[#2f8bff]" />
                  <span>Enter / Boot</span>
                </button>

                {/* Back Key */}
                <button
                  onClick={() => handleSendKey('esc')}
                  disabled={!status?.isRunning}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] rounded text-slate-200 transition-colors font-mono cursor-pointer disabled:opacity-50"
                  title="Gửi phím ESC / KEYCODE_BACK đến Android"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back (ESC)</span>
                </button>

                {/* Home Key */}
                <button
                  onClick={() => handleSendKey('home')}
                  disabled={!status?.isRunning}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] rounded text-slate-200 transition-colors font-mono cursor-pointer disabled:opacity-50"
                  title="Gửi phím HOME đến Android"
                >
                  <Circle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Home</span>
                </button>

                {/* Recent Apps */}
                <button
                  onClick={() => handleSendKey('menu')}
                  disabled={!status?.isRunning}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] rounded text-slate-200 transition-colors font-mono cursor-pointer disabled:opacity-50"
                  title="Gửi phím MENU / KEYCODE_APP_SWITCH đến Android"
                >
                  <SquareIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Recents</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>VNC: 127.0.0.1:5900</span>
                <span aria-hidden="true">·</span>
                <span>WS: :6080</span>
              </div>
            </div>
          </div>

          {/* Real System Image & Hardware Verification Banner (Requirement 8) */}
          <div className="p-4 bg-[#0f172a] rounded-xl border border-[#1e293b] space-y-2 text-xs">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Xác nhận tính xác thực của môi trường ảo hóa</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px] pt-1">
              <div className="p-2.5 rounded bg-[#070b14] border border-[#1e293b]">
                <span className="text-slate-500 block">Tệp OS Image</span>
                <span className="text-slate-200 block truncate">{status?.imagePath}</span>
                <span className="text-emerald-400 block mt-0.5">{status?.imageSizeMb} MB (Đã xác minh)</span>
              </div>
              <div className="p-2.5 rounded bg-[#070b14] border border-[#1e293b]">
                <span className="text-slate-500 block">Tiến trình QEMU</span>
                <span className="text-slate-200 block">qemu-system-x86_64</span>
                <span className="text-emerald-400 block mt-0.5">PID {status?.pid || 'None'}</span>
              </div>
              <div className="p-2.5 rounded bg-[#070b14] border border-[#1e293b]">
                <span className="text-slate-500 block">Tăng tốc KVM</span>
                <span className="text-slate-200 block">{status?.hasKvm ? 'Bật (/dev/kvm)' : 'Chưa bật KVM'}</span>
                <span className={status?.hasKvm ? 'text-emerald-400' : 'text-amber-400'}>
                  {status?.hasKvm ? 'Hardware Passthrough' : 'Chạy TCG Emulation'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Real APK Installer & Real ADB Shell Console (Requirements 6 & 7) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Real APK Installer Card */}
          <div className="p-5 bg-[#0f172a] rounded-xl border border-[#1e293b] space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#2f8bff]" />
                <span>Cài đặt APK vào Emulator thật</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Thực thi lệnh <code className="text-[#2f8bff] font-mono">adb install -r &lt;file&gt;</code> trực tiếp vào hệ thống Android.
              </p>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#1e293b] hover:border-[#2f8bff] bg-[#070b14] rounded-xl p-5 text-center cursor-pointer transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".apk"
                onChange={handleApkSelected}
                className="hidden"
              />
              <Upload className="w-6 h-6 text-[#2f8bff] mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-white">Chọn tệp APK thực tế từ máy tính</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Hỗ trợ các gói cài đặt Android (.apk)</p>
            </div>

            {isUploadingApk && (
              <div className="p-3 bg-[#070b14] rounded-lg border border-[#1e293b] text-xs text-[#2f8bff] flex items-center gap-2 font-mono">
                <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                <span>Đang upload và thực thi adb install...</span>
              </div>
            )}

            {apkResult && (
              <div
                className={`p-3 rounded-lg text-xs font-mono space-y-1 ${
                  apkResult.success
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                    : 'bg-rose-950/60 text-rose-300 border border-rose-800'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  {apkResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  )}
                  <span>{apkResult.success ? 'Cài đặt thành công!' : 'Kết quả cài đặt APK:'}</span>
                </div>
                <pre className="text-[11px] whitespace-pre-wrap overflow-x-auto max-h-28">
                  {apkResult.output}
                </pre>
              </div>
            )}
          </div>

          {/* 2. Real ADB Shell Console Card */}
          <div className="p-5 bg-[#0f172a] rounded-xl border border-[#1e293b] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Cửa sổ dòng lệnh ADB Shell Thật</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gửi lệnh trực tiếp đến Android OS qua daemon cổng 5555.
                </p>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#070b14] text-emerald-400 border border-slate-800">
                adb :5555
              </span>
            </div>

            {/* Quick command pills */}
            <div className="flex flex-wrap gap-1.5 text-xs font-mono">
              <button
                onClick={() => handleRunAdb('adb devices')}
                className="px-2 py-1 bg-[#070b14] hover:bg-[#1e293b] border border-[#1e293b] rounded text-slate-300 cursor-pointer"
              >
                adb devices
              </button>
              <button
                onClick={() => handleRunAdb('getprop ro.build.version.release')}
                className="px-2 py-1 bg-[#070b14] hover:bg-[#1e293b] border border-[#1e293b] rounded text-slate-300 cursor-pointer"
              >
                getprop version
              </button>
              <button
                onClick={() => handleRunAdb('pm list packages')}
                className="px-2 py-1 bg-[#070b14] hover:bg-[#1e293b] border border-[#1e293b] rounded text-slate-300 cursor-pointer"
              >
                pm list packages
              </button>
              <button
                onClick={() => handleRunAdb('uname -a')}
                className="px-2 py-1 bg-[#070b14] hover:bg-[#1e293b] border border-[#1e293b] rounded text-slate-300 cursor-pointer"
              >
                uname -a
              </button>
              <button
                onClick={() => handleRunAdb('df -h')}
                className="px-2 py-1 bg-[#070b14] hover:bg-[#1e293b] border border-[#1e293b] rounded text-slate-300 cursor-pointer"
              >
                df -h
              </button>
            </div>

            {/* Terminal Output */}
            <div className="bg-black rounded-lg p-3 font-mono text-xs text-emerald-400 h-56 overflow-y-auto whitespace-pre-wrap border border-slate-900 leading-relaxed">
              {adbOutput}
            </div>

            {/* Terminal Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunAdb();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={adbInput}
                onChange={(e) => setAdbInput(e.target.value)}
                placeholder="Nhập lệnh adb shell..."
                className="flex-1 bg-[#070b14] border border-[#1e293b] rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-[#2f8bff]"
              />
              <button
                type="submit"
                disabled={isExecutingAdb}
                className="px-4 py-1.5 bg-[#2f8bff] hover:bg-[#2575db] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {isExecutingAdb ? 'Chạy...' : 'Thực thi'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
