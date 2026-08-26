import React, { useState } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { 
  PhoneOff, 
  RotateCcw, 
  LayoutDashboard, 
  Star, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  MessageSquare
} from 'lucide-react';

export const MeetingEndedPage: React.FC = () => {
  const { navigate, meetingCode } = useNavigation();
  const { success } = useToast();
  const [rating, setRating] = useState<number>(5);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const FEEDBACK_TAGS = [
    'Crystal Clear Audio',
    'Smooth Video Quality',
    'Seamless Screen Share',
    'No Lag or Latency',
  ];

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSubmitted(true);
    success('Thank You!', 'Your call quality feedback has been recorded.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        
        {/* Main Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6 text-center">
          
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
            <PhoneOff className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              You left the meeting
            </h1>
            <p className="text-sm text-slate-400">
              Your hardware camera and microphone streams have been securely released.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {meetingCode && (
              <Button
                id="rejoin-meeting-btn"
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
                leftIcon={<RotateCcw className="w-4 h-4" />}
                onClick={() => navigate('room-preview', meetingCode)}
              >
                Re-join Call
              </Button>
            )}

            <Button
              id="return-dashboard-btn"
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              leftIcon={<LayoutDashboard className="w-4 h-4" />}
              onClick={() => navigate('dashboard')}
            >
              Back to Home
            </Button>
          </div>

          {/* Quality Feedback Card */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Rate Call Quality
              </span>
              {feedbackSubmitted && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Feedback sent
                </span>
              )}
            </div>

            {!feedbackSubmitted ? (
              <form onSubmit={handleSubmitFeedback} className="space-y-3">
                {/* 5-Star Rating */}
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-slate-600 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* Quality Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {FEEDBACK_TAGS.map(tag => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                            : 'bg-slate-800 text-slate-400 border-slate-700/60 hover:border-slate-600'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="text-xs border-slate-700 text-slate-300 hover:text-white"
                  >
                    Submit Feedback
                  </Button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-slate-500">
                Thank you for helping us maintain peak streaming quality!
              </p>
            )}
          </div>

        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Session logs and media packets cleared safely</span>
        </div>

      </div>
    </div>
  );
};
