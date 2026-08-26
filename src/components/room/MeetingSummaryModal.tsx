import React, { useState } from 'react';
import { useWebRTC } from '../../context/WebRTCContext';
import {
  X,
  Sparkles,
  CheckCircle2,
  ListTodo,
  FileText,
  Copy,
  Check,
  Download,
  RefreshCw,
  Calendar,
  Layers,
  ArrowRight,
  Share2,
  Clock
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface MeetingSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MeetingSummaryModal: React.FC<MeetingSummaryModalProps> = ({ isOpen, onClose }) => {
  const {
    meetingSummary,
    isGeneratingSummary,
    generateSummary,
    meetingCode,
    transcript
  } = useWebRTC();

  const { success } = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyMarkdown = () => {
    if (!meetingSummary) return;

    const points = meetingSummary.keyDiscussionPoints || meetingSummary.keyPoints || [];
    const decisions = meetingSummary.decisionsMade || meetingSummary.decisions || [];
    const nextSteps = meetingSummary.nextSteps || [];

    let md = `# MeetSpace AI Intelligence Report\n**Meeting:** ${meetingSummary.title || meetingCode}\n**Date:** ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n\n`;
    md += `## Executive Summary\n${meetingSummary.executiveSummary}\n\n`;

    if (points.length > 0) {
      md += `## Key Discussion Points\n`;
      points.forEach(kp => {
        md += `- ${kp}\n`;
      });
      md += `\n`;
    }

    if (meetingSummary.actionItems && meetingSummary.actionItems.length > 0) {
      md += `## Action Items\n`;
      meetingSummary.actionItems.forEach(ai => {
        md += `- [ ] **${ai.task}** (Owner: ${ai.assignee || 'Unassigned'}, Priority: ${ai.priority || 'Medium'})\n`;
      });
      md += `\n`;
    }

    if (decisions.length > 0) {
      md += `## Key Decisions\n`;
      decisions.forEach(d => {
        md += `- ${d}\n`;
      });
      md += `\n`;
    }

    if (nextSteps.length > 0) {
      md += `## Next Steps\n`;
      nextSteps.forEach(ns => {
        md += `- ${ns}\n`;
      });
    }

    navigator.clipboard.writeText(md);
    setCopied(true);
    success('Copied Report', 'Complete meeting report copied in Markdown format.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!meetingSummary) return;
    const points = meetingSummary.keyDiscussionPoints || meetingSummary.keyPoints || [];
    const decisions = meetingSummary.decisionsMade || meetingSummary.decisions || [];

    let md = `# MeetSpace AI Intelligence Report\n**Meeting:** ${meetingSummary.title || meetingCode}\n**Date:** ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n\n`;
    md += `## Executive Summary\n${meetingSummary.executiveSummary}\n\n`;

    if (points.length) {
      md += `## Key Discussion Points\n`;
      points.forEach(kp => (md += `- ${kp}\n`));
      md += `\n`;
    }

    if (meetingSummary.actionItems?.length) {
      md += `## Action Items\n`;
      meetingSummary.actionItems.forEach(ai => {
        md += `- [ ] **${ai.task}** (Owner: ${ai.assignee || 'Unassigned'}, Priority: ${ai.priority || 'Medium'})\n`;
      });
      md += `\n`;
    }

    if (decisions.length) {
      md += `## Key Decisions\n`;
      decisions.forEach(d => (md += `- ${d}\n`));
      md += `\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-summary-${meetingCode}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    success('Downloaded', 'Summary report saved as .md file.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">AI Meeting Intelligence</h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                  Gemini 3.7 Flash
                </span>
              </div>
              <p className="text-xs text-slate-400">Automated synthesis, action items & decision registry</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => generateSummary()}
              disabled={isGeneratingSummary || transcript.length === 0}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
              title="Regenerate Summary"
            >
              <RefreshCw className={`w-4 h-4 ${isGeneratingSummary ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            {meetingSummary && (
              <>
                <button
                  onClick={handleCopyMarkdown}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Copy Markdown Report"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>

                <button
                  onClick={handleDownloadMarkdown}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Download Markdown Report"
                >
                  <Download className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {isGeneratingSummary ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center animate-pulse">
                  <Sparkles className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Synthesizing Meeting Insights...</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Gemini is parsing the live transcript, identifying discussion themes, extracting action items with owners, and recording decisions.
                </p>
              </div>
            </div>
          ) : !meetingSummary ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <FileText className="w-12 h-12 text-slate-600" />
              <div>
                <h3 className="text-sm font-semibold text-white">No Summary Generated Yet</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Click the button below to analyze all {transcript.length} transcript lines and produce an executive briefing.
                </p>
              </div>
              <button
                onClick={() => generateSummary()}
                disabled={transcript.length === 0}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Generate Summary Now</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Executive Summary Card */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
                  <FileText className="w-4 h-4" />
                  <span>Executive Overview</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-normal">
                  {meetingSummary.executiveSummary}
                </p>
              </div>

              {/* Key Discussion Points */}
              {((meetingSummary.keyDiscussionPoints && meetingSummary.keyDiscussionPoints.length > 0) ||
                (meetingSummary.keyPoints && meetingSummary.keyPoints.length > 0)) && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Key Discussion Points</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(meetingSummary.keyDiscussionPoints || meetingSummary.keyPoints || []).map((point, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-200 flex items-start gap-2.5"
                      >
                        <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Items */}
              {meetingSummary.actionItems && meetingSummary.actionItems.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <ListTodo className="w-4 h-4 text-amber-400" />
                    <span>Action Items & Deliverables</span>
                  </div>
                  <div className="space-y-2">
                    {meetingSummary.actionItems.map((item, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0" />
                          <span className="text-slate-200 font-medium">{item.task}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.assignee && (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-medium">
                              @{item.assignee}
                            </span>
                          )}
                          {item.priority && (
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                item.priority.toLowerCase() === 'high'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {item.priority}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Decisions */}
              {((meetingSummary.decisionsMade && meetingSummary.decisionsMade.length > 0) ||
                (meetingSummary.decisions && meetingSummary.decisions.length > 0)) && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Recorded Decisions</span>
                  </div>
                  <div className="space-y-1.5">
                    {(meetingSummary.decisionsMade || meetingSummary.decisions || []).map((dec, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-2"
                      >
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{dec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Transcript lines analyzed: {transcript.length}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
