import { api } from "../../../../convex/_generated/api";
import { authedClient, isConvexConfigured } from "@/lib/convex";

export const adminService = {
  async getDashboardStats() {
    if (!isConvexConfigured) {
      return {
        totalRevenuePaise: 0,
        totalBookings: 0,
        totalEvents: 0,
        totalCheckins: 0,
        pendingReviews: 0,
      };
    }
    const counts = await (await authedClient()).query(api.events.adminDashboardCounts, {}) as any;
    const events = await (await authedClient()).query(api.events.adminListEvents, {}) as unknown as any[];
    const pendingReviews = events.filter((e) => e.status === "SUBMITTED_FOR_REVIEW").length;
    const confirmedBookings = (
      await (await authedClient()).query(api.staff.listOrganizerBookings, {})
    ).filter((b: any) => b.status === "CONFIRMED");

    return {
      totalRevenuePaise: confirmedBookings.reduce((s, b) => s + (Number(b.totalAmountMinor) || 0), 0),
      totalBookings: counts.confirmedBookings + counts.bookings - confirmedBookings.length, // all bookings
      totalEvents: counts.events,
      totalCheckins: counts.checkIns,
      pendingReviews,
    };
  },

  async getReportMetrics() {
    const stats = await this.getDashboardStats();
    if (!isConvexConfigured) {
      return {
        ...stats,
        conversionRate: null as number | null,
        attendanceRate: null as number | null,
        confirmedBookings: 0,
        issuedTickets: 0,
        successfulCheckins: 0,
      };
    }
    const counts = await (await authedClient()).query(api.events.adminDashboardCounts, {}) as any;
    const confirmedBookings = counts.confirmedBookings;
    const issuedTickets = counts.tickets;
    const successfulCheckins = counts.checkIns;
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
    if (!isConvexConfigured) return [];
    const data = await (await authedClient()).query(api.staff.adminListOrganizers, {});
    return (data as any[]) || [];
  },

  async listUsers() {
    if (!isConvexConfigured) return [];
    const data = await (await authedClient()).query(api.staff.adminListUsers, {});
    return (data as any[]) || [];
  },

  async listAuditLogs() {
    if (!isConvexConfigured) return [];
    const data = await (await authedClient()).query(api.staff.adminListAuditLogs, {});
    return (data as any[]) || [];
  },
};
