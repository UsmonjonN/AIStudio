import React, { useState } from 'react';
import {
  ArrowLeft,
  Mail,
  Building2,
  User,
  MessageSquare,
  Clock,
  Zap,
  Monitor,
  ExternalLink,
  Bot,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  FileText,
  Activity,
} from 'lucide-react';
import type { LeadWithConversation, LeadStatus } from '../types/crm';
import { STATUS_LABELS, SEGMENT_LABELS, SEGMENT_COLORS } from '../types/crm';
import { scoreLead } from '../services/leadScoringService';

// ─── Dark-theme status colours ────────────────────────────────
const STATUS_DARK: Record<LeadStatus, string> = {
  started:               'bg-white/10 text-white/60',
  clarifying:            'bg-[#1283BB]/20 text-[#4ABFE8]',
  contact_captured:      'bg-indigo-500/20 text-indigo-300',
  generating_prototype:  'bg-amber-500/20 text-amber-300',
  prototype_sent:        'bg-purple-500/20 text-purple-300',
  follow_up_pending:     'bg-orange-500/20 text-orange-300',
  consultant_requested:  'bg-[#4ABFE8]/20 text-[#4ABFE8]',
  discovery_call_booked: 'bg-emerald-500/20 text-emerald-300',
  converted:             'bg-green-500/20 text-green-300',
};

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
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

  const scoreResult = lead.conversation?.messages ? scoreLead(lead.conversation.messages) : null;
  const messages = lead.conversation?.messages || [];
  const visibleMessages = showAllMessages ? messages : messages.slice(-10);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'linear-gradient(135deg, #070129 0%, #0B0B2C 50%, #0a0a24 100%)' }}>

      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl animate-pulse" style={{ background: '#1283BB' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10 blur-3xl animate-pulse" style={{ background: '#4ABFE8', animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 px-8 py-4 flex items-center gap-4 backdrop-blur-sm" style={{ background: 'rgba(7,1,41,0.8)' }}>
        <button
          onClick={onBack}
          className="p-2 rounded-xl border border-white/10 hover:border-[#4ABFE8]/50 hover:bg-white/5 transition-all group"
        >
          <ArrowLeft className="w-5 h-5 text-white/50 group-hover:text-[#4ABFE8] transition-colors" />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-xl text-white truncate">
            {lead.name || lead.email || `Lead #${lead.id.slice(0, 8)}`}
          </h1>
          <p className="text-xs text-white/30">
            Created {formatDate(lead.createdAt)} · ID: {lead.id}
          </p>
        </div>

        {/* Status dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setStatusOpen(!statusOpen)}
            className={`text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 border border-white/10 transition-all ${STATUS_DARK[lead.status]}`}
          >
            {STATUS_LABELS[lead.status]}
            {statusOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {statusOpen && (
            <div className="absolute right-0 top-full mt-2 rounded-xl border border-white/10 shadow-2xl z-20 py-2 w-56 overflow-hidden" style={{ background: '#0f172a' }}>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={async () => { await onStatusChange(key as LeadStatus); setStatusOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 hover:bg-white/5"
                  style={{ color: lead.status === key ? '#4ABFE8' : 'rgba(255,255,255,0.6)' }}
                >
                  {lead.status === key && <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: '#4ABFE8' }} />}
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10 flex-1 flex overflow-hidden">

        {/* Left panel */}
        <div className="w-96 border-r border-white/10 overflow-y-auto p-6 space-y-5 shrink-0" style={{ background: 'rgba(255,255,255,0.02)' }}>

          {/* Contact Info */}
          <Panel title="Contact Information">
            <div className="space-y-3">
              <InfoRow icon={User}     label="Name"         value={lead.name} />
              <InfoRow icon={Mail}     label="Email"        value={lead.email} />
              <InfoRow icon={Building2} label="Company"     value={lead.company} />
              <InfoRow icon={FileText} label="Product Type" value={lead.productType?.replace(/_/g, ' ')} />
            </div>
          </Panel>

          {/* Idea Summary */}
          {lead.ideaSummary && (
            <Panel title="Idea Summary">
              <p className="text-sm text-white/60 leading-relaxed">{lead.ideaSummary}</p>
            </Panel>
          )}

          {/* Lead Score */}
          <Panel title="Lead Score">
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl font-bold text-white">
                {scoreResult?.score ?? lead.qualificationScore ?? '—'}
              </span>
              {(scoreResult?.segment || lead.qualificationSegment) && (
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${SEGMENT_COLORS[scoreResult?.segment || lead.qualificationSegment!]}`}>
                  {SEGMENT_LABELS[scoreResult?.segment || lead.qualificationSegment!]}
                </span>
              )}
            </div>
            <div className="w-full rounded-full h-2 mb-4 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(scoreResult?.score ?? lead.qualificationScore ?? 0, 100)}%`,
                  background: 'linear-gradient(90deg, #1283BB, #4ABFE8)',
                }}
              />
            </div>
            {scoreResult?.signals && scoreResult.signals.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Detected Signals</p>
                {scoreResult.signals.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-400 shrink-0" />
                    <span className="text-xs text-white/50">{s}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Recommended Action */}
          <Panel title="Recommended Action">
            <div className="flex items-start gap-3 rounded-xl p-3 border border-[#4ABFE8]/20" style={{ background: 'rgba(74,191,232,0.06)' }}>
              <Zap className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#4ABFE8' }} />
              <p className="text-sm font-medium text-white/80">{lead.recommendedAction}</p>
            </div>
          </Panel>

          {/* Metrics */}
          <Panel title="Engagement Metrics">
            <div className="grid grid-cols-2 gap-3">
              <MetricCard icon={MessageSquare} label="Messages"     value={lead.messageCount} />
              <MetricCard icon={Clock}         label="Last Active"  value={timeAgo(lead.lastActivity)} />
              <MetricCard
                icon={Monitor}
                label="Prototype"
                value={lead.prototypeUrl ? 'Generated' : lead.status === 'generating_prototype' ? 'In Progress' : 'None'}
              />
              <MetricCard icon={Mail} label="Email" value={lead.email ? 'Captured' : 'Pending'} />
            </div>
          </Panel>

          {/* Prototype link */}
          {lead.prototypeUrl && (
            <a
              href={lead.prototypeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white transition-all border border-white/10 hover:border-[#4ABFE8]/40"
              style={{ background: '#0f172a' }}
            >
              <ExternalLink className="w-4 h-4" style={{ color: '#4ABFE8' }} />
              View Prototype
            </a>
          )}
        </div>

        {/* Right panel: Conversation */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b border-white/10 px-6 py-3.5 flex items-center justify-between shrink-0" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4" style={{ color: '#4ABFE8' }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
                Conversation Transcript
              </span>
              <span className="text-[11px] text-white/25">({messages.length} messages)</span>
            </div>
            {messages.length > 10 && (
              <button
                onClick={() => setShowAllMessages(!showAllMessages)}
                className="text-xs font-bold hover:underline transition-colors"
                style={{ color: '#4ABFE8' }}
              >
                {showAllMessages ? 'Show Recent' : 'Show All'}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="w-10 h-10 text-white/10 mb-3" />
                <p className="text-sm text-white/30 font-medium">No conversation yet</p>
              </div>
            ) : (
              <>
                {!showAllMessages && messages.length > 10 && (
                  <button
                    onClick={() => setShowAllMessages(true)}
                    className="w-full py-2 text-xs font-bold text-center rounded-xl border border-dashed border-white/10 hover:border-[#4ABFE8]/40 text-white/30 hover:text-[#4ABFE8] transition-all"
                  >
                    ↑ Load {messages.length - 10} earlier messages
                  </button>
                )}
                {visibleMessages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                      msg.role === 'bot'
                        ? 'border-[#4ABFE8]/20'
                        : 'border-white/10'
                    }`} style={{ background: msg.role === 'bot' ? 'rgba(74,191,232,0.1)' : 'rgba(255,255,255,0.05)' }}>
                      {msg.role === 'bot'
                        ? <Bot className="w-4 h-4" style={{ color: '#4ABFE8' }} />
                        : <User className="w-4 h-4 text-white/60" />
                      }
                    </div>
                    <div className={`max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed border ${
                      msg.role === 'bot'
                        ? 'rounded-tl-none border-white/10 text-white/70'
                        : 'rounded-tr-none border-white/10 text-white/80'
                    }`} style={{ background: msg.role === 'bot' ? 'rgba(255,255,255,0.04)' : 'rgba(18,131,187,0.15)' }}>
                      {msg.text
                        .replace(/\[BUTTONS:.*?\]/g, '')
                        .replace('[GENERATE_UI_PROTOTYPE]', '')
                        .replace('[GENERATE_TECH_SPEC]', '')
                        .split('\n')
                        .map((line, i) => (
                          <p key={i} className={line.trim() === '' ? 'h-1.5' : 'mb-0.5'}>
                            {line.split(/(\*\*.*?\*\*)/g).map((part, j) =>
                              part.startsWith('**') && part.endsWith('**')
                                ? <strong key={j} className="font-bold text-white">{part.slice(2, -2)}</strong>
                                : part
                            )}
                          </p>
                        ))}
                      <p className="text-[10px] mt-2 text-white/25">
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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4">{title}</p>
      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-white/25 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-bold">{label}</p>
        <p className="text-sm text-white/70 font-medium truncate">
          {value || <span className="text-white/20 italic">Not provided</span>}
        </p>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="rounded-xl p-3 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-white/25" />
        <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-bold">{label}</span>
      </div>
      <p className="text-sm font-bold text-white/80">{value}</p>
    </div>
  );
}
