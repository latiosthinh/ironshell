import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import pkg from 'ssh2';
const { Client } = pkg;
import type { ConnectConfig } from 'ssh2';
import cors from 'cors';
import { spawn } from 'child_process';
import { Duplex } from 'stream';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

// Serve static files from the client build
app.use(express.static(path.join(__dirname, '../client/dist')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

interface SSHConnectConfig {
  host: string;
  port: string | number;
  username: string;
  password?: string;
  rows?: number;
  cols?: number;
}

io.on('connection', (socket: Socket) => {
  console.log('Client connected', socket.id);

  let sshClient = new Client();

  socket.on('ssh-connect', (config: SSHConnectConfig) => {
    console.log('Attempting SSH connection to ' + config.host);

    // Basic validation
    if (!config.host || !config.username) {
      socket.emit('ssh-error', 'Missing host or username');
      return;
    }

    try {
      const isCloudflare = config.host === 'ssh.xueer.space';

      const connectConfig: ConnectConfig = {
        username: config.username,
        password: config.password,
        readyTimeout: 60000,
      };

      if (isCloudflare) {
        console.log('Using cloudflared for connection...');
        const cf = spawn('cloudflared', ['access', 'tcp', '--hostname', config.host], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        cf.stderr.on('data', (data) => {
          console.log(`cloudflared stderr: ${data}`);
        });

        cf.on('error', (err) => {
          console.error('Failed to start cloudflared:', err);
          socket.emit('ssh-error', 'Failed to start cloudflared: ' + err.message);
        });

        const stream = new Duplex({
          read(size) {
            // cloudflared stdout -> this stream
          },
          write(chunk, encoding, callback) {
            // this stream -> cloudflared stdin
            return cf.stdin.write(chunk, encoding as BufferEncoding, callback);
          }
        });

        cf.stdout.on('data', (chunk) => {
          stream.push(chunk);
        });

        cf.stdout.on('end', () => {
          stream.push(null);
        });

        cf.on('close', (code) => {
          console.log(`cloudflared exited with code ${code}`);
          if (code !== 0) {
            socket.emit('ssh-error', `cloudflared exited with code ${code}`);
          }
        });

        connectConfig.sock = stream;
      } else {
        connectConfig.host = config.host;
        connectConfig.port = typeof config.port === 'string' ? parseInt(config.port) : config.port || 22;
      }

      sshClient.on('ready', () => {
        console.log('SSH Client Ready');
        socket.emit('ssh-status', 'connected');

        // Default window size
        const rows = config.rows || 24;
        const cols = config.cols || 80;

        sshClient.shell({ rows, cols }, (err, stream) => {
          if (err) {
            socket.emit('ssh-error', 'Shell error: ' + err.message);
            return;
          }

          socket.on('term-input', (data) => {
            stream.write(data);
          });

          socket.on('term-resize', (size) => {
            if (stream.setWindow) {
              stream.setWindow(size.rows, size.cols, size.height, size.width);
            }
          });

          stream.on('data', (data: Buffer) => {
            socket.emit('term-output', data.toString('utf-8'));
          });

          stream.on('close', () => {
            console.log('Stream :: close');
            socket.emit('ssh-status', 'disconnected');
            sshClient.end();
          });
        });
      }).on('error', (err) => {
        console.error('SSH Client Error:', err);
        socket.emit('ssh-error', 'Connection error: ' + err.message);
      }).on('close', () => {
        console.log('SSH Client Connection Closed');
        socket.emit('ssh-status', 'disconnected');
      }).connect(connectConfig);
    } catch (err: any) {
      socket.emit('ssh-error', 'Init error: ' + err.message);
    }
  });

  socket.on('disconnect', () => {
    if (sshClient) {
      sshClient.end();
    }
    console.log('Client disconnected', socket.id);
  });
});

// Handle client-side routing by serving index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
