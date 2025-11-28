import React, { useEffect, useState } from 'react';
import { getStatusColor } from '../utils/statusUtils';

interface StatusBarProps {
    host: string;
    status: 'connected' | 'disconnected' | 'connecting' | 'lost';
}

const StatusBar: React.FC<StatusBarProps> = ({ host, status }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div data-test-id="status-bar" className="w-full h-8 bg-[#1e1e1e] border-t border-[#333] flex items-center justify-between px-4 text-xs font-mono text-[#6272a4] select-none">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
                    <span className={status === 'connected' ? 'text-[#f8f8f2]' : ''}>
                        {status.toUpperCase()}
                    </span>
                </div>
                <div className="h-4 w-[1px] bg-[#444]" />
                <div className="flex items-center gap-2">
                    <span>HOST:</span>
                    <span className="text-[#8be9fd]">{host}</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className='flex items-center gap-1'>
                        <img
                            src="/ironshell.svg"
                            alt="IronShell Logo"
                            className="w-auto h-5"
                        />
                        <span className='uppercase font-bold'>IronShell</span>
                    </div>
                    <span className="text-[#bd93f9]">v1.0.0</span>
                </div>
                <div className="h-4 w-[1px] bg-[#444]" />
                <div className="text-[#f8f8f2]">
                    {time.toLocaleTimeString([], { hour12: false })}
                </div>
            </div>
        </div>
    );
};

export default StatusBar;
