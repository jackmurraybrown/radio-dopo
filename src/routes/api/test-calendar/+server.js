import { json } from '@sveltejs/kit';
import { getScheduleEvents, getEventsOnDay } from '$lib/server/googleCalendar.js';
import { CRON_SECRET } from '$env/static/private';

// GET /api/test-calendar?secret=xxx&days=7
// Returns raw events with attendees so you can verify auth + data shape.
// DELETE THIS ENDPOINT before going to production.
export async function GET({ url }) {
	const secret = url.searchParams.get('secret');
	if (CRON_SECRET && secret !== CRON_SECRET) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const days = Number(url.searchParams.get('days') ?? 7);

	const [scheduleEvents, reminderEvents] = await Promise.all([
		getScheduleEvents(days),
		getEventsOnDay(0), // today
	]);

	return json({
		schedule: scheduleEvents.map((e) => ({
			id: e.id,
			summary: e.summary,
			start: e.start,
			end: e.end,
			attendees: e.attendees ?? [],
		})),
		today: reminderEvents.map((e) => ({
			id: e.id,
			summary: e.summary,
			start: e.start,
			attendees: e.attendees ?? [],
		})),
	});
}
