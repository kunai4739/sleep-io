import OpenAI from 'openai';

type SleepLog = {
  date: string;
  duration: number;
  bedtime: string;
  wake: string;
  quality: number;
  caffeine?: boolean;
  exercise?: boolean;
  screens?: boolean;
};

const client = new OpenAI();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages || [];
    const sleepLogs: SleepLog[] = body.logs || [];

    const sleepContext = sleepLogs.length > 0
      ? `The user has logged ${sleepLogs.length} sleep entries.`
      : 'No sleep data logged yet.';

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are Sleep.io, a friendly sleep assistant. Current sleep data: ${sleepContext}`
        },
        ...messages,
      ],
    });

    const content = response.choices[0].message.content || 'No response';
    console.log('API Response content:', content);

    return new Response(JSON.stringify({ content }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Route error:', error);
    return new Response(JSON.stringify({ content: 'Error: ' + String(error) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}