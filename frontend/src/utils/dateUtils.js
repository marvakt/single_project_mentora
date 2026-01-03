export const formatIndianTime = (time) => {
    if (!time) return '';

    // Handle Date objects
    if (time instanceof Date) {
        return time.toLocaleTimeString('en-IN', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    // Handle "HH:MM:SS" or "HH:MM" strings
    let hours, minutes;

    if (typeof time === 'string') {
        // If it's a full ISO string
        if (time.includes('T')) {
            const date = new Date(time);
            return date.toLocaleTimeString('en-IN', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        }

        const parts = time.split(':');
        if (parts.length >= 2) {
            hours = parseInt(parts[0], 10);
            minutes = parseInt(parts[1], 10);
        }
    }

    if (hours === undefined || minutes === undefined || isNaN(hours) || isNaN(minutes)) {
        return time; // Return original if parsing fails
    }

    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12; // Convert 0 to 12
    const displayMinute = minutes.toString().padStart(2, '0');

    return `${displayHour}:${displayMinute} ${ampm}`;
};

export const formatIndianDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};
