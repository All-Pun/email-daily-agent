import { NextResponse } from 'next/server';
import { getYesterdaysEmails, sendEmail } from '@/lib/gmail';
import { categorizeEmails } from '@/lib/agent';
import { generateEmailTemplate } from '@/lib/template';

const SUMMARY_EMAIL = 'arpan@materialdepot.com';

// Vercel cron jobs send an Authorization header with the CRON_SECRET
export async function GET(request: Request) {
  const auth = request.headers.get('Authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const emails = await getYesterdaysEmails();

    if (emails.length === 0) {
      return NextResponse.json({ message: 'No emails found for yesterday' });
    }

    const categorized = await categorizeEmails(emails);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateLabel = yesterday.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const html = generateEmailTemplate(categorized, dateLabel);

    await sendEmail(
      SUMMARY_EMAIL,
      `📧 Daily Email Briefing — ${dateLabel}`,
      html
    );

    const counts = {
      total: categorized.length,
      needsReply: categorized.filter((e) => e.category === 'NEEDS_REPLY').length,
      needsAttention: categorized.filter((e) => e.category === 'NEEDS_ATTENTION').length,
      fyi: categorized.filter((e) => e.category === 'FYI').length,
      internal: categorized.filter((e) => e.category === 'INTERNAL').length,
      newsletter: categorized.filter((e) => e.category === 'NEWSLETTER').length,
    };

    console.log('Daily summary sent:', counts);
    return NextResponse.json({ success: true, sentTo: SUMMARY_EMAIL, counts });
  } catch (err) {
    console.error('Daily summary failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
