import React, { useState, useEffect } from 'react';
import { Clock, Users, Check, X, Calendar, Plus, Trash2, UserPlus } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { UWSRsvp, User } from '../../types';
import { getUpcomingSaturday, formatDate } from '../../utils/dateUtils';

interface UWSManagementProps {
  onDataChange: () => void;
}

export function UWSManagement({ onDataChange }: UWSManagementProps) {
  const [rsvps, setRsvps] = useState<UWSRsvp[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<Date>(getUpcomingSaturday());
  const [loading, setLoading] = useState(false);
  const [showAllRSVPs, setShowAllRSVPs] = useState(true);
  const [participants, setParticipants] = useState<User[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRSVP, setNewRSVP] = useState({
    participantId: '',
    attending: true
  });

  useEffect(() => {
    loadRSVPs();
    loadParticipants();
  }, [selectedWeek, showAllRSVPs]);

  const loadRSVPs = async () => {
    setLoading(true);
    try {
      console.log('Loading UWS RSVPs - showAllRSVPs:', showAllRSVPs, 'selectedWeek:', selectedWeek);
      const rsvpList = await dataService.getAllUWSRSVPs(showAllRSVPs ? undefined : selectedWeek);
      console.log('Loaded RSVPs:', rsvpList);
      setRsvps(rsvpList);
    } catch (error) {
      console.error('Error loading UWS RSVPs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async () => {
    try {
      const users = await dataService.getUsers();
      setParticipants(users.filter(u => u.role === 'participant'));
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  const handleDeleteRSVP = async (rsvpId: string) => {
    if (!confirm('Are you sure you want to remove this RSVP?')) return;
    
    try {
      await dataService.deleteUWSRSVP(rsvpId);
      await loadRSVPs();
      onDataChange();
    } catch (error) {
      console.error('Error deleting RSVP:', error);
      alert('Failed to delete RSVP. Please try again.');
    }
  };

  const handleAddRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRSVP.participantId) return;

    try {
      const weekDate = showAllRSVPs ? getUpcomingSaturday() : selectedWeek;
      await dataService.addUWSRSVP(newRSVP.participantId, weekDate, newRSVP.attending);
      setNewRSVP({ participantId: '', attending: true });
      setShowAddForm(false);
      await loadRSVPs();
      onDataChange();
    } catch (error) {
      console.error('Error adding RSVP:', error);
      alert('Failed to add RSVP. Please try again.');
    }
  };

  const attendingCount = rsvps.filter(r => r.attending).length;
  const notAttendingCount = rsvps.filter(r => !r.attending).length;
  const totalResponses = rsvps.length;

  // Generate next few Saturdays for week selection
  const getNextSaturdays = (count: number) => {
    const saturdays = [];
    const today = new Date();
    const currentDay = today.getDay();
    const daysUntilSaturday = (6 - currentDay) % 7;
    
    for (let i = 0; i < count; i++) {
      const saturday = new Date(today);
      saturday.setDate(today.getDate() + daysUntilSaturday + (i * 7));
      saturdays.push(saturday);
    }
    return saturdays;
  };

  const upcomingSaturdays = getNextSaturdays(4);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium ink-900">UWS Meal Management</h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-400/20 text-green-300 rounded-lg text-sm font-medium glow hover:bg-green-400/30"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add RSVP</span>
          </button>
          <button
            onClick={() => setShowAllRSVPs(!showAllRSVPs)}
            className={`px-4 py-2 rounded-lg text-sm font-medium glow ${
              showAllRSVPs 
                ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30' 
                : 'btn-ghost'
            }`}
          >
            {showAllRSVPs ? 'Show All RSVPs' : 'Filter by Week'}
          </button>
          <button
            onClick={loadRSVPs}
            className="px-4 py-2 btn-ghost rounded-lg text-sm font-medium glow"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Week Selection - Only show when filtering by week */}
      {!showAllRSVPs && (
        <div className="glass rounded-2xl p-6 glow">
          <h3 className="text-md font-medium ink-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Select Week
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {upcomingSaturdays.map((saturday) => (
              <button
                key={saturday.toISOString()}
                onClick={() => setSelectedWeek(saturday)}
                className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                  selectedWeek.toDateString() === saturday.toDateString()
                    ? 'bg-cyan-400/20 text-cyan-300 border-2 border-cyan-400/50'
                    : 'btn-ghost hover:bg-cyan-400/10 hover:text-cyan-300'
                }`}
              >
                <div className="text-center">
                  <div className="font-medium">{formatDate(saturday)}</div>
                  <div className="text-xs ink-500 mt-1">
                    {saturday.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add RSVP Form */}
      {showAddForm && (
        <div className="glass rounded-2xl p-6 glow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-medium ink-900">Add New RSVP</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-1 text-ink-500 hover:text-ink-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <form onSubmit={handleAddRSVP} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium ink-700 mb-2">
                  Participant
                </label>
                <select
                  value={newRSVP.participantId}
                  onChange={(e) => setNewRSVP({ ...newRSVP, participantId: e.target.value })}
                  className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-ink-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  required
                >
                  <option value="">Select a participant</option>
                  {participants.map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {participant.preferredName} ({participant.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium ink-700 mb-2">
                  Status
                </label>
                <select
                  value={newRSVP.attending ? 'true' : 'false'}
                  onChange={(e) => setNewRSVP({ ...newRSVP, attending: e.target.value === 'true' })}
                  className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-ink-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                >
                  <option value="true">Attending</option>
                  <option value="false">Not Attending</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 btn-ghost rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-400/20 text-green-300 rounded-lg text-sm font-medium glow hover:bg-green-400/30"
              >
                Add RSVP
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-6 glow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Check className="h-8 w-8 text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium ink-500">Attending</p>
              <p className="text-2xl font-bold ink-900">{attendingCount}</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 glow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <X className="h-8 w-8 text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium ink-500">Not Attending</p>
              <p className="text-2xl font-bold ink-900">{notAttendingCount}</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 glow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-cyan-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium ink-500">Total Responses</p>
              <p className="text-2xl font-bold ink-900">{totalResponses}</p>
            </div>
          </div>
        </div>
      </div>

      {/* RSVP List */}
      <div className="glass rounded-2xl p-6 glow">
        <h3 className="text-md font-medium ink-900 mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          {showAllRSVPs ? 'All UWS RSVPs' : `RSVPs for ${formatDate(selectedWeek)}`}
        </h3>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            <p className="text-sm ink-500 mt-2">Loading RSVPs...</p>
          </div>
        ) : rsvps.length === 0 ? (
          <div className="text-center py-8 ink-500">
            <Clock className="h-8 w-8 mx-auto mb-2" />
            <p>No RSVPs yet for this week</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rsvps
              .sort((a, b) => {
                // Sort by attending first, then by RSVP time
                if (a.attending !== b.attending) {
                  return a.attending ? -1 : 1;
                }
                return b.rsvpAt.getTime() - a.rsvpAt.getTime();
              })
              .map((rsvp) => (
                <div
                  key={rsvp.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    rsvp.attending
                      ? 'bg-green-400/10 border-green-400/30'
                      : 'bg-red-400/10 border-red-400/30'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        rsvp.attending ? 'bg-green-400' : 'bg-red-400'
                      }`}
                    />
                    <div>
                      <div className="font-medium ink-900">
                        {rsvp.user?.preferredName || 'Unknown User'}
                      </div>
                      <div className="text-sm ink-500">
                        {rsvp.user?.email || rsvp.participantId}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-2">
                      <div
                        className={`px-3 py-1 text-sm font-medium rounded-full ${
                          rsvp.attending
                            ? 'bg-green-400/20 text-green-300'
                            : 'bg-red-400/20 text-red-300'
                        }`}
                      >
                        {rsvp.attending ? 'Attending' : 'Not Attending'}
                      </div>
                      <button
                        onClick={() => handleDeleteRSVP(rsvp.id)}
                        className="p-1 text-red-400 hover:text-red-300 hover:bg-red-400/20 rounded transition-colors"
                        title="Remove RSVP"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-xs ink-500">
                      RSVP'd {rsvp.rsvpAt.toLocaleDateString()} at {rsvp.rsvpAt.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
