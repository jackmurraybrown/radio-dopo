import { directus } from '../directus.js';
import { readItems } from '@directus/sdk';

/**
 * Get all projects
 * @returns {Promise<Array>} Array of project objects
 */
export async function getAllProjects() {
	try {
		const projects = await directus.request(
			readItems('projects', {
				fields: ['*', 'translations.*'],
				sort: ['title']
			})
		);
		return projects;
	} catch (error) {
		console.error('Error fetching projects:', error);
		throw error;
	}
}

/**
 * Get a single project by slug
 * @param {string} slug - The project slug
 * @returns {Promise<Object|null>} Project object or null if not found
 */
export async function getProjectBySlug(slug) {
	try {
		const projects = await directus.request(
			readItems('projects', {
				fields: ['*', 'translations.*'],
				filter: {
					slug: { _eq: slug }
				},
				limit: 1
			})
		);
		return projects.length > 0 ? projects[0] : null;
	} catch (error) {
		console.error('Error fetching project by slug:', error);
		throw error;
	}
}
