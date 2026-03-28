import { db, auth } from '../firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore';
import type {
  Lead,
  Conversation,
  LeadWithConversation,
  CRMStats,
  LeadStatus,
  QualificationSegment,
} from '../types/crm';

function toDate(val: unknown): Date {
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === 'string') return new Date(val);
  return new Date();
}

function mapLeadDoc(docSnap: { id: string; data: () => Record<string, unknown> }): Lead {
  const d = docSnap.data();
  return {
    id: docSnap.id,
    email: d.email as string | undefined,
    name: d.name as string | undefined,
    company: d.company as string | undefined,
    ideaSummary: d.ideaSummary as string | undefined,
    qualificationScore: d.qualificationScore as number | undefined,
    qualificationSegment: d.qualificationSegment as QualificationSegment | undefined,
    status: (d.status as LeadStatus) || 'started',
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
    prototypeUrl: d.prototypeUrl as string | undefined,
    productType: d.productType as Lead['productType'],
  };
}

function mapConversationDoc(docSnap: { id: string; data: () => Record<string, unknown> }): Conversation {
  const d = docSnap.data();
  return {
    id: docSnap.id,
    leadId: d.leadId as string,
    messages: (d.messages as Conversation['messages']) || [],
    updatedAt: d.updatedAt ? toDate(d.updatedAt) : undefined,
  };
}

function getRecommendedAction(lead: Lead, conversation?: Conversation): string {
  const msgCount = conversation?.messages?.length || 0;

  if (lead.status === 'converted') return 'Account closed — no action needed';
  if (lead.status === 'discovery_call_booked') return 'Prepare for discovery call';
  if (lead.status === 'consultant_requested') return 'Assign consultant & schedule call';
  if (lead.status === 'follow_up_pending') return 'Send follow-up email within 24h';
  if (lead.status === 'prototype_sent') return 'Follow up on prototype feedback';
  if (lead.status === 'generating_prototype') return 'Wait for prototype completion';
  if (lead.status === 'contact_captured' && !lead.prototypeUrl) return 'Trigger prototype generation';

  if (lead.email && lead.status === 'clarifying') return 'Monitor conversation — lead is engaged';

  if (msgCount === 0) return 'New lead — awaiting first interaction';
  if (msgCount <= 2) return 'Early stage — let AI continue discovery';
  if (msgCount > 10 && !lead.email) return 'High engagement, no email — prioritize capture';

  if (lead.qualificationSegment === 'high_fit') return 'High-fit lead — fast-track to consultation';
  if (lead.qualificationSegment === 'not_qualified') return 'Low priority — auto-nurture via email';

  return 'Continue monitoring conversation';
}

/** Subscribe to all leads in real-time. Returns unsubscribe function. */
export function subscribeToLeads(callback: (leads: Lead[]) => void): () => void {
  const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const leads = snap.docs.map((d) => mapLeadDoc(d as any));
    callback(leads);
  });
}

/** Subscribe to all conversations in real-time. Returns unsubscribe function. */
export function subscribeToConversations(callback: (convos: Conversation[]) => void): () => void {
  const q = query(collection(db, 'conversations'));
  return onSnapshot(q, (snap) => {
    const convos = snap.docs.map((d) => mapConversationDoc(d as any));
    callback(convos);
  });
}

/** Join leads with their conversations and compute derived fields. */
export function buildLeadViews(leads: Lead[], conversations: Conversation[]): LeadWithConversation[] {
  const convoMap = new Map<string, Conversation>();
  conversations.forEach((c) => convoMap.set(c.leadId, c));

  return leads.map((lead) => {
    const conversation = convoMap.get(lead.id);
    const messageCount = conversation?.messages?.length || 0;
    const lastMsgTime = conversation?.messages?.[messageCount - 1]?.timestamp;
    const lastActivity = lastMsgTime ? new Date(lastMsgTime) : lead.updatedAt;
    const recommendedAction = getRecommendedAction(lead, conversation);

    return { ...lead, conversation, messageCount, lastActivity, recommendedAction };
  });
}

/** Compute aggregate CRM stats. */
export function computeStats(leads: Lead[]): CRMStats {
  const statusCounts = {} as Record<LeadStatus, number>;
  const segmentCounts = {} as Record<QualificationSegment, number>;
  let totalScore = 0;
  let scoredCount = 0;
  let protoCount = 0;
  let convertedCount = 0;

  leads.forEach((l) => {
    statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    if (l.qualificationSegment) {
      segmentCounts[l.qualificationSegment] = (segmentCounts[l.qualificationSegment] || 0) + 1;
    }
    if (l.qualificationScore != null) {
      totalScore += l.qualificationScore;
      scoredCount++;
    }
    if (l.prototypeUrl) protoCount++;
    if (l.status === 'converted') convertedCount++;
  });

  const activeStatuses: LeadStatus[] = ['started', 'clarifying', 'contact_captured', 'generating_prototype'];
  const activeConversations = leads.filter((l) => activeStatuses.includes(l.status)).length;

  return {
    totalLeads: leads.length,
    activeConversations,
    prototypesGenerated: protoCount,
    conversionRate: leads.length > 0 ? (convertedCount / leads.length) * 100 : 0,
    avgQualificationScore: scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0,
    leadsByStatus: statusCounts,
    leadsBySegment: segmentCounts,
  };
}

/** Update a lead's status. */
export async function updateLeadStatus(leadId: string, status: LeadStatus): Promise<void> {
  await updateDoc(doc(db, 'leads', leadId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

/** Update lead fields (e.g. qualificationScore, segment). */
export async function updateLead(leadId: string, data: Partial<Omit<Lead, 'id' | 'createdAt'>>): Promise<void> {
  const { updatedAt, ...rest } = data as any;
  await updateDoc(doc(db, 'leads', leadId), {
    ...rest,
    updatedAt: serverTimestamp(),
  });
}
