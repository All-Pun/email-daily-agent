import { generateText } from 'ai';
import type { RawEmail } from './gmail';

export type Category =
  | 'NEEDS_REPLY'
  | 'NEEDS_ATTENTION'
  | 'FYI'
  | 'INTERNAL'
  | 'NEWSLETTER';

export type SenderType =
  | 'client'
  | 'prospect'
  | 'vendor'
  | 'internal'
  | 'newsletter'
  | 'unknown';

export type Tone = 'urgent' | 'professional' | 'friendly';
export type ClientValue = 'high' | 'medium' | 'low' | 'unknown';

export type CategorizedEmail = RawEmail & {
  category: Category;
  senderType: SenderType;
  summary?: string;
  reason?: string;
  suggestedTone?: Tone;
  clientValue?: ClientValue;
};

const SYSTEM_PROMPT = `You are an email assistant for a busy sales professional.
Analyze each email and return a JSON object — nothing else, no markdown, no explanation.

CATEGORIES (pick exactly one):
- NEEDS_REPLY   → Client or prospect waiting on you; deal inquiry, pricing, proposal, follow-up, demo request
- NEEDS_ATTENTION → Urgent/time-sensitive; complaint, escalation, legal/financial, deadline, important decision
- FYI           → Informational only; receipts, confirmations, automated reports, read-only updates
- INTERNAL      → Emails from your own company domain / colleagues
- NEWSLETTER    → Marketing, bulk promotional, subscription digest, "unsubscribe" link prominent

SENDER TYPE (pick exactly one):
- client    → Existing customer; likely mentions ongoing account, support, renewal, invoice
- prospect  → Potential new business; inquiry, demo request, pricing question, first contact
- vendor    → Supplier, service provider, tool/SaaS billing
- internal  → Same company domain as the TO address or typical internal keywords (team, all-hands, hr, it helpdesk)
- newsletter→ Bulk sender, marketing alias, "noreply", unsubscribe footer
- unknown   → Cannot determine

RULES:
- If FROM contains "noreply", "no-reply", "donotreply", or obvious automated patterns → NEWSLETTER or FYI
- If subject has "invoice", "payment", "overdue" and not from a newsletter → NEEDS_ATTENTION
- If a client mentions a deal, pricing, or proposal → NEEDS_REPLY with clientValue = high
- For NEEDS_REPLY and NEEDS_ATTENTION, always fill summary, reason, suggestedTone, clientValue
- For all other categories, omit those fields entirely

Return this JSON (no extra keys):
{
  "category": "NEEDS_REPLY|NEEDS_ATTENTION|FYI|INTERNAL|NEWSLETTER",
  "senderType": "client|prospect|vendor|internal|newsletter|unknown",
  "summary": "2–3 sentences (NEEDS_REPLY and NEEDS_ATTENTION only)",
  "reason": "One sentence — why does this need action? (NEEDS_REPLY and NEEDS_ATTENTION only)",
  "suggestedTone": "urgent|professional|friendly (NEEDS_REPLY and NEEDS_ATTENTION only)",
  "clientValue": "high|medium|low|unknown (NEEDS_REPLY and NEEDS_ATTENTION only)"
}`;

export async function categorizeEmails(
  emails: RawEmail[]
): Promise<CategorizedEmail[]> {
  // Process in batches of 10 to avoid rate limits
  const BATCH = 10;
  const results: CategorizedEmail[] = [];

  for (let i = 0; i < emails.length; i += BATCH) {
    const batch = emails.slice(i, i + BATCH);
    const categorized = await Promise.all(batch.map(categorizeOne));
    results.push(...categorized);
  }

  return results;
}

async function categorizeOne(email: RawEmail): Promise<CategorizedEmail> {
  try {
    const { text } = await generateText({
      model: 'anthropic/claude-haiku-4.5',
      system: SYSTEM_PROMPT,
      prompt: `From: ${email.from}
To: ${email.to}
Subject: ${email.subject}
Date: ${email.date}

Content:
${email.snippet || email.body.slice(0, 800)}`,
    });

    const parsed = JSON.parse(text.trim());

    return {
      ...email,
      category: parsed.category ?? 'FYI',
      senderType: parsed.senderType ?? 'unknown',
      summary: parsed.summary,
      reason: parsed.reason,
      suggestedTone: parsed.suggestedTone,
      clientValue: parsed.clientValue,
    };
  } catch {
    return { ...email, category: 'FYI', senderType: 'unknown' };
  }
}
