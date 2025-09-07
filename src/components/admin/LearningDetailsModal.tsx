import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Calendar, FileText, User, ChevronDown, ChevronUp, Utensils } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { User as UserType, LearningSession, MealLog } from '../../types';
import { formatDuration } from '../../utils/dateUtils';

interface LearningDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: UserType | null;
}

export function LearningDetailsModal({ isOpen, onClose, participant }: LearningDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'learning' | 'meals'>('learning');
  const [learningSessions, setLearningSessions] = useState<LearningSession[]>([]);
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [filterYear, setFilterYear] = useState<number | 'all'>('all');
  const [filterMonth, setFilterMonth] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'duration' | 'source' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (isOpen && participant) {
      loadLearningSessions();
      loadMealLogs();
    }
  }, [isOpen, participant]);

  const loadLearningSessions = async () => {
    if (!participant) return;
    
    setLoading(true);
    setError('');
    
    try {
      const sessions = await dataService.getLearningSessions(participant.id);
      setLearningSessions(sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load learning sessions');
    } finally {
      setLoading(false);
    }
  };

  const loadMealLogs = async () => {
    if (!participant) return;
    setLoading(true);
    setError('');

    try {
      const meals = await dataService.getMealLogs(participant.id);
      setMealLogs(meals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meal logs');
    } finally {
      setLoading(false);
    }
  };

  const toggleSessionExpansion = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  const getFilteredAndSortedSessions = () => {
    let filtered = learningSessions.filter(session => {
      if (filterYear !== 'all' && session.appliedYear !== filterYear) return false;
      if (filterMonth !== 'all' && session.appliedMonth !== filterMonth) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = a.startedAt.getTime() - b.startedAt.getTime();
          break;
        case 'duration':
          comparison = a.minutes - b.minutes;
          break;
        case 'source':
          comparison = a.source.localeCompare(b.source);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const getFilteredAndSortedMeals = () => {
    let filtered = mealLogs.filter(meal => {
      if (filterYear !== 'all' && meal.appliedYear !== filterYear) return false;
      if (filterMonth !== 'all' && meal.appliedMonth !== filterMonth) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = a.occurredAt.getTime() - b.occurredAt.getTime();
          break;
        case 'source':
          comparison = a.source.localeCompare(b.source);
          break;
        case 'type':
          // @ts-ignore - extend sortBy union at usage time
          comparison = a.type.localeCompare(b.type);
          break;
        default:
          comparison = a.occurredAt.getTime() - b.occurredAt.getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const getUniqueYears = () => {
    const years = [...new Set(learningSessions.map(s => s.appliedYear))].sort((a, b) => b - a);
    return years;
  };

  const getUniqueMonths = () => {
    const months = [...new Set(learningSessions.map(s => s.appliedMonth))].sort((a, b) => a - b);
    return months;
  };

  const getTotalHours = () => {
    return getFilteredAndSortedSessions().reduce((total, session) => total + session.minutes, 0);
  };

  const getSourceStats = () => {
    if (activeTab === 'learning') {
      const stats: Record<string, { count: number; totalMinutes: number }> = {};
      getFilteredAndSortedSessions().forEach(session => {
        if (!stats[session.source]) {
          stats[session.source] = { count: 0, totalMinutes: 0 };
        }
        stats[session.source].count++;
        stats[session.source].totalMinutes += session.minutes;
      });
      return stats;
    } else {
      const stats: Record<string, { count: number; totalMinutes: number }> = {};
      getFilteredAndSortedMeals().forEach(meal => {
        if (!stats[meal.source]) {
          stats[meal.source] = { count: 0, totalMinutes: 0 };
        }
        stats[meal.source].count++;
      });
      return stats;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  };

  if (!isOpen || !participant) return null;

  const filteredSessions = getFilteredAndSortedSessions();
  const filteredMeals = getFilteredAndSortedMeals();
  const totalHours = getTotalHours();
  const totalMeals = filteredMeals.length;
  const typeCount = new Set(filteredMeals.map(m => m.type)).size;
  const sourceStats = getSourceStats();
  const years = getUniqueYears();
  const months = getUniqueMonths();

  return createPortal(
    <div className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-start justify-center z-[2147483647] px-4 pb-6 pt-8" role="dialog" aria-modal="true">
      <div className="w-full max-w-7xl max-h-[calc(100vh-64px)] flex flex-col">
        {/* Main Modal Container */}
        <div className="glass-strong rounded-3xl flex-1 flex flex-col overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="relative px-8 py-6 border-b border-white/10">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-800"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold ink-900 mb-1">
                  {activeTab === 'learning' ? 'Learning Sessions' : 'Meals'}
                </h2>
                <div className="flex items-center space-x-3">
                  <div className="text-lg ink-700">{participant.preferredName}</div>
                  <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                  <div className="text-sm ink-500">{participant.email}</div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 rounded-xl glass-strong hover:bg-white/10 transition-all duration-200 group"
              >
                <X className="h-6 w-6 ink-700 group-hover:ink-900" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-8 pt-4 glass border-b border-white/10">
            <div className="inline-flex bg-white/5 rounded-xl p-1 border border-white/10">
              <button
                className={`${activeTab === 'learning' ? 'bg-white/20 ink-900' : 'ink-700'} px-4 py-2 rounded-lg transition-colors`}
                onClick={() => setActiveTab('learning')}
              >
                Learning
              </button>
              <button
                className={`${activeTab === 'meals' ? 'bg-white/20 ink-900' : 'ink-700'} px-4 py-2 rounded-lg transition-colors`}
                onClick={() => setActiveTab('meals')}
              >
                Meals
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="px-8 py-6 border-b border-white/10 flex-shrink-0">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="glass-strong rounded-2xl p-5 hover:bg-white/5 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30">
                    <Clock className="h-6 w-6 text-blue-300" />
                  </div>
                  <div className="text-xs ink-500 font-medium">TOTAL</div>
                </div>
                <div className="text-2xl font-bold ink-900 mb-1">
                  {activeTab === 'learning' ? formatDuration(totalHours) : totalMeals}
                </div>
                <div className="text-sm ink-700">{activeTab === 'learning' ? 'Learning Hours' : 'Meals Logged'}</div>
              </div>
              
              <div className="glass-strong rounded-2xl p-5 hover:bg-white/5 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30">
                    <Calendar className="h-6 w-6 text-green-300" />
                  </div>
                  <div className="text-xs ink-500 font-medium">COUNT</div>
                </div>
                <div className="text-2xl font-bold ink-900 mb-1">
                  {activeTab === 'learning' ? filteredSessions.length : typeCount}
                </div>
                <div className="text-sm ink-700">{activeTab === 'learning' ? 'Sessions' : 'Meal Types'}</div>
              </div>
              
              <div className="glass-strong rounded-2xl p-5 hover:bg-white/5 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30">
                    {activeTab === 'learning' ? (
                      <FileText className="h-6 w-6 text-purple-300" />
                    ) : (
                      <Utensils className="h-6 w-6 text-purple-300" />
                    )}
                  </div>
                  <div className="text-xs ink-500 font-medium">{activeTab === 'learning' ? 'NOTES' : 'RECENT'}</div>
                </div>
                <div className="text-2xl font-bold ink-900 mb-1">
                  {activeTab === 'learning' ? filteredSessions.filter(s => s.notes).length : filteredMeals.slice(0,3).length}
                </div>
                <div className="text-sm ink-700">{activeTab === 'learning' ? 'With Notes' : 'Recent Meals'}</div>
              </div>
              
              <div className="glass-strong rounded-2xl p-5 hover:bg-white/5 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-400/30">
                    <User className="h-6 w-6 text-orange-300" />
                  </div>
                  <div className="text-xs ink-500 font-medium">SOURCES</div>
                </div>
                <div className="text-2xl font-bold ink-900 mb-1">
                  {Object.keys(sourceStats).length}
                </div>
                <div className="text-sm ink-700">Different Sources</div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="text-sm ink-700 font-medium">Filter & Sort:</div>
              <div className="flex items-center space-x-2">
                <label className="text-sm ink-500 font-medium">Year</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  className="px-3 py-2 glass-strong rounded-lg text-sm ink-900 font-medium hover:bg-white/5 focus:ring-2 focus:ring-blue-400/30 transition-all duration-200"
                >
                  <option value="all" className="bg-gray-800 text-white">All Years</option>
                  {years.map(year => (
                    <option key={year} value={year} className="bg-gray-800 text-white">{year}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm ink-500 font-medium">Month</label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  className="px-3 py-2 glass-strong rounded-lg text-sm ink-900 font-medium hover:bg-white/5 focus:ring-2 focus:ring-blue-400/30 transition-all duration-200"
                >
                  <option value="all" className="bg-gray-800 text-white">All Months</option>
                  {months.map(month => (
                    <option key={month} value={month} className="bg-gray-800 text-white">{getMonthName(month)}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm ink-500 font-medium">Sort</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'duration' | 'source')}
                  className="px-3 py-2 glass-strong rounded-lg text-sm ink-900 font-medium hover:bg-white/5 focus:ring-2 focus:ring-blue-400/30 transition-all duration-200"
                >
                  <option value="date" className="bg-gray-800 text-white">Date</option>
                  <option value="duration" className="bg-gray-800 text-white">Duration</option>
                  <option value="source" className="bg-gray-800 text-white">Source</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="px-3 py-2 glass-strong rounded-lg text-sm ink-900 font-medium hover:bg-white/5 focus:ring-2 focus:ring-blue-400/30 transition-all duration-200"
                >
                  <option value="desc" className="bg-gray-800 text-white">Newest First</option>
                  <option value="asc" className="bg-gray-800 text-white">Oldest First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Source Breakdown */}
          {Object.keys(sourceStats).length > 0 && (
            <div className="px-8 py-6 border-b border-white/10 flex-shrink-0">
              <h3 className="text-xl font-bold ink-900 mb-4">{activeTab === 'learning' ? 'Source Breakdown' : 'Meal Sources'}</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(sourceStats).map(([source, stats]) => (
                  <div key={source} className="glass rounded-xl p-4 hover:bg-white/5 transition-all duration-300">
                    <div className="text-sm font-semibold ink-900 mb-1">{source}</div>
                    {activeTab === 'learning' ? (
                      <div className="text-xs ink-500">{stats.count} sessions • {formatDuration((stats as any).totalMinutes || 0)}</div>
                    ) : (
                      <div className="text-xs ink-500">{(stats as any).count} meals</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sessions / Meals List */}
          <div className="px-8 py-6 overflow-y-auto flex-1 min-h-0">
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto"></div>
                <p className="ink-500 mt-4 text-lg">Loading learning sessions...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-red-400 text-lg mb-4">{error}</p>
                <button
                  onClick={loadLearningSessions}
                  className="px-6 py-3 glass rounded-lg ink-900 font-medium hover:bg-white/10 transition-all duration-200"
                >
                  Retry
                </button>
              </div>
            ) : (activeTab === 'learning' ? filteredSessions.length === 0 : filteredMeals.length === 0) ? (
              <div className="text-center py-16">
                <div className="ink-500 mb-4">
                  <Calendar className="h-20 w-20 mx-auto" />
                </div>
                <p className="ink-700 text-lg">No {activeTab === 'learning' ? 'learning sessions' : 'meals'} found for the selected filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(activeTab === 'learning' ? filteredSessions : filteredMeals).map((item: any) => {
                  const isLearning = activeTab === 'learning';
                  const id = isLearning ? item.id : item.id;
                  const isExpanded = expandedSessions.has(id);
                  return (
                    <div key={id} className="glass rounded-2xl overflow-hidden hover:bg-white/5 transition-all duration-300 shadow-lg">
                      <div
                        className="p-6 cursor-pointer hover:bg-white/5 transition-all duration-200"
                        onClick={() => toggleSessionExpansion(id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-8">
                            <div className="flex items-center space-x-3">
                              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30">
                                <Calendar className="h-5 w-5 text-blue-300" />
                              </div>
                              <div>
                                <div className="text-xs ink-500 font-medium uppercase tracking-wide">Date & Time</div>
                                <div className="text-lg font-semibold ink-900">{formatDate(isLearning ? item.startedAt : item.occurredAt)}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30">
                                {isLearning ? <Clock className="h-5 w-5 text-green-300" /> : <Utensils className="h-5 w-5 text-green-300" />}
                              </div>
                              <div>
                                <div className="text-xs ink-500 font-medium uppercase tracking-wide">{isLearning ? 'Duration' : 'Type'}</div>
                                <div className="text-lg font-semibold ink-900">{isLearning ? formatDuration(item.minutes) : item.type}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30">
                                <User className="h-5 w-5 text-purple-300" />
                              </div>
                              <div>
                                <div className="text-xs ink-500 font-medium uppercase tracking-wide">Source</div>
                                <div className="text-lg font-semibold ink-900">{item.source}</div>
                              </div>
                            </div>
                            <div className="text-sm ink-500">
                              Applied to {getMonthName(item.appliedMonth)} {item.appliedYear}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {item.notes && (
                              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-400/30">
                                <FileText className="h-5 w-5 text-orange-300" />
                              </div>
                            )}
                            <div className="p-3 glass rounded-lg">
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 ink-700" />
                              ) : (
                                <ChevronDown className="h-5 w-5 ink-700" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="border-t border-white/10 p-6 bg-white/5">
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-6 text-sm">
                              <div>
                                <span className="font-semibold ink-700">Session ID:</span>
                                <div className="ink-500 font-mono text-xs mt-1">{id}</div>
                              </div>
                              <div>
                                <span className="font-semibold ink-700">Created:</span>
                                <div className="ink-500 mt-1">{formatDate(isLearning ? item.createdAt : item.createdAt)}</div>
                              </div>
                              <div>
                                <span className="font-semibold ink-700">Last Updated:</span>
                                <div className="ink-500 mt-1">{formatDate(isLearning ? item.updatedAt : item.updatedAt)}</div>
                              </div>
                              <div>
                                <span className="font-semibold ink-700">Created By:</span>
                                <div className="ink-500 mt-1">{item.createdBy}</div>
                              </div>
                            </div>
                            
                            {item.notes && (
                              <div>
                                <span className="font-semibold ink-700 text-sm">Notes:</span>
                                <div className="mt-2 p-4 glass rounded-xl">
                                  <p className="text-sm ink-900 whitespace-pre-wrap leading-relaxed">{item.notes}</p>
                                </div>
                              </div>
                            )}
                            
                            {item.shabbatonId && (
                              <div>
                                <span className="font-semibold ink-700 text-sm">Shabbaton ID:</span>
                                <div className="ink-500 font-mono text-xs mt-1">{item.shabbatonId}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
