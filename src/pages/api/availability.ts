import type { APIRoute } from 'astro';
import bookings from '@/data/bookings.json';


export const GET: APIRoute = async () => {
    const blockedDates: string[] = [];

    // Add Local Bookings
    bookings.forEach((booking: any) => {
        let currentDate = new Date(booking.checkIn);
        const endDate = new Date(booking.checkOut);

        while (currentDate < endDate) {
            blockedDates.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }
    });

    // Remove duplicates
    const uniqueDates = [...new Set(blockedDates)];

    return new Response(JSON.stringify(uniqueDates), {
        headers: {
            'Content-Type': 'application/json',
        },
    });
};
