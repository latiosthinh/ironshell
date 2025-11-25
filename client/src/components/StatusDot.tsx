import React from 'react';

interface StatusDotProps {
    status: 'connected' | 'disconnected' | 'connecting' | 'lost';
    isActive?: boolean;
    className?: string;
}

const StatusDot: React.FC<StatusDotProps> = ({
    status,
    isActive = true,
    className = ''
}) => {
    const getBaseColor = () => {
        switch (status) {
            case 'connected':
                return isActive ? 'bg-[#50fa7b]' : 'bg-[#2e8b57]';
            case 'connecting':
                return 'bg-[#f1fa8c]';
            case 'lost':
                return 'bg-[#ff5555]';
            case 'disconnected':
            default:
                return 'bg-[#6272a4]';
        }
    };

    const getAnimation = () => {
        if (status === 'connecting') return 'animate-pulse';
        return '';
    };

    const baseColor = getBaseColor();
    const animation = getAnimation();

    return (
        <div
            className={`w-2 h-2 rounded-full ${baseColor} ${animation} ${className}`}
        />
    );
};

export default StatusDot;
