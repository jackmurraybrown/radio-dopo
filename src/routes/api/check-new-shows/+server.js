import { json, error } from '@sveltejs/kit';
import { pollCalendarChanges } from '$lib/server/googleCalendar.js';
import { sendShowEmail } from '$lib/server/email.js';
import { rruleToText } from '$lib/rrule.js';
import { formatShowTime } from '$lib/dateUtils.js';
import {
	CRON_SECRET,
	RESEND_TEMPLATE_NEW_SHOW,
	RESEND_TEMPLATE_NEW_SHOW_URGENT,
} from '$env/static/private';

const URGENT_DAYS = 10;

export async function POST({ request, url }) {
	const authHeader = request.headers.get('authorization');
	if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
		throw error(401, 'Unauthorized');
	}

	const { syncToken, lastRunAt } = await request.json();

	let events, nextSyncToken;
	try {
		({ events, nextSyncToken } = await pollCalendarChanges(syncToken ?? null));
	} catch (err) {
		if (err.message === 'SYNC_TOKEN_EXPIRED') {
			({ events, nextSyncToken } = await pollCalendarChanges(null));
			return json({ nextSyncToken, newEvents: [], reinitialised: true });
		}
		throw err;
	}

	// First run — just initialise the token, no emails
	if (!lastRunAt) {
		return json({ nextSyncToken, newEvents: [] });
	}

	const lastRun = new Date(lastRunAt);
	const now = new Date();
	const newEvents = [];
	const errors = [];

	for (const event of events) {
		if (event.status === 'cancelled') continue;

		// Only events created after last run are genuinely new (not just edited)
		const created = new Date(event.created);
		if (created <= lastRun) continue;

		const attendees = (event.attendees ?? []).filter((a) => !a.organizer && a.email);
		if (attendees.length === 0) {
			console.log(`[check-new-shows] "${event.summary}" has no attendees — skipping`);
			continue;
		}

		const startDate = event.start?.dateTime || event.start?.date;
		const endDate = event.end?.dateTime || event.end?.date;
		const showDate = formatShowTime(startDate, endDate);
		const showName = event.summary || 'Your Show';
		const location = event.location ?? '';
		const repeats = rruleToText(event.recurrence);

		const msUntilShow = startDate ? new Date(startDate) - now : Infinity;
		const daysUntilShow = msUntilShow / (1000 * 60 * 60 * 24);
		const isUrgent = daysUntilShow <= URGENT_DAYS;

		const templateId = isUrgent ? RESEND_TEMPLATE_NEW_SHOW_URGENT : RESEND_TEMPLATE_NEW_SHOW;
		const formUrl = isUrgent ? `${url.origin}/submission?eventId=${event.id}` : undefined;

		for (const attendee of attendees) {
			const name = attendee.displayName || showName;
			try {
				await sendShowEmail({ to: attendee.email, templateId, name, showDate, location, repeats, formUrl });
				console.log(`[check-new-shows] Emailed ${attendee.email} for "${showName}" (${isUrgent ? 'urgent' : 'standard'})`);
				newEvents.push({ eventId: event.id, showName, email: attendee.email, isUrgent });
			} catch (err) {
				console.error(`[check-new-shows] Failed to email ${attendee.email}:`, err);
				errors.push({ eventId: event.id, email: attendee.email, error: err.message });
			}
		}
	}

	return json({
		nextSyncToken,
		newEvents,
		...(errors.length ? { errors } : {}),
	});
}
