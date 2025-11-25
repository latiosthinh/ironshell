import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { Socket } from 'socket.io-client';
import StatusBar from './StatusBar';
import { useStore, ConnectionConfig } from '../store';
import { socketService } from '../socket';

interface TerminalProps {
    config: ConnectionConfig;
    onDisconnect: () => void;
    sessionId: string;
    isActive: boolean;
    onDuplicate: () => void;
}

const Terminal: React.FC<TerminalProps> = ({ config, onDisconnect, isActive, onDuplicate, sessionId }) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);
    const xtermRef = useRef<XTerm | null>(null);
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'lost'>('connecting');
    const { updateSessionStatus, commandCategories, setCommandCategories } = useStore();

    const [suggestion, setSuggestion] = useState('');
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        updateSessionStatus(sessionId, connectionStatus);
    }, [connectionStatus, sessionId, updateSessionStatus]);

    useEffect(() => {
        // Use shared socket service instead of creating new connection
        const socket = socketService.getSocket();
        socketRef.current = socket;

        // Initialize xterm.js
        const term = new XTerm({
            cursorBlink: true,
            fontFamily: '"Fira Code", monospace',
            fontSize: 16,
            lineHeight: 1.2,
            fontWeight: '500',
            theme: {
                background: '#0f0f1a',
                foreground: '#f8f8f2',
                cursor: '#5af78e',
                cursorAccent: '#282a36',
                selectionBackground: 'rgba(90, 247, 142, 0.3)',
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

        // Handle resize
        const resizeObserver = new ResizeObserver(entries => {
            if (!term.element) return;
            if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
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

        if (terminalRef.current) resizeObserver.observe(terminalRef.current);

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
            setConnectionStatus('connected');
            term.write('\r\n*** Connected to backend ***\r\n');
            socket.emit('ssh-connect', { ...config, cols: term.cols, rows: term.rows });

            // Load commands on connect
            console.log('Requesting commands...');
            socket.emit('load-commands');
        });

        // Check if already connected
        if (socket.connected) {
            setConnectionStatus('connected');
            term.write('\r\n*** Connected to backend (Restored) ***\r\n');
            socket.emit('ssh-connect', { ...config, cols: term.cols, rows: term.rows });
            socket.emit('load-commands');
        }

        socket.on('commands-loaded', (categories: Record<string, string[]>) => {
            console.log('Commands loaded:', categories);
            setCommandCategories(categories);
        });

        socket.on('disconnect', () => setConnectionStatus('lost'));

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setConnectionStatus('lost');
        });

        socket.on('reconnect_failed', () => {
            console.error('Socket reconnection failed after maximum attempts');
            setConnectionStatus('disconnected');
            term.write('\r\n*** Failed to connect to server. Please check if the server is running. ***\r\n');
        });

        socket.on('ssh-status', (status: string) => {
            if (status === 'connected') {
                setConnectionStatus('connected');
                term.write(`\r\n*** SSH Connection Established to ${config.host} ***\r\n`);
                term.focus();
            } else if (status === 'disconnected') {
                setConnectionStatus('disconnected');
                term.write('\r\n*** SSH Connection Closed ***\r\n');
                if (onDisconnect) onDisconnect();
            }
        });

        socket.on('ssh-error', (err: string) => term.write(`\r\n*** SSH Error: ${err} ***\r\n`));
        socket.on('term-output', (data: string) => term.write(data));

        term.onData((data) => socket.emit('term-input', data));

        return () => {
            resizeObserver.disconnect();
            if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
            socket.disconnect();
            term.dispose();
        };
    }, [config, onDisconnect, setCommandCategories]);

    const findSuggestion = (input: string) => {
        if (!input.trim()) return '';

        const lowerInput = input.toLowerCase();
        let candidates: string[] = [];

        if (lowerInput.startsWith('git')) {
            candidates = commandCategories.git || [];
        } else if (lowerInput.startsWith('docker')) {
            candidates = commandCategories.docker || [];
        } else {
            candidates = [...(commandCategories.shell || []), ...(commandCategories.custom || [])];
        }

        const match = candidates.find(cmd => cmd.toLowerCase().startsWith(lowerInput));
        if (match) return match;

        const allCommands = [
            ...(commandCategories.git || []),
            ...(commandCategories.docker || []),
            ...(commandCategories.shell || []),
            ...(commandCategories.custom || [])
        ];

        return allCommands.find(cmd => cmd.toLowerCase().startsWith(lowerInput)) || '';
    };

    const handleInputSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && socketRef.current) {
            const input = inputValue;
            if (input.trim()) {
                setHistory(prev => [...prev, input]);
                setHistoryIndex(-1);
                socketRef.current.emit('save-command', input);
            }
            socketRef.current.emit('term-input', input + '\r');
            setInputValue('');
            setSuggestion('');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (history.length > 0) {
                const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
                setHistoryIndex(newIndex);
                setInputValue(history[newIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex !== -1) {
                const newIndex = historyIndex + 1;
                if (newIndex < history.length) {
                    setHistoryIndex(newIndex);
                    setInputValue(history[newIndex]);
                } else {
                    setHistoryIndex(-1);
                    setInputValue('');
                }
            }
        } else if (e.key === 'Tab' || e.key === 'ArrowRight') {
            if (suggestion && suggestion !== inputValue) {
                e.preventDefault();
                setInputValue(suggestion);
            }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        setSuggestion(findSuggestion(value));
    };

    return (
        <div className="flex flex-col h-full w-full">
            <div
                data-component="terminal-container"
                className="flex-1 overflow-hidden bg-[#0f0f1a] p-[15px] pb-0 box-border flex flex-col relative"
            >
                <div className="flex-1 w-full overflow-hidden relative">
                    <div ref={terminalRef} className="absolute inset-0" />
                </div>
            </div>
            <div className="w-full bg-[#0f0f1a] px-4 py-2 border-t border-[#282a36]">
                <div className="flex items-center bg-[#1e1f29] rounded-lg border border-[#282a36] px-3 py-2 focus-within:border-[#50fa7b] transition-colors relative">
                    <span className="text-[#50fa7b] mr-2">➜</span>
                    <div className="flex-1 relative">
                        {/* Ghost text overlay */}
                        <input
                            type="text"
                            className="absolute inset-0 w-full h-full bg-transparent border-none text-[#6272a4] font-mono text-sm focus:outline-none pointer-events-none"
                            value={suggestion}
                            readOnly
                        />
                        <input
                            type="text"
                            className="relative z-10 w-full bg-transparent border-none text-[#f8f8f2] font-mono text-sm focus:outline-none placeholder-[#6272a4]"
                            placeholder="Type a command..."
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyDown={handleInputSubmit}
                            autoFocus
                            spellCheck={false}
                            autoComplete="off"
                        />
                    </div>
                </div>
            </div>
            <StatusBar host={config.host} status={connectionStatus} />
        </div>
    );
};

export default Terminal;
