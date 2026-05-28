import { getScheduleEvents } from '$lib/server/googleCalendar.js';

export async function GET() {
	try {
		const currentTime = new Date();
		const items = await getScheduleEvents(7);

		const events = [];
		let liveNow = null;

		items.forEach((event) => {
			const startDateTime = event.start.dateTime || event.start.date;
			const endDateTime = event.end.dateTime || event.end.date;

			const startDate = new Date(startDateTime);
			const endDate = new Date(endDateTime);

			const eventData = {
				start: startDate.toISOString(),
				end: endDate.toISOString(),
				playlist: {
					title: event.summary || 'Untitled Show',
					name: event.summary || 'Untitled Show'
				},
				description: event.description || ''
			};

			events.push(eventData);

			if (startDate <= currentTime && endDate >= currentTime) {
				liveNow = eventData;
			}
		});

		return new Response(JSON.stringify({ data: events, liveNow }), {
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'public, max-age=60'
			}
		});
	} catch (error) {
		console.error('Error fetching Google Calendar:', error);
		return new Response(
			JSON.stringify({ error: 'Failed to fetch calendar data', message: error.message }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
}
