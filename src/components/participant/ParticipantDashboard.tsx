import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { MonthLog, MealLog, LearningSession, Shabbaton, Attendance, UWSRsvp } from '../../types';
import { getCurrentMonth, getPreviousMonth, formatDuration, getMonthName, isUWSRSVPWindowOpen, getUpcomingSaturday, getPaymentDate } from '../../utils/dateUtils';
import { ProgressBar } from '../ProgressBar';
import { LogMealModal } from './LogMealModal';
import { LogLearningModal } from './LogLearningModal';
import { UWSRSVPWidget } from './UWSRSVPWidget';

export function ParticipantDashboard() {
  const { currentUser } = useAuth();
  const [currentMonthLog, setCurrentMonthLog] = useState<MonthLog | null>(null);
  const [previousMonthLog, setPreviousMonthLog] = useState<MonthLog | null>(null);
  const [upcomingShabbatons, setUpcomingShabbatons] = useState<Shabbaton[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [recentLogs, setRecentLogs] = useState<(MealLog | LearningSession)[]>([]);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showLearningModal, setShowLearningModal] = useState(false);
  const [uwsRsvp, setUwsRsvp] = useState<UWSRsvp | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      const { year, month } = getCurrentMonth();
      const previousMonth = getPreviousMonth(year, month);

      try {
        // Load current month log
        const currentLog = await dataService.getOrCreateMonthLog(currentUser.id, year, month);
        setCurrentMonthLog(currentLog);

        // Load previous month log if exists
        const previousLog = await dataService.getMonthLog(currentUser.id, previousMonth.year, previousMonth.month);
        setPreviousMonthLog(previousLog);

        // Load upcoming Shabbatons
        const shabbatons = (await dataService.getShabbatons()).filter(s => s.date >= new Date());
        setUpcomingShabbatons(shabbatons);

        // Load user's attendances
        const userAttendances = await dataService.getAttendances(currentUser.id);
        setAttendances(userAttendances);

        // Load recent logs
        const meals = (await dataService.getMealLogs(currentUser.id)).slice(0, 5);
        const sessions = (await dataService.getLearningSessions(currentUser.id)).slice(0, 5);
        const combined = [...meals, ...sessions]
          .sort((a, b) => {
            const dateA = 'occurredAt' in a ? a.occurredAt : a.startedAt;
            const dateB = 'occurredAt' in b ? b.occurredAt : b.startedAt;
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 8);
        setRecentLogs(combined);

        // Load UWS RSVP for upcoming Saturday
        const upcomingSaturday = getUpcomingSaturday();
        const rsvp = await dataService.getUWSRSVP(currentUser.id, upcomingSaturday);
        setUwsRsvp(rsvp);
      } catch (err) {
        console.error('Failed to load participant dashboard data:', err);
        // Fallback baseline month log so UI can render
        setCurrentMonthLog({
          participantId: currentUser.id,
          year,
          month,
          mealsRequired: 4,
          minutesRequired: 720,
          mealsEarned: 0,
          minutesEarned: 0,
          isComplete: false,
          computedPaymentDate: getPaymentDate(year, month),
          paymentStatus: 'Not due'
        });
        setUpcomingShabbatons([]);
        setAttendances([]);
        setRecentLogs([]);
        setUwsRsvp(null);
      }
    })();
  }, [currentUser]);

  const handleRequestAttendance = async (shabbatonId: string) => {
    if (!currentUser) return;
    
    try {
      await dataService.requestAttendance(currentUser.id, shabbatonId);
      const userAttendances = await dataService.getAttendances(currentUser.id);
      setAttendances(userAttendances);
    } catch (error) {
      console.error('Error requesting attendance:', error);
    }
  };

  const refreshData = async () => {
    if (!currentUser) return;
    
    const { year, month } = getCurrentMonth();
    const previousMonth = getPreviousMonth(year, month);
    
    try {
      // Refresh current month log
      const currentLog = await dataService.getOrCreateMonthLog(currentUser.id, year, month);
      setCurrentMonthLog(currentLog);
      
      // Refresh previous month log if it exists
      const previousLog = await dataService.getMonthLog(currentUser.id, previousMonth.year, previousMonth.month);
      setPreviousMonthLog(previousLog);
      
      // Refresh recent logs
      const meals = (await dataService.getMealLogs(currentUser.id)).slice(0, 5);
      const sessions = (await dataService.getLearningSessions(currentUser.id)).slice(0, 5);
      const combined = [...meals, ...sessions]
        .sort((a, b) => {
          const dateA = 'occurredAt' in a ? a.occurredAt : a.startedAt;
          const dateB = 'occurredAt' in b ? b.occurredAt : b.startedAt;
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 8);
      setRecentLogs(combined);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    }
  };

  if (!currentUser || !currentMonthLog) {
    return <div>Loading...</div>;
  }

  const { year, month } = getCurrentMonth();
  const canMakeUp = previousMonthLog && !previousMonthLog.isComplete;
  const rsvpWindowOpen = isUWSRSVPWindowOpen();

  return (
    <div className="space-y-6">
      {/* This Month Progress Card */}
      <div className="glass-strong rounded-2xl p-6 glow">
        <h2 className="text-xl font-semibold ink-900 mb-6">
          {getMonthName(month)} {year} Progress
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <ProgressBar
            current={currentMonthLog.mealsEarned}
            target={currentMonthLog.mealsRequired}
            label="Meals"
            className="col-span-1"
          />
          <ProgressBar
            current={currentMonthLog.minutesEarned}
            target={currentMonthLog.minutesRequired}
            label="Learning Time"
            formatValue={formatDuration}
            className="col-span-1"
          />
        </div>

        {currentMonthLog.isComplete && (
          <div className="glass rounded-lg p-4 mb-6 border border-green-400/30">
            <div className="flex items-center text-green-300">
              <span className="text-lg">🎉</span>
              <span className="ml-2 font-medium">
                Congratulations! You've completed this month's requirements.
              </span>
            </div>
            {currentMonthLog.completedAt && (
              <p className="text-sm text-green-400 mt-1">
                Completed on {currentMonthLog.completedAt.toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowLearningModal(true)}
            className="flex items-center justify-center px-4 py-2 btn-primary rounded-lg glow"
          >
            <Clock className="h-4 w-4 mr-2" />
            Log Learning Session
          </button>
          <button
            onClick={() => setShowMealModal(true)}
            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors glow"
          >
            <Plus className="h-4 w-4 mr-2" />
            Log Meal
          </button>
        </div>
      </div>

      {/* Make-up Notice */}
      {canMakeUp && (
        <div className="glass rounded-lg p-4 border border-yellow-400/30">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-yellow-400">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-200">
                Make-up Available
              </p>
              <p className="text-sm text-yellow-300/80 mt-1">
                You can log activities this month that count toward{' '}
                {getMonthName(previousMonthLog.month)} {previousMonthLog.year}.
                Missing: {Math.max(0, previousMonthLog.mealsRequired - previousMonthLog.mealsEarned)} meals,{' '}
                {formatDuration(Math.max(0, previousMonthLog.minutesRequired - previousMonthLog.minutesEarned))} learning.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* UWS RSVP Widget */}
      <UWSRSVPWidget
        rsvp={uwsRsvp}
        onRSVPChange={async (attending) => {
          if (!currentUser) return;
          const upcomingSaturday = getUpcomingSaturday();
          console.log('Submitting UWS RSVP:', { 
            participantId: currentUser.id, 
            weekDate: upcomingSaturday, 
            attending 
          });
          try {
            const result = await dataService.setUWSRSVP(currentUser.id, upcomingSaturday, attending);
            console.log('UWS RSVP saved successfully:', result);
            setUwsRsvp(result);
          } catch (error) {
            console.error('Error saving UWS RSVP:', error);
            // Show user-friendly error message
            alert('Failed to save RSVP. Please try again.');
          }
        }}
        windowOpen={rsvpWindowOpen}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Shabbatons */}
        <div className="glass rounded-2xl p-6 glow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium ink-900">Upcoming Shabbatons</h3>
              <p className="text-sm ink-500 mt-1">Sign up for events to earn credits</p>
            </div>
            <Calendar className="h-5 w-5 ink-500" />
          </div>
          {upcomingShabbatons.length === 0 ? (
            <div className="text-center py-8 ink-500">
              <Calendar className="h-8 w-8 mx-auto mb-2" />
              <p>No upcoming Shabbatons scheduled</p>
              <p className="text-sm mt-2">Check back later for new events!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingShabbatons.slice(0, 3).map((shabbaton) => {
                const attendance = attendances.find(a => a.shabbatonId === shabbaton.id);
                return (
                  <div key={shabbaton.id} className="glass rounded-lg p-3 border border-white/20">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium ink-900">{shabbaton.title}</p>
                        <p className="text-sm ink-500">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          {shabbaton.date.toLocaleDateString()}
                        </p>
                        <p className="text-xs text-cyan-400 mt-1">
                          Credits: {shabbaton.defaultCredits.meals} meals, {formatDuration(shabbaton.defaultCredits.minutes)}
                        </p>
                      </div>
                      <div>
                        {attendance ? (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            attendance.status === 'Confirmed' ? 'bg-green-400/20 text-green-300 border border-green-400/30' :
                            attendance.status === 'Pending' ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30' :
                            'bg-red-400/20 text-red-300 border border-red-400/30'
                          }`}>
                            {attendance.status}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleRequestAttendance(shabbaton.id)}
                            className="px-4 py-2 text-sm font-medium bg-cyan-400/20 text-cyan-300 rounded-lg glow hover:bg-cyan-400/30 transition-colors flex items-center space-x-1"
                          >
                            <Calendar className="h-3 w-3" />
                            <span>Sign Up</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="glass rounded-2xl p-6 glow">
          <h3 className="text-lg font-medium ink-900 mb-4">Recent Activity</h3>
          {recentLogs.length === 0 ? (
            <p className="ink-500 text-sm">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => {
                const isMeal = 'occurredAt' in log;
                const date = isMeal ? log.occurredAt : log.startedAt;
                
                return (
                  <div key={log.id} className="flex items-start space-x-3 text-sm">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      isMeal ? 'bg-green-400/20 border border-green-400/30' : 'bg-cyan-400/20 border border-cyan-400/30'
                    }`}>
                      {isMeal ? '🍽️' : '📚'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="ink-900">
                        {isMeal ? 'Meal' : `Learning Session (${formatDuration(log.minutes)})`}
                        {log.appliedYear !== date.getFullYear() || log.appliedMonth !== date.getMonth() + 1 ? (
                          <span className="ml-2 px-2 py-0.5 bg-yellow-400/20 text-yellow-300 text-xs rounded border border-yellow-400/30">
                            Make-up for {getMonthName(log.appliedMonth)} {log.appliedYear}
                          </span>
                        ) : null}
                      </p>
                      <p className="ink-500">
                        {date.toLocaleDateString()} • {log.source}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <LogMealModal
        isOpen={showMealModal}
        onClose={() => setShowMealModal(false)}
        canMakeUp={canMakeUp}
        previousMonth={previousMonthLog}
        onSuccess={refreshData}
      />

      <LogLearningModal
        isOpen={showLearningModal}
        onClose={() => setShowLearningModal(false)}
        canMakeUp={canMakeUp}
        previousMonth={previousMonthLog}
        onSuccess={refreshData}
      />
    </div>
  );
}