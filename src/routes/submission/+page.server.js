import { directusServer } from '$lib/server/directus.js';
import { getCalendarEvent } from '$lib/server/googleCalendar.js';
import { readSingleton, readItems, createItem } from '@directus/sdk';
import { fail } from '@sveltejs/kit';

function slugify(str) {
	return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function load({ url }) {
	const eventId = url.searchParams.get('eventId');

	// Load submission form info page content
	let submissionForm = null;
	try {
		submissionForm = await directusServer.request(readSingleton('submission_form', {
			fields: ['content', { resources: ['id', 'directus_files_id.id', 'directus_files_id.title', 'directus_files_id.filename_download'] }]
		}));
	} catch (err) {
		console.error('Error loading submission form content:', err);
	}

	if (!eventId) {
		return { calendarEvent: null, shows: [], submissionForm };
	}

	// Fetch the Google Calendar event and the shows list in parallel
	const [calendarEvent, shows] = await Promise.all([
		getCalendarEvent(eventId).catch((err) => {
			console.error('Error loading calendar event:', err);
			return null;
		}),
		directusServer.request(readItems('shows', {
			fields: ['id', 'name'],
			sort: ['name'],
			limit: 500,
		})).catch(() => []),
	]);

	return { calendarEvent, shows, submissionForm };
}

export const actions = {
	submit: async ({ request, url }) => {
		const eventId = url.searchParams.get('eventId');

		if (!eventId) {
			return fail(400, { error: 'Missing event ID.' });
		}

		const formData = await request.formData();

		const title = formData.get('title');
		const descriptionEn = formData.get('description_en');
		const descriptionIt = formData.get('description_it');
		const tracklist = formData.get('tracklist');
		const imageId = formData.get('image_id');
		const audioId = formData.get('audio_id');
		const type = formData.get('type');
		const showId = formData.get('show_id');
		const newShowName = formData.get('new_show_name');
		const showImageId = formData.get('show_image_id');
		const showDescriptionEn = formData.get('show_description_en');
		const showDescriptionIt = formData.get('show_description_it');

		// Validation
		if (!title?.trim()) {
			return fail(400, { error: 'Episode title is required.' });
		}

		const hasEnDescription = descriptionEn?.trim();
		const hasItDescription = descriptionIt?.trim();
		if (!hasEnDescription && !hasItDescription) {
			return fail(400, { error: 'At least one description (EN or IT) is required.' });
		}

		if (!imageId) {
			return fail(400, { error: 'Episode image is required.' });
		}

		if (!showId && !newShowName?.trim()) {
			return fail(400, { error: 'Please select or create a show.' });
		}

		if (showId === 'new') {
			const hasShowEn = showDescriptionEn?.trim();
			const hasShowIt = showDescriptionIt?.trim();
			if (!hasShowEn && !hasShowIt) {
				return fail(400, { error: 'At least one show description (EN or IT) is required.' });
			}
			if (!showImageId) {
				return fail(400, { error: 'A show image is required.' });
			}
		}

		// Re-fetch event to get authoritative start/end times
		let calendarEvent;
		try {
			calendarEvent = await getCalendarEvent(eventId);
		} catch {
			return fail(400, { error: 'Could not load event details. Please try again.' });
		}

		if (!calendarEvent) {
			return fail(400, { error: 'Event not found.' });
		}

		// Strip timezone offset so Directus stores the local time as-is, not converted to UTC
		const stripTz = (s) => s?.replace(/([+-]\d{2}:\d{2}|Z)$/, '') ?? s;
		const start = stripTz(calendarEvent.start?.dateTime || calendarEvent.start?.date);
		const end = stripTz(calendarEvent.end?.dateTime || calendarEvent.end?.date);

		try {
			// Create new show if needed
			let resolvedShowId = showId;
			if (showId === 'new') {
				const showTranslations = [];
				if (showDescriptionEn?.trim()) {
					showTranslations.push({ name: newShowName.trim(), description: showDescriptionEn.trim(), languages_code: 'en-US' });
				}
				if (showDescriptionIt?.trim()) {
					showTranslations.push({ name: newShowName.trim(), description: showDescriptionIt.trim(), languages_code: 'it-IT' });
				}
				const newShow = await directusServer.request(
					createItem('shows', {
						name: newShowName.trim(),
						slug: slugify(newShowName.trim()),
						status: 'published',
						image: showImageId,
						translations: showTranslations,
					})
				);
				resolvedShowId = newShow.id;
			}

			// Build translations
			const translationsCreate = [];
			if (hasEnDescription) {
				translationsCreate.push({ title: title.trim(), description: descriptionEn.trim(), languages_code: 'en-US' });
			}
			if (hasItDescription) {
				translationsCreate.push({ title: title.trim(), description: descriptionIt.trim(), languages_code: 'it-IT' });
			}

			// Append date and time to slug to avoid collisions between episodes with the same title
			const dateTimeStr = start ? start.slice(0, 16).replace(/[-T:]/g, '') : Date.now().toString();
			const slug = `${slugify(title.trim())}-${dateTimeStr}`;

			const episodeData = {
				title: title.trim(),
				slug,
				type,
				start,
				end,
				image: imageId,
				booking_status: 'Submitted',
				cal_id: eventId,
				show_id: resolvedShowId,
				translations: translationsCreate,
			};

			if (audioId) episodeData.audio = audioId;
			if (tracklist?.trim()) episodeData.tracklist = tracklist.trim();

			await directusServer.request(createItem('episodes', episodeData));

			return { success: true };
		} catch (err) {
			console.error('Error creating episode:', err);
			return fail(500, { error: 'Failed to submit. Please try again.' });
		}
	}
};
