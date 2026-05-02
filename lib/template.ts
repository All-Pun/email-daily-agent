import type { CategorizedEmail } from './agent';

export function generateEmailTemplate(
  emails: CategorizedEmail[],
  dateLabel: string
): string {
  const replied = emails.filter((e) => e.replied);
  const needsReply = emails.filter((e) => e.category === 'NEEDS_REPLY' && !e.replied);
  const needsAttention = emails.filter((e) => e.category === 'NEEDS_ATTENTION' && !e.replied);
  const fyi = emails.filter((e) => e.category === 'FYI' && !e.replied);
  const internal = emails.filter((e) => e.category === 'INTERNAL' && !e.replied);
  const newsletter = emails.filter((e) => e.category === 'NEWSLETTER' && !e.replied);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Daily Email Briefing</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f0f2f5;color:#1a1a2e}
.wrap{max-width:680px;margin:24px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}
.hdr{background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:28px 32px;color:#fff}
.hdr h1{font-size:20px;font-weight:700;letter-spacing:-.3px}
.hdr .sub{color:#8892b0;font-size:13px;margin-top:4px}
.stats{display:grid;grid-template-columns:repeat(6,1fr);gap:0;border-bottom:1px solid #f0f0f0}
.stat{padding:16px 10px;text-align:center;border-right:1px solid #f0f0f0}
.stat:last-child{border-right:none}
.stat .n{font-size:26px;font-weight:800;line-height:1}
.stat .l{font-size:11px;color:#666;margin-top:4px;text-transform:uppercase;letter-spacing:.5px}
.s-reply .n{color:#e74c3c}
.s-attn .n{color:#e67e22}
.s-fyi .n{color:#2980b9}
.s-int .n{color:#8e44ad}
.s-news .n{color:#95a5a6}
.s-replied .n{color:#27ae60}
.section{padding:24px 28px;border-bottom:1px solid #f5f5f5}
.section:last-child{border-bottom:none}
.sec-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:16px;display:flex;align-items:center;gap:8px}
.t-reply{color:#e74c3c}
.t-attn{color:#e67e22}
.t-fyi{color:#2980b9}
.card{border:1px solid #eee;border-radius:10px;padding:16px;margin-bottom:12px;position:relative;overflow:hidden}
.card:last-child{margin-bottom:0}
.card.client{border-left:3px solid #e74c3c}
.card.prospect{border-left:3px solid #e67e22}
.card-from{font-size:12px;color:#777;font-weight:500}
.card-subject{font-size:15px;font-weight:600;color:#1a1a2e;margin:4px 0 8px}
.card-summary{font-size:13px;color:#444;line-height:1.6}
.card-reason{font-size:12px;color:#555;background:#f8f9fa;border-radius:6px;padding:8px 12px;margin-top:10px;border-left:2px solid #ddd}
.badges{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}
.badge{font-size:11px;font-weight:600;padding:3px 9px;border-radius:20px}
.b-client{background:#fde8e8;color:#c0392b}
.b-prospect{background:#fef5e7;color:#d35400}
.b-urgent{background:#fde8e8;color:#c0392b}
.b-professional{background:#e8f4fd;color:#1a6fa8}
.b-friendly{background:#e8f8f5;color:#1e8449}
.b-high{background:#fef9e7;color:#9a7d0a}
.b-medium{background:#f4f6f7;color:#626567}
.fyi-list{list-style:none}
.fyi-item{padding:9px 0;border-bottom:1px solid #f8f8f8;display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.fyi-item:last-child{border-bottom:none}
.fyi-subj{font-size:13px;color:#333;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1}
.fyi-from{font-size:12px;color:#aaa;white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis}
.footer{padding:18px 28px;text-align:center;font-size:12px;color:#bbb;background:#fafafa}
</style>
</head>
<body>
<div class="wrap">
  <div class="hdr">
    <h1>📧 Daily Email Briefing</h1>
    <div class="sub">${escHtml(dateLabel)} &nbsp;·&nbsp; ${emails.length} emails processed</div>
  </div>

  <div class="stats">
    <div class="stat s-reply">
      <div class="n">${needsReply.length}</div>
      <div class="l">Needs Reply</div>
    </div>
    <div class="stat s-attn">
      <div class="n">${needsAttention.length}</div>
      <div class="l">Attention</div>
    </div>
    <div class="stat s-fyi">
      <div class="n">${fyi.length}</div>
      <div class="l">FYI</div>
    </div>
    <div class="stat s-int">
      <div class="n">${internal.length}</div>
      <div class="l">Internal</div>
    </div>
    <div class="stat s-news">
      <div class="n">${newsletter.length}</div>
      <div class="l">Newsletters</div>
    </div>
    <div class="stat s-replied">
      <div class="n">${replied.length}</div>
      <div class="l">Replied</div>
    </div>
  </div>

  ${needsReply.length > 0 ? `
  <div class="section">
    <div class="sec-title t-reply">🔴 Needs Reply &nbsp;(${needsReply.length})</div>
    ${needsReply.map(detailCard).join('')}
  </div>` : ''}

  ${needsAttention.length > 0 ? `
  <div class="section">
    <div class="sec-title t-attn">🟡 Needs Attention &nbsp;(${needsAttention.length})</div>
    ${needsAttention.map(detailCard).join('')}
  </div>` : ''}

  ${fyi.length + internal.length > 0 ? `
  <div class="section">
    <div class="sec-title t-fyi">📌 FYI &amp; Internal &nbsp;(${fyi.length + internal.length})</div>
    <ul class="fyi-list">
      ${[...fyi, ...internal].map(fyiRow).join('')}
    </ul>
  </div>` : ''}

  ${newsletter.length > 0 ? `
  <div class="section">
    <div class="sec-title" style="color:#95a5a6">📰 Newsletters &amp; Promotions &nbsp;(${newsletter.length})</div>
    <ul class="fyi-list">
      ${newsletter.map(fyiRow).join('')}
    </ul>
  </div>` : ''}

  ${replied.length > 0 ? `
  <div class="section">
    <div class="sec-title" style="color:#27ae60">✅ Already Replied &nbsp;(${replied.length})</div>
    <ul class="fyi-list">
      ${replied.map(fyiRow).join('')}
    </ul>
  </div>` : ''}

  <div class="footer">Generated by your Email Agent &nbsp;·&nbsp; ${new Date().toUTCString()}</div>
</div>
</body>
</html>`;
}

function detailCard(email: CategorizedEmail): string {
  const cls =
    email.senderType === 'client'
      ? 'card client'
      : email.senderType === 'prospect'
      ? 'card prospect'
      : 'card';

  const badges: string[] = [];
  if (email.senderType === 'client')
    badges.push(`<span class="badge b-client">client</span>`);
  if (email.senderType === 'prospect')
    badges.push(`<span class="badge b-prospect">prospect</span>`);
  if (email.suggestedTone)
    badges.push(
      `<span class="badge b-${email.suggestedTone}">${email.suggestedTone} tone</span>`
    );
  if (email.clientValue && email.clientValue !== 'unknown')
    badges.push(
      `<span class="badge b-${email.clientValue}">${email.clientValue} value</span>`
    );

  return `
<div class="${cls}">
  <div class="card-from">${escHtml(email.from)}</div>
  <div class="card-subject">${escHtml(email.subject)}</div>
  ${email.summary ? `<div class="card-summary">${escHtml(email.summary)}</div>` : ''}
  ${email.reason ? `<div class="card-reason">💡 ${escHtml(email.reason)}</div>` : ''}
  ${badges.length ? `<div class="badges">${badges.join('')}</div>` : ''}
</div>`;
}

function fyiRow(email: CategorizedEmail): string {
  return `
<li class="fyi-item">
  <span class="fyi-subj">${escHtml(email.subject || '(no subject)')}</span>
  <span class="fyi-from">${escHtml(extractName(email.from))}</span>
</li>`;
}

function extractName(from: string): string {
  // "John Doe <john@example.com>" → "John Doe"
  const match = from.match(/^"?([^"<]+)"?\s*</);
  return match ? match[1].trim() : from.split('@')[0];
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
