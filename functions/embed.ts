import CalendarGenerator from '../lib/calendar-generator';

import type { Request as CFRequest } from '@cloudflare/workers-types';

const calendarGenerator = new CalendarGenerator();

function generateBadRequestResponse(message: string = 'The request is invalid') {
  return new Response(
    JSON.stringify({ error: message }),
    { status: 400 }
  );
}

const onRequestGet = (async (context) => {
  await calendarGenerator.initialize();

  const url = new URL((context.request as CFRequest).url);
  const rawConfigurations = url.searchParams.get('configurations');
  
  if (!rawConfigurations) {
    return generateBadRequestResponse();
  }

  // We don't know whether the input is valid
  let configurations: Record<any, any>;
  try {
    configurations = JSON.parse(atob(rawConfigurations));
  } catch (error) {
    console.error(`Fail to parse configurations '${rawConfigurations}', ${error}`);
  
    return generateBadRequestResponse();
  }

  // Validation will be done by CalendarGenerator
  calendarGenerator.updateConfigurations(configurations);

  const { result: svg } = await calendarGenerator.generate();

  return new Response(
    svg,
    {
      headers: {
        'Content-Types': 'image/svg+xml',
        // Cache for one day
        'Cache-Control': 'public, max-age=86400'
      }
    }
  );
}) satisfies PagesFunction;

export { onRequestGet }