import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { io, Socket } from 'socket.io-client';

interface ConnectionConfig {
    host: string;
    port: string;
    username: string;
    password?: string;
}

interface TerminalProps {
    config: ConnectionConfig;
    onDisconnect: () => void;
}

const Terminal: React.FC<TerminalProps> = ({ config, onDisconnect }) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);
    const xtermRef = useRef<XTerm | null>(null);
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Initialize Socket.io
        // Use relative path for single-port setup, fall back to env var for dev
        const serverUrl = import.meta.env.PROD ? '/' : (import.meta.env.VITE_SERVER_URL || 'http://localhost:50000');
        const socket = io(serverUrl);
        socketRef.current = socket;

        // Initialize xterm.js
        const term = new XTerm({
            cursorBlink: true,
            fontFamily: '"Fira Code", monospace',
            fontSize: 16, // Larger font for clarity
            lineHeight: 1.2, // More breathing room
            fontWeight: '500',
            theme: {
                background: '#0f0f1a', // Matches app background
                foreground: '#f8f8f2', // High contrast text
                cursor: '#5af78e', // Bright green cursor (like robbyrussell success)
                cursorAccent: '#282a36',
                selectionBackground: 'rgba(90, 247, 142, 0.3)',

                // Vibrant ANSI colors for zsh themes
                black: '#21222c',
                red: '#ff5555',
                green: '#50fa7b',
                yellow: '#f1fa8c',
                blue: '#bd93f9',
                magenta: '#ff79c6',
                cyan: '#8be9fd',
                white: '#f8f8f2',

                brightBlack: '#6272a4',
                brightRed: '#ff6e6e',
                brightGreen: '#69ff94',
                brightYellow: '#ffffa5',
                brightBlue: '#d6acff',
                brightMagenta: '#ff92df',
                brightCyan: '#a4ffff',
                brightWhite: '#ffffff',
            },
        });
        xtermRef.current = term;

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.loadAddon(new WebLinksAddon());

        term.open(terminalRef.current as HTMLDivElement);

        // Handle resize with ResizeObserver
        const resizeObserver = new ResizeObserver(entries => {
            if (!term.element) return;

            // Debounce resize
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }

            resizeTimeoutRef.current = setTimeout(() => {
                try {
                    const { width, height } = entries[0].contentRect;
                    if (width === 0 || height === 0) return;

                    fitAddon.fit();

                    if (socket.connected) {
                        socket.emit('term-resize', { cols: term.cols, rows: term.rows });
                    }
                } catch (e) {
                    console.warn('Resize error suppressed:', e);
                }
            }, 50);
        });

        if (terminalRef.current) {
            resizeObserver.observe(terminalRef.current);
        }

        // Initial fit and connect
        setTimeout(() => {
            try {
                fitAddon.fit();
                term.write('Welcome to IronShell\r\n');
            } catch (e) {
                console.warn('Initial fit error:', e);
            }
        }, 100);

        // Socket events
        socket.on('connect', () => {
            term.write('\r\n*** Connected to backend ***\r\n');
            socket.emit('ssh-connect', {
                ...config,
                cols: term.cols,
                rows: term.rows
            });
        });

        socket.on('ssh-status', (status: string) => {
            if (status === 'connected') {
                term.write('\r\n*** SSH Connection Established ***\r\n');
                term.focus();
            } else if (status === 'disconnected') {
                term.write('\r\n*** SSH Connection Closed ***\r\n');
                if (onDisconnect) onDisconnect();
            }
        });

        socket.on('ssh-error', (err: string) => {
            term.write(`\r\n*** SSH Error: ${err} ***\r\n`);
        });

        socket.on('term-output', (data: string) => {
            term.write(data);
        });

        // Terminal input
        term.onData((data) => {
            socket.emit('term-input', data);
        });

        // Cleanup
        return () => {
            resizeObserver.disconnect();
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
            socket.disconnect();
            term.dispose();
        };
    }, [config, onDisconnect]);

    return (
        <div
            className="terminal-container"
            style={{
                width: '100%',
                height: '100vh',
                overflow: 'hidden',
                background: '#0f0f1a',
                padding: '15px',
                boxSizing: 'border-box',
                border: '2px solid #50fa7b'
            }}
        >
            <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
};

export default Terminal;
