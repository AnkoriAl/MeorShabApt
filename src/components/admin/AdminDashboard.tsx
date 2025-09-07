import React, { useState, useEffect } from 'react';
import { Users, Calendar, FileText, DollarSign, Clock } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { User, MonthLog } from '../../types';
import { getCurrentMonth, getMonthName, formatDuration } from '../../utils/dateUtils';
import { ParticipantList } from './ParticipantList';
import { ShabbatonManagement } from './ShabbatonManagement';
import { UWSManagement } from './UWSManagement';
import { Reports } from './Reports';

type ActiveTab = 'participants' | 'shabbatons' | 'uws' | 'reports';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('participants');
  const [participants, setParticipants] = useState<User[]>([]);
  const [monthLogs, setMonthLogs] = useState<MonthLog[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const users = await dataService.getUsers();
      setParticipants(users.filter(u => u.role === 'participant'));
      
      const logs = await dataService.getAllMonthLogs();
      setMonthLogs(logs);
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const { year, month } = getCurrentMonth();
  const currentMonthLogs = monthLogs.filter(ml => ml.year === year && ml.month === month);
  
  // Calculate summary stats
  const completedCount = currentMonthLogs.filter(ml => ml.isComplete).length;
  const totalParticipants = participants.length;
  const completionRate = totalParticipants > 0 ? (completedCount / totalParticipants) * 100 : 0;
  
  const paymentsOverdue = monthLogs.filter(ml => ml.paymentStatus === 'Due').length;

  const tabs = [
    { id: 'participants' as const, label: 'Participants', icon: Users },
    { id: 'shabbatons' as const, label: 'Shabbatons', icon: Calendar },
    { id: 'uws' as const, label: 'UWS Meals', icon: Clock },
    { id: 'reports' as const, label: 'Reports', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-6 glow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-cyan-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium ink-500">Total Participants</p>
              <p className="text-2xl font-bold ink-900">{totalParticipants}</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 glow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-green-400/20 rounded-full flex items-center justify-center border border-green-400/30">
                <span className="text-green-400 font-bold">✓</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium ink-500">Completed This Month</p>
              <p className="text-2xl font-bold ink-900">
                {completedCount}
                <span className="text-sm font-normal ink-500 ml-1">
                  ({completionRate.toFixed(0)}%)
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 glow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium ink-500">Current Month</p>
              <p className="text-xl font-bold ink-900">
                {getMonthName(month)} {year}
              </p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 glow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium ink-500">Overdue Payments</p>
              <p className="text-2xl font-bold ink-900">{paymentsOverdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="glass-strong rounded-2xl">
        <div className="border-b border-white/20">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent ink-500 hover:ink-900 hover:border-white/30'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'participants' && (
            <ParticipantList
              participants={participants}
              monthLogs={currentMonthLogs}
              onDataChange={loadData}
            />
          )}
          {activeTab === 'shabbatons' && (
            <ShabbatonManagement onDataChange={loadData} />
          )}
          {activeTab === 'uws' && (
            <UWSManagement onDataChange={loadData} />
          )}
          {activeTab === 'reports' && (
            <Reports
              participants={participants}
              monthLogs={monthLogs}
            />
          )}
        </div>
      </div>
    </div>
  );
}