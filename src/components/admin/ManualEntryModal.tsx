import React, { useState } from 'react';
import { X, Plus, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { User } from '../../types';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: User | null;
  onSuccess: () => void;
}

export function ManualEntryModal({ isOpen, onClose, participant, onSuccess }: ManualEntryModalProps) {
  const { currentUser } = useAuth();
  const [entryType, setEntryType] = useState<'meal' | 'learning'>('meal');
  const [date, setDate] = useState('');
  const [mealType, setMealType] = useState<'UWS' | 'Other'>('Other');
  const [learningSource, setLearningSource] = useState<'Meor' | 'J Club' | 'Meeting with Rabbi Zach' | 'Other'>('Meor');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !participant || !date) return;

    setIsSubmitting(true);
    setError('');

    try {
      const entryDate = new Date(date + 'T12:00:00'); // Add noon time for date-only input

      if (entryType === 'meal') {
        await dataService.addMealLog({
          participantId: participant.id,
          occurredAt: entryDate,
          appliedYear: entryDate.getFullYear(),
          appliedMonth: entryDate.getMonth() + 1,
          type: mealType,
          notes: notes.trim() || undefined,
          source: 'Admin entry',
          createdBy: currentUser.id
        });
      } else {
        await dataService.addLearningSession({
          participantId: participant.id,
          startedAt: entryDate,
          minutes: 60, // Default 1 hour for learning sessions
          appliedYear: entryDate.getFullYear(),
          appliedMonth: entryDate.getMonth() + 1,
          source: learningSource,
          notes: notes.trim() || undefined,
          createdBy: currentUser.id
        });
      }

      // Reset form
      setDate('');
      setMealType('Other');
      setLearningSource('Meor');
      setNotes('');
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !participant) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full max-h-screen overflow-y-auto border border-white/30">
        <div className="flex items-center justify-between p-6 border-b border-gray-300">
          <h2 className="text-lg font-semibold text-gray-900">
            Add Entry for {participant.preferredName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Entry Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Entry Type</label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setEntryType('meal')}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
                  entryType === 'meal'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Plus className="h-4 w-4 mr-2" />
                Meal
              </button>
              <button
                type="button"
                onClick={() => setEntryType('learning')}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
                  entryType === 'learning'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Clock className="h-4 w-4 mr-2" />
                Learning
              </button>
            </div>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Meal Type or Learning Source */}
          {entryType === 'meal' ? (
            <div>
              <label htmlFor="mealType" className="block text-sm font-medium text-gray-700 mb-2">
                Meal Type
              </label>
              <select
                id="mealType"
                value={mealType}
                onChange={(e) => setMealType(e.target.value as 'UWS' | 'Other')}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Other">Other</option>
                <option value="UWS">UWS</option>
              </select>
            </div>
          ) : (
            <div>
              <label htmlFor="learningSource" className="block text-sm font-medium text-gray-700 mb-2">
                Learning Source
              </label>
              <select
                id="learningSource"
                value={learningSource}
                onChange={(e) => setLearningSource(e.target.value as 'Meor' | 'J Club' | 'Meeting with Rabbi Zach' | 'Other')}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Meor">Meor</option>
                <option value="J Club">J Club</option>
                <option value="Meeting with Rabbi Zach">Meeting with Rabbi Zach</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Additional details..."
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 rounded-lg p-3 border border-red-200">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Adding...' : `Add ${entryType === 'meal' ? 'Meal' : 'Learning'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
