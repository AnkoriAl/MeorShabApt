import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { MonthLog } from '../../types';
import { getCurrentMonth, getMonthName } from '../../utils/dateUtils';

interface LogLearningModalProps {
  isOpen: boolean;
  onClose: () => void;
  canMakeUp: boolean;
  previousMonth?: MonthLog | null;
  onSuccess: () => void;
}

export function LogLearningModal({ isOpen, onClose, canMakeUp, previousMonth, onSuccess }: LogLearningModalProps) {
  const { currentUser } = useAuth();
  const [date, setDate] = useState('');
  const [source, setSource] = useState<'Meor' | 'J Club' | 'Meeting with Rabbi Zach' | 'Other'>('Meor');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [applyAsMakeUp, setApplyAsMakeUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !date) return;

    setIsSubmitting(true);
    setError('');

    try {
      const sessionDate = new Date(date + 'T12:00:00'); // Add noon time for date-only input
      const { year, month } = getCurrentMonth();
      
      let appliedYear = year;
      let appliedMonth = month;

      if (applyAsMakeUp && canMakeUp && previousMonth) {
        appliedYear = previousMonth.year;
        appliedMonth = previousMonth.month;
        
        // Validate make-up rules
        const sessionYear = sessionDate.getFullYear();
        const sessionMonthNum = sessionDate.getMonth() + 1;
        
        if (sessionYear !== year || sessionMonthNum !== month) {
          setError('Make-up activities must occur in the current month');
          return;
        }
      }

      await dataService.addLearningSession({
        participantId: currentUser.id,
        startedAt: sessionDate,
        minutes: 60, // Default duration of 1 hour
        appliedYear,
        appliedMonth,
        source,
        notes: notes.trim() || undefined,
        createdBy: currentUser.id
      });

      // Reset form
      setDate('');
      setSource('Meor');
      setNotes('');
      setApplyAsMakeUp(false);
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log learning session');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const { year, month } = getCurrentMonth();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-strong rounded-2xl shadow-2xl max-w-md w-full max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-lg font-semibold ink-900">Log Learning Session</h2>
          <button
            onClick={onClose}
            className="text-ink-500 hover:text-ink-900 transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium ink-700 mb-2">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-ink-900 placeholder-ink-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50"
              required
            />
          </div>

          <div>
            <label htmlFor="source" className="block text-sm font-medium ink-700 mb-2">
              Learning Type
            </label>
            <select
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value as 'Meor' | 'J Club' | 'Meeting with Rabbi Zach' | 'Other')}
              className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-ink-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50"
            >
              <option value="Meor">Meor</option>
              <option value="J Club">J Club</option>
              <option value="Meeting with Rabbi Zach">Meeting with Rabbi Zach</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium ink-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-ink-900 placeholder-ink-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 resize-none"
              placeholder="What did you study? Any additional details..."
            />
          </div>

          {canMakeUp && previousMonth && (
            <div className="glass rounded-lg p-3 border border-yellow-400/30">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="makeUp"
                  checked={applyAsMakeUp}
                  onChange={(e) => setApplyAsMakeUp(e.target.checked)}
                  className="mt-1 h-4 w-4 text-cyan-400 focus:ring-cyan-400/50 border-white/30 rounded bg-white/10"
                />
                <div className="ml-3">
                  <label htmlFor="makeUp" className="text-sm font-medium text-yellow-200">
                    Apply as make-up for {getMonthName(previousMonth.month)} {previousMonth.year}
                  </label>
                  <p className="text-xs text-yellow-300/80 mt-1">
                    This session will count toward your incomplete previous month requirements.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-300 text-sm glass rounded-lg p-3 border border-red-400/30">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium btn-ghost rounded-lg glow"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium btn-primary rounded-lg glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Logging...' : 'Log Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}