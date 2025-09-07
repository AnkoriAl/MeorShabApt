import React from 'react';
import { Clock, Check, X } from 'lucide-react';
import { UWSRsvp } from '../../types';
import { getUpcomingSaturday } from '../../utils/dateUtils';

interface UWSRSVPWidgetProps {
  rsvp: UWSRsvp | null;
  onRSVPChange: (attending: boolean) => void;
  windowOpen: boolean;
}

export function UWSRSVPWidget({ rsvp, onRSVPChange, windowOpen }: UWSRSVPWidgetProps) {
  const upcomingSaturday = getUpcomingSaturday();

  return (
    <div className="glass rounded-2xl p-6 glow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium ink-900">UWS Shabbat Meals</h3>
        <Clock className="h-5 w-5 ink-500" />
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm ink-700">
            This Saturday: {upcomingSaturday.toLocaleDateString()}
          </p>
          <p className="text-xs ink-500 mt-1">
            RSVP required by Wednesday 11:59 PM (NY time)
          </p>
        </div>

        {windowOpen ? (
          <div className="flex space-x-3">
            <button
              onClick={() => onRSVPChange(true)}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors glow ${
                rsvp?.attending === true
                  ? 'bg-green-400/20 text-green-300 border-2 border-green-400/50'
                  : 'btn-ghost hover:bg-green-400/10 hover:text-green-300'
              }`}
            >
              <Check className="h-4 w-4 mr-2" />
              Yes, I'll attend
            </button>
            <button
              onClick={() => onRSVPChange(false)}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors glow ${
                rsvp?.attending === false
                  ? 'bg-red-400/20 text-red-300 border-2 border-red-400/50'
                  : 'btn-ghost hover:bg-red-400/10 hover:text-red-300'
              }`}
            >
              <X className="h-4 w-4 mr-2" />
              Can't attend
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="inline-flex items-center px-4 py-2 glass text-ink-500 rounded-lg text-sm">
              <Clock className="h-4 w-4 mr-2" />
              RSVP window closed
            </div>
            {rsvp && (
              <p className="text-sm ink-700 mt-2">
                Your response: {rsvp.attending ? '✅ Attending' : '❌ Not attending'}
              </p>
            )}
          </div>
        )}

        {rsvp && (
          <p className="text-xs ink-500">
            Last updated: {rsvp.rsvpAt.toLocaleDateString()} at {rsvp.rsvpAt.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}