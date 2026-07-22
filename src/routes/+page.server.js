import { getHomeContent, getFeaturedEpisodes } from '$lib/queries/home.js';

export async function load() {
	try {
		const [episodes, home] = await Promise.all([
			getFeaturedEpisodes(),
			getHomeContent()
		]);

		// Pick a random image from the home images
		let randomImage = null;
		if (home?.images && home.images.length > 0) {
			const randomIndex = Math.floor(Math.random() * home.images.length);
			randomImage = home.images[randomIndex].directus_files_id;
		}

		return {
			episodes,
			randomImage,
			title: 'Radio Dopo',
			error: null
		};
	} catch (error) {
		console.error('Error fetching data:', error);
		return {
			episodes: [],
			randomImage: null,
			title: 'Radio Dopo',
			error: error.message
		};
	}
}