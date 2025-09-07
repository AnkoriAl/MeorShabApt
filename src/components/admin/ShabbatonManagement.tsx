import React, { useState, useEffect } from 'react';
import { Calendar, Users, Check, Plus, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { Shabbaton, Attendance, User } from '../../types';

interface ShabbatonManagementProps {
  onDataChange: () => void;
}

export function ShabbatonManagement({ onDataChange }: ShabbatonManagementProps) {
  const { currentUser } = useAuth();
  const [shabbatons, setShabbatons] = useState<Shabbaton[]>([]);
  const [selectedShabbaton, setSelectedShabbaton] = useState<string | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [participants, setParticipants] = useState<User[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newShabbaton, setNewShabbaton] = useState({
    title: '',
    date: '',
    meals: 3,
    minutes: 180
  });

  useEffect(() => {
    loadShabbatons();
    loadParticipants();
  }, []);

  useEffect(() => {
    if (selectedShabbaton) {
      loadAttendances(selectedShabbaton);
    }
  }, [selectedShabbaton]);

  const loadShabbatons = async () => {
    try {
      const shabbatonList = await dataService.getShabbatons();
      setShabbatons(shabbatonList);
    } catch (error) {
      console.error('Error loading shabbatons:', error);
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

  const loadAttendances = async (shabbatonId: string) => {
    try {
      const attendanceList = await dataService.getAttendances(undefined, shabbatonId);
      setAttendances(attendanceList);
    } catch (error) {
      console.error('Error loading attendances:', error);
    }
  };

  const handleConfirmAttendance = async (attendanceId: string) => {
    if (!currentUser) return;
    
    try {
      await dataService.confirmAttendance(attendanceId, currentUser.id);
      if (selectedShabbaton) {
        await loadAttendances(selectedShabbaton);
      }
      await loadShabbatons();
      onDataChange();
    } catch (error) {
      console.error('Error confirming attendance:', error);
    }
  };

  const handleRevokeAttendance = async (attendanceId: string) => {
    if (!currentUser) return;
    
    try {
      await dataService.revokeAttendance(attendanceId, currentUser.id);
      if (selectedShabbaton) {
        await loadAttendances(selectedShabbaton);
      }
      await loadShabbatons();
      onDataChange();
    } catch (error) {
      console.error('Error revoking attendance:', error);
    }
  };

  const handleCreateShabbaton = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      await dataService.createShabbaton(
        newShabbaton.title,
        new Date(newShabbaton.date),
        newShabbaton.meals,
        newShabbaton.minutes
      );
      
      setNewShabbaton({ title: '', date: '', meals: 3, minutes: 180 });
      setShowCreateForm(false);
      await loadShabbatons();
      onDataChange();
    } catch (error) {
      console.error('Error creating shabbaton:', error);
    }
  };

  const selectedShabbatonData = selectedShabbaton 
    ? shabbatons.find(s => s.id === selectedShabbaton)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium ink-900">Shabbaton Management</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center space-x-2 px-4 py-2 btn-ghost rounded-lg text-sm font-medium glow"
        >
          <Plus className="h-4 w-4" />
          <span>Create Shabbaton</span>
        </button>
      </div>

      {/* Create Shabbaton Form */}
      {showCreateForm && (
        <div className="glass rounded-2xl p-6 glow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-medium ink-900">Create New Shabbaton</h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="p-1 text-ink-500 hover:text-ink-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <form onSubmit={handleCreateShabbaton} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium ink-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newShabbaton.title}
                  onChange={(e) => setNewShabbaton({ ...newShabbaton, title: e.target.value })}
                  className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-ink-900 placeholder-ink-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  placeholder="e.g., Shabbaton Retreat 2024"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium ink-700 mb-2">
                  Date
                </label>
                <input
                  type="datetime-local"
                  value={newShabbaton.date}
                  onChange={(e) => setNewShabbaton({ ...newShabbaton, date: e.target.value })}
                  className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-ink-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium ink-700 mb-2">
                  Meals Credit
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newShabbaton.meals}
                  onChange={(e) => setNewShabbaton({ ...newShabbaton, meals: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-ink-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium ink-700 mb-2">
                  Learning Minutes Credit
                </label>
                <input
                  type="number"
                  min="30"
                  max="480"
                  step="30"
                  value={newShabbaton.minutes}
                  onChange={(e) => setNewShabbaton({ ...newShabbaton, minutes: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-ink-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 btn-ghost rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-400/20 text-cyan-300 rounded-lg text-sm font-medium glow hover:bg-cyan-400/30"
              >
                Create Shabbaton
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shabbaton List */}
        <div className="glass rounded-2xl p-6 glow">
          <h3 className="text-md font-medium ink-900 mb-4">Upcoming Events</h3>
          <div className="space-y-3">
            {shabbatons.map((shabbaton) => {
              const pendingCount = attendances.filter(
                a => a.shabbatonId === shabbaton.id && a.status === 'Pending'
              ).length;
              
              return (
                <button
                  key={shabbaton.id}
                  onClick={() => setSelectedShabbaton(shabbaton.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selectedShabbaton === shabbaton.id
                      ? 'bg-cyan-400/20 border-cyan-400/50 shadow-sm'
                      : 'bg-white/10 border-white/20 hover:bg-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium ink-900">
                        {shabbaton.title}
                      </div>
                      <div className="text-sm ink-500 flex items-center mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        {shabbaton.date.toLocaleDateString()}
                      </div>
                      <div className="text-sm text-cyan-400 mt-1">
                        Credits: {shabbaton.defaultCredits.meals} meals, {Math.floor(shabbaton.defaultCredits.minutes / 60)}h
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium ink-900">
                        {shabbaton.attendanceCount} confirmed
                      </div>
                      {selectedShabbaton === shabbaton.id && pendingCount > 0 && (
                        <div className="text-xs text-yellow-400 mt-1">
                          {pendingCount} pending
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Attendance Management */}
        <div className="glass rounded-2xl p-6 glow">
          {selectedShabbatonData ? (
            <div>
              <h3 className="text-md font-medium ink-900 mb-4">
                Attendance: {selectedShabbatonData.title}
              </h3>
              
              {attendances.length === 0 ? (
                <p className="ink-500 text-sm">No attendance requests yet.</p>
              ) : (
                <div className="space-y-3">
                  {attendances.map((attendance) => {
                    const participant = participants.find(p => p.id === attendance.participantId);
                    if (!participant) return null;

                    return (
                      <div
                        key={attendance.id}
                        className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-white/20"
                      >
                        <div>
                          <div className="font-medium ink-900">
                            {participant.preferredName}
                          </div>
                          <div className="text-sm ink-500">
                            {participant.email}
                          </div>
                          <div className="text-xs ink-500 mt-1">
                            Requested: {attendance.createdAt.toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              attendance.status === 'Confirmed'
                                ? 'bg-green-400/20 text-green-300 border border-green-400/30'
                                : attendance.status === 'Pending'
                                ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30'
                                : 'bg-red-400/20 text-red-300 border border-red-400/30'
                            }`}
                          >
                            {attendance.status}
                          </span>
                          
                          {attendance.status === 'Pending' && (
                            <button
                              onClick={() => handleConfirmAttendance(attendance.id)}
                              className="p-1 text-green-400 hover:text-green-300 hover:bg-green-400/20 rounded transition-colors"
                              title="Confirm Attendance"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          
                          {attendance.status === 'Confirmed' && (
                            <button
                              onClick={() => handleRevokeAttendance(attendance.id)}
                              className="px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/20 rounded transition-colors"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 ink-500">
              <Users className="h-8 w-8 mx-auto mb-2" />
              <p>Select a Shabbaton to manage attendance</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}