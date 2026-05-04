export const dynamic = 'force-dynamic';

function todayJST() {
  const d = new Date();
  const jst = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  return {
    year: jst.getFullYear(),
    month: jst.getMonth(),
    day: jst.getDate(),
    dateStr: `${jst.getFullYear()}${String(jst.getMonth() + 1).padStart(2, '0')}${String(jst.getDate()).padStart(2, '0')}`,
  };
}

function parseICSDate(val) {
  // DATE-only: 20260504
  if (/^\d{8}$/.test(val)) {
    return { date: val, allDay: true };
  }
  // DATETIME UTC: 20260504T000000Z
  if (/^\d{8}T\d{6}Z$/.test(val)) {
    const d = new Date(
      `${val.slice(0,4)}-${val.slice(4,6)}-${val.slice(6,8)}T${val.slice(9,11)}:${val.slice(11,13)}:${val.slice(13,15)}Z`
    );
    const jst = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
    return {
      date: `${jst.getFullYear()}${String(jst.getMonth()+1).padStart(2,'0')}${String(jst.getDate()).padStart(2,'0')}`,
      time: `${String(jst.getHours()).padStart(2,'0')}:${String(jst.getMinutes()).padStart(2,'0')}`,
      allDay: false,
    };
  }
  // DATETIME local: 20260504T090000
  if (/^\d{8}T\d{6}$/.test(val)) {
    return {
      date: val.slice(0, 8),
      time: `${val.slice(9,11)}:${val.slice(11,13)}`,
      allDay: false,
    };
  }
  return null;
}

function parseICS(text) {
  const events = [];
  const blocks = text.split('BEGIN:VEVENT');
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const get = (key) => {
      const m = block.match(new RegExp(`${key}(?:;[^:]*)?:([^\\r\\n]+)`));
      return m ? m[1].trim() : '';
    };
    const dtstart = parseICSDate(get('DTSTART').replace(/\s/g, ''));
    const dtend   = parseICSDate(get('DTEND').replace(/\s/g, ''));
    const summary  = get('SUMMARY').replace(/\\,/g, ',').replace(/\\n/g, ' ');
    const location = get('LOCATION').replace(/\\,/g, ',').replace(/\\n/g, ' ');
    if (!dtstart || !summary) continue;
    events.push({ summary, location, dtstart, dtend });
  }
  return events;
}

export async function GET() {
  const urls = [
    process.env.GOOGLE_CALENDAR_ICS_URL_1,
    process.env.GOOGLE_CALENDAR_ICS_URL_2,
    process.env.GOOGLE_CALENDAR_ICS_URL_3,
    process.env.GOOGLE_CALENDAR_ICS_URL_4,
  ].filter(Boolean);

  if (urls.length === 0) {
    return Response.json({ events: [], error: 'No calendar URLs set' });
  }

  try {
    const today = todayJST();

    const results = await Promise.allSettled(
      urls.map(url => fetch(url, { next: { revalidate: 300 } }).then(r => r.text()))
    );

    const allEvents = results.flatMap(r => r.status === 'fulfilled' ? parseICS(r.value) : []);

    const todayEvents = allEvents
      .filter(e => e.dtstart.date === today.dateStr)
      .sort((a, b) => {
        if (a.dtstart.allDay) return 1;
        if (b.dtstart.allDay) return -1;
        return (a.dtstart.time || '').localeCompare(b.dtstart.time || '');
      })
      .map(e => ({
        summary:  e.summary,
        location: e.location || null,
        time:     e.dtstart.allDay ? null : e.dtstart.time,
        endTime:  e.dtend && !e.dtend.allDay ? e.dtend.time : null,
        allDay:   e.dtstart.allDay,
      }));

    return Response.json({ events: todayEvents });
  } catch (err) {
    return Response.json({ events: [], error: err.message }, { status: 500 });
  }
}
