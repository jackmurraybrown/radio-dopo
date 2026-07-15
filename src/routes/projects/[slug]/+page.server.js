import { getProjectBySlug } from '$lib/queries/projects.js';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const { slug } = params;

	try {
		const project = await getProjectBySlug(slug);

		if (!project) {
			throw error(404, 'Project not found');
		}

		return {
			project,
			title: `${project.title} - Radio Dopo`
		};
	} catch (err) {
		console.error('Error fetching project data:', err);
		throw error(404, 'Project not found');
	}
}
