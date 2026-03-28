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
} from 'lucide-react';

import {
  subscribeToLeads,
  subscribeToConversations,
  buildLeadViews,
  computeStats,
  updateLeadStatus,
} from '../services/crmService';
import { scoreLead } from '../services/leadScoringService';
import type {
  Lead,
  Conversation,
  LeadWithConversation,
  CRMStats,
  LeadStatus,
} from '../types/crm';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  SEGMENT_LABELS,
  SEGMENT_COLORS,
} from '../types/crm';
import LeadDetail from './LeadDetail';

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-srp-border p-6 flex items-start gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-srp-navy/40">{label}</p>
        <p className="text-2xl font-display font-black text-srp-navy mt-1">{value}</p>
        {sub && <p className="text-xs text-srp-navy/50 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Score Badge ──────────────────────────────────────────────
function ScoreBadge({ score }: { score?: number }) {
  if (score == null) return <span className="text-xs text-srp-navy/30 italic">—</span>;
  const color = score >= 60 ? 'text-green-600 bg-green-50' : score >= 35 ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50';
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
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Main CRM Dashboard ──────────────────────────────────────
export default function CRMDashboard({ onBack }: { onBack: () => void }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Data subscriptions
  useEffect(() => {
    const unsubLeads = subscribeToLeads(setLeads);
    const unsubConvos = subscribeToConversations(setConversations);
    return () => { unsubLeads(); unsubConvos(); };
  }, []);

  // Joined data
  const leadViews = useMemo(() => buildLeadViews(leads, conversations), [leads, conversations]);
  const stats = useMemo(() => computeStats(leads), [leads]);

  // Filter / search
  const filteredLeads = useMemo(() => {
    let result = leadViews;
    if (statusFilter !== 'all') {
      result = result.filter((l) => l.status === statusFilter);
    }
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

  // ── Detail view ──────────────────────────────────────
  if (selectedLead) {
    return (
      <LeadDetail
        lead={selectedLead}
        onBack={() => setSelectedLeadId(null)}
        onStatusChange={async (status) => {
          await updateLeadStatus(selectedLead.id, status);
        }}
      />
    );
  }

  // ── Dashboard ────────────────────────────────────────
  return (
    <div className="h-screen bg-srp-bg font-sans text-srp-navy flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-srp-border px-8 py-4 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-srp-bg transition-colors">
            <ArrowLeft className="w-5 h-5 text-srp-navy/50" />
          </button>
          <div className="w-10 h-10 bg-srp-navy rounded-xl flex items-center justify-center shadow-lg -rotate-3">
            <BarChart3 className="text-srp-teal w-6 h-6" />
          </div>
          <div>
            <span className="font-display font-extrabold text-xl tracking-tight text-srp-navy uppercase">
              Sales CRM
            </span>
            <span className="text-[10px] text-srp-teal font-bold uppercase tracking-[0.3em] ml-3">
              Pipeline Dashboard
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-srp-navy/50 uppercase tracking-widest">Sales Rep View</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label="Total Leads" value={stats.totalLeads} color="bg-srp-teal/10 text-srp-teal" />
          <StatCard icon={MessageSquare} label="Active Conversations" value={stats.activeConversations} color="bg-blue-50 text-blue-600" />
          <StatCard icon={Monitor} label="Prototypes Generated" value={stats.prototypesGenerated} color="bg-purple-50 text-purple-600" />
          <StatCard
            icon={TrendingUp}
            label="Conversion Rate"
            value={`${stats.conversionRate.toFixed(1)}%`}
            sub={stats.avgQualificationScore ? `Avg score: ${stats.avgQualificationScore}` : undefined}
            color="bg-green-50 text-green-600"
          />
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-srp-navy/30" />
            <input
              type="text"
              placeholder="Search leads by name, email, company, or idea..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-srp-border rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-srp-teal/10 focus:border-srp-teal transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-srp-navy/30" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
              className="bg-white border border-srp-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-4 focus:ring-srp-teal/10 focus:border-srp-teal transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-srp-navy/40 font-bold">
            {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-2xl border border-srp-border shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_2fr_80px] px-6 py-3.5 bg-srp-bg border-b border-srp-border text-[11px] font-bold uppercase tracking-[0.15em] text-srp-navy/40">
            <span>Lead</span>
            <span>Status</span>
            <span>Score</span>
            <span>Messages</span>
            <span>Last Activity</span>
            <span>Recommended Action</span>
            <span></span>
          </div>

          {/* Table Body */}
          {filteredLeads.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-10 h-10 text-srp-navy/10 mx-auto mb-3" />
              <p className="text-sm text-srp-navy/30 font-medium">No leads found</p>
            </div>
          ) : (
            <div className="divide-y divide-srp-border">
              <AnimatePresence initial={false}>
                {filteredLeads.map((lead) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_2fr_80px] px-6 py-4 items-center hover:bg-srp-bg/50 transition-colors cursor-pointer group"
                    onClick={() => setSelectedLeadId(lead.id)}
                  >
                    {/* Lead Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-srp-teal/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-srp-teal">
                          {(lead.name || lead.email || lead.id)?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-srp-navy truncate">
                          {lead.name || lead.email || `Lead #${lead.id.slice(0, 6)}`}
                        </p>
                        {lead.company && <p className="text-[11px] text-srp-navy/40 truncate">{lead.company}</p>}
                        {lead.ideaSummary && <p className="text-[11px] text-srp-navy/30 truncate max-w-xs">{lead.ideaSummary}</p>}
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[lead.status]}`}>
                        {STATUS_LABELS[lead.status]}
                      </span>
                    </div>

                    {/* Score */}
                    <div>
                      <ScoreBadge score={lead.qualificationScore} />
                      {lead.qualificationSegment && (
                        <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${SEGMENT_COLORS[lead.qualificationSegment]}`}>
                          {SEGMENT_LABELS[lead.qualificationSegment]}
                        </span>
                      )}
                    </div>

                    {/* Messages */}
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-srp-navy/30" />
                      <span className="text-sm font-semibold text-srp-navy">{lead.messageCount}</span>
                    </div>

                    {/* Last Activity */}
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-srp-navy/30" />
                      <span className="text-xs text-srp-navy/50">{timeAgo(lead.lastActivity)}</span>
                    </div>

                    {/* Recommended Action */}
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-srp-teal shrink-0" />
                      <span className="text-xs text-srp-navy/60 font-medium">{lead.recommendedAction}</span>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-end">
                      <ChevronRight className="w-4 h-4 text-srp-navy/20 group-hover:text-srp-teal transition-colors" />
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
