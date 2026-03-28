import React, { useState } from 'react';
import {
  ArrowLeft,
  Mail,
  Building2,
  User,
  MessageSquare,
  Clock,
  Zap,
  Target,
  Monitor,
  ExternalLink,
  Bot,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  FileText,
  Activity,
} from 'lucide-react';
import type { LeadWithConversation, LeadStatus } from '../types/crm';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  SEGMENT_LABELS,
  SEGMENT_COLORS,
} from '../types/crm';
import { scoreLead } from '../services/leadScoringService';

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

interface Props {
  lead: LeadWithConversation;
  onBack: () => void;
  onStatusChange: (status: LeadStatus) => Promise<void>;
}

export default function LeadDetail({ lead, onBack, onStatusChange }: Props) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [showAllMessages, setShowAllMessages] = useState(false);

  const scoreResult = lead.conversation?.messages
    ? scoreLead(lead.conversation.messages)
    : null;

  const messages = lead.conversation?.messages || [];
  const visibleMessages = showAllMessages ? messages : messages.slice(-10);

  return (
    <div className="h-screen bg-srp-bg font-sans text-srp-navy flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-srp-border px-8 py-4 flex items-center gap-4 z-10 shadow-sm">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-srp-bg transition-colors">
          <ArrowLeft className="w-5 h-5 text-srp-navy/50" />
        </button>
        <div className="flex-1">
          <h1 className="font-display font-extrabold text-xl text-srp-navy">
            {lead.name || lead.email || `Lead #${lead.id.slice(0, 8)}`}
          </h1>
          <p className="text-xs text-srp-navy/40">
            Created {formatDate(lead.createdAt)} · ID: {lead.id}
          </p>
        </div>
        {/* Status Dropdown */}
        <div className="relative">
          <button
            onClick={() => setStatusOpen(!statusOpen)}
            className={`text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 transition-all ${STATUS_COLORS[lead.status]}`}
          >
            {STATUS_LABELS[lead.status]}
            {statusOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {statusOpen && (
            <div className="absolute right-0 top-full mt-2 bg-white rounded-xl border border-srp-border shadow-xl z-20 py-2 w-56">
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={async () => {
                    await onStatusChange(key as LeadStatus);
                    setStatusOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-srp-bg transition-colors flex items-center gap-2 ${
                    lead.status === key ? 'font-bold text-srp-teal' : 'text-srp-navy/70'
                  }`}
                >
                  {lead.status === key && <CheckCircle className="w-3.5 h-3.5" />}
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left: Lead Info + Scores */}
        <div className="w-[380px] border-r border-srp-border bg-white overflow-y-auto p-6 space-y-6">
          {/* Contact Info */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-srp-navy/40 mb-3">Contact Information</h3>
            <div className="space-y-3">
              <InfoRow icon={User} label="Name" value={lead.name} />
              <InfoRow icon={Mail} label="Email" value={lead.email} />
              <InfoRow icon={Building2} label="Company" value={lead.company} />
              <InfoRow icon={FileText} label="Product Type" value={lead.productType?.replace('_', ' ')} />
            </div>
          </section>

          {/* Idea Summary */}
          {lead.ideaSummary && (
            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-srp-navy/40 mb-3">Idea Summary</h3>
              <p className="text-sm text-srp-navy/70 leading-relaxed bg-srp-bg rounded-xl p-4 border border-srp-border">
                {lead.ideaSummary}
              </p>
            </section>
          )}

          {/* Lead Score */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-srp-navy/40 mb-3">Lead Score</h3>
            <div className="bg-srp-bg rounded-xl p-4 border border-srp-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl font-display font-black text-srp-navy">
                  {scoreResult?.score ?? lead.qualificationScore ?? '—'}
                </span>
                {(scoreResult?.segment || lead.qualificationSegment) && (
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    SEGMENT_COLORS[scoreResult?.segment || lead.qualificationSegment!]
                  }`}>
                    {SEGMENT_LABELS[scoreResult?.segment || lead.qualificationSegment!]}
                  </span>
                )}
              </div>
              {/* Score bar */}
              <div className="w-full bg-white rounded-full h-2.5 mb-3">
                <div
                  className="h-2.5 rounded-full transition-all duration-700 bg-gradient-to-r from-srp-teal to-[#008A93]"
                  style={{ width: `${Math.min(scoreResult?.score ?? lead.qualificationScore ?? 0, 100)}%` }}
                />
              </div>
              {/* Signals */}
              {scoreResult?.signals && scoreResult.signals.length > 0 && (
                <div className="space-y-1.5 mt-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-srp-navy/30">Detected Signals</p>
                  {scoreResult.signals.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                      <span className="text-xs text-srp-navy/60">{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Recommended Action */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-srp-navy/40 mb-3">Recommended Action</h3>
            <div className="bg-srp-teal/5 rounded-xl p-4 border border-srp-teal/20 flex items-start gap-3">
              <Zap className="w-5 h-5 text-srp-teal shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-srp-navy">{lead.recommendedAction}</p>
            </div>
          </section>

          {/* Engagement Metrics */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-srp-navy/40 mb-3">Engagement Metrics</h3>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard icon={MessageSquare} label="Messages" value={lead.messageCount} />
              <MetricCard icon={Clock} label="Last Active" value={timeAgo(lead.lastActivity)} />
              <MetricCard
                icon={Monitor}
                label="Prototype"
                value={lead.prototypeUrl ? 'Generated' : lead.status === 'generating_prototype' ? 'In Progress' : 'None'}
              />
              <MetricCard icon={Mail} label="Email" value={lead.email ? 'Captured' : 'Pending'} />
            </div>
          </section>

          {/* Prototype Link */}
          {lead.prototypeUrl && (
            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-srp-navy/40 mb-3">Generated Prototype</h3>
              <a
                href={lead.prototypeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-srp-navy text-white px-4 py-3 rounded-xl text-sm font-bold hover:bg-srp-navy/90 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                View Prototype
              </a>
            </section>
          )}
        </div>

        {/* Right: Conversation Transcript */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white border-b border-srp-border px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-srp-teal" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-srp-navy/40">
                Conversation Transcript
              </span>
              <span className="text-[11px] text-srp-navy/30">
                ({messages.length} messages)
              </span>
            </div>
            {messages.length > 10 && (
              <button
                onClick={() => setShowAllMessages(!showAllMessages)}
                className="text-xs text-srp-teal font-bold hover:underline"
              >
                {showAllMessages ? 'Show Recent' : 'Show All'}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="w-10 h-10 text-srp-navy/10 mb-3" />
                <p className="text-sm text-srp-navy/30 font-medium">No conversation yet</p>
              </div>
            ) : (
              <>
                {!showAllMessages && messages.length > 10 && (
                  <button
                    onClick={() => setShowAllMessages(true)}
                    className="w-full py-2 text-xs text-srp-navy/40 hover:text-srp-teal font-bold text-center border border-dashed border-srp-border rounded-xl hover:border-srp-teal transition-colors"
                  >
                    ↑ Load {messages.length - 10} earlier messages
                  </button>
                )}
                {visibleMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      msg.role === 'bot' ? 'bg-srp-bg text-srp-teal' : 'bg-srp-navy text-white'
                    }`}>
                      {msg.role === 'bot' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className={`max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'bot'
                        ? 'bg-srp-bg text-srp-navy rounded-tl-none border border-srp-border'
                        : 'bg-srp-navy text-white rounded-tr-none'
                    }`}>
                      {msg.text
                        .replace(/\[BUTTONS:.*?\]/g, '')
                        .replace('[GENERATE_UI_PROTOTYPE]', '')
                        .replace('[GENERATE_TECH_SPEC]', '')
                        .split('\n')
                        .map((line, i) => (
                          <p key={i} className={line.trim() === '' ? 'h-1.5' : 'mb-0.5'}>
                            {line.split(/(\*\*.*?\*\*)/g).map((part, j) =>
                              part.startsWith('**') && part.endsWith('**')
                                ? <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>
                                : part
                            )}
                          </p>
                        ))}
                      <p className="text-[10px] mt-2 opacity-40">
                        {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-srp-navy/30 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.15em] text-srp-navy/30 font-bold">{label}</p>
        <p className="text-sm text-srp-navy font-medium truncate">{value || <span className="text-srp-navy/20 italic">Not provided</span>}</p>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="bg-srp-bg rounded-xl p-3 border border-srp-border">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-srp-navy/30" />
        <span className="text-[10px] uppercase tracking-[0.15em] text-srp-navy/30 font-bold">{label}</span>
      </div>
      <p className="text-sm font-bold text-srp-navy">{value}</p>
    </div>
  );
}
