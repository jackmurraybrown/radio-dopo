import { getAllEpisodes } from '$lib/queries/episodes.js';
import { getAllShows } from '$lib/queries/shows.js';

/**
 * Generate sitemap.xml dynamically
 * @type {import('./$types').RequestHandler}
 */
export async function GET() {
	const baseUrl = 'https://radiodopo.it';

	try {
		// Fetch all episodes and shows
		const [episodes, shows] = await Promise.all([
			getAllEpisodes(),
			getAllShows()
		]);

		// Static pages with lastmod
		const now = new Date().toISOString();
		const staticPages = [
			{ url: '', priority: '1.0', changefreq: 'daily' },
			{ url: '/episodes', priority: '0.9', changefreq: 'daily' },
			{ url: '/shows', priority: '0.9', changefreq: 'weekly' },
			{ url: '/schedule', priority: '0.8', changefreq: 'daily' },
			{ url: '/about', priority: '0.7', changefreq: 'monthly' },
			{ url: '/partners', priority: '0.7', changefreq: 'monthly' }
		];

		// Generate XML
		const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
${shows.map(show => `  <url>
    <loc>${baseUrl}/shows/${show.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n')}
${episodes.map(episode => `  <url>
    <loc>${baseUrl}/episodes/${episode.slug}</loc>
    <lastmod>${new Date(episode.date_updated || episode.date_created).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`).join('\n')}
</urlset>`;

		return new Response(sitemap, {
			headers: {
				'Content-Type': 'application/xml',
				'Cache-Control': 'max-age=3600' // Cache for 1 hour
			}
		});
	} catch (error) {
		console.error('Error generating sitemap:', error);
		return new Response('Error generating sitemap', { status: 500 });
	}
}
