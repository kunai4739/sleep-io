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
          content: `You are Sleep.io, a friendly sleep assistant. Current sleep data: ${sleepContext}

CRITICAL RULE: When a user provides sleep information (bedtime, wake time, quality), you MUST include a SLEEP_LOG at the end of your response in this EXACT format with no spaces:
SLEEP_LOG:{"date":"2026-02-26","bedtime":"02:00","wake":"09:00","duration":7,"quality":40,"caffeine":true,"exercise":false,"screens":true}

Rules for the SLEEP_LOG:
- date: today's date in YYYY-MM-DD format
- bedtime: 24-hour format (2:00 am = "02:00", 11:00 pm = "23:00")
- wake: 24-hour format
- duration: hours as a number
- quality: 0-100 number
- caffeine: true if they mention caffeine
- exercise: true if they mention exercise
- screens: true if they mention screens

You MUST always append the SLEEP_LOG line. Never skip it when sleep data is provided.`
        },
        ...messages,
      ],
    });

    const content = response.choices[0].message.content || '';
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