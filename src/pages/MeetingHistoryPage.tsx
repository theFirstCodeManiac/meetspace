import React, { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { 
  History, 
  Video, 
  Clock, 
  Users, 
  Calendar, 
  Download, 
  Search, 
  RefreshCw
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import { api } from '../lib/api';
import { Meeting } from '../types';

export const MeetingHistoryPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { success, info } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.meetings.list();
      setHistory(res.meetings);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filteredHistory = history.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.meetingCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportSummary = (item: Meeting) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(item, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `meeting-${item.meetingCode}-summary.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    success('Export Downloaded', `Meeting session record exported.`);
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Meeting History
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review past meetings, participant metrics, and session summaries.
          </p>
        </div>
        <button
          onClick={loadHistory}
          className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="history-search-input"
            type="text"
            placeholder="Search past meetings..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <Card padding="lg" className="text-center py-16 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No meeting records found
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Meetings you complete will automatically be archived here with duration and attendee records.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map(item => (
            <Card
              key={item.id}
              id={`history-item-${item.id}`}
              padding="md"
              hoverEffect
              className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                    {item.title}
                  </h3>
                  <Badge variant={item.status === 'ACTIVE' ? 'success' : 'outline'} size="sm">
                    {item.status}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    {item.createdAt ? formatDate(item.createdAt) : 'Recorded'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {item.durationMinutes || 45} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {item.participantCount || 1} Participants
                  </span>
                  <span className="font-mono text-slate-500 text-[11px]">
                    code: {item.meetingCode}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
                <Button
                  id={`history-reopen-${item.id}`}
                  variant="outline"
                  size="sm"
                  leftIcon={<Video className="w-3.5 h-3.5 text-indigo-500" />}
                  onClick={() => navigate('room-preview', item.meetingCode)}
                >
                  Enter Room
                </Button>
                <Button
                  id={`history-export-${item.id}`}
                  variant="ghost"
                  size="sm"
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  onClick={() => handleExportSummary(item)}
                >
                  Export Log
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
};
