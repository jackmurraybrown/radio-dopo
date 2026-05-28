<script>
	import { Html, Head, Body, Container, Heading, Text, Link, Hr } from 'svelte-email';

	export let showName = '';
	export let episodeDate = '';
	export let formUrl = '';
</script>

<Html lang="en">
	<Head />
	<Body style="font-family: sans-serif; background-color: #000000; color: #ffffff;">
		<Container
			style="max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #000000;"
		>
			<Heading
				style="font-size: 32px; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 20px; color: #ff79ab;"
			>
				RADIO DOPO
			</Heading>

			<Text style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
				Ciao! Your show <strong style="color: #1ba9e3;">{showName}</strong> is scheduled to air on
				<strong>{episodeDate}</strong>.
			</Text>

			<Text style="font-size: 18px; line-height: 1.6; margin-bottom: 30px;">
				Please fill out the following information for your upcoming episode:
			</Text>

			<ul style="font-size: 18px; line-height: 1.8; margin-bottom: 30px; padding-left: 20px;">
				<li>Episode title</li>
				<li>Episode image</li>
				<li>Description</li>
				<li>Genres</li>
			</ul>

			<Container
				style="text-align: center; margin: 40px 0; padding: 20px; background-color: #1a1a1a; border-radius: 4px;"
			>
				<Link
					href={formUrl}
					style="display: inline-block; padding: 16px 32px; background-color: #f35910; color: #ffffff; text-decoration: none; text-transform: uppercase; letter-spacing: 1.2px; font-size: 18px; font-weight: bold; border-radius: 4px;"
				>
					FILL OUT EPISODE INFO
				</Link>
			</Container>

			<Hr style="border: none; border-top: 1px solid #333333; margin: 30px 0;" />

			<Text style="font-size: 14px; color: #999999; line-height: 1.6;">
				This link is unique to your episode and should not be shared. If you have any questions,
				please contact us.
			</Text>

			<Text style="font-size: 14px; color: #666666; margin-top: 20px;">
				- Radio Dopo Team
			</Text>
		</Container>
	</Body>
</Html>
