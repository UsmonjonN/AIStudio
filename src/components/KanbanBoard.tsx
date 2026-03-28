import React, { useState, useRef } from 'react';
import {
  MessageSquare,
  Clock,
  Zap,
  GripVertical,
  ChevronRight,
} from 'lucide-react';
import type { LeadWithConversation, LeadStatus } from '../types/crm';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  SEGMENT_LABELS,
  SEGMENT_COLORS,
} from '../types/crm';

// Pipeline column order
const PIPELINE_STAGES: LeadStatus[] = [
  'started',
  'clarifying',
  'contact_captured',
  'generating_prototype',
  'prototype_sent',
  'follow_up_pending',
  'consultant_requested',
  'discovery_call_booked',
  'converted',
];

const COLUMN_DOT_COLORS: Record<LeadStatus, string> = {
  started: 'bg-gray-400',
  clarifying: 'bg-blue-500',
  contact_captured: 'bg-indigo-500',
  generating_prototype: 'bg-yellow-500',
  prototype_sent: 'bg-purple-500',
  follow_up_pending: 'bg-orange-500',
  consultant_requested: 'bg-teal-500',
  discovery_call_booked: 'bg-emerald-500',
  converted: 'bg-green-500',
};

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

interface Props {
  leads: LeadWithConversation[];
  onSelectLead: (id: string) => void;
  onStatusChange: (leadId: string, newStatus: LeadStatus) => Promise<void>;
}

export default function KanbanBoard({ leads, onSelectLead, onStatusChange }: Props) {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<LeadStatus | null>(null);
  const dragCounter = useRef<Record<string, number>>({});

  // Group leads by status
  const columns = PIPELINE_STAGES.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    leads: leads.filter((l) => l.status === status),
  }));

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', leadId);
  };

  const handleDragEnd = () => {
    setDraggedLeadId(null);
    setDragOverColumn(null);
    dragCounter.current = {};
  };

  const handleDragEnter = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    dragCounter.current[status] = (dragCounter.current[status] || 0) + 1;
    setDragOverColumn(status);
  };

  const handleDragLeave = (status: LeadStatus) => {
    dragCounter.current[status] = (dragCounter.current[status] || 0) - 1;
    if (dragCounter.current[status] <= 0) {
      dragCounter.current[status] = 0;
      if (dragOverColumn === status) setDragOverColumn(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: LeadStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    if (!leadId) return;

    const lead = leads.find((l) => l.id === leadId);
    if (lead && lead.status !== targetStatus) {
      await onStatusChange(leadId, targetStatus);
    }
    setDraggedLeadId(null);
    setDragOverColumn(null);
    dragCounter.current = {};
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-full px-2">
      {columns.map((col) => (
        <div
          key={col.status}
          className={`flex-shrink-0 w-72 flex flex-col rounded-2xl border transition-all duration-200 ${
            dragOverColumn === col.status
              ? 'border-srp-teal bg-srp-teal/5 shadow-lg'
              : 'border-srp-border bg-white/60'
          }`}
          onDragEnter={(e) => handleDragEnter(e, col.status)}
          onDragLeave={() => handleDragLeave(col.status)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, col.status)}
        >
          {/* Column Header */}
          <div className="px-4 py-3 border-b border-srp-border flex items-center justify-between bg-white rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${COLUMN_DOT_COLORS[col.status]}`} />
              <span className="text-xs font-bold text-srp-navy uppercase tracking-wider">
                {col.label}
              </span>
            </div>
            <span className="text-[11px] font-bold text-srp-navy/30 bg-srp-bg px-2 py-0.5 rounded-full">
              {col.leads.length}
            </span>
          </div>

          {/* Column Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[120px]">
            {col.leads.length === 0 ? (
              <div className="flex items-center justify-center h-20 text-srp-navy/15 text-xs font-medium">
                {dragOverColumn === col.status ? 'Drop here' : 'No leads'}
              </div>
            ) : (
              col.leads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onSelectLead(lead.id)}
                  style={{ opacity: draggedLeadId === lead.id ? 0.5 : 1 }}
                  className="bg-white rounded-xl border border-srp-border p-3.5 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-srp-teal/30 transition-all group"
                >
                  {/* Drag handle + Name */}
                  <div className="flex items-start gap-2 mb-2">
                    <GripVertical className="w-3.5 h-3.5 text-srp-navy/15 mt-0.5 shrink-0 group-hover:text-srp-navy/30" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-srp-navy truncate">
                        {lead.name || lead.email || `Lead #${lead.id.slice(0, 6)}`}
                      </p>
                      {lead.company && (
                        <p className="text-[11px] text-srp-navy/40 truncate">{lead.company}</p>
                      )}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-srp-navy/15 group-hover:text-srp-teal shrink-0 mt-0.5" />
                  </div>

                  {/* Idea snippet */}
                  {lead.ideaSummary && (
                    <p className="text-[11px] text-srp-navy/40 leading-relaxed mb-2.5 line-clamp-2">
                      {lead.ideaSummary}
                    </p>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Score */}
                    {lead.qualificationScore != null && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        lead.qualificationScore >= 60
                          ? 'bg-green-50 text-green-600'
                          : lead.qualificationScore >= 35
                          ? 'bg-yellow-50 text-yellow-600'
                          : 'bg-red-50 text-red-600'
                      }`}>
                        {lead.qualificationScore}
                      </span>
                    )}
                    {lead.qualificationSegment && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${SEGMENT_COLORS[lead.qualificationSegment]}`}>
                        {SEGMENT_LABELS[lead.qualificationSegment]}
                      </span>
                    )}
                    <div className="flex items-center gap-1 ml-auto">
                      <MessageSquare className="w-3 h-3 text-srp-navy/25" />
                      <span className="text-[10px] text-srp-navy/40 font-semibold">{lead.messageCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-srp-navy/25" />
                      <span className="text-[10px] text-srp-navy/40">{timeAgo(lead.lastActivity)}</span>
                    </div>
                  </div>

                  {/* Action hint */}
                  <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-srp-border/50">
                    <Zap className="w-3 h-3 text-srp-teal shrink-0" />
                    <span className="text-[10px] text-srp-navy/50 truncate">{lead.recommendedAction}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
