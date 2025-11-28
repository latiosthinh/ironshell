import React from 'react';
import { useStore } from '../store';

import { getStatusColor } from '../utils/statusUtils';

interface TabBarProps {
    onNewTab: () => void;
    onCloseSession: (id: string) => void;
    onSwitchSession: (id: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({
    onNewTab,
    onCloseSession,
    onSwitchSession
}) => {
    const { sessions, activeSessionId, updateSessionTitle } = useStore();
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editValue, setEditValue] = React.useState('');

    const handleDoubleClick = (id: string, currentTitle: string) => {
        setEditingId(id);
        setEditValue(currentTitle);
    };

    const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
        if (e.key === 'Enter') {
            updateSessionTitle(id, editValue);
            setEditingId(null);
        } else if (e.key === 'Escape') {
            setEditingId(null);
        }
    };

    const handleBlur = (id: string) => {
        updateSessionTitle(id, editValue);
        setEditingId(null);
    };

    return (
        <div className="flex items-center bg-[#0f0f1a] border-b border-[#282a36] h-10 select-none">
            <div className="flex overflow-x-auto no-scrollbar max-md:flex-1">
                {sessions.map((session) => (
                    <div
                        key={session.id}
                        className={`
                            flex items-center px-4 h-10 cursor-pointer border-r border-[#282a36] min-w-[150px] max-w-[200px] group
                            ${activeSessionId === session.id
                                ? 'bg-[#1e1f29] text-[#50fa7b]'
                                : 'bg-[#0f0f1a] text-[#6272a4] hover:bg-[#191a23] hover:text-[#f8f8f2]'}
                        `}
                        onClick={() => onSwitchSession(session.id)}
                        onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleDoubleClick(session.id, session.title);
                        }}
                    >
                        <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(session.status, activeSessionId === session.id)}`} />
                        {editingId === session.id ? (
                            <input
                                autoFocus
                                className="flex-1 bg-transparent border-none text-sm font-medium text-inherit focus:outline-none min-w-0"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, session.id)}
                                onBlur={() => handleBlur(session.id)}
                                onClick={(e) => e.stopPropagation()}
                                onDoubleClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span className="truncate flex-1 text-sm font-medium">
                                {session.title}
                            </span>
                        )}
                        <button
                            className={`
                                ml-2 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-[#ff5555] hover:text-white transition-all
                                ${activeSessionId === session.id ? 'opacity-100' : ''}
                            `}
                            onClick={(e) => {
                                e.stopPropagation();
                                onCloseSession(session.id);
                            }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
            <button
                className="px-3 h-full text-[#6272a4] hover:text-[#50fa7b] hover:bg-[#191a23] transition-colors flex items-center justify-center max-md:border-l border-[#282a36] cursor-pointer"
                onClick={onNewTab}
                title="New Tab"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            </button>
        </div>
    );
};

export default TabBar;
