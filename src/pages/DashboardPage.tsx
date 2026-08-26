import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { 
  Video, 
  Calendar, 
  Keyboard, 
  Copy, 
  Check, 
  Clock, 
  Users, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { formatMeetingCode, generateMeetingCode, formatDate } from '../lib/utils';
import { api } from '../lib/api';
import { Meeting } from '../types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { navigate } = useNavigation();
  const { success, error } = useToast();

  const [joinCode, setJoinCode] = useState('');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isInstantModalOpen, setIsInstantModalOpen] = useState(false);
  const [createdInstantCode, setCreatedInstantCode] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false);

  // Schedule Form State
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDate, setScheduleDate] = useState(
    new Date(Date.now() + 3600000).toISOString().slice(0, 16)
  );
  const [allowGuests, setAllowGuests] = useState(true);
  const [waitingRoomEnabled, setWaitingRoomEnabled] = useState(true);

  // Meetings List State
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(true);

  const fetchMeetings = useCallback(async () => {
    try {
      setIsLoadingMeetings(true);
      const res = await api.meetings.list();
      setUpcomingMeetings(res.meetings);
    } catch {
      // Fallback
    } finally {
      setIsLoadingMeetings(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleStartInstant = async () => {
    const code = generateMeetingCode();
    try {
      await api.meetings.create({
        meetingCode: code,
        title: `${user?.displayName || 'Host'}'s Instant Meeting`,
        allowGuests: true,
        waitingRoomEnabled: false,
      });
      setCreatedInstantCode(code);
      setIsInstantModalOpen(true);
      fetchMeetings();
    } catch (err: any) {
      error('Could not create instant room', err?.message || 'Error occurred');
    }
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinCode.trim().replace(/[^a-zA-Z0-9-]/g, '');
    if (!clean || clean.length < 4) {
      error('Invalid Meeting Code', 'Please provide a valid code.');
      return;
    }
    const formatted = formatMeetingCode(clean);
    navigate('room-preview', formatted);
  };

  const handleCopy = (code: string) => {
    const url = `${window.location.origin}/#meet/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    success('Invitation Copied', 'Meeting link copied to clipboard.');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTitle.trim()) {
      error('Title Required', 'Please enter a meeting title.');
      return;
    }

    setIsCreatingSchedule(true);
    const newCode = generateMeetingCode();
    try {
      await api.meetings.create({
        meetingCode: newCode,
        title: scheduleTitle.trim(),
        scheduledAt: new Date(scheduleDate).toISOString(),
        allowGuests,
        waitingRoomEnabled,
      });

      setIsScheduleModalOpen(false);
      setScheduleTitle('');
      success('Meeting Scheduled', `Meeting scheduled with code ${newCode}`);
      await fetchMeetings();
    } catch (err: any) {
      error('Failed to schedule', err?.message || 'Server error occurred');
    } finally {
      setIsCreatingSchedule(false);
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome, {user?.displayName || 'Host'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create an instant meeting, schedule future sessions, or join via code.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            id="dashboard-schedule-btn"
            variant="outline"
            size="md"
            leftIcon={<Calendar className="w-4 h-4" />}
            onClick={() => setIsScheduleModalOpen(true)}
          >
            Schedule
          </Button>
          <Button
            id="dashboard-instant-btn"
            variant="primary"
            size="md"
            leftIcon={<Video className="w-4 h-4" />}
            onClick={handleStartInstant}
            className="shadow-sm shadow-indigo-600/20"
          >
            New Meeting
          </Button>
        </div>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Instant Meeting Action */}
        <Card 
          hoverEffect 
          className="p-6 flex flex-col justify-between space-y-4 border-indigo-100 dark:border-indigo-950/60 bg-gradient-to-b from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-slate-900"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Start Instant Meeting
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Launch a live room instantly. You will receive host controls and a shareable invitation link.
              </p>
            </div>
          </div>
          <Button
            id="card-start-instant-btn"
            variant="primary"
            size="sm"
            className="w-full"
            onClick={handleStartInstant}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Start Now
          </Button>
        </Card>

        {/* Schedule Meeting Action */}
        <Card 
          hoverEffect 
          className="p-6 flex flex-col justify-between space-y-4 border-slate-200/80 dark:border-slate-800"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Schedule a Meeting
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Plan ahead, configure waiting room rules, guest permissions, and share invitations in advance.
              </p>
            </div>
          </div>
          <Button
            id="card-schedule-meeting-btn"
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => setIsScheduleModalOpen(true)}
          >
            Set Date & Time
          </Button>
        </Card>

        {/* Join with Code Action */}
        <Card 
          hoverEffect 
          className="p-6 flex flex-col justify-between space-y-4 border-slate-200/80 dark:border-slate-800"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Keyboard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Join with Code
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Enter an existing meeting code or paste a direct meeting link to join.
              </p>
            </div>
          </div>
          <form onSubmit={handleJoinByCode} className="flex gap-2">
            <input
              id="dashboard-join-input"
              type="text"
              placeholder="xxx-yyyy-zzz"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              className="flex-1 bg-slate-100 dark:bg-slate-800 text-xs px-3 py-2 rounded-xl border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none"
            />
            <Button
              id="dashboard-join-submit-btn"
              type="submit"
              variant="outline"
              size="sm"
              disabled={!joinCode.trim()}
            >
              Join
            </Button>
          </form>
        </Card>

      </div>

      {/* Upcoming Scheduled Meetings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Upcoming Meetings
            </h2>
            <Badge variant="info" size="sm">{upcomingMeetings.length}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchMeetings}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 cursor-pointer"
              title="Refresh list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMeetings ? 'animate-spin' : ''}`} />
            </button>
            <button
              id="view-all-scheduled-link"
              onClick={() => navigate('scheduled-meetings')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {upcomingMeetings.length === 0 ? (
          <Card padding="lg" className="text-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No upcoming meetings scheduled
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Schedule your team standups, product demos, or 1-on-1 video calls.
            </p>
            <Button
              id="empty-schedule-btn"
              variant="outline"
              size="sm"
              onClick={() => setIsScheduleModalOpen(true)}
            >
              Schedule a Meeting
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingMeetings.map(meeting => (
              <Card 
                key={meeting.id} 
                id={`upcoming-meeting-${meeting.id}`}
                padding="md" 
                hoverEffect
                className="flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                      {meeting.title}
                    </h3>
                    <Badge variant="success" size="sm">{meeting.status}</Badge>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      {meeting.scheduledAt ? formatDate(meeting.scheduledAt) : 'Ready now'}
                    </span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md font-semibold">
                      {meeting.meetingCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500">
                    <span>Host: {meeting.hostName}</span>
                    <span>•</span>
                    <span>Waiting Room: {meeting.waitingRoomEnabled ? 'On' : 'Off'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    id={`join-meeting-btn-${meeting.id}`}
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    leftIcon={<Video className="w-3.5 h-3.5" />}
                    onClick={() => navigate('room-preview', meeting.meetingCode)}
                  >
                    Join Room
                  </Button>
                  <Button
                    id={`copy-meeting-btn-${meeting.id}`}
                    variant="outline"
                    size="sm"
                    leftIcon={copiedCode === meeting.meetingCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    onClick={() => handleCopy(meeting.meetingCode)}
                  >
                    {copiedCode === meeting.meetingCode ? 'Copied' : 'Share'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Instant Meeting Launch */}
      <Modal
        isOpen={isInstantModalOpen}
        onClose={() => setIsInstantModalOpen(false)}
        title="Your Meeting is Ready"
        description="Share this link with participants to join."
        maxWidth="md"
      >
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-between gap-3 border border-slate-200/80 dark:border-slate-700/80">
            <div className="truncate">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Meeting URL</p>
              <p className="text-xs sm:text-sm font-mono font-semibold text-slate-900 dark:text-white truncate">
                {window.location.origin}/#meet/{createdInstantCode}
              </p>
            </div>
            <Button
              id="instant-modal-copy-btn"
              variant="outline"
              size="sm"
              leftIcon={copiedCode === createdInstantCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              onClick={() => handleCopy(createdInstantCode)}
            >
              {copiedCode === createdInstantCode ? 'Copied' : 'Copy'}
            </Button>
          </div>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <p className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              You will join as the Room Host with full moderation rights.
            </p>
            <p className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              Guests can join using the link and will enter the waiting room if enabled.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              id="instant-modal-cancel"
              variant="ghost"
              size="md"
              onClick={() => setIsInstantModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              id="instant-modal-enter"
              variant="primary"
              size="md"
              leftIcon={<Video className="w-4 h-4" />}
              onClick={() => {
                setIsInstantModalOpen(false);
                navigate('room-preview', createdInstantCode);
              }}
            >
              Enter Meeting Room
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Schedule Meeting */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule a New Meeting"
        description="Configure meeting parameters, date, and security policies."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSchedule} className="space-y-4">
          <Input
            id="schedule-title"
            label="Meeting Title"
            placeholder="e.g. Q3 Roadmap Planning"
            value={scheduleTitle}
            onChange={e => setScheduleTitle(e.target.value)}
            required
          />

          <Input
            id="schedule-date"
            type="datetime-local"
            label="Date & Time"
            value={scheduleDate}
            onChange={e => setScheduleDate(e.target.value)}
            required
          />

          <div className="space-y-3 pt-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Security & Admission
            </p>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Waiting Room</p>
                <p className="text-[11px] text-slate-500">Require host approval before participants can enter.</p>
              </div>
              <input
                id="schedule-waiting-room"
                type="checkbox"
                checked={waitingRoomEnabled}
                onChange={e => setWaitingRoomEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Allow Guest Access</p>
                <p className="text-[11px] text-slate-500">Allow unauthenticated users to join with link.</p>
              </div>
              <input
                id="schedule-allow-guests"
                type="checkbox"
                checked={allowGuests}
                onChange={e => setAllowGuests(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              id="schedule-modal-cancel"
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setIsScheduleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              id="schedule-modal-submit"
              type="submit"
              variant="primary"
              size="md"
              isLoading={isCreatingSchedule}
            >
              Save Schedule
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
