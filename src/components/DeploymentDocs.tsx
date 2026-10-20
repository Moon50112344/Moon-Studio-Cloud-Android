import React, { useState } from 'react';
import { Copy, Check, Terminal, Server, Shield, Layers, DollarSign, Cpu } from 'lucide-react';

export const DeploymentDocs: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const kernelScript = `# 1. Cập nhật hệ thống Ubuntu 22.04 / 24.04 LTS
sudo apt-get update && sudo apt-get upgrade -y

# 2. Cài đặt các gói kernel modules cần thiết cho Android Binderfs
sudo apt-get install -y linux-modules-extra-$(uname -r)
sudo apt-get install -y qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils adb

# 3. Kích hoạt và cấp quyền truy cập KVM
sudo usermod -aG kvm $USER
sudo chmod 666 /dev/kvm

# 4. Tải và nạp module binderfs
sudo modprobe binder_linux devices="binder,hwbinder,vndbinder"
sudo modprobe ashmem_linux || true

# 5. Kiểm tra module hoạt động
ls -l /dev/binderfs || ls -l /dev/binder
ls -l /dev/kvm`;

  const dockerCompose = `version: '3.8'

services:
  # Android 14 Container (Redroid Engine with Hardware KVM & SwiftShader / GPU)
  moon-phone-01:
    image: redroid/redroid:14.0.0-latest
    container_name: moon_android_14_01
    privileged: true
    restart: always
    ports:
      - "5555:5555" # ADB port
    volumes:
      - /data/moon_android_01:/data
    devices:
      - /dev/kvm:/dev/kvm
    command:
      - "androidboot.redroid_width=1080"
      - "androidboot.redroid_height=1920"
      - "androidboot.redroid_dpi=420"
      - "androidboot.redroid_fps=60"
      - "androidboot.redroid_gpu_mode=guest" # hoặc "host" nếu có card NVIDIA/Intel
      - "ro.secure=0"
      - "ro.debuggable=1"

  # WebRTC / WebSocket Low-Latency Streaming Bridge (ws-scrcpy)
  scrcpy-streamer:
    image: genymobile/scrcpy:latest
    container_name: moon_scrcpy_bridge
    restart: always
    network_mode: "host"
    environment:
      - ADB_SERVER_SOCKET=tcp:localhost:5555
    depends_on:
      - moon-phone-01`;

  const nginxConfig = `server {
    listen 80;
    server_name cloudphone.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cloudphone.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/cloudphone.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cloudphone.yourdomain.com/privkey.pem;

    # Frontend & Backend API
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # WebSocket Low-Latency Stream
    location /ws/stream {
        proxy_pass http://127.0.0.1:3000/ws/stream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}`;

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-[#0f172a] rounded-xl border border-[#1e293b] p-6">
        <div className="flex items-center gap-3 pb-5 border-b border-[#1e293b]">
          <div className="w-11 h-11 rounded-lg bg-[#070b14] border border-[#2f8bff]/30 flex items-center justify-center">
            <Server className="w-6 h-6 text-[#2f8bff]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Kiến trúc & Hướng dẫn Triển khai Thực tế (Production)</h2>
            <p className="text-xs text-slate-400">
              Mô hình triển khai hệ thống máy ảo Android thật trên máy chủ Linux Bare-Metal có KVM (như VSPhone / Redroid).
            </p>
          </div>
        </div>

        {/* Cost & Architecture Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          <div className="p-4 rounded-xl bg-[#070b14] border border-[#1e293b] space-y-1.5">
            <span className="text-xs font-semibold text-[#2f8bff] flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              <span>Dự toán Ngân sách Tối ưu</span>
            </span>
            <div className="text-lg font-bold font-mono text-white">~€35 - €45 / tháng</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Thuê máy chủ Dedicated Bare-metal tại Hetzner (AX41 / EX44) hoặc OVH: AMD Ryzen 5 / Intel Core i5, 64GB RAM, NVMe SSD chạy được từ 16 đến 24 máy ảo Android 14 đồng thời.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#070b14] border border-[#1e293b] space-y-1.5">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <Cpu className="w-4 h-4" />
              <span>Công nghệ Ảo hóa Cốt lõi</span>
            </span>
            <div className="text-lg font-bold font-mono text-white">Linux KVM + Redroid</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Android chạy native container trên Linux kernel thông qua driver Binderfs và ashmem, tối ưu 85% hiệu năng so với giải pháp chạy emulator lồng QEMU thuần túy.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#070b14] border border-[#1e293b] space-y-1.5">
            <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              <span>Giao thức Truyền phát Màn hình</span>
            </span>
            <div className="text-lg font-bold font-mono text-white">WebRTC / Scrcpy H.264</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Truyền tải khung hình 60 FPS độ trễ cực thấp (15ms - 35ms) trực tiếp vào thẻ HTML5 Video/Canvas trên trình duyệt, không cần cài đặt phần mềm bên thứ ba.
            </p>
          </div>
        </div>

        {/* Step 1: Kernel Prep */}
        <div className="space-y-3 pt-4 border-t border-[#1e293b]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#1e293b] text-[#2f8bff] flex items-center justify-center text-xs font-mono font-bold">
                1
              </span>
              <span>Cấu hình Kernel & Cài đặt Module KVM Binderfs (Ubuntu/Debian)</span>
            </h3>
            <button
              onClick={() => copyToClipboard('kernel', kernelScript)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-[#1e293b] hover:bg-[#334155] text-slate-300 rounded cursor-pointer transition-colors"
            >
              {copiedKey === 'kernel' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'kernel' ? 'Đã sao chép' : 'Sao chép lệnh'}</span>
            </button>
          </div>
          <pre className="bg-[#070b14] p-4 rounded-xl border border-[#1e293b] font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
            {kernelScript}
          </pre>
        </div>

        {/* Step 2: Docker Compose */}
        <div className="space-y-3 pt-6 border-t border-[#1e293b]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#1e293b] text-[#2f8bff] flex items-center justify-center text-xs font-mono font-bold">
                2
              </span>
              <span>Khởi chạy Redroid Container qua docker-compose.yml</span>
            </h3>
            <button
              onClick={() => copyToClipboard('docker', dockerCompose)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-[#1e293b] hover:bg-[#334155] text-slate-300 rounded cursor-pointer transition-colors"
            >
              {copiedKey === 'docker' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'docker' ? 'Đã sao chép' : 'Sao chép YAML'}</span>
            </button>
          </div>
          <pre className="bg-[#070b14] p-4 rounded-xl border border-[#1e293b] font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed">
            {dockerCompose}
          </pre>
        </div>

        {/* Step 3: Nginx Reverse Proxy */}
        <div className="space-y-3 pt-6 border-t border-[#1e293b]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#1e293b] text-[#2f8bff] flex items-center justify-center text-xs font-mono font-bold">
                3
              </span>
              <span>Cấu hình Nginx Reverse Proxy & HTTPS TLS (WebSocket Streaming)</span>
            </h3>
            <button
              onClick={() => copyToClipboard('nginx', nginxConfig)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-[#1e293b] hover:bg-[#334155] text-slate-300 rounded cursor-pointer transition-colors"
            >
              {copiedKey === 'nginx' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'nginx' ? 'Đã sao chép' : 'Sao chép Nginx'}</span>
            </button>
          </div>
          <pre className="bg-[#070b14] p-4 rounded-xl border border-[#1e293b] font-mono text-xs text-sky-400 overflow-x-auto leading-relaxed">
            {nginxConfig}
          </pre>
        </div>
      </div>
    </div>
  );
};
