import { directus, getAssetUrl } from '../directus.js';
import { readItems } from '@directus/sdk';

const SHOW_GENRES_FIELD = { genres: [{ genres_id: ['id', 'slug', { translations: ['name', 'languages_code'] }] }] };

/**
 * @param {any} show
 */
function transformShow(show) {
	return {
		...show,
		genres: (show.genres || []).map(j => j.genres_id).filter(Boolean),
	};
}

/**
 * Get all shows
 * @returns {Promise<Array>} Array of show objects
 */
export async function getAllShows() {
	try {
		const shows = await directus.request(
			readItems('shows', {
				fields: ['*', 'translations.*', SHOW_GENRES_FIELD],
				sort: ['name'],
				filter: {
					status: { _eq: 'published' }
				}
			})
		);
		return shows.map(transformShow);
	} catch (error) {
		console.error('Error fetching shows:', error);
		throw error;
	}
}

/**
 * Get shows with pagination and optional search
 * @param {number} limit - Number of shows to return
 * @param {number} offset - Number of shows to skip
 * @param {string} search - Optional search query
 * @returns {Promise<Array>} Array of show objects
 */
export async function getShows(limit = 20, offset = 0, search = '') {
	try {
		const filter = {
			status: { _eq: 'published' }
		};

		if (search) {
			filter.name = { _contains: search };
		}

		const shows = await directus.request(
			readItems('shows', {
				fields: ['*', 'translations.*', SHOW_GENRES_FIELD],
				sort: ['name'],
				limit,
				offset,
				filter
			})
		);
		return shows.map(transformShow);
	} catch (error) {
		console.error('Error fetching shows:', error);
		throw error;
	}
}

/**
 * Get a single show by slug with its episodes
 * @param {string} slug - The show slug
 * @returns {Promise<Object|null>} Show object with episodes or null if not found
 */
export async function getShowBySlug(slug) {
	try {
		const shows = await directus.request(
			readItems('shows', {
				fields: [
					'*',
					'translations.*',
					SHOW_GENRES_FIELD,
					{
						episodes: [
							'*',
							'translations.*',
							{ show_id: ['id', 'name', 'slug'] },
							{ audio: ['filename_disk'] }
						]
					}
				],
				filter: {
					slug: { _eq: slug },
					status: { _eq: 'published' }
				},
				limit: 1
			})
		);

		if (shows.length > 0) {
			const show = shows[0];
			// Transform episodes to include proper audio URLs and show reference
			// Also filter for only published episodes with audio
			if (show.episodes) {
				show.episodes = show.episodes
					.filter(episode => episode.status === 'published' && episode.audio)
					.map(episode => ({
						...episode,
						show: episode.show_id,
						audio: episode.audio?.filename_disk
							? getAssetUrl(episode.audio.filename_disk)
							: null
					}))
					.sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()); // Sort by date descending
			}
			return transformShow(show);
		}
		return null;
	} catch (error) {
		console.error('Error fetching show by slug:', error);
		throw error;
	}
}

/**
 * Get a single show by ID
 * @param {number} id - The show ID
 * @returns {Promise<Object|null>} Show object or null if not found
 */
export async function getShowById(id) {
	try {
		const show = await directus.request(
			readItems('shows', {
				fields: ['*'],
				filter: {
					id: { _eq: id },
					status: { _eq: 'published' }
				},
				limit: 1
			})
		);
		return show.length > 0 ? show[0] : null;
	} catch (error) {
		console.error('Error fetching show by ID:', error);
		throw error;
	}
}
