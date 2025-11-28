import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { io, Socket } from 'socket.io-client';
import StatusBar from './StatusBar';

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
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

    const onDisconnectRef = useRef(onDisconnect);

    useEffect(() => {
        onDisconnectRef.current = onDisconnect;
    }, [onDisconnect]);

    useEffect(() => {
        // Initialize Socket.io
        // Use relative path for single-port setup, fall back to env var for dev
        const serverUrl = import.meta.env.PROD ? '/' : (import.meta.env.VITE_SERVER_URL || 'http://localhost:50000');
        const socket = io(serverUrl);
        socketRef.current = socket;

        // Initialize xterm.js
        const term = new XTerm({
            cursorBlink: true,
            fontFamily: '"MesloLGS NF", "Fira Code", monospace',
            fontSize: 14, // Slightly smaller for p10k density
            lineHeight: 1.1, // Tighter line height for powerline glyphs
            fontWeight: 'normal',
            theme: {
                background: '#0f0f1a', // Matches app background
                foreground: '#f8f8f2', // High contrast text
                cursor: '#5af78e', // Bright green cursor
                cursorAccent: '#282a36',
                selectionBackground: 'rgba(90, 247, 142, 0.3)',

                // Vibrant ANSI colors
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
                const logoLines = [
                    '         ####                                                                                       ',
                    '      ##### ####                                                                                    ',
                    ' ##########    #####    ### ########  #######  #### ###  ######  ###  ### ######## ###     ###      ',
                    ' ##########        #    ### ###  ### ###   ### ########  ####### ###  ### ###      ###     ###      ',
                    ' ##########        #    ### ######## ###   ############   #####  ######## #######  ###     ###      ',
                    ' ##########       ##    ### ### #### ###   ### ### ####  ### ### ###  ### ###      ###     ###      ',
                    '  ######### ##### ##    ### ###  #### #######  ### ####   ###### ###  ### ######## ####### #######  ',
                    '   ########      ##                                                                                 ',
                    '    #######     ##                                                                                  ',
                    '     ######  ####                                                                                   ',
                    '       #######                                                                                      '
                ];

                const startColor = { r: 109, g: 236, b: 174 }; // #6decae
                const endColor = { r: 129, g: 128, b: 255 };   // #8180ff
                const maxLength = Math.max(...logoLines.map(line => line.length));

                const coloredLogo = logoLines.map(line => {
                    let coloredLine = '';
                    for (let i = 0; i < line.length; i++) {
                        const char = line[i];
                        if (char === ' ') {
                            coloredLine += char;
                            continue;
                        }
                        const ratio = i / maxLength;
                        const r = Math.round(startColor.r + (endColor.r - startColor.r) * ratio);
                        const g = Math.round(startColor.g + (endColor.g - startColor.g) * ratio);
                        const b = Math.round(startColor.b + (endColor.b - startColor.b) * ratio);
                        coloredLine += `\x1b[38;2;${r};${g};${b}m${char}`;
                    }
                    return coloredLine + '\x1b[0m';
                }).join('\r\n');

                term.write(coloredLogo + '\r\n');
            } catch (e) {
                console.warn('Initial fit error:', e);
            }
        }, 100);

        // Socket events
        socket.on('connect', () => {
            setConnectionStatus('connected');
            term.write(`\r\n**************************** IRONSHELL v1.0.0 ****************************\r\n`);
            socket.emit('ssh-connect', {
                ...config,
                cols: term.cols,
                rows: term.rows
            });
        });

        socket.on('disconnect', () => {
            setConnectionStatus('disconnected');
        });

        socket.on('ssh-status', (status: string) => {
            if (status === 'connected') {
                setConnectionStatus('connected');
                term.write(`\r\n*** SSH Connection Established to ${config.host} ***\r\n`);
                term.focus();
            } else if (status === 'disconnected') {
                setConnectionStatus('disconnected');
                term.write('\r\n*** SSH Connection Closed ***\r\n');
                if (onDisconnectRef.current) onDisconnectRef.current();
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
    }, [config]);

    return (
        <>
            <div
                data-component="terminal-container"
                className="w-full h-full max-h-[100svh] overflow-hidden bg-[#0f0f1a] p-[15px] pb-0 box-border flex flex-col"
            >
                <div className="flex-1 w-full overflow-hidden relative">
                    <div ref={terminalRef} className="absolute inset-0" />
                </div>
            </div>
            <StatusBar host={config.host} status={connectionStatus} />
        </>
    );
};

export default Terminal;
