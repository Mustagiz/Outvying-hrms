// Calendar integration utilities (Google Calendar, Outlook)

export const calendar = {
    // Generate Google Calendar event URL
    googleCalendar: ({
        title,
        description,
        location,
        startTime,
        endTime,
    }) => {
        const baseUrl = 'https://calendar.google.com/calendar/render';
        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: title,
            details: description || '',
            location: location || '',
            dates: `${formatDateForGoogle(startTime)}/${formatDateForGoogle(endTime)}`,
        });

        return `${baseUrl}?${params.toString()}`;
    },

    // Generate Outlook Calendar event URL
    outlookCalendar: ({
        title,
        description,
        location,
        startTime,
        endTime,
    }) => {
        const baseUrl = 'https://outlook.live.com/calendar/0/deeplink/compose';
        const params = new URLSearchParams({
            subject: title,
            body: description || '',
            location: location || '',
            startdt: startTime.toISOString(),
            enddt: endTime.toISOString(),
            path: '/calendar/action/compose',
            rru: 'addevent',
        });

        return `${baseUrl}?${params.toString()}`;
    },

    // Generate ICS file for download
    generateICS: ({
        title,
        description,
        location,
        startTime,
        endTime,
    }) => {
        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//HRMS//Calendar//EN',
            'BEGIN:VEVENT',
            `UID:${Date.now()}@hrms.com`,
            `DTSTAMP:${formatDateForICS(new Date())}`,
            `DTSTART:${formatDateForICS(startTime)}`,
            `DTEND:${formatDateForICS(endTime)}`,
            `SUMMARY:${title}`,
            `DESCRIPTION:${description || ''}`,
            `LOCATION:${location || ''}`,
            'STATUS:CONFIRMED',
            'END:VEVENT',
            'END:VCALENDAR',
        ].join('\r\n');

        return icsContent;
    },

    // Download ICS file
    downloadICS: (eventDetails, filename = 'event.ics') => {
        const icsContent = calendar.generateICS(eventDetails);
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    // Event templates
    templates: {
        // Interview event
        interview: (candidateName, jobTitle, interviewTime, location) => ({
            title: `Interview: ${candidateName} - ${jobTitle}`,
            description: `Interview scheduled with ${candidateName} for ${jobTitle} position`,
            location: location,
            startTime: interviewTime,
            endTime: new Date(interviewTime.getTime() + 60 * 60 * 1000), // 1 hour
        }),

        // Training session
        training: (courseTitle, instructor, startTime, duration) => ({
            title: `Training: ${courseTitle}`,
            description: `Instructor: ${instructor}`,
            location: 'Training Room',
            startTime: startTime,
            endTime: new Date(startTime.getTime() + duration * 60 * 60 * 1000),
        }),

        // Leave reminder
        leave: (employeeName, leaveType, startDate, endDate) => ({
            title: `${employeeName} - ${leaveType}`,
            description: `${employeeName} will be on ${leaveType}`,
            location: '',
            startTime: startDate,
            endTime: endDate,
        }),

        // Meeting
        meeting: (title, description, startTime, duration, location) => ({
            title: title,
            description: description,
            location: location,
            startTime: startTime,
            endTime: new Date(startTime.getTime() + duration * 60 * 1000),
        }),
    },
};

// Helper functions
const formatDateForGoogle = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

const formatDateForICS = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

export default calendar;
