import { formatInTimeZone } from 'date-fns-tz';

const PALERMO_TZ = 'Europe/Rome';

/**
 * Format a show's start and end into a single display string.
 * e.g. "22 June at 18:00–19:00 (Europe/Palermo CET/CEST)"
 * @param {string|null|undefined} startDate - ISO date string
 * @param {string|null|undefined} endDate - ISO date string
 * @returns {string}
 */
export function formatShowTime(startDate, endDate) {
	if (!startDate) return '';
	const start = new Date(startDate);
	const date = formatInTimeZone(start, PALERMO_TZ, 'd MMMM');
	const startTime = formatInTimeZone(start, PALERMO_TZ, 'HH:mm');
	const endTime = endDate ? formatInTimeZone(new Date(endDate), PALERMO_TZ, 'HH:mm') : '';
	const timeRange = endTime ? `${startTime}–${endTime}` : startTime;
	return `${date} at ${timeRange} (Europe/Palermo CET/CEST)`;
}
