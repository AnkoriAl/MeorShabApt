import { User, MonthLog, MealLog, LearningSession, Shabbaton, Attendance, UWSRsvp } from '../types';
import { supabaseDataService } from './supabaseDataService';

class DataService {
  // This class now acts as a wrapper around the Supabase service
  // for backward compatibility with existing components

  // User management
  async getUsers(): Promise<User[]> {
    return await supabaseDataService.getUsers();
  }

  async getUserById(id: string): Promise<User | null> {
    return await supabaseDataService.getUserById(id);
  }

  // Month log management
  async getOrCreateMonthLog(participantId: string, year: number, month: number): Promise<MonthLog> {
    return await supabaseDataService.getOrCreateMonthLog(participantId, year, month);
  }

  async getMonthLog(participantId: string, year: number, month: number): Promise<MonthLog | null> {
    return await supabaseDataService.getMonthLog(participantId, year, month);
  }

  async getMonthLogsForParticipant(participantId: string): Promise<MonthLog[]> {
    return await supabaseDataService.getMonthLogsForParticipant(participantId);
  }

  async getAllMonthLogs(): Promise<MonthLog[]> {
    return await supabaseDataService.getAllMonthLogs();
  }

  async recomputeMonthLog(participantId: string, year: number, month: number): Promise<void> {
    return await supabaseDataService.recomputeMonthLog(participantId, year, month);
  }

  // Meal logs
  async getMealLogs(participantId?: string): Promise<MealLog[]> {
    return await supabaseDataService.getMealLogs(participantId);
  }

  async addMealLog(mealLog: Omit<MealLog, 'id' | 'createdAt' | 'updatedAt' | 'deleted'>): Promise<MealLog> {
    return await supabaseDataService.addMealLog(mealLog);
  }

  async softDeleteMealLog(id: string, reason: string, deletedBy: string): Promise<void> {
    return await supabaseDataService.softDeleteMealLog(id, reason, deletedBy);
  }

  // Learning sessions
  async getLearningSessions(participantId?: string): Promise<LearningSession[]> {
    return await supabaseDataService.getLearningSessions(participantId);
  }

  async addLearningSession(session: Omit<LearningSession, 'id' | 'createdAt' | 'updatedAt' | 'deleted'>): Promise<LearningSession> {
    return await supabaseDataService.addLearningSession(session);
  }

  async softDeleteLearningSession(id: string, reason: string, deletedBy: string): Promise<void> {
    return await supabaseDataService.softDeleteLearningSession(id, reason, deletedBy);
  }

  // Shabbatons
  async getShabbatons(): Promise<Shabbaton[]> {
    return await supabaseDataService.getShabbatons();
  }

  async createShabbaton(title: string, date: Date, meals: number, minutes: number): Promise<Shabbaton> {
    return await supabaseDataService.createShabbaton(title, date, meals, minutes);
  }

  async getShabbaton(id: string): Promise<Shabbaton | null> {
    return await supabaseDataService.getShabbaton(id);
  }

  // Attendance
  async getAttendances(participantId?: string, shabbatonId?: string): Promise<Attendance[]> {
    return await supabaseDataService.getAttendances(participantId, shabbatonId);
  }

  async requestAttendance(participantId: string, shabbatonId: string): Promise<Attendance> {
    return await supabaseDataService.requestAttendance(participantId, shabbatonId);
  }

  async confirmAttendance(attendanceId: string, confirmedBy: string): Promise<void> {
    return await supabaseDataService.confirmAttendance(attendanceId, confirmedBy);
  }

  async revokeAttendance(attendanceId: string, revokedBy: string): Promise<void> {
    return await supabaseDataService.revokeAttendance(attendanceId, revokedBy);
  }

  // UWS RSVP
  async getUWSRSVP(participantId: string, weekDate: Date): Promise<UWSRsvp | null> {
    return await supabaseDataService.getUWSRSVP(participantId, weekDate);
  }

  async setUWSRSVP(participantId: string, weekDate: Date, attending: boolean): Promise<UWSRsvp> {
    return await supabaseDataService.setUWSRSVP(participantId, weekDate, attending);
  }

  async getAllUWSRSVPs(weekDate?: Date): Promise<UWSRsvp[]> {
    return await supabaseDataService.getAllUWSRSVPs(weekDate);
  }

  async deleteUWSRSVP(rsvpId: string): Promise<void> {
    return await supabaseDataService.deleteUWSRSVP(rsvpId);
  }

  async addUWSRSVP(participantId: string, weekDate: Date, attending: boolean): Promise<UWSRsvp> {
    return await supabaseDataService.addUWSRSVP(participantId, weekDate, attending);
  }

  // Payment management
  async markPayment(participantId: string, year: number, month: number, paid: boolean, markedBy: string): Promise<void> {
    return await supabaseDataService.markPayment(participantId, year, month, paid, markedBy);
  }

  // Validation helpers
  async canApplyMakeUp(participantId: string, currentYear: number, currentMonth: number, targetYear: number, targetMonth: number): Promise<boolean> {
    return await supabaseDataService.canApplyMakeUp(participantId, currentYear, currentMonth, targetYear, targetMonth);
  }
}

export const dataService = new DataService();