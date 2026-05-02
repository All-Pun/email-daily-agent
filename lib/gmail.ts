import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'urn:ietf:wg:oauth:2.0:oob'
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

export type RawEmail = {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
  snippet: string;
  replied: boolean;
  threadId: string;
};

export async function getYesterdaysEmails(): Promise<RawEmail[]> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const endOfYesterday = new Date(yesterday);
  endOfYesterday.setHours(23, 59, 59, 999);

  const after = Math.floor(yesterday.getTime() / 1000);
  const before = Math.floor(endOfYesterday.getTime() / 1000);

  // Exclude social/promotions tabs but still catch all real emails
  const query = `after:${after} before:${before} -category:social`;

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: 150,
  });

  const messages = listRes.data.messages ?? [];
  if (messages.length === 0) return [];

  const emails = await Promise.all(
    messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'full',
      });
      const email = parseEmail(detail.data);
      email.replied = await hasBeenReplied(email.threadId, detail.data.internalDate!);
      return email;
    })
  );

  return emails;
}

function parseEmail(message: any): RawEmail {
  const headers: { name: string; value: string }[] =
    message.payload?.headers ?? [];
  const h = (name: string) =>
    headers.find((x) => x.name.toLowerCase() === name.toLowerCase())?.value ??
    '';

  return {
    id: message.id,
    threadId: message.threadId ?? '',
    subject: h('Subject'),
    from: h('From'),
    to: h('To'),
    date: h('Date'),
    body: extractBody(message.payload).slice(0, 2500),
    snippet: message.snippet ?? '',
    replied: false, // filled in after
  };
}

async function hasBeenReplied(threadId: string, receivedAt: string): Promise<boolean> {
  try {
    const thread = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: 'metadata',
      metadataHeaders: ['From', 'Date'],
    });

    const messages = thread.data.messages ?? [];
    const receivedTime = parseInt(receivedAt, 10);

    // Check if any message in the thread is SENT and came after the received email
    return messages.some((msg) => {
      const labels = msg.labelIds ?? [];
      const msgTime = parseInt(msg.internalDate ?? '0', 10);
      return labels.includes('SENT') && msgTime > receivedTime;
    });
  } catch {
    return false;
  }
}

function extractBody(payload: any): string {
  if (!payload) return '';
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        const html = Buffer.from(part.body.data, 'base64').toString('utf-8');
        return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }
    // Recurse into nested parts
    for (const part of payload.parts) {
      const text = extractBody(part);
      if (text) return text;
    }
  }
  return '';
}

export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string
): Promise<void> {
  const raw = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    '',
    htmlBody,
  ].join('\r\n');

  const encoded = Buffer.from(raw)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encoded },
  });
}

