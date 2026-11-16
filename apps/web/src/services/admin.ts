import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const adminService = {
  async getDashboardStats() {
    if (!isSupabaseConfigured) {
      return {
        totalRevenuePaise: 0,
        totalBookings: 0,
        totalEvents: 0,
        totalCheckins: 0,
        pendingReviews: 0,
      };
    }

    const [eventsRes, bookingsRes, checkinsRes, reviewRes] = await Promise.all([
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id, total_amount_minor', { count: 'exact' }).eq('status', 'CONFIRMED'),
      supabase.from('check_ins').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'SUBMITTED_FOR_REVIEW'),
    ]);

    const totalRevenuePaise = (bookingsRes.data || []).reduce(
      (sum, b) => sum + (Number(b.total_amount_minor) || 0),
      0
    );

    return {
      totalRevenuePaise,
      totalBookings: bookingsRes.count || 0,
      totalEvents: eventsRes.count || 0,
      totalCheckins: checkinsRes.count || 0,
      pendingReviews: reviewRes.count || 0,
    };
  },

  async getReportMetrics() {
    const stats = await this.getDashboardStats();
    if (!isSupabaseConfigured) {
      return {
        ...stats,
        conversionRate: null as number | null,
        attendanceRate: null as number | null,
        confirmedBookings: 0,
        issuedTickets: 0,
        successfulCheckins: 0,
      };
    }

    const [confirmedRes, ticketsRes, successCheckins] = await Promise.all([
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'CONFIRMED'),
      supabase.from('tickets').select('id', { count: 'exact', head: true }),
      supabase.from('check_ins').select('id', { count: 'exact', head: true }).eq('result', 'SUCCESS'),
    ]);

    const confirmedBookings = confirmedRes.count || 0;
    const issuedTickets = ticketsRes.count || 0;
    const successfulCheckins = successCheckins.count || 0;
    const conversionRate =
      stats.totalBookings > 0 ? (confirmedBookings / stats.totalBookings) * 100 : null;
    const attendanceRate =
      issuedTickets > 0 ? (successfulCheckins / issuedTickets) * 100 : null;

    return {
      ...stats,
      conversionRate,
      attendanceRate,
      confirmedBookings,
      issuedTickets,
      successfulCheckins,
    };
  },

  async listOrganizers() {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('organizers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async listUsers() {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('app_users')
      .select('*, profile:profiles(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async listAuditLogs() {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  },
};
