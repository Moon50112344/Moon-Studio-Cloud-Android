import express from 'express';
import http from 'http';
import net from 'net';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { qemuManager } from './server/qemuManager.js';
import { inspectHostHardware } from './server/virtualization.js';

const app = express();
const server = http.createServer(app);
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer temporary disk storage for real APK installation
const uploadDir = '/tmp/apk_uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

// Ensure websockify is running if QEMU is running
qemuManager.ensureWebsockify();

// Transparent WebSocket proxy for noVNC / RFB protocol on /ws/vnc
server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url || '', `http://${request.headers.host}`);

  if (pathname === '/ws/vnc' || pathname.startsWith('/ws/vnc')) {
    qemuManager.ensureWebsockify();

    const proxySocket = net.connect(6080, '127.0.0.1', () => {
      let rawReq = `${request.method} ${request.url} HTTP/${request.httpVersion}\r\n`;
      for (let i = 0; i < request.rawHeaders.length; i += 2) {
        rawReq += `${request.rawHeaders[i]}: ${request.rawHeaders[i + 1]}\r\n`;
      }
      rawReq += '\r\n';

      proxySocket.write(rawReq);
      if (head && head.length > 0) {
        proxySocket.write(head);
      }

      proxySocket.pipe(socket);
      socket.pipe(proxySocket);
    });

    proxySocket.on('error', (err) => {
      console.error('[VNC Proxy Socket Error]', err.message);
      socket.destroy();
    });

    socket.on('error', () => {
      proxySocket.destroy();
    });
  } else {
    socket.destroy();
  }
});

// API Routes for Real Android Emulator & Hardware
app.get('/api/emulator/status', (req, res) => {
  const status = qemuManager.getStatus();
  res.json({ success: true, status });
});

app.post('/api/emulator/start', (req, res) => {
  const result = qemuManager.startEmulator();
  res.json(result);
});

app.post('/api/emulator/stop', (req, res) => {
  const result = qemuManager.stopEmulator();
  res.json(result);
});

app.post('/api/emulator/reset', (req, res) => {
  const result = qemuManager.resetEmulator();
  res.json(result);
});

app.post('/api/emulator/key', (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ success: false, error: 'Missing key' });
  const result = qemuManager.sendKey(key);
  res.json(result);
});

app.post('/api/emulator/install-apk', upload.single('apk'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Vui lòng chọn file APK để cài đặt.' });
  }

  const apkPath = req.file.path;
  const result = qemuManager.installApk(apkPath);

  // Clean up uploaded file after install
  try {
    fs.unlinkSync(apkPath);
  } catch {}

  res.json(result);
});

app.post('/api/emulator/adb', (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ success: false, error: 'Missing command' });
  const result = qemuManager.executeAdb(command);
  res.json(result);
});

app.get('/api/emulator/frame', (req, res) => {
  const frameBase64 = qemuManager.dumpScreenFrame();
  if (!frameBase64) {
    return res.status(503).json({ success: false, error: 'Không thể capture màn hình (Emulator có thể đang tắt)' });
  }
  res.json({ success: true, frame: frameBase64 });
});

app.get('/api/system/host-check', (req, res) => {
  try {
    const diagnostics = inspectHostHardware();
    res.json({ success: true, diagnostics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`[Moon Studio Cloud Android] Server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('[Server Start Error]', err);
  process.exit(1);
});
