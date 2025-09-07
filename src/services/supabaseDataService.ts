import { supabase } from '../lib/supabase';
import { User, MonthLog, MealLog, LearningSession, Shabbaton, Attendance, UWSRsvp } from '../types';
import { getCurrentMonth, getPreviousMonth, getPaymentDate } from '../utils/dateUtils';

class SupabaseDataService {
  // User management
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapUserFromDB);
  }

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) return null;
    return this.mapUserFromDB(data);
  }

  async createUser(user: Omit<User, 'createdAt'>): Promise<User> {
    const dbUser = this.mapUserToDB(user);
    const { data, error } = await supabase
      .from('users')
      .upsert([dbUser], { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return this.mapUserFromDB(data);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(this.mapUserToDB(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapUserFromDB(data);
  }

  // Month log management
  async getOrCreateMonthLog(participantId: string, year: number, month: number): Promise<MonthLog> {
    let { data: monthLog, error } = await supabase
      .from('month_logs')
      .select('*')
      .eq('participant_id', participantId)
      .eq('year', year)
      .eq('month', month)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') { // tolerate 'no rows' style errors
      throw error;
    }

    if (!monthLog) {
      const newMonthLog = {
        participant_id: participantId,
        year,
        month,
        meals_required: 4,
        minutes_required: 720,
        meals_earned: 0,
        minutes_earned: 0,
        is_complete: false,
        computed_payment_date: getPaymentDate(year, month).toISOString(),
        payment_status: 'Not due' as const
      };

      const { data, error: insertError } = await supabase
        .from('month_logs')
        .insert([newMonthLog])
        .select()
        .single();

      if (insertError) throw insertError;
      monthLog = data;
    }

    return this.mapMonthLogFromDB(monthLog);
  }

  async getMonthLog(participantId: string, year: number, month: number): Promise<MonthLog | null> {
    const { data, error } = await supabase
      .from('month_logs')
      .select('*')
      .eq('participant_id', participantId)
      .eq('year', year)
      .eq('month', month)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapMonthLogFromDB(data);
  }

  async getMonthLogsForParticipant(participantId: string): Promise<MonthLog[]> {
    const { data, error } = await supabase
      .from('month_logs')
      .select('*')
      .eq('participant_id', participantId)
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapMonthLogFromDB);
  }

  async getAllMonthLogs(): Promise<MonthLog[]> {
    const { data, error } = await supabase
      .from('month_logs')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapMonthLogFromDB);
  }

  async recomputeMonthLog(participantId: string, year: number, month: number): Promise<void> {
    const monthLog = await this.getOrCreateMonthLog(participantId, year, month);
    
    // Calculate meals earned
    const { data: meals } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('participant_id', participantId)
      .eq('applied_year', year)
      .eq('applied_month', month)
      .eq('deleted', false);

    const { data: attendanceGrants } = await supabase
      .from('attendances')
      .select('*')
      .eq('participant_id', participantId)
      .eq('applied_year', year)
      .eq('applied_month', month)
      .eq('status', 'Confirmed');

    const mealsEarned = (meals?.length || 0) + 
      (attendanceGrants?.reduce((sum, a) => sum + a.granted_meals, 0) || 0);

    // Calculate minutes earned
    const { data: sessions } = await supabase
      .from('learning_sessions')
      .select('*')
      .eq('participant_id', participantId)
      .eq('applied_year', year)
      .eq('applied_month', month)
      .eq('deleted', false);

    const minutesEarned = (sessions?.reduce((sum, s) => sum + s.minutes, 0) || 0) +
      (attendanceGrants?.reduce((sum, a) => sum + a.granted_minutes, 0) || 0);

    // Update completion status
    const wasComplete = monthLog.isComplete;
    const isComplete = mealsEarned >= monthLog.mealsRequired && 
                      minutesEarned >= monthLog.minutesRequired;
    
    const updates: any = {
      meals_earned: mealsEarned,
      minutes_earned: minutesEarned,
      is_complete: isComplete
    };

    if (isComplete && !wasComplete) {
      updates.completed_at = new Date().toISOString();
    } else if (!isComplete && wasComplete) {
      updates.completed_at = null;
    }

    // Update payment status
    const now = new Date();
    if (isComplete && now >= new Date(monthLog.computedPaymentDate) && monthLog.paymentStatus === 'Not due') {
      updates.payment_status = 'Due';
    }

    const { error: updateError } = await supabase
      .from('month_logs')
      .update(updates)
      .eq('participant_id', participantId)
      .eq('year', year)
      .eq('month', month);

    if (updateError) {
      console.error('Error updating month log:', updateError);
      throw updateError;
    }
  }

  // Meal logs
  async getMealLogs(participantId?: string): Promise<MealLog[]> {
    let query = supabase
      .from('meal_logs')
      .select('*')
      .eq('deleted', false)
      .order('occurred_at', { ascending: false });

    if (participantId) {
      query = query.eq('participant_id', participantId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(this.mapMealLogFromDB);
  }

  async addMealLog(mealLog: Omit<MealLog, 'id' | 'createdAt' | 'updatedAt' | 'deleted'>): Promise<MealLog> {
    const dbMealLog = this.mapMealLogToDB(mealLog);
    
    const { data, error } = await supabase
      .from('meal_logs')
      .insert([dbMealLog])
      .select()
      .single();

    if (error) throw error;
    
    await this.recomputeMonthLog(mealLog.participantId, mealLog.appliedYear, mealLog.appliedMonth);
    
    return this.mapMealLogFromDB(data);
  }

  async softDeleteMealLog(id: string, reason: string, deletedBy: string): Promise<void> {
    const { error } = await supabase
      .from('meal_logs')
      .update({
        deleted: true,
        deleted_reason: reason,
        deleted_by: deletedBy,
        deleted_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    // Get the meal log to recompute month log
    const { data: mealLog } = await supabase
      .from('meal_logs')
      .select('participant_id, applied_year, applied_month')
      .eq('id', id)
      .single();

    if (mealLog) {
      await this.recomputeMonthLog(mealLog.participant_id, mealLog.applied_year, mealLog.applied_month);
    }
  }

  // Learning sessions
  async getLearningSessions(participantId?: string): Promise<LearningSession[]> {
    let query = supabase
      .from('learning_sessions')
      .select('*')
      .eq('deleted', false)
      .order('started_at', { ascending: false });

    if (participantId) {
      query = query.eq('participant_id', participantId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(this.mapLearningSessionFromDB);
  }

  async addLearningSession(session: Omit<LearningSession, 'id' | 'createdAt' | 'updatedAt' | 'deleted'>): Promise<LearningSession> {
    const dbSession = this.mapLearningSessionToDB(session);
    
    const { data, error } = await supabase
      .from('learning_sessions')
      .insert([dbSession])
      .select()
      .single();

    if (error) throw error;
    
    await this.recomputeMonthLog(session.participantId, session.appliedYear, session.appliedMonth);
    
    return this.mapLearningSessionFromDB(data);
  }

  async softDeleteLearningSession(id: string, reason: string, deletedBy: string): Promise<void> {
    const { error } = await supabase
      .from('learning_sessions')
      .update({
        deleted: true,
        deleted_reason: reason,
        deleted_by: deletedBy,
        deleted_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    // Get the session to recompute month log
    const { data: session } = await supabase
      .from('learning_sessions')
      .select('participant_id, applied_year, applied_month')
      .eq('id', id)
      .single();

    if (session) {
      await this.recomputeMonthLog(session.participant_id, session.applied_year, session.applied_month);
    }
  }

  // Shabbatons
  async getShabbatons(): Promise<Shabbaton[]> {
    const { data, error } = await supabase
      .from('shabbatons')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapShabbatonFromDB);
  }

  async createShabbaton(title: string, date: Date, meals: number, minutes: number): Promise<Shabbaton> {
    const shabbaton = {
      title,
      date: date.toISOString(),
      default_credits: { meals, minutes },
      attendance_count: 0
    };

    const { data, error } = await supabase
      .from('shabbatons')
      .insert([shabbaton])
      .select()
      .single();

    if (error) throw error;
    return this.mapShabbatonFromDB(data);
  }

  async getShabbaton(id: string): Promise<Shabbaton | null> {
    const { data, error } = await supabase
      .from('shabbatons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return this.mapShabbatonFromDB(data);
  }

  // Attendance
  async getAttendances(participantId?: string, shabbatonId?: string): Promise<Attendance[]> {
    let query = supabase.from('attendances').select('*');

    if (participantId) {
      query = query.eq('participant_id', participantId);
    }
    if (shabbatonId) {
      query = query.eq('shabbaton_id', shabbatonId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(this.mapAttendanceFromDB);
  }

  async requestAttendance(participantId: string, shabbatonId: string): Promise<Attendance> {
    const shabbaton = await this.getShabbaton(shabbatonId);
    if (!shabbaton) throw new Error('Shabbaton not found');

    const { data: existingAttendance } = await supabase
      .from('attendances')
      .select('*')
      .eq('participant_id', participantId)
      .eq('shabbaton_id', shabbatonId)
      .maybeSingle();

    if (existingAttendance) {
      throw new Error('Attendance already requested for this Shabbaton');
    }

    const appliedMonth = shabbaton.date.getMonth() + 1;
    const appliedYear = shabbaton.date.getFullYear();

    const attendance = {
      participant_id: participantId,
      shabbaton_id: shabbatonId,
      applied_year: appliedYear,
      applied_month: appliedMonth,
      granted_meals: shabbaton.defaultCredits.meals,
      granted_minutes: shabbaton.defaultCredits.minutes,
      status: 'Pending' as const
    };

    const { data, error } = await supabase
      .from('attendances')
      .insert([attendance])
      .select()
      .single();

    if (error) throw error;
    return this.mapAttendanceFromDB(data);
  }

  async confirmAttendance(attendanceId: string, confirmedBy: string): Promise<void> {
    const { data: attendance, error: fetchError } = await supabase
      .from('attendances')
      .select('*')
      .eq('id', attendanceId)
      .single();

    if (fetchError) throw fetchError;
    if (attendance.status === 'Confirmed') return; // Already confirmed

    const { error: updateError } = await supabase
      .from('attendances')
      .update({
        status: 'Confirmed',
        marked_by: confirmedBy,
        marked_at: new Date().toISOString()
      })
      .eq('id', attendanceId);

    if (updateError) throw updateError;

    // Create attendance grants
    const shabbaton = await this.getShabbaton(attendance.shabbaton_id);
    if (!shabbaton) throw new Error('Shabbaton not found');

    // Add learning session grant
    await this.addLearningSession({
      participantId: attendance.participant_id,
      startedAt: shabbaton.date,
      minutes: attendance.granted_minutes,
      appliedYear: attendance.applied_year,
      appliedMonth: attendance.applied_month,
      source: 'Shabbaton',
      shabbatonId: attendance.shabbaton_id,
      createdBy: confirmedBy,
      notes: `Shabbaton attendance grant: ${shabbaton.title}`
    });

    // Add meal grants
    for (let i = 0; i < attendance.granted_meals; i++) {
      await this.addMealLog({
        participantId: attendance.participant_id,
        occurredAt: shabbaton.date,
        appliedYear: attendance.applied_year,
        appliedMonth: attendance.applied_month,
        type: 'Shabbaton',
        source: 'Attendance grant',
        shabbatonId: attendance.shabbaton_id,
        createdBy: confirmedBy,
        notes: `Shabbaton meal grant ${i + 1}: ${shabbaton.title}`
      });
    }

    // Update shabbaton attendance count
    const { data: attendances } = await supabase
      .from('attendances')
      .select('*')
      .eq('shabbaton_id', attendance.shabbaton_id)
      .eq('status', 'Confirmed');

    await supabase
      .from('shabbatons')
      .update({ attendance_count: attendances?.length || 0 })
      .eq('id', attendance.shabbaton_id);
  }

  async revokeAttendance(attendanceId: string, revokedBy: string): Promise<void> {
    const { data: attendance, error: fetchError } = await supabase
      .from('attendances')
      .select('*')
      .eq('id', attendanceId)
      .single();

    if (fetchError) throw fetchError;
    if (attendance.status !== 'Confirmed') return;

    // Soft delete associated grants
    const { data: learningGrants } = await supabase
      .from('learning_sessions')
      .select('*')
      .eq('participant_id', attendance.participant_id)
      .eq('shabbaton_id', attendance.shabbaton_id)
      .eq('source', 'Shabbaton')
      .eq('deleted', false);

    const { data: mealGrants } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('participant_id', attendance.participant_id)
      .eq('shabbaton_id', attendance.shabbaton_id)
      .eq('source', 'Attendance grant')
      .eq('deleted', false);

    // Soft delete learning grants
    if (learningGrants?.length) {
      await supabase
        .from('learning_sessions')
        .update({
          deleted: true,
          deleted_reason: 'Attendance revoked',
          deleted_by: revokedBy,
          deleted_at: new Date().toISOString()
        })
        .in('id', learningGrants.map(g => g.id));
    }

    // Soft delete meal grants
    if (mealGrants?.length) {
      await supabase
        .from('meal_logs')
        .update({
          deleted: true,
          deleted_reason: 'Attendance revoked',
          deleted_by: revokedBy,
          deleted_at: new Date().toISOString()
        })
        .in('id', mealGrants.map(g => g.id));
    }

    await supabase
      .from('attendances')
      .update({
        status: 'Denied',
        marked_by: revokedBy,
        marked_at: new Date().toISOString()
      })
      .eq('id', attendanceId);

    // Update shabbaton attendance count
    const { data: attendances } = await supabase
      .from('attendances')
      .select('*')
      .eq('shabbaton_id', attendance.shabbaton_id)
      .eq('status', 'Confirmed');

    await supabase
      .from('shabbatons')
      .update({ attendance_count: attendances?.length || 0 })
      .eq('id', attendance.shabbaton_id);
  }

  // UWS RSVP
  async getUWSRSVP(participantId: string, weekDate: Date): Promise<UWSRsvp | null> {
    // Normalize weekDate to start of Saturday (midnight) to match storage format
    const normalizedWeekDate = new Date(weekDate);
    normalizedWeekDate.setHours(0, 0, 0, 0);
    const normalizedWeekDateISO = normalizedWeekDate.toISOString();
    
    const { data, error } = await supabase
      .from('uws_rsvps')
      .select('*')
      .eq('participant_id', participantId)
      .eq('week_date', normalizedWeekDateISO)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapUWSRsvpFromDB(data);
  }

  async setUWSRSVP(participantId: string, weekDate: Date, attending: boolean): Promise<UWSRsvp> {
    // Normalize weekDate to start of Saturday (midnight) to ensure uniqueness
    const normalizedWeekDate = new Date(weekDate);
    normalizedWeekDate.setHours(0, 0, 0, 0);
    const normalizedWeekDateISO = normalizedWeekDate.toISOString();
    
    console.log('Setting UWS RSVP:', {
      participantId,
      originalWeekDate: weekDate.toISOString(),
      normalizedWeekDate: normalizedWeekDateISO,
      attending
    });

    const { data: existingRsvp } = await supabase
      .from('uws_rsvps')
      .select('*')
      .eq('participant_id', participantId)
      .eq('week_date', normalizedWeekDateISO)
      .maybeSingle();

    if (existingRsvp) {
      console.log('Updating existing RSVP:', existingRsvp.id);
      const { data, error } = await supabase
        .from('uws_rsvps')
        .update({ attending, rsvp_at: new Date().toISOString() })
        .eq('id', existingRsvp.id)
        .select()
        .single();

      if (error) throw error;
      return this.mapUWSRsvpFromDB(data);
    } else {
      console.log('Creating new RSVP');
      const rsvp = {
        participant_id: participantId,
        week_date: normalizedWeekDateISO,
        attending,
        rsvp_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('uws_rsvps')
        .insert([rsvp])
        .select()
        .single();

      if (error) {
        console.error('Error creating RSVP:', error);
        throw error;
      }
      return this.mapUWSRsvpFromDB(data);
    }
  }

  async getAllUWSRSVPs(weekDate?: Date): Promise<UWSRsvp[]> {
    console.log('getAllUWSRSVPs called with weekDate:', weekDate);
    
    // Fetch RSVPs with user information joined
    let query = supabase
      .from('uws_rsvps')
      .select(`
        *,
        users:participant_id (
          id,
          preferred_name,
          email
        )
      `)
      .order('rsvp_at', { ascending: false });

    if (weekDate) {
      // Normalize weekDate for filtering
      const normalizedWeekDate = new Date(weekDate);
      normalizedWeekDate.setHours(0, 0, 0, 0);
      const targetDateStart = normalizedWeekDate.toISOString();
      const targetDateEnd = new Date(normalizedWeekDate);
      targetDateEnd.setHours(23, 59, 59, 999);
      targetDateEnd.setMilliseconds(999);
      
      query = query
        .gte('week_date', targetDateStart)
        .lte('week_date', targetDateEnd.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching UWS RSVPs:', error);
      throw error;
    }
    
    console.log('UWS RSVPs with user data:', data);
    return (data || []).map(this.mapUWSRsvpFromDB);
  }

  async deleteUWSRSVP(rsvpId: string): Promise<void> {
    const { error } = await supabase
      .from('uws_rsvps')
      .delete()
      .eq('id', rsvpId);

    if (error) {
      console.error('Error deleting UWS RSVP:', error);
      throw error;
    }
  }

  async addUWSRSVP(participantId: string, weekDate: Date, attending: boolean): Promise<UWSRsvp> {
    // Normalize weekDate to start of Saturday (midnight) to ensure uniqueness
    const normalizedWeekDate = new Date(weekDate);
    normalizedWeekDate.setHours(0, 0, 0, 0);
    const normalizedWeekDateISO = normalizedWeekDate.toISOString();
    
    console.log('Admin adding UWS RSVP:', {
      participantId,
      weekDate: normalizedWeekDateISO,
      attending
    });

    const rsvp = {
      participant_id: participantId,
      week_date: normalizedWeekDateISO,
      attending,
      rsvp_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('uws_rsvps')
      .insert([rsvp])
      .select(`
        *,
        users:participant_id (
          id,
          preferred_name,
          email
        )
      `)
      .single();

    if (error) {
      console.error('Error adding UWS RSVP:', error);
      throw error;
    }
    
    return this.mapUWSRsvpFromDB(data);
  }

  // Payment management
  async markPayment(participantId: string, year: number, month: number, paid: boolean, markedBy: string): Promise<void> {
    const monthLog = await this.getMonthLog(participantId, year, month);
    if (!monthLog) throw new Error('Month log not found');

    const paymentStatus = paid ? 'Paid' : 
      (monthLog.isComplete && new Date() >= monthLog.computedPaymentDate ? 'Due' : 'Not due');

    const { error } = await supabase
      .from('month_logs')
      .update({
        payment_status: paymentStatus,
        payment_marked_at: new Date().toISOString(),
        payment_marked_by: markedBy
      })
      .eq('participant_id', participantId)
      .eq('year', year)
      .eq('month', month);

    if (error) throw error;
  }

  // Validation helpers
  async canApplyMakeUp(participantId: string, currentYear: number, currentMonth: number, targetYear: number, targetMonth: number): Promise<boolean> {
    const previousMonth = getPreviousMonth(currentYear, currentMonth);
    const targetMonthLog = await this.getMonthLog(participantId, targetYear, targetMonth);
    
    // Can only make up for the immediately previous month
    if (targetYear !== previousMonth.year || targetMonth !== previousMonth.month) {
      return false;
    }

    // Previous month must be incomplete
    return !targetMonthLog?.isComplete;
  }

  // Helper methods to map between database and application types
  private mapUserFromDB = (data: any): User => {
    return {
      id: data.id,
      email: data.email,
      role: data.role,
      createdAt: new Date(data.created_at),
      status: data.status,
      preferredName: data.preferred_name,
      notes: data.notes
    };
  };

  private mapUserToDB = (user: Partial<User>): any => {
    const mapped: any = {};
    if (user.id !== undefined) mapped.id = user.id;
    if (user.email !== undefined) mapped.email = user.email;
    if (user.role !== undefined) mapped.role = user.role;
    if (user.status !== undefined) mapped.status = user.status;
    if (user.preferredName !== undefined) mapped.preferred_name = user.preferredName;
    if (user.notes !== undefined) mapped.notes = user.notes;
    // created_at/updated_at are managed by the DB
    return mapped;
  };

  private mapMonthLogFromDB(data: any): MonthLog {
    return {
      participantId: data.participant_id,
      year: data.year,
      month: data.month,
      mealsRequired: data.meals_required,
      minutesRequired: data.minutes_required,
      mealsEarned: data.meals_earned,
      minutesEarned: data.minutes_earned,
      isComplete: data.is_complete,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      computedPaymentDate: new Date(data.computed_payment_date),
      paymentStatus: data.payment_status,
      paymentMarkedAt: data.payment_marked_at ? new Date(data.payment_marked_at) : undefined,
      paymentMarkedBy: data.payment_marked_by
    };
  }

  private mapMealLogFromDB(data: any): MealLog {
    return {
      id: data.id,
      participantId: data.participant_id,
      occurredAt: new Date(data.occurred_at),
      appliedYear: data.applied_year,
      appliedMonth: data.applied_month,
      type: data.type,
      notes: data.notes,
      source: data.source,
      shabbatonId: data.shabbaton_id,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      deleted: data.deleted,
      deletedReason: data.deleted_reason,
      deletedBy: data.deleted_by,
      deletedAt: data.deleted_at ? new Date(data.deleted_at) : undefined
    };
  }

  private mapMealLogToDB(mealLog: Omit<MealLog, 'id' | 'createdAt' | 'updatedAt' | 'deleted'>): any {
    return {
      participant_id: mealLog.participantId,
      occurred_at: mealLog.occurredAt.toISOString(),
      applied_year: mealLog.appliedYear,
      applied_month: mealLog.appliedMonth,
      type: mealLog.type,
      notes: mealLog.notes,
      source: mealLog.source,
      shabbaton_id: mealLog.shabbatonId,
      created_by: mealLog.createdBy
    };
  }

  private mapLearningSessionFromDB(data: any): LearningSession {
    return {
      id: data.id,
      participantId: data.participant_id,
      startedAt: new Date(data.started_at),
      minutes: data.minutes,
      notes: data.notes,
      appliedYear: data.applied_year,
      appliedMonth: data.applied_month,
      source: data.source,
      shabbatonId: data.shabbaton_id,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      deleted: data.deleted,
      deletedReason: data.deleted_reason,
      deletedBy: data.deleted_by,
      deletedAt: data.deleted_at ? new Date(data.deleted_at) : undefined
    };
  }

  private mapLearningSessionToDB(session: Omit<LearningSession, 'id' | 'createdAt' | 'updatedAt' | 'deleted'>): any {
    return {
      participant_id: session.participantId,
      started_at: session.startedAt.toISOString(),
      minutes: session.minutes,
      notes: session.notes,
      applied_year: session.appliedYear,
      applied_month: session.appliedMonth,
      source: session.source,
      shabbaton_id: session.shabbatonId,
      created_by: session.createdBy
    };
  }

  private mapShabbatonFromDB(data: any): Shabbaton {
    return {
      id: data.id,
      title: data.title,
      date: new Date(data.date),
      defaultCredits: data.default_credits,
      attendanceCount: data.attendance_count
    };
  }

  private mapAttendanceFromDB(data: any): Attendance {
    return {
      id: data.id,
      participantId: data.participant_id,
      shabbatonId: data.shabbaton_id,
      appliedYear: data.applied_year,
      appliedMonth: data.applied_month,
      grantedMeals: data.granted_meals,
      grantedMinutes: data.granted_minutes,
      status: data.status,
      markedBy: data.marked_by,
      markedAt: data.marked_at ? new Date(data.marked_at) : undefined,
      createdAt: new Date(data.created_at)
    };
  }

  private mapUWSRsvpFromDB(data: any): UWSRsvp {
    return {
      id: data.id,
      participantId: data.participant_id,
      weekDate: new Date(data.week_date),
      attending: data.attending,
      rsvpAt: new Date(data.rsvp_at),
      user: data.users ? {
        id: data.users.id,
        preferredName: data.users.preferred_name,
        email: data.users.email
      } : undefined
    };
  }
}

export const supabaseDataService = new SupabaseDataService();
