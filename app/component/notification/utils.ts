export function typeColor(type: string) {
    if (type === 'success') return { bg: '#ecfdf5', icon: '#10b981' };
    if (type === 'error') return { bg: '#fef2f2', icon: '#ef4444' };
    return { bg: '#eff6ff', icon: '#3b82f6' };
}

export function typeIcon(type: string) {
    if (type === 'success') return 'check-circle-filled';
    if (type === 'error') return 'circle-dashed';
    return 'notification';
}
