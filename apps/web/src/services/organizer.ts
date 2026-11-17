import { api } from "../../../../convex/_generated/api";
import { authedClient, isConvexConfigured, snakeize } from "@/lib/convex";
import type { TicketType } from "@ctrlpass/types";

export type OrganizerRecord = {
  id: string;
  name: string;
  email: string | null;
  city: string | null;
  verification_status: string;
  status: string;
};

function requireConfigured() {
  if (!isConvexConfigured) {
    throw new Error("Convex is not configured. Set NEXT_PUBLIC_CONVEX_URL to continue.");
  }
}

function toOrganizerRecord(org: any): OrganizerRecord {
  const s = snakeize<any>(org);
  return {
    id: s.id,
    name: s.name,
    email: s.email ?? null,
    city: s.city ?? null,
    verification_status: s.verification_status,
    status: s.status,
  };
}

export const organizerService = {
  async bootstrapMyOrganizer(name: string): Promise<OrganizerRecord> {
    requireConfigured();
    const client = await authedClient();
    const orgId = (await client.mutation(api.organizers.bootstrapMyOrganizer, {
      name,
    } as any)) as unknown as string;
    const mine = await client.query(api.organizers.listMyOrganizers, {});
    const found = (mine as any[]).find((m) => m.organizer.id === orgId);
    if (!found) throw new Error("Organizer bootstrap failed.");
    return toOrganizerRecord(found.organizer);
  },

  async getMyOrganizer(): Promise<OrganizerRecord | null> {
    requireConfigured();
    const mine = await (await authedClient()).query(api.organizers.listMyOrganizers, {});
    const active = (mine as any[])[0];
    if (!active) return null;
    return toOrganizerRecord(active.organizer);
  },

  async updateMyOrganizer(
    id: string,
    updates: { name: string; email: string; city: string },
  ): Promise<OrganizerRecord> {
    requireConfigured();
    (await authedClient()).mutation(api.organizers.updateOrganizer, {
      organizerId: id,
      name: updates.name,
      email: updates.email,
      city: updates.city,
    } as any);
    const mine = await (await authedClient()).query(api.organizers.listMyOrganizers, {});
    const found = (mine as any[]).find((m) => m.organizer.id === id);
    if (!found) throw new Error("Organizer not found after update.");
    return toOrganizerRecord(found.organizer);
  },

  async listVolunteers(eventId?: string) {
    requireConfigured();
    const data = await (await authedClient()).query(api.staff.listVolunteers, {
      eventId,
    } as any);
    return snakeize<any[]>(data) ?? [];
  },

  // ── Volunteer invitations ────────────────────────────────────────────
  // No email provider is wired — invitations are recorded and the volunteer
  // activates them by signing in with the invited email (accept_my_invitations).

  async listInvitations(eventId?: string) {
    requireConfigured();
    const data = await (await authedClient()).query(api.staff.listAllInvitations, {
      eventId,
    } as any);
    return snakeize<any[]>(data) ?? [];
  },

  async inviteVolunteer(
    eventId: string,
    email: string,
    role: "VOLUNTEER" | "SCANNER" | "EVENT_MANAGER",
  ) {
    requireConfigured();
    const data = await (await authedClient()).mutation(api.volunteers.inviteVolunteer, {
      eventId,
      email: email.trim().toLowerCase(),
      role,
    } as any);
    return snakeize(data);
  },

  async resendInvitation(invitationId: string) {
    requireConfigured();
    (await authedClient()).mutation(api.volunteers.resendVolunteerInvitation, {
      invitationId,
    } as any);
  },

  async revokeInvitation(invitationId: string) {
    requireConfigured();
    (await authedClient()).mutation(api.volunteers.revokeVolunteerInvitation, {
      invitationId,
    } as any);
  },

  async upsertVolunteer(eventId: string, userId: string, role: "VOLUNTEER" | "SCANNER" = "SCANNER") {
    requireConfigured();
    // Direct upsert is admin-only; invitations are the normal path.
    const me = await (await authedClient()).query(api.users.me, {});
    if (!(me as any).roles?.some((r: any) => r.role === "ADMIN")) {
      throw new Error(
        "Only admins can add volunteers directly. Use the invitation flow instead.",
      );
    }
    throw new Error("Direct member upsert moved to admin role management.");
  },

  async listTicketTypes(eventId: string): Promise<TicketType[]> {
    requireConfigured();
    const data = await (await authedClient()).query(api.ticketTypes.listForEventStaff, {
      eventId,
    } as any);
    return (snakeize<TicketType[]>(data) ?? []) as unknown as TicketType[];
  },

  async createTicketType(eventId: string, payload: Partial<TicketType>) {
    requireConfigured();
    const data = await (await authedClient()).mutation(api.ticketTypes.create, {
      eventId,
      name: (payload as any).name || "General",
      priceMinor: (payload as any).price_minor ?? 0,
      quantity: (payload as any).quantity ?? 0,
      minPerBooking: (payload as any).min_per_booking,
      maxPerBooking: (payload as any).max_per_booking,
      salesStartAt: (payload as any).sales_start_at
        ? new Date((payload as any).sales_start_at).getTime()
        : undefined,
      salesEndAt: (payload as any).sales_end_at
        ? new Date((payload as any).sales_end_at).getTime()
        : undefined,
      visibility: (payload as any).visibility === "HIDDEN" ? "HIDDEN" : "VISIBLE",
    } as any);
    return snakeize(data) as unknown as TicketType;
  },

  async updateTicketType(id: string, updates: Partial<TicketType>) {
    requireConfigured();
    const data = await (await authedClient()).mutation(api.ticketTypes.update, {
      ticketTypeId: id,
      name: updates.name,
      description: (updates as any).description,
      priceMinor: (updates as any).price_minor,
      quantity: (updates as any).quantity,
      minPerBooking: (updates as any).min_per_booking,
      maxPerBooking: (updates as any).max_per_booking,
      salesStartAt: (updates as any).sales_start_at
        ? new Date((updates as any).sales_start_at).getTime()
        : undefined,
      salesEndAt: (updates as any).sales_end_at
        ? new Date((updates as any).sales_end_at).getTime()
        : undefined,
      visibility: (updates as any).visibility as any,
      status: (updates as any).status as any,
    } as any);
    return snakeize(data) as unknown as TicketType;
  },

  async disableTicketType(id: string) {
    return this.updateTicketType(id, { status: "DISABLED" } as Partial<TicketType>);
  },

  async getFinanceAggregates() {
    requireConfigured();
    return (await (await authedClient()).query(api.staff.getFinanceAggregates, {})) as {
      grossMinor: number;
      feesMinor: number;
      netMinor: number;
      confirmedBookings: number;
      successfulPayments: number;
      paymentsMinor: number;
    };
  },

  async dispatchAnnouncement(eventId: string, title: string, body: string) {
    requireConfigured();
    return await (await authedClient()).mutation(api.staff.announceToEventAttendees, {
      eventId,
      title,
      body,
    } as any) as { recipientCount: number };
  },
};
