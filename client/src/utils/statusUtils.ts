export const getStatusColor = (status: string, isActive: boolean = true): string => {
    if (["connected", "connecting"].includes(status)) {
        return isActive ? 'bg-[#50fa7b]' : 'bg-[#2e8b57]';
    }
    if (status === 'lost') return 'bg-[#ff5555]';
    return 'bg-[#6272a4]';
};
