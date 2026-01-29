import type { APIRoute } from 'astro';
import bookings from '@/data/bookings.json';
import ical from 'node-ical';

// TODO: Replace with actual Airbnb iCal URL from user
const AIRBNB_ICAL_URL = process.env.AIRBNB_ICAL_URL || '';

export const GET: APIRoute = async () => {
    const blockedDates: string[] = [];

    // 1. Add Local Bookings
    bookings.forEach((booking: any) => {
        let currentDate = new Date(booking.checkIn);
        const endDate = new Date(booking.checkOut);

        while (currentDate < endDate) {
            blockedDates.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }
    });

    // 2. Fetch and Parse Airbnb iCal
    // 2. Fetch and Parse Airbnb iCal
    if (AIRBNB_ICAL_URL) {
        try {
            const events = await ical.async.fromURL(AIRBNB_ICAL_URL);
            for (const ev of Object.values(events)) {
                const event = ev as any;
                if (event.type === 'VEVENT' && event.start && event.end) {
                    let currentDate = new Date(event.start);
                    const endDate = new Date(event.end);
                    while (currentDate < endDate) {
                        blockedDates.push(currentDate.toISOString().split('T')[0]);
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching Airbnb iCal:', error);
        }
    }

    // Remove duplicates
    const uniqueDates = [...new Set(blockedDates)];

    return new Response(JSON.stringify(uniqueDates), {
        headers: {
            'Content-Type': 'application/json',
        },
    });
};
