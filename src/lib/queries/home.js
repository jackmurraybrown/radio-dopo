import { directus } from '../directus.js';
import { readSingleton } from '@directus/sdk';
import { EPISODE_FIELDS, transformEpisode, getRecentEpisodes } from './episodes.js';

/**
 * Get home page content
 * Note: If 'home' is a singleton collection in Directus, use getHomeSingleton instead
 * @returns {Promise<Object>} Home page content object
 */
export async function getHomeContent() {
	try {
		const home = await directus.request(
			readSingleton('home', {
				fields: ['*', 'images.*']
			})
		);
		return home;
	} catch (error) {
		console.error('Error fetching home content:', error);
		throw error;
	}
}

/**
 * get the curated list of featured episodes for the homepage.
 * @returns {Promise<Array>} Array of episode objects
 */
export async function getFeaturedEpisodes() {
	try {
		const home = await directus.request(
			readSingleton('home', {
				fields: [{ featured_episodes: [{ episodes_id: EPISODE_FIELDS }] }]
			})
		);
		const episodes = (home.featured_episodes || [])
			.map(j => j.episodes_id)
			.filter(episode => episode && episode.status === 'published' && episode.audio);

		if (episodes.length === 0) {
			return getRecentEpisodes(6);
		}

		return episodes.map(transformEpisode);
	} catch (error) {
		console.error('Error fetching featured episodes:', error);
		throw error;
	}
}
