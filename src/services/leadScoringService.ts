import type { ConversationMessage, QualificationSegment } from '../types/crm';

interface ScoreResult {
  score: number;            // 0–100
  segment: QualificationSegment;
  signals: string[];
}

/**
 * Scores a lead based on conversation content.
 * Returns a 0-100 score, a segment, and the detected signals.
 */
export function scoreLead(messages: ConversationMessage[]): ScoreResult {
  let score = 0;
  const signals: string[] = [];

  const userMessages = messages.filter((m) => m.role === 'user');
  const allText = userMessages.map((m) => m.text).join(' ').toLowerCase();

  // --- Engagement signals ---
  if (userMessages.length >= 3) { score += 10; signals.push('3+ user messages'); }
  if (userMessages.length >= 6) { score += 10; signals.push('6+ user messages (high engagement)'); }

  const avgLength = userMessages.reduce((s, m) => s + m.text.length, 0) / (userMessages.length || 1);
  if (avgLength > 80) { score += 10; signals.push('Detailed responses (avg >80 chars)'); }

  // --- Business context ---
  if (/\b(company|business|startup|enterprise|firm|organization)\b/.test(allText)) {
    score += 10; signals.push('Mentions business/company');
  }
  if (/\b(revenue|monetize|subscription|saas|pricing|customers|clients)\b/.test(allText)) {
    score += 10; signals.push('Revenue/monetization language');
  }
  if (/\b(team|employees|staff|departments?)\b/.test(allText)) {
    score += 5; signals.push('Team/org context');
  }

  // --- Urgency ---
  if (/\b(asap|urgent|deadline|quickly|soon|immediately|this month|next week)\b/.test(allText)) {
    score += 15; signals.push('Urgency detected');
  }
  if (/\b(budget|invest|funding|paying)\b/.test(allText)) {
    score += 10; signals.push('Budget/investment language');
  }

  // --- B2B fit ---
  if (/\b(b2b|enterprise|crm|erp|dashboard|admin|portal|workflow|automation)\b/.test(allText)) {
    score += 10; signals.push('B2B/enterprise fit');
  }

  // --- Email captured ---
  if (/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/.test(allText)) {
    score += 10; signals.push('Email address shared');
  }

  // Cap at 100
  score = Math.min(score, 100);

  let segment: QualificationSegment;
  if (score >= 60) segment = 'high_fit';
  else if (score >= 35) segment = 'medium_fit';
  else if (score >= 15) segment = 'low_fit';
  else segment = 'not_qualified';

  return { score, segment, signals };
}
