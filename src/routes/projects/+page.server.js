import { getAllProjects } from '$lib/queries/projects.js';

export async function load() {
	try {
		const projects = await getAllProjects();

		return {
			projects,
			title: 'Projects - Radio Dopo'
		};
	} catch (err) {
		console.error('Error fetching projects:', err);
		throw err;
	}
}
