import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/server/googleAuth.js', () => ({
	getServiceAccountToken: vi.fn().mockResolvedValue('mock-token'),
}));

const CALENDAR_ID = 'test-calendar-id';

function makeFetchEvent(overrides = {}) {
	return {
		id: 'event-1',
		summary: 'Test Show',
		start: { dateTime: '2026-06-01T20:00:00+02:00' },
		end: { dateTime: '2026-06-01T22:00:00+02:00' },
		attendees: [
			{ email: 'host@example.com', organizer: false },
			{ email: 'organizer@example.com', organizer: true },
		],
		...overrides,
	};
}

describe('getCalendarEvent', () => {
	beforeEach(() => {
		vi.stubEnv('PUBLIC_GOOGLE_CALENDAR_ID', CALENDAR_ID);
	});

	it('returns the event on success', async () => {
		const event = makeFetchEvent();
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => event,
		}));

		const { getCalendarEvent } = await import('$lib/server/googleCalendar.js');
		const result = await getCalendarEvent('event-1');
		expect(result.id).toBe('event-1');
		expect(result.summary).toBe('Test Show');
	});

	it('returns null for 404', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));

		const { getCalendarEvent } = await import('$lib/server/googleCalendar.js');
		const result = await getCalendarEvent('missing-id');
		expect(result).toBeNull();
	});

	it('passes Authorization header', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => makeFetchEvent(),
		}));

		const { getCalendarEvent } = await import('$lib/server/googleCalendar.js');
		await getCalendarEvent('event-1');

		expect(fetch).toHaveBeenCalledWith(
			expect.stringContaining(encodeURIComponent(CALENDAR_ID)),
			expect.objectContaining({ headers: { Authorization: 'Bearer mock-token' } })
		);
	});

	it('throws on non-404 error', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

		const { getCalendarEvent } = await import('$lib/server/googleCalendar.js');
		await expect(getCalendarEvent('event-1')).rejects.toThrow('Calendar API error: 500');
	});
});

describe('getScheduleEvents', () => {
	it('returns items array', async () => {
		const events = [makeFetchEvent(), makeFetchEvent({ id: 'event-2', summary: 'Show B' })];
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ items: events }),
		}));

		const { getScheduleEvents } = await import('$lib/server/googleCalendar.js');
		const result = await getScheduleEvents(7);
		expect(result).toHaveLength(2);
		expect(result[0].summary).toBe('Test Show');
	});

	it('returns empty array when no items', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({}),
		}));

		const { getScheduleEvents } = await import('$lib/server/googleCalendar.js');
		const result = await getScheduleEvents(7);
		expect(result).toEqual([]);
	});

	it('requests singleEvents=true ordered by startTime', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ items: [] }),
		}));

		const { getScheduleEvents } = await import('$lib/server/googleCalendar.js');
		await getScheduleEvents(7);

		const calledUrl = new URL(fetch.mock.calls[0][0]);
		expect(calledUrl.searchParams.get('singleEvents')).toBe('true');
		expect(calledUrl.searchParams.get('orderBy')).toBe('startTime');
	});
});

describe('getEventsOnDay', () => {
	it('scopes the query to a single day', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ items: [] }),
		}));

		const { getEventsOnDay } = await import('$lib/server/googleCalendar.js');
		await getEventsOnDay(3);

		const calledUrl = new URL(fetch.mock.calls[0][0]);
		const timeMin = new Date(calledUrl.searchParams.get('timeMin'));
		const timeMax = new Date(calledUrl.searchParams.get('timeMax'));

		// Should span at most one day (implementation uses local setHours, not UTC)
		const rangeMs = timeMax - timeMin;
		expect(rangeMs).toBeGreaterThan(0);
		expect(rangeMs).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
		// timeMax should be end of local day (23:59:59)
		expect(timeMax.getHours()).toBe(23);
	});

	it('returns attendee emails for filtering', async () => {
		const event = makeFetchEvent();
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ items: [event] }),
		}));

		const { getEventsOnDay } = await import('$lib/server/googleCalendar.js');
		const [result] = await getEventsOnDay(0);
		const nonOrganizerAttendees = result.attendees.filter((a) => !a.organizer);
		expect(nonOrganizerAttendees).toHaveLength(1);
		expect(nonOrganizerAttendees[0].email).toBe('host@example.com');
	});
});
