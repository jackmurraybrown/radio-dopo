const DAY_NAMES = {
	MO: 'Monday', TU: 'Tuesday', WE: 'Wednesday', TH: 'Thursday',
	FR: 'Friday', SA: 'Saturday', SU: 'Sunday',
};

const ORDINALS = { '1': 'First', '2': 'Second', '3': 'Third', '4': 'Fourth', '-1': 'Last' };

function listToText(items) {
	if (items.length === 1) return items[0];
	return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
}

/**
 * Convert a Google Calendar recurrence array (RRULE strings) to plain English.
 * @param {string[]|null|undefined} recurrence
 * @returns {string}
 */
export function rruleToText(recurrence) {
	if (!recurrence?.length) return '';

	const rruleLine = recurrence.find((r) => r.startsWith('RRULE:'));
	if (!rruleLine) return '';

	const rule = Object.fromEntries(
		rruleLine.slice(6).split(';').map((part) => part.split('='))
	);

	const freq = rule.FREQ;
	const interval = parseInt(rule.INTERVAL ?? '1', 10);
	const byDay = rule.BYDAY;

	let text = '';

	if (freq === 'DAILY') {
		text = interval === 1 ? 'Every day' : `Every ${interval} days`;
	} else if (freq === 'WEEKLY') {
		const days = byDay ? byDay.split(',').map((d) => DAY_NAMES[d] ?? d) : [];
		const daysText = days.length ? listToText(days) : '';
		if (interval === 1) text = daysText ? `Every ${daysText}` : 'Weekly';
		else text = daysText ? `Every ${interval} weeks on ${daysText}` : `Every ${interval} weeks`;
	} else if (freq === 'MONTHLY') {
		if (byDay) {
			const match = byDay.match(/^(-?\d+)([A-Z]{2})$/);
			if (match) {
				const ordinal = ORDINALS[match[1]] ?? `${match[1]}th`;
				const day = DAY_NAMES[match[2]] ?? match[2];
				text = `${ordinal} ${day} of every month`;
			}
		}
		if (!text) text = interval === 1 ? 'Monthly' : `Every ${interval} months`;
	} else if (freq === 'YEARLY') {
		text = interval === 1 ? 'Yearly' : `Every ${interval} years`;
	}

	return text ? `Repeats: ${text}` : '';
}
