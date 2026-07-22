import { directus } from '../directus.js';
import { readItems } from '@directus/sdk';

export async function getAllGenres() {
	try {
		const genres = await directus.request(
			readItems('genres', {
				fields: ['id', 'slug', { translations: ['name', 'languages_code'] }],
				sort: ['slug'],
			})
		);
		return genres;
	} catch (error) {
		console.error('Error fetching genres:', error);
		throw error;
	}
}
