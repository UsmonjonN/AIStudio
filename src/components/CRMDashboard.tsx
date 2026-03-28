import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart3,
  Users,
  MessageSquare,
  Monitor,
  TrendingUp,
  Search,
  Filter,
  ArrowLeft,
  Clock,
  Zap,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

import {
  subscribeToLeads,
  subscribeToConversations,
  buildLeadViews,
  computeStats,
  updateLeadStatus,
} from '../services/crmService';
import type {
  Lead,
  Conversation,
  LeadWithConversation,
  CRMStats,
  LeadStatus,
} from '../types/crm';
import { STATUS_LABELS } from '../types/crm';
import LeadDetail from './LeadDetail';

// ─── Dark-theme status colours ─────────────────────────────────
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

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; accent: string;
}) {
  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 flex items-start gap-4 overflow-hidden group hover:border-[#4ABFE8]/30 transition-all duration-300">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">{label}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        {sub && <p className="text-xs text-white/40 mt-0.5">{sub}</p>}
      </div>
      <div className="absolute inset-0 bg-linear-to-br from-[#4ABFE8]/0 to-[#4ABFE8]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
}

// ─── Score Badge ──────────────────────────────────────────────
function ScoreBadge({ score }: { score?: number }) {
  if (score == null) return <span className="text-xs text-white/20 italic">—</span>;
  const color = score >= 60
    ? 'text-green-300 bg-green-500/20'
    : score >= 35
    ? 'text-amber-300 bg-amber-500/20'
    : 'text-red-300 bg-red-500/20';
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{score}</span>;
}

// ─── Time ago ─────────────────────────────────────────────────
function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ─── Main CRM Dashboard ──────────────────────────────────────
export default function CRMDashboard({ onBack }: { onBack: () => void }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleError = (err: Error) => { setDataError(err.message); setLoading(false); };
    const unsubLeads = subscribeToLeads((data) => { setLeads(data); setLoading(false); }, handleError);
    const unsubConvos = subscribeToConversations(setConversations, handleError);
    return () => { unsubLeads(); unsubConvos(); };
  }, []);

  const leadViews = useMemo(() => buildLeadViews(leads, conversations), [leads, conversations]);
  const stats = useMemo(() => computeStats(leads), [leads]);

  const filteredLeads = useMemo(() => {
    let result = leadViews;
    if (statusFilter !== 'all') result = result.filter((l) => l.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.email?.toLowerCase().includes(q) ||
          l.name?.toLowerCase().includes(q) ||
          l.company?.toLowerCase().includes(q) ||
          l.ideaSummary?.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q)
      );
    }
    return result;
  }, [leadViews, statusFilter, searchQuery]);

  const selectedLead = selectedLeadId ? leadViews.find((l) => l.id === selectedLeadId) : null;

  if (selectedLead) {
    return (
      <LeadDetail
        lead={selectedLead}
        onBack={() => setSelectedLeadId(null)}
        onStatusChange={async (status) => { await updateLeadStatus(selectedLead.id, status); }}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'linear-gradient(135deg, #070129 0%, #0B0B2C 50%, #0a0a24 100%)' }}>

      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl animate-pulse" style={{ background: '#1283BB' }} />
        <div className="absolute top-1/2 -right-32 w-80 h-80 rounded-full opacity-10 blur-3xl animate-pulse" style={{ background: '#4ABFE8', animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 px-8 py-4 flex items-center justify-between backdrop-blur-sm" style={{ background: 'rgba(7,1,41,0.8)' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-white/10 hover:border-[#4ABFE8]/50 hover:bg-white/5 transition-all duration-200 group"
          >
            <ArrowLeft className="w-5 h-5 text-white/50 group-hover:text-[#4ABFE8] transition-colors" />
          </button>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-[#4ABFE8]/30" style={{ background: 'rgba(74,191,232,0.1)' }}>
            <BarChart3 className="w-5 h-5" style={{ color: '#4ABFE8' }} />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white">Sales CRM</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] ml-3" style={{ color: '#4ABFE8' }}>Pipeline Dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {loading && <RefreshCw className="w-4 h-4 animate-spin text-white/30" />}
          <span className="text-xs font-semibold text-white/30 uppercase tracking-widest">Sales Rep View</span>
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto p-8">

        {/* Error banner */}
        {dataError && (
          <div className="mb-6 px-4 py-3 rounded-xl border border-red-500/30 text-sm font-medium" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>
            Failed to load CRM data: {dataError}
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users}        label="Total Leads"          value={stats.totalLeads}                                    accent="bg-[#4ABFE8]/10 text-[#4ABFE8]" />
          <StatCard icon={MessageSquare} label="Active Conversations" value={stats.activeConversations}                           accent="bg-[#1283BB]/20 text-[#4ABFE8]" />
          <StatCard icon={Monitor}      label="Prototypes Generated"  value={stats.prototypesGenerated}                           accent="bg-purple-500/20 text-purple-300" />
          <StatCard
            icon={TrendingUp}
            label="Conversion Rate"
            value={`${stats.conversionRate.toFixed(1)}%`}
            sub={stats.avgQualificationScore ? `Avg score: ${stats.avgQualificationScore}` : undefined}
            accent="bg-green-500/20 text-green-300"
          />
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search leads by name, email, company, or idea…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-white/30 border border-white/10 focus:outline-none focus:border-[#4ABFE8]/50 focus:ring-2 transition-all"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-white/30" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
              className="rounded-xl py-3 px-4 text-sm text-white border border-white/10 focus:outline-none focus:border-[#4ABFE8]/50 transition-all appearance-none cursor-pointer"
              style={{ background: '#0f172a' }}
            >
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <p className="text-xs font-bold text-white/30">
            {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Leads Table */}
        <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_2fr_60px] px-6 py-3.5 border-b border-white/10 text-[11px] font-bold uppercase tracking-[0.15em] text-white/30" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span>Lead</span>
            <span>Status</span>
            <span>Score</span>
            <span>Messages</span>
            <span>Last Activity</span>
            <span>Recommended Action</span>
            <span />
          </div>

          {/* Table Body */}
          {filteredLeads.length === 0 ? (
            <div className="py-20 text-center">
              <Users className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/30 font-medium">
                {loading ? 'Loading leads…' : 'No leads found'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              <AnimatePresence initial={false}>
                {filteredLeads.map((lead) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_2fr_60px] px-6 py-4 items-center cursor-pointer group transition-all duration-150"
                    style={{ background: 'transparent' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(74,191,232,0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => setSelectedLeadId(lead.id)}
                  >
                    {/* Lead Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-[#4ABFE8]/20" style={{ background: 'rgba(74,191,232,0.1)' }}>
                        <span className="text-sm font-bold" style={{ color: '#4ABFE8' }}>
                          {(lead.name || lead.email || lead.id)?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {lead.name || lead.email || `Lead #${lead.id.slice(0, 6)}`}
                        </p>
                        {lead.company && <p className="text-[11px] text-white/40 truncate">{lead.company}</p>}
                        {lead.ideaSummary && <p className="text-[11px] text-white/25 truncate max-w-xs">{lead.ideaSummary}</p>}
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_DARK[lead.status]}`}>
                        {STATUS_LABELS[lead.status]}
                      </span>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <ScoreBadge score={lead.qualificationScore} />
                    </div>

                    {/* Messages */}
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-white/25" />
                      <span className="text-sm font-semibold text-white/70">{lead.messageCount}</span>
                    </div>

                    {/* Last Activity */}
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-white/25" />
                      <span className="text-xs text-white/40">{timeAgo(lead.lastActivity)}</span>
                    </div>

                    {/* Recommended Action */}
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 shrink-0" style={{ color: '#4ABFE8' }} />
                      <span className="text-xs text-white/50 font-medium">{lead.recommendedAction}</span>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-end">
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-[#4ABFE8] transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
