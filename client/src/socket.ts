import { io, Socket } from 'socket.io-client';

class SocketService {
    private socket: Socket | null = null;
    private isInitialized = false;

    initialize() {
        if (this.isInitialized) {
            return this.socket!;
        }

        const serverUrl = import.meta.env.PROD ? '/' : (import.meta.env.VITE_SERVER_URL || 'http://localhost:50000');

        this.socket = io(serverUrl, {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 10000,
            autoConnect: true,
        });

        this.isInitialized = true;

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket?.id);
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        return this.socket;
    }

    getSocket(): Socket {
        if (!this.socket) {
            return this.initialize();
        }
        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isInitialized = false;
        }
    }
}

export const socketService = new SocketService();
