import { json, error } from '@sveltejs/kit';
import { getEventsOnDay } from '$lib/server/googleCalendar.js';
import { sendShowEmail } from '$lib/server/email.js';
import { directusServer } from '$lib/server/directus.js';
import { readItems } from '@directus/sdk';
import { formatShowTime } from '$lib/dateUtils.js';
import { rruleToText } from '$lib/rrule.js';
import {
	CRON_SECRET,
	RESEND_TEMPLATE_SUBMISSION_INITIAL,
	RESEND_TEMPLATE_SUBMISSION_REMINDER,
	RESEND_TEMPLATE_SUBMISSION_LATE,
} from '$env/static/private';

const REMINDER_DAYS = [10, 4, 3];

const TEMPLATE_BY_DAYS = {
	10: RESEND_TEMPLATE_SUBMISSION_INITIAL,
	4:  RESEND_TEMPLATE_SUBMISSION_REMINDER,
	3:  RESEND_TEMPLATE_SUBMISSION_LATE,
};

/** Fetch events for all reminder days and return a map of days → events. */
async function fetchAllEvents() {
	const map = {};
	await Promise.all(
		REMINDER_DAYS.map(async (days) => {
			try {
				map[days] = await getEventsOnDay(days);
			} catch (err) {
				console.error(`[reminders] Failed to fetch events for day +${days}:`, err);
				map[days] = [];
			}
		})
	);
	return map;
}

/** Return a Set of cal_ids that already have a submitted episode in Directus. */
/** @param {string[]} eventIds */
async function getSubmittedCalIds(eventIds) {
	if (eventIds.length === 0) return new Set();
	try {
		const episodes = await directusServer.request(
			readItems('episodes', {
				fields: ['cal_id'],
				filter: { cal_id: { _in: eventIds } },
			})
		);
		return new Set(episodes.map((ep) => ep.cal_id));
	} catch (err) {
		console.error('[reminders] Failed to query submitted episodes:', err);
		return new Set();
	}
}

function extractEventFields(event, baseUrl) {
	const startDate = event.start?.dateTime || event.start?.date;
	const endDate = event.end?.dateTime || event.end?.date;
	return {
		showDate: formatShowTime(startDate, endDate),
		showName: event.summary || 'Your Show',
		location: event.location ?? '',
		repeats: rruleToText(event.recurrence),
		formUrl: `${baseUrl}/submission?eventId=${event.id}`,
	};
}

// GET /api/send-episode-reminders — dry run, no emails sent
export async function GET({ url }) {
	const secret = url.searchParams.get('secret');
	if (CRON_SECRET && secret !== CRON_SECRET) {
		throw error(401, 'Unauthorized');
	}

	const baseUrl = url.origin;
	const eventsByDay = await fetchAllEvents();
	const allEventIds = Object.values(eventsByDay).flat().map((e) => e.id);
	const submittedCalIds = await getSubmittedCalIds(allEventIds);
	const preview = [];

	for (const days of REMINDER_DAYS) {
		const events = eventsByDay[days] ?? [];
		console.log(`[dry-run] day +${days}: ${events.length} event(s)`);

		for (const event of events) {
			const submitted = submittedCalIds.has(event.id);
			const attendees = (event.attendees ?? []).filter((a) => !a.organizer && a.email);
			const { showDate, showName, location, repeats, formUrl } = extractEventFields(event, baseUrl);
			const templateId = TEMPLATE_BY_DAYS[days];

			if (submitted) {
				console.log(`[dry-run]   "${showName}" → already submitted, would skip`);
			} else {
				console.log(`[dry-run]   "${showName}" on ${showDate} → template: ${templateId}`);
				if (attendees.length === 0) {
					console.log(`[dry-run]     → no attendees, would skip`);
				} else {
					for (const a of attendees) {
						console.log(`[dry-run]     → would email ${a.email} (${a.displayName || 'no name'})`);
					}
				}
			}

			preview.push({
				daysAhead: days,
				eventId: event.id,
				showName,
				showDate,
				location,
				repeats,
				formUrl,
				templateId,
				submitted,
				attendees: attendees.map((/** @type {any} */ a) => ({ email: a.email, name: a.displayName || '' })),
			});
		}
	}

	return json({ dryRun: true, preview });
}

export async function POST({ request, url }) {
	const authHeader = request.headers.get('authorization');
	if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
		throw error(401, 'Unauthorized');
	}

	const baseUrl = url.origin;
	const eventsByDay = await fetchAllEvents();
	const allEventIds = Object.values(eventsByDay).flat().map((e) => e.id);
	const submittedCalIds = await getSubmittedCalIds(allEventIds);
	const results = [];
	const errors = [];

	for (const days of REMINDER_DAYS) {
		const events = eventsByDay[days] ?? [];

		for (const event of events) {
			if (submittedCalIds.has(event.id)) {
				console.log(`[reminders] Skipping "${event.summary}" — already submitted`);
				continue;
			}

			const attendees = (event.attendees ?? []).filter((a) => !a.organizer && a.email);
			if (attendees.length === 0) continue;

			const { showDate, showName, location, repeats, formUrl } = extractEventFields(event, baseUrl);
			const templateId = TEMPLATE_BY_DAYS[days];

			for (const attendee of attendees) {
				const name = attendee.displayName || showName;
				try {
					await sendShowEmail({ to: attendee.email, templateId, name, showDate, location, repeats, formUrl });
					results.push({ eventId: event.id, showName, email: attendee.email, daysAhead: days });
				} catch (err) {
					console.error(`[reminders] Failed to email ${attendee.email}:`, err);
					errors.push({ eventId: event.id, email: attendee.email, error: err.message });
				}
			}
		}
	}

	return json({
		success: true,
		emailsSent: results.length,
		results,
		...(errors.length ? { errors } : {}),
	});
}
