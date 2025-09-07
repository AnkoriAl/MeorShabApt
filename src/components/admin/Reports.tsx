import React, { useState } from 'react';
import { Download, FileText, DollarSign, Users } from 'lucide-react';
import { User, MonthLog } from '../../types';
import { getMonthName, formatDuration } from '../../utils/dateUtils';

interface ReportsProps {
  participants: User[];
  monthLogs: MonthLog[];
}

export function Reports({ participants, monthLogs }: ReportsProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const generateMonthlyComplianceCSV = () => {
    const filteredLogs = monthLogs.filter(ml => ml.year === selectedYear && ml.month === selectedMonth);
    
    const headers = [
      'Participant Name',
      'Email',
      'Meals Earned',
      'Meals Required',
      'Learning Minutes',
      'Learning Required',
      'Complete',
      'Completed Date',
      'Payment Status',
      'Payment Date'
    ];

    const rows = filteredLogs.map(log => {
      const participant = participants.find(p => p.id === log.participantId);
      return [
        participant?.preferredName || 'Unknown',
        participant?.email || 'Unknown',
        log.mealsEarned.toString(),
        log.mealsRequired.toString(),
        log.minutesEarned.toString(),
        log.minutesRequired.toString(),
        log.isComplete ? 'Yes' : 'No',
        log.completedAt ? log.completedAt.toISOString().split('T')[0] : '',
        log.paymentStatus,
        log.computedPaymentDate.toISOString().split('T')[0]
      ];
    });

    const csv = [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    downloadCSV(csv, `monthly-compliance-${selectedYear}-${selectedMonth.toString().padStart(2, '0')}.csv`);
  };

  const generatePaymentReportCSV = () => {
    const paymentLogs = monthLogs.filter(ml => ml.paymentStatus === 'Due' || ml.paymentStatus === 'Paid');
    
    const headers = [
      'Participant Name',
      'Email',
      'Month',
      'Year',
      'Payment Status',
      'Payment Due Date',
      'Marked By',
      'Marked Date'
    ];

    const rows = paymentLogs.map(log => {
      const participant = participants.find(p => p.id === log.participantId);
      return [
        participant?.preferredName || 'Unknown',
        participant?.email || 'Unknown',
        getMonthName(log.month),
        log.year.toString(),
        log.paymentStatus,
        log.computedPaymentDate.toISOString().split('T')[0],
        log.paymentMarkedBy || '',
        log.paymentMarkedAt ? log.paymentMarkedAt.toISOString().split('T')[0] : ''
      ];
    });

    const csv = [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    downloadCSV(csv, `payment-report-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentMonthLogs = monthLogs.filter(ml => ml.year === selectedYear && ml.month === selectedMonth);
  const completedCount = currentMonthLogs.filter(ml => ml.isComplete).length;
  const averageMeals = currentMonthLogs.length > 0 
    ? currentMonthLogs.reduce((sum, log) => sum + log.mealsEarned, 0) / currentMonthLogs.length 
    : 0;
  const averageMinutes = currentMonthLogs.length > 0
    ? currentMonthLogs.reduce((sum, log) => sum + log.minutesEarned, 0) / currentMonthLogs.length
    : 0;

  const years = Array.from(new Set(monthLogs.map(ml => ml.year))).sort();
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium ink-900">Reports</h2>
      </div>

      {/* Report Controls */}
      <div className="glass rounded-2xl p-4 glow">
        <div className="flex items-end space-x-6">
          <div>
            <label htmlFor="year" className="block text-xs font-medium ink-500 mb-1">
              Year
            </label>
            <select
              id="year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input-dark px-3 py-2 rounded-lg"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="month" className="block text-xs font-medium ink-500 mb-1">
              Month
            </label>
            <select
              id="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="input-dark px-3 py-2 rounded-lg"
            >
              {months.map(month => (
                <option key={month} value={month}>{getMonthName(month)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-6 glow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-cyan-400" />
            <div className="ml-4">
              <p className="text-sm font-medium ink-500">Participants</p>
              <p className="text-2xl font-bold ink-900">{currentMonthLogs.length}</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 glow">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-green-400/20 rounded-full flex items-center justify-center border border-green-400/30">
              <span className="text-green-400 font-bold">✓</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium ink-500">Completed</p>
              <p className="text-2xl font-bold ink-900">
                {completedCount}
                <span className="text-sm font-normal ink-500 ml-1">
                  ({currentMonthLogs.length > 0 ? Math.round((completedCount / currentMonthLogs.length) * 100) : 0}%)
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 glow">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-orange-400/20 rounded-full flex items-center justify-center border border-orange-400/30">
              <span className="text-orange-300">🍽️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium ink-500">Avg Meals</p>
              <p className="text-2xl font-bold ink-900">{averageMeals.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 glow">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-purple-400/20 rounded-full flex items-center justify-center border border-purple-400/30">
              <span className="text-purple-300">📚</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium ink-500">Avg Learning</p>
              <p className="text-2xl font-bold ink-900">{formatDuration(Math.round(averageMinutes))}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Generation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6 glow">
          <div className="flex items-center mb-3">
            <FileText className="h-6 w-6 text-cyan-400 mr-3" />
            <h3 className="text-lg font-medium ink-900">Monthly Compliance Report</h3>
          </div>
          <p className="text-sm ink-500 mb-4">
            Export detailed compliance data for {getMonthName(selectedMonth)} {selectedYear},
            including meal and learning progress for all participants.
          </p>
          <button
            onClick={generateMonthlyComplianceCSV}
            className="btn-primary flex items-center px-4 py-2 rounded-lg glow"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>

        <div className="glass rounded-2xl p-6 glow">
          <div className="flex items-center mb-3">
            <DollarSign className="h-6 w-6 text-green-400 mr-3" />
            <h3 className="text-lg font-medium ink-900">Payment Report</h3>
          </div>
          <p className="text-sm ink-500 mb-4">
            Export payment status for all participants, including due dates and payment history across all months.
          </p>
          <button
            onClick={generatePaymentReportCSV}
            className="flex items-center px-4 py-2 rounded-lg glow"
            style={{ background: 'linear-gradient(180deg, #22c55e, #16a34a)', color: 'white' }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="glass-strong rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/20">
          <h3 className="text-lg font-medium ink-900">
            {getMonthName(selectedMonth)} {selectedYear} Detail
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5">
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
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {currentMonthLogs.map((log) => {
                const participant = participants.find(p => p.id === log.participantId);
                return (
                  <tr key={`${log.participantId}-${log.year}-${log.month}`} className="hover:bg-white/5">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium ink-900">
                        {participant?.preferredName || 'Unknown'}
                      </div>
                      <div className="text-sm ink-500">
                        {participant?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm ink-900">
                      {log.mealsEarned} / {log.mealsRequired}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm ink-900">
                      {formatDuration(log.minutesEarned)} / 12h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        log.isComplete ? 'bg-green-400/20 text-green-300 border border-green-400/30' : 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30'
                      }`}>
                        {log.isComplete ? 'Complete' : 'In Progress'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm ink-900">{log.paymentStatus}</div>
                      <div className="text-xs ink-500">
                        Due: {log.computedPaymentDate.toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {currentMonthLogs.length === 0 && (
          <div className="text-center py-8 ink-500">
            No data found for {getMonthName(selectedMonth)} {selectedYear}.
          </div>
        )}
      </div>
    </div>
  );
}