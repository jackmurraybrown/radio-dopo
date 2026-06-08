import { PUBLIC_GOOGLE_CALENDAR_ID } from '$env/static/public';
import { getServiceAccountToken } from '$lib/server/googleAuth.js';

/**
 * Fetch a single calendar event by ID (includes attendees).
 * @param {string} eventId
 * @returns {Promise<Object|null>}
 */
export async function getCalendarEvent(eventId) {
	const token = await getServiceAccountToken();
	const res = await fetch(
		`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(PUBLIC_GOOGLE_CALENDAR_ID)}/events/${encodeURIComponent(eventId)}`,
		{ headers: { Authorization: `Bearer ${token}` } }
	);
	if (res.status === 404) return null;
	if (!res.ok) throw new Error(`Calendar API error: ${res.status}`);
	return res.json();
}

/**
 * Fetch all events within the next N days from midnight today.
 * @param {number} days
 * @returns {Promise<Array>}
 */
export async function getScheduleEvents(days = 7) {
	const token = await getServiceAccountToken();

	const now = new Date();
	const timeMin = new Date(now);
	timeMin.setHours(0, 0, 0, 0);
	const timeMax = new Date(now);
	timeMax.setDate(timeMax.getDate() + days);
	timeMax.setHours(23, 59, 59, 999);

	const params = new URLSearchParams({
		timeMin: timeMin.toISOString(),
		timeMax: timeMax.toISOString(),
		singleEvents: 'true',
		orderBy: 'startTime',
		maxResults: '100',
	});

	const res = await fetch(
		`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(PUBLIC_GOOGLE_CALENDAR_ID)}/events?${params}`,
		{ headers: { Authorization: `Bearer ${token}` } }
	);
	if (!res.ok) throw new Error(`Calendar API error: ${res.status}`);
	const data = await res.json();
	return data.items ?? [];
}

/**
 * Fetch all events starting on a day N days from now (includes attendees).
 * @param {number} daysFromNow
 * @returns {Promise<Array>}
 */
export async function getEventsOnDay(daysFromNow) {
	const token = await getServiceAccountToken();

	const date = new Date();
	date.setDate(date.getDate() + daysFromNow);

	const timeMin = new Date(date);
	timeMin.setHours(0, 0, 0, 0);
	const timeMax = new Date(date);
	timeMax.setHours(23, 59, 59, 999);

	const params = new URLSearchParams({
		timeMin: timeMin.toISOString(),
		timeMax: timeMax.toISOString(),
		singleEvents: 'true',
		orderBy: 'startTime',
		maxResults: '50',
	});

	const res = await fetch(
		`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(PUBLIC_GOOGLE_CALENDAR_ID)}/events?${params}`,
		{ headers: { Authorization: `Bearer ${token}` } }
	);
	if (!res.ok) throw new Error(`Calendar API error: ${res.status}`);
	const data = await res.json();
	return data.items ?? [];
}
