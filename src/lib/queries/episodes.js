import { directus, getAssetUrl } from '../directus.js';
import { readItems } from '@directus/sdk';

/**
 * Get all episodes with their related show data
 * @returns {Promise<Array>} Array of episode objects with show information
 */
export async function getAllEpisodes() {
	try {
		const episodes = await directus.request(
			readItems('episodes', {
				fields: ['*', { translations: ['*'] }, { show_id: ['id', 'name', 'slug', 'image', { translations: ['*'] }] }, { audio: ['filename_disk'] }],
				sort: ['-start'],
				filter: {
					status: { _eq: 'published' },
					audio: { _nnull: true } // audio isn't null
				}
			})
		);
		// Build media server URL using filename_disk
		return episodes.map(episode => ({
			...episode,
			show: episode.show_id, // Map show_id to show for easier access
			audio: episode.audio?.filename_disk
				? getAssetUrl(episode.audio.filename_disk)
				: null
		}));
	} catch (error) {
		console.error('Error fetching episodes:', error);
		throw error;
	}
}

/**
 * Get episodes with pagination and optional search
 * @param {number} limit - Number of episodes to return
 * @param {number} offset - Number of episodes to skip
 * @param {string} search - Optional search query
 * @returns {Promise<Array>} Array of episode objects
 */
export async function getEpisodes(limit = 20, offset = 0, search = '') {
	try {
		const filter = {
			status: { _eq: 'published' },
			audio: { _nnull: true }
		};

		if (search) {
			filter._and = [
				{ status: { _eq: 'published' } },
				{ audio: { _nnull: true } },
				{
					_or: [
						{ title: { _contains: search } },
						{ show_id: { name: { _contains: search } } }
					]
				}
			];
			delete filter.status;
			delete filter.audio;
		}

		const episodes = await directus.request(
			readItems('episodes', {
				fields: ['*', { translations: ['*'] }, { show_id: ['id', 'name', 'slug', 'image', { translations: ['*'] }] }, { audio: ['filename_disk'] }],
				sort: ['-start'],
				limit,
				offset,
				filter
			})
		);
		// Build media server URL using filename_disk
		return episodes.map(episode => ({
			...episode,
			show: episode.show_id, // Map show_id to show for easier access
			audio: episode.audio?.filename_disk
				? getAssetUrl(episode.audio.filename_disk)
				: null
		}));
	} catch (error) {
		console.error('Error fetching episodes:', error);
		throw error;
	}
}

/**
 * Get a single episode by slug
 * @param {string} slug - The episode slug
 * @returns {Promise<Object|null>} Episode object with show information or null if not found
 */
export async function getEpisodeBySlug(slug) {
	try {
		const episodes = await directus.request(
			readItems('episodes', {
				fields: ['*', 'translations.*', 'show_id.id', 'show_id.name', 'show_id.slug', 'show_id.image', 'show_id.translations.*', 'audio.filename_disk'],
				filter: {
					slug: { _eq: slug },
					status: { _eq: 'published' },
					audio: { _nnull: true }  // audio isn't null
				},
				limit: 1
			})
		);
		if (episodes.length > 0) {
			// Build media server URL using filename_disk
			return {
				...episodes[0],
				show: episodes[0].show_id, // Map show_id to show for easier access
				audio: episodes[0].audio?.filename_disk
					? getAssetUrl(episodes[0].audio.filename_disk)
					: null
			};
		}
		return null;
	} catch (error) {
		console.error('Error fetching episode by slug:', error);
		throw error;
	}
}

/**
 * Get episodes for a specific show
 * @param {number} showId - The show ID
 * @returns {Promise<Array>} Array of episode objects
 */
export async function getEpisodesByShow(showId) {
	try {
		const episodes = await directus.request(
			readItems('episodes', {
				fields: ['*', { show_id: ['id', 'name', 'slug', 'image'] }, { audio: ['filename_disk'] }],
				filter: {
					show_id: { _eq: showId },
					status: { _eq: 'published' },
					audio: { _nnull: true }  // audio isn't null
				},
				sort: ['-start'] // Sort by start date descending (newest first)
			})
		);
		// Build media server URL using filename_disk
		return episodes.map(episode => ({
			...episode,
			show: episode.show_id, // Map show_id to show for easier access
			audio: episode.audio?.filename_disk
				? getAssetUrl(episode.audio.filename_disk)
				: null
		}));
	} catch (error) {
		console.error('Error fetching episodes by show:', error);
		throw error;
	}
}

/**
 * Get an episode that is airing at a specific timestamp
 * @param {string} time - ISO 8601 timestamp
 * @returns {Promise<Object|null>} Episode object or null if not found
 */
export async function getEpisodeByTime(time) {
	try {
		const episodes = await directus.request(
			readItems('episodes', {
				fields: ['*', { translations: ['*'] }, { show_id: ['id', 'name', 'slug', 'image', { translations: ['*'] }] }, { audio: ['filename_disk'] }],
				filter: {
					start: { _lte: time },
					end: { _gte: time }
				},
				limit: 1
			})
		);
		if (episodes.length === 0) return null;
		const episode = episodes[0];
		return {
			...episode,
			show: episode.show_id,
			audio: episode.audio?.filename_disk
				? getAssetUrl(episode.audio.filename_disk)
				: null
		};
	} catch (error) {
		console.error('Error fetching episode by time:', error);
		throw error;
	}
}

/**
 * Get recent episodes (limit to a specific number)
 * @param {number} limit - Number of episodes to return
 * @returns {Promise<Array>} Array of recent episode objects
 */
export async function getRecentEpisodes(limit = 10) {
	try {
		const episodes = await directus.request(
			readItems('episodes', {
				fields: ['*', { show_id: ['id', 'name', 'slug', 'image'] }, { audio: ['filename_disk'] }],
				sort: ['-start'],
				limit: limit,
				filter: {
					status: { _eq: 'published' },
					audio: { _nnull: true }  // audio isn't null
				}
			})
		);
		// Build media server URL using filename_disk
		return episodes.map(episode => ({
			...episode,
			show: episode.show_id, // Map show_id to show for easier access
			audio: episode.audio?.filename_disk
				? getAssetUrl(episode.audio.filename_disk)
				: null
		}));
	} catch (error) {
		console.error('Error fetching recent episodes:', error);
		throw error;
	}
}
