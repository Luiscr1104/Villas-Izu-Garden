import ical from 'ical-generator';
import type { APIRoute } from 'astro';
import bookings from '@/data/bookings.json';

export const GET: APIRoute = async () => {
    const calendar = ical({
        name: 'Villas Izu Garden Direct Bookings',
        timezone: 'America/Costa_Rica', // Adjust as needed
    });

    bookings.forEach((booking: any) => {
        calendar.createEvent({
            start: new Date(booking.checkIn),
            end: new Date(booking.checkOut),
            summary: 'Reserved',
            description: 'Direct Booking',
        });
    });

    return new Response(calendar.toString(), {
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': 'attachment; filename="villas-izu-garden.ics"',
        },
    });
};
