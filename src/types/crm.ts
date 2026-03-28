export type LeadStatus =
  | 'started'
  | 'clarifying'
  | 'contact_captured'
  | 'generating_prototype'
  | 'prototype_sent'
  | 'follow_up_pending'
  | 'consultant_requested'
  | 'discovery_call_booked'
  | 'converted';

export type QualificationSegment = 'high_fit' | 'medium_fit' | 'low_fit' | 'not_qualified';

export type ProductType = 'web_app' | 'mobile_app' | 'dashboard' | 'integration' | 'process' | 'other';

export interface Lead {
  id: string;
  email?: string;
  name?: string;
  company?: string;
  ideaSummary?: string;
  qualificationScore?: number;
  qualificationSegment?: QualificationSegment;
  status: LeadStatus;
  createdAt: Date;
  updatedAt: Date;
  prototypeUrl?: string;
  productType?: ProductType;
}

export interface ConversationMessage {
  role: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  leadId: string;
  messages: ConversationMessage[];
  updatedAt?: Date;
}

export interface LeadWithConversation extends Lead {
  conversation?: Conversation;
  messageCount: number;
  lastActivity: Date;
  recommendedAction: string;
}

export interface EmailEngagement {
  leadId: string;
  emailSent: boolean;
  emailOpened: boolean;
  emailClicked: boolean;
  sentAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
}

export interface CRMStats {
  totalLeads: number;
  activeConversations: number;
  prototypesGenerated: number;
  conversionRate: number;
  avgQualificationScore: number;
  leadsByStatus: Record<LeadStatus, number>;
  leadsBySegment: Record<QualificationSegment, number>;
}

export const STATUS_LABELS: Record<LeadStatus, string> = {
  started: 'Started',
  clarifying: 'Clarifying',
  contact_captured: 'Contact Captured',
  generating_prototype: 'Generating Prototype',
  prototype_sent: 'Prototype Sent',
  follow_up_pending: 'Follow-up Pending',
  consultant_requested: 'Consultation Requested',
  discovery_call_booked: 'Discovery Call Booked',
  converted: 'Converted',
};

export const STATUS_COLORS: Record<LeadStatus, string> = {
  started: 'bg-gray-100 text-gray-700',
  clarifying: 'bg-blue-100 text-blue-700',
  contact_captured: 'bg-indigo-100 text-indigo-700',
  generating_prototype: 'bg-yellow-100 text-yellow-700',
  prototype_sent: 'bg-purple-100 text-purple-700',
  follow_up_pending: 'bg-orange-100 text-orange-700',
  consultant_requested: 'bg-teal-100 text-teal-700',
  discovery_call_booked: 'bg-emerald-100 text-emerald-700',
  converted: 'bg-green-100 text-green-700',
};

export const SEGMENT_LABELS: Record<QualificationSegment, string> = {
  high_fit: 'High Fit',
  medium_fit: 'Medium Fit',
  low_fit: 'Low Fit',
  not_qualified: 'Not Qualified',
};

export const SEGMENT_COLORS: Record<QualificationSegment, string> = {
  high_fit: 'bg-green-100 text-green-700',
  medium_fit: 'bg-yellow-100 text-yellow-700',
  low_fit: 'bg-orange-100 text-orange-700',
  not_qualified: 'bg-red-100 text-red-700',
};
