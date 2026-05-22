import { directus } from '$lib/directus.js';
import { directusServer } from '$lib/server/directus.js';
import { readItem, readSingleton, updateItem } from '@directus/sdk';
import { fail } from '@sveltejs/kit';

export async function load({ url }) {
	const episodeId = url.searchParams.get('id');

	// Load submission form info page content
	let submissionForm = null;
	try {
		submissionForm = await directusServer.request(readSingleton('submission_form', {
			fields: ['content', { resources: ['id', 'directus_files_id.id', 'directus_files_id.title', 'directus_files_id.filename_download'] }]
		}));
	} catch (err) {
		console.error('Error loading submission form content:', err);
	}

	if (!episodeId) {
		return { episode: null, submissionForm, loadError: true };
	}

	try {
		const episode = await directus.request(
			readItem('episodes', episodeId, {
				fields: ['id', 'title', 'type', 'image', 'start', 'end', 'tracklist', 'translations.*', 'show_id.id', 'show_id.name', 'show_id.slug']
			})
		);

		if (!episode) {
			return { episode: null, submissionForm, loadError: true };
		}

		return { episode, submissionForm };
	} catch (err) {
		console.error('Error loading episode:', err);
		return { episode: null, submissionForm, loadError: true };
	}
}

export const actions = {
	submit: async ({ request, url }) => {
		const episodeId = url.searchParams.get('id');

		if (!episodeId) {
			return fail(400, { error: 'Missing episode ID.' });
		}

		const formData = await request.formData();

		const title = formData.get('title');
		const descriptionEn = formData.get('description_en');
		const descriptionIt = formData.get('description_it');
		const tracklist = formData.get('tracklist');
		const imageId = formData.get('image_id');
		const audioId = formData.get('audio_id');
		const enTranslationId = formData.get('en_translation_id') || null;
		const itTranslationId = formData.get('it_translation_id') || null;

		if (!title || title.trim() === '') {
			return fail(400, {
				error: 'Episode title is required.',
				title,
				description_en: descriptionEn,
				description_it: descriptionIt
			});
		}

		const hasEnDescription = descriptionEn && descriptionEn.trim() !== '';
		const hasItDescription = descriptionIt && descriptionIt.trim() !== '';

		if (!hasEnDescription && !hasItDescription) {
			return fail(400, {
				error: 'At least one description (EN or IT) is required.',
				title,
				description_en: descriptionEn,
				description_it: descriptionIt
			});
		}

		if (!imageId) {
			return fail(400, {
				error: 'Episode image is required.',
				title,
				description_en: descriptionEn,
				description_it: descriptionIt
			});
		}

		try {
			const translationsUpdate = [];
			const translationsCreate = [];

			if (hasEnDescription) {
				const data = { title: title.trim(), description: descriptionEn.trim(), languages_code: 'en-US' };
				if (enTranslationId) {
					translationsUpdate.push({ id: enTranslationId, ...data });
				} else {
					translationsCreate.push(data);
				}
			}

			if (hasItDescription) {
				const data = { title: title.trim(), description: descriptionIt.trim(), languages_code: 'it-IT' };
				if (itTranslationId) {
					translationsUpdate.push({ id: itTranslationId, ...data });
				} else {
					translationsCreate.push(data);
				}
			}

			const updateData = {
				title: title.trim(),
				image: imageId,
				booking_status: 'Submitted',
				translations: { create: translationsCreate, update: translationsUpdate, delete: [] }
			};

			if (audioId) {
				updateData.audio = audioId;
			}

			if (tracklist !== null) {
				updateData.tracklist = tracklist.trim() || null;
			}

			await directusServer.request(updateItem('episodes', episodeId, updateData));

			return { success: true };
		} catch (err) {
			console.error('Error updating episode:', err);
			return fail(500, {
				error: 'Failed to update episode. Please try again.',
				title,
				description_en: descriptionEn,
				description_it: descriptionIt
			});
		}
	}
};
