import { getEpisodes } from '$lib/queries/episodes.js';
import { getAllGenres } from '$lib/queries/genres.js';

export async function load({ url }) {
	const limit = parseInt(url.searchParams.get('limit') || '20');
	const offset = parseInt(url.searchParams.get('offset') || '0');
	const search = url.searchParams.get('search') || '';
	const genre = url.searchParams.get('genre') || '';

	try {
		const [episodes, genres] = await Promise.all([
			getEpisodes(limit, offset, search, genre),
			getAllGenres(),
		]);

		return {
			episodes,
			genres,
			hasMore: episodes.length === limit,
			activeGenre: genre,
			title: 'Episodes - Radio Dopo'
		};
	} catch (err) {
		console.error('Error fetching episodes:', err);
		throw err;
	}
}
