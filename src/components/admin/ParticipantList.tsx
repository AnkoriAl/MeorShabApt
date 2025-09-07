import React, { useState } from 'react';
import { Eye, DollarSign, Check, X, Plus, BookOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { User, MonthLog } from '../../types';
import { formatDuration } from '../../utils/dateUtils';
import { ManualEntryModal } from './ManualEntryModal';
import { LearningDetailsModal } from './LearningDetailsModal';

interface ParticipantListProps {
  participants: User[];
  monthLogs: MonthLog[];
  onDataChange: () => void;
}

export function ParticipantList({ participants, monthLogs, onDataChange }: ParticipantListProps) {
  const { currentUser } = useAuth();
  const [selectedParticipant, setSelectedParticipant] = useState<User | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showLearningDetails, setShowLearningDetails] = useState(false);

  const handleMarkPayment = async (participantId: string, year: number, month: number, paid: boolean) => {
    if (!currentUser) return;
    
    try {
      await dataService.markPayment(participantId, year, month, paid, currentUser.id);
      onDataChange();
    } catch (error) {
      console.error('Error marking payment:', error);
    }
  };

  const handleAddEntry = (participant: User) => {
    setSelectedParticipant(participant);
    setShowManualEntry(true);
  };

  const handleViewLearningDetails = (participant: User) => {
    setSelectedParticipant(participant);
    setShowLearningDetails(true);
  };

  const handleManualEntrySuccess = () => {
    onDataChange();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold ink-900">Participants Overview</h2>
      </div>

      <div className="overflow-x-auto glass rounded-2xl">
        <table className="min-w-full divide-y divide-white/20">
          <thead className="glass-strong">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium ink-500 uppercase tracking-wider">
                Participant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium ink-500 uppercase tracking-wider">
                Meals
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium ink-500 uppercase tracking-wider">
                Learning
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium ink-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium ink-500 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium ink-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {participants.map((participant) => {
              const monthLog = monthLogs.find(ml => ml.participantId === participant.id);
              
              return (
                <tr key={participant.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium ink-900">
                        {participant.preferredName}
                      </div>
                      <div className="text-sm ink-500">
                        {participant.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm ink-900">
                      {monthLog ? `${monthLog.mealsEarned} / ${monthLog.mealsRequired}` : '0 / 4'}
                    </div>
                    <div className="w-full track-glass rounded-full h-1.5 mt-1">
                      <div
                        className={`h-1.5 rounded-full ${
                          monthLog && monthLog.mealsEarned >= monthLog.mealsRequired
                            ? 'bg-green-500'
                            : 'bar-gradient'
                        }`}
                        style={{
                          width: `${
                            monthLog
                              ? Math.min((monthLog.mealsEarned / monthLog.mealsRequired) * 100, 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm ink-900">
                      {monthLog
                        ? `${formatDuration(monthLog.minutesEarned)} / 12h`
                        : '0m / 12h'
                      }
                    </div>
                    <div className="w-full track-glass rounded-full h-1.5 mt-1">
                      <div
                        className={`h-1.5 rounded-full ${
                          monthLog && monthLog.minutesEarned >= monthLog.minutesRequired
                            ? 'bg-green-500'
                            : 'bar-gradient'
                        }`}
                        style={{
                          width: `${
                            monthLog
                              ? Math.min((monthLog.minutesEarned / monthLog.minutesRequired) * 100, 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        monthLog?.isComplete
                          ? 'bg-green-400/20 text-green-300 border border-green-400/30'
                          : 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30'
                      }`}
                    >
                      {monthLog?.isComplete ? 'Complete' : 'In Progress'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {monthLog && (
                      <div className="space-y-1">
                        <div
                          className={`text-xs ${
                            monthLog.paymentStatus === 'Paid'
                              ? 'text-green-400'
                              : monthLog.paymentStatus === 'Due'
                              ? 'text-red-400'
                              : 'ink-500'
                          }`}
                        >
                          {monthLog.paymentStatus}
                        </div>
                        <div className="text-xs ink-500">
                          Due: {monthLog.computedPaymentDate.toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button 
                      onClick={() => handleViewLearningDetails(participant)}
                      className="text-blue-400 hover:text-blue-300 transition-colors p-1 rounded-lg hover:bg-white/10"
                      title="View learning session details"
                    >
                      <BookOpen className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleAddEntry(participant)}
                      className="text-cyan-400 hover:text-cyan-300 transition-colors p-1 rounded-lg hover:bg-white/10"
                      title="Add meal or learning entry"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    {monthLog && monthLog.paymentStatus !== 'Not due' && (
                      <div className="inline-flex space-x-1">
                        {monthLog.paymentStatus === 'Due' && (
                          <button
                            onClick={() => handleMarkPayment(
                              participant.id,
                              monthLog.year,
                              monthLog.month,
                              true
                            )}
                            className="text-green-400 hover:text-green-300 transition-colors p-1 rounded-lg hover:bg-green-400/10"
                            title="Mark as Paid"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        {monthLog.paymentStatus === 'Paid' && (
                          <button
                            onClick={() => handleMarkPayment(
                              participant.id,
                              monthLog.year,
                              monthLog.month,
                              false
                            )}
                            className="text-red-400 hover:text-red-300 transition-colors p-1 rounded-lg hover:bg-red-400/10"
                            title="Mark as Unpaid"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {participants.length === 0 && (
        <div className="text-center py-8 ink-500">
          No participants found.
        </div>
      )}

      {/* Manual Entry Modal */}
      <ManualEntryModal
        isOpen={showManualEntry}
        onClose={() => {
          setShowManualEntry(false);
          setSelectedParticipant(null);
        }}
        participant={selectedParticipant}
        onSuccess={handleManualEntrySuccess}
      />

      {/* Learning Details Modal */}
      <LearningDetailsModal
        isOpen={showLearningDetails}
        onClose={() => {
          setShowLearningDetails(false);
          setSelectedParticipant(null);
        }}
        participant={selectedParticipant}
      />
    </div>
  );
}