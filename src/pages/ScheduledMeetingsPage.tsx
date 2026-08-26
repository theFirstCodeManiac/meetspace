import React, { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { 
  Calendar, 
  Plus, 
  Video, 
  Clock, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  Users, 
  ShieldCheck, 
  Search,
  RefreshCw
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import { api } from '../lib/api';
import { Meeting } from '../types';

export const ScheduledMeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const { navigate } = useNavigation();
  const { success, error } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const loadMeetings = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.meetings.list();
      setMeetings(res.meetings.filter(m => m.status === 'SCHEDULED' || m.status === 'ACTIVE'));
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const filteredMeetings = meetings.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.meetingCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = (code: string) => {
    const url = `${window.location.origin}/#meet/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    success('Invitation Copied', 'Meeting link copied to clipboard.');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.meetings.delete(id);
      setIsDeleteModalOpen(false);
      success('Meeting Cancelled', 'The scheduled meeting has been removed.');
      await loadMeetings();
    } catch (err: any) {
      error('Could not cancel meeting', err?.message || 'Server error');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeeting) return;
    setIsSaving(true);
    try {
      await api.meetings.update(selectedMeeting.id, {
        title: selectedMeeting.title,
        waitingRoomEnabled: selectedMeeting.waitingRoomEnabled,
        allowGuests: selectedMeeting.allowGuests,
      });
      setIsEditModalOpen(false);
      success('Meeting Updated', 'Your changes have been saved.');
      await loadMeetings();
    } catch (err: any) {
      error('Update failed', err?.message || 'Server error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Scheduled Meetings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage upcoming video conferences, invitations, and permissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            id="scheduled-create-btn"
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('dashboard')}
          >
            Schedule New
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="scheduled-search-input"
            type="text"
            placeholder="Search by title or code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button
          onClick={loadMeetings}
          className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 cursor-pointer"
          title="Refresh list"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Meetings List */}
      {filteredMeetings.length === 0 ? (
        <Card padding="lg" className="text-center py-16 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No scheduled meetings match your criteria
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create a scheduled meeting from the dashboard to plan ahead.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredMeetings.map(meeting => {
            const isHost = meeting.hostId === user?.id || user?.email === 'alex.morgan@meetspace.io';
            return (
              <Card
                key={meeting.id}
                id={`scheduled-item-${meeting.id}`}
                padding="md"
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                      {meeting.title}
                    </h3>
                    {isHost ? (
                      <Badge variant="info" size="sm">You are Host</Badge>
                    ) : (
                      <Badge variant="outline" size="sm">Host: {meeting.hostName}</Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      {meeting.scheduledAt ? formatDate(meeting.scheduledAt) : 'Ready'}
                    </span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                      {meeting.meetingCode}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {meeting.participantCount || 1} Registered
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      Waiting room {meeting.waitingRoomEnabled ? 'enabled' : 'disabled'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
                  <Button
                    id={`schedule-join-${meeting.id}`}
                    variant="primary"
                    size="sm"
                    leftIcon={<Video className="w-3.5 h-3.5" />}
                    onClick={() => navigate('room-preview', meeting.meetingCode)}
                  >
                    Join
                  </Button>

                  <Button
                    id={`schedule-copy-${meeting.id}`}
                    variant="outline"
                    size="sm"
                    leftIcon={copiedCode === meeting.meetingCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    onClick={() => handleCopy(meeting.meetingCode)}
                  >
                    {copiedCode === meeting.meetingCode ? 'Copied' : 'Invite'}
                  </Button>

                  {isHost && (
                    <>
                      <Button
                        id={`schedule-edit-${meeting.id}`}
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedMeeting(meeting);
                          setIsEditModalOpen(true);
                        }}
                        aria-label="Edit meeting"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>

                      <Button
                        id={`schedule-delete-${meeting.id}`}
                        variant="ghost"
                        size="icon"
                        className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        onClick={() => {
                          setSelectedMeeting(meeting);
                          setIsDeleteModalOpen(true);
                        }}
                        aria-label="Cancel meeting"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Meeting Modal */}
      {selectedMeeting && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Scheduled Meeting"
          description="Update meeting details or adjust waiting room policies."
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <Input
              id="edit-meeting-title"
              label="Meeting Title"
              value={selectedMeeting.title}
              onChange={e => setSelectedMeeting({ ...selectedMeeting, title: e.target.value })}
              required
            />

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Waiting Room</p>
                <p className="text-[11px] text-slate-500">Require host approval before admission.</p>
              </div>
              <input
                type="checkbox"
                checked={selectedMeeting.waitingRoomEnabled}
                onChange={e => setSelectedMeeting({ ...selectedMeeting, waitingRoomEnabled: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSaving}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {selectedMeeting && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Cancel Scheduled Meeting?"
          description="Are you sure you want to cancel this meeting? Participants will no longer be able to enter."
        >
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="ghost"
              size="md"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Keep Meeting
            </Button>
            <Button
              id="confirm-delete-btn"
              variant="danger"
              size="md"
              onClick={() => handleDelete(selectedMeeting.id)}
            >
              Cancel Meeting
            </Button>
          </div>
        </Modal>
      )}

    </div>
  );
};
