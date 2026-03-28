import React from 'react';
import {
  Play,
  MessageSquare,
  Mail,
  Monitor,
  Send,
  Phone,
  CheckCircle,
  Target,
  ArrowRight,
} from 'lucide-react';
import type { LeadWithConversation, LeadStatus } from '../types/crm';
import { STATUS_LABELS } from '../types/crm';

interface TimelineEvent {
  id: string;
  icon: React.ElementType;
  color: string;
  title: string;
  description?: string;
  timestamp: Date;
}

function formatTime(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Reconstructs a timeline of events from lead data + conversation messages.
 */
function buildTimeline(lead: LeadWithConversation): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // 1. Lead created
  events.push({
    id: 'created',
    icon: Play,
    color: 'text-gray-500 bg-gray-100',
    title: 'Lead created',
    description: 'Visitor started a conversation',
    timestamp: lead.createdAt,
  });

  // 2. Track conversation milestones from messages
  const msgs = lead.conversation?.messages || [];
  let userMsgCount = 0;
  let emailDetected = false;

  for (const msg of msgs) {
    if (msg.role === 'user') {
      userMsgCount++;

      // First user message
      if (userMsgCount === 1) {
        events.push({
          id: `msg-first`,
          icon: MessageSquare,
          color: 'text-blue-500 bg-blue-50',
          title: 'First message sent',
          description: msg.text.length > 80 ? msg.text.slice(0, 80) + '…' : msg.text,
          timestamp: new Date(msg.timestamp),
        });
      }

      // 3rd user message = engaged
      if (userMsgCount === 3) {
        events.push({
          id: `msg-engaged`,
          icon: Target,
          color: 'text-indigo-500 bg-indigo-50',
          title: 'Lead engaged (3+ messages)',
          timestamp: new Date(msg.timestamp),
        });
      }

      // Email detected
      const emailMatch = msg.text.match(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/);
      if (emailMatch && !emailDetected) {
        emailDetected = true;
        events.push({
          id: `email-captured`,
          icon: Mail,
          color: 'text-emerald-500 bg-emerald-50',
          title: 'Email captured',
          description: emailMatch[0],
          timestamp: new Date(msg.timestamp),
        });
      }
    }

    // Prototype trigger
    if (msg.role === 'bot' && (msg.text.includes('[GENERATE_UI_PROTOTYPE]') || msg.text.includes('[GENERATE_TECH_SPEC]'))) {
      const type = msg.text.includes('[GENERATE_UI_PROTOTYPE]') ? 'UI Prototype' : 'Tech Spec';
      events.push({
        id: `proto-trigger`,
        icon: Monitor,
        color: 'text-purple-500 bg-purple-50',
        title: `${type} generation triggered`,
        timestamp: new Date(msg.timestamp),
      });
    }
  }

  // 3. Prototype completed (if URL exists)
  if (lead.prototypeUrl) {
    events.push({
      id: 'proto-done',
      icon: CheckCircle,
      color: 'text-purple-600 bg-purple-100',
      title: 'Prototype generated',
      description: 'Visual concept ready for review',
      timestamp: lead.updatedAt,
    });
  }

  // 4. Status-based events
  const statusEvents: Partial<Record<LeadStatus, { icon: React.ElementType; color: string; title: string }>> = {
    follow_up_pending: { icon: Send, color: 'text-orange-500 bg-orange-50', title: 'Moved to follow-up' },
    consultant_requested: { icon: Phone, color: 'text-teal-500 bg-teal-50', title: 'Consultation requested' },
    discovery_call_booked: { icon: Phone, color: 'text-emerald-600 bg-emerald-100', title: 'Discovery call booked' },
    converted: { icon: CheckCircle, color: 'text-green-600 bg-green-100', title: 'Lead converted!' },
  };

  if (statusEvents[lead.status]) {
    const ev = statusEvents[lead.status]!;
    events.push({
      id: `status-${lead.status}`,
      icon: ev.icon,
      color: ev.color,
      title: ev.title,
      timestamp: lead.updatedAt,
    });
  }

  // Sort by timestamp
  events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return events;
}

export default function ActivityTimeline({ lead }: { lead: LeadWithConversation }) {
  const events = buildTimeline(lead);

  if (events.length === 0) {
    return (
      <p className="text-xs text-srp-navy/30 italic text-center py-4">No activity yet</p>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-4 bottom-4 w-px bg-srp-border" />

      <div className="space-y-4">
        {events.map((event, i) => {
          const Icon = event.icon;
          return (
            <div key={event.id} className="flex items-start gap-3 relative">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 z-10 ${event.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-semibold text-srp-navy">{event.title}</p>
                {event.description && (
                  <p className="text-xs text-srp-navy/40 mt-0.5 truncate max-w-[240px]">{event.description}</p>
                )}
                <p className="text-[10px] text-srp-navy/30 mt-1">{formatTime(event.timestamp)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
