import { directus, getAssetUrl } from '../directus.js';
import { readItems } from '@directus/sdk';

export const EPISODE_FIELDS = ['*', { translations: ['*'] }, { show_id: ['id', 'name', 'slug', 'image', { translations: ['*'] }] }, { audio: ['filename_disk'] }, { genres: [{ genres_id: ['id', 'slug', { translations: ['name', 'languages_code'] }] }] }];

export function transformEpisode(episode) {
	return {
		...episode,
		show: episode.show_id,
		audio: episode.audio?.filename_disk
			? getAssetUrl(episode.audio.filename_disk)
			: null,
		genres: (episode.genres || []).map(j => j.genres_id).filter(Boolean),
	};
}

/**
 * Get all episodes with their related show data
 * @returns {Promise<Array>} Array of episode objects with show information
 */
export async function getAllEpisodes() {
	try {
		const episodes = await directus.request(
			readItems('episodes', {
				fields: EPISODE_FIELDS,
				sort: ['-start'],
				filter: {
					status: { _eq: 'published' },
					audio: { _nnull: true }
				}
			})
		);
		return episodes.map(transformEpisode);
	} catch (error) {
		console.error('Error fetching episodes:', error);
		throw error;
	}
}

/**
 * Get episodes with pagination and optional search/genre filter
 * @param {number} limit - Number of episodes to return
 * @param {number} offset - Number of episodes to skip
 * @param {string} search - Optional search query
 * @param {string} genre - Optional genre slug to filter by
 * @returns {Promise<Array>} Array of episode objects
 */
export async function getEpisodes(limit = 20, offset = 0, search = '', genre = '') {
	try {
		/** @type {any[]} */
		const conditions = [
			{ status: { _eq: 'published' } },
			{ audio: { _nnull: true } },
		];

		if (search) {
			conditions.push({
				_or: [
					{ title: { _contains: search } },
					{ show_id: { name: { _contains: search } } }
				]
			});
		}

		if (genre) {
			conditions.push({
				genres: { genres_id: { slug: { _eq: genre } } }
			});
		}

		/** @type {any} */
		const filter = conditions.length === 1 ? conditions[0] : { _and: conditions };

		const episodes = await directus.request(
			readItems('episodes', {
				fields: EPISODE_FIELDS,
				sort: ['-start'],
				limit,
				offset,
				filter
			})
		);
		return episodes.map(transformEpisode);
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
				fields: EPISODE_FIELDS,
				filter: {
					slug: { _eq: slug },
					status: { _eq: 'published' },
					audio: { _nnull: true }
				},
				limit: 1
			})
		);
		if (episodes.length > 0) {
			return transformEpisode(episodes[0]);
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
				fields: EPISODE_FIELDS,
				filter: {
					show_id: { _eq: showId },
					status: { _eq: 'published' },
					audio: { _nnull: true }
				},
				sort: ['-start']
			})
		);
		return episodes.map(transformEpisode);
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
				fields: EPISODE_FIELDS,
				filter: {
					start: { _lte: time },
					end: { _gte: time }
				},
				limit: 1
			})
		);
		if (episodes.length === 0) return null;
		return transformEpisode(episodes[0]);
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
				fields: EPISODE_FIELDS,
				sort: ['-start'],
				limit: limit,
				filter: {
					status: { _eq: 'published' },
					audio: { _nnull: true }
				}
			})
		);
		return episodes.map(transformEpisode);
	} catch (error) {
		console.error('Error fetching recent episodes:', error);
		throw error;
	}
}
