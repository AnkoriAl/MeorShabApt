export interface User {
  id: string;
  email: string;
  role: 'participant' | 'admin';
  createdAt: Date;
  status: 'active' | 'disabled';
  preferredName: string;
  notes?: string;
}

export interface MonthLog {
  participantId: string;
  year: number;
  month: number; // 1-12
  mealsRequired: number; // default 4
  minutesRequired: number; // default 720
  mealsEarned: number;
  minutesEarned: number;
  isComplete: boolean;
  completedAt?: Date;
  computedPaymentDate: Date; // first day of month + 2 months
  paymentStatus: 'Not due' | 'Due' | 'Paid';
  paymentMarkedAt?: Date;
  paymentMarkedBy?: string;
}

export interface MealLog {
  id: string;
  participantId: string;
  occurredAt: Date;
  appliedYear: number;
  appliedMonth: number;
  type: 'UWS' | 'Shabbaton' | 'Other';
  notes?: string;
  source: 'Self report' | 'Admin entry' | 'Attendance grant';
  shabbatonId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deleted: boolean;
  deletedReason?: string;
  deletedBy?: string;
  deletedAt?: Date;
}

export interface LearningSession {
  id: string;
  participantId: string;
  startedAt: Date;
  minutes: number; // 1-360 per session
  notes?: string;
  appliedYear: number;
  appliedMonth: number;
  source: 'Self' | 'Hevruta' | 'Shabbaton' | 'Admin entry';
  shabbatonId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deleted: boolean;
  deletedReason?: string;
  deletedBy?: string;
  deletedAt?: Date;
}

export interface Shabbaton {
  id: string;
  title: string;
  date: Date;
  defaultCredits: {
    meals: number; // default 3
    minutes: number; // default 180
  };
  attendanceCount: number;
}

export interface Attendance {
  id: string;
  participantId: string;
  shabbatonId: string;
  appliedYear: number;
  appliedMonth: number;
  grantedMeals: number; // default 3
  grantedMinutes: number; // default 180
  status: 'Pending' | 'Confirmed' | 'Denied';
  markedBy?: string;
  markedAt?: Date;
  createdAt: Date;
}

export interface UWSRsvp {
  id: string;
  participantId: string;
  weekDate: Date; // Saturday of the week
  attending: boolean;
  rsvpAt: Date;
  user?: {
    id: string;
    preferredName: string;
    email: string;
  };
}