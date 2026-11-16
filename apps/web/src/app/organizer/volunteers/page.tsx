'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  Mail,
  Plus,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  UserCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';

import DashboardLayout from '@/components/DashboardLayout';
import EmptyState from '@/components/EmptyState';
import { organizerService } from '@/services/organizer';
import { eventService } from '@/services/events';

type InvitationStatus =
  | 'PENDING'
  | 'SENT'
  | 'ACCEPTED'
  | 'EXPIRED'
  | 'REVOKED';

type Invitation = {
  id: string;
  event_id: string;
  email: string;
  role: string;
  status: InvitationStatus;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  event?: {
    name: string;
  };
};

type Volunteer = {
  id: string;
  user_id: string;
  role: string;
  event?: {
    name: string;
  };
};

type OrganizerEvent = {
  id: string;
  name: string;
};

const STATUS_STYLE: Record<InvitationStatus, string> = {
  PENDING:
    'border-[#D6B47A]/30 bg-[#D6B47A]/[0.08] text-[#D6B47A]',
  SENT:
    'border-white/10 bg-white/[0.04] text-white/55',
  ACCEPTED:
    'border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300',
  EXPIRED:
    'border-white/10 bg-white/[0.03] text-white/35',
  REVOKED:
    'border-red-500/20 bg-red-500/[0.06] text-red-300',
};

export default function VolunteersPage() {
  const [showInviteModal, setShowInviteModal] = useState(false);

  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [events, setEvents] = useState<OrganizerEvent[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inviteEvent, setInviteEvent] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<
    'VOLUNTEER' | 'SCANNER' | 'EVENT_MANAGER'
  >('VOLUNTEER');

  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);

      const [vols, invites, evts] = await Promise.all([
        organizerService.listVolunteers(),
        organizerService.listInvitations(),
        eventService.listOrganizerEvents(),
      ]);

      setVolunteers(vols as Volunteer[]);
      setInvitations(invites as Invitation[]);
      setEvents(
        evts.map((event) => ({
          id: event.id,
          name: event.name,
        })),
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to load volunteers.';

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleInvite() {
    setInviteError(null);

    if (!inviteEvent) {
      setInviteError('Choose an event.');
      return;
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inviteEmail)) {
      setInviteError('Enter a valid email address.');
      return;
    }

    setInviting(true);

    try {
      await organizerService.inviteVolunteer(
        inviteEvent,
        inviteEmail.trim(),
        inviteRole,
      );

      setShowInviteModal(false);
      setInviteEmail('');
      setInviteEvent('');
      setInviteRole('VOLUNTEER');

      await load();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Could not create the invitation.';

      setInviteError(message);
    } finally {
      setInviting(false);
    }
  }

  async function handleResend(id: string) {
    try {
      setError(null);
      await organizerService.resendInvitation(id);
      await load();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Could not resend the invitation.';

      setError(message);
    }
  }

  async function handleRevoke(id: string) {
    try {
      setError(null);
      await organizerService.revokeInvitation(id);
      await load();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Could not revoke the invitation.';

      setError(message);
    }
  }

  const pendingInvites = useMemo(
    () => invitations.filter((invitation) => invitation.status !== 'ACCEPTED'),
    [invitations],
  );

  const acceptedInvites = useMemo(
    () =>
      invitations.filter(
        (invitation) => invitation.status === 'ACCEPTED',
      ),
    [invitations],
  );

  const activeAssignments = volunteers.length + acceptedInvites.length;

  const pendingCount = invitations.filter(
    (invitation) =>
      invitation.status === 'PENDING' ||
      invitation.status === 'SENT',
  ).length;

  return (
    <DashboardLayout
      role="organizer"
      title="Volunteer Management"
      subtitle="Manage event staff, scanner access, and volunteer invitations."
      actions={
        <button
          type="button"
          onClick={() => {
            setInviteError(null);
            setShowInviteModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-[#D6B47A] px-4 py-2.5 text-xs font-semibold text-[#050505] shadow-[0_8px_30px_rgba(214,180,122,0.12)] transition hover:bg-[#E1C58F]"
        >
          <Plus className="h-4 w-4" />
          Invite Volunteer
        </button>
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />

            <p className="text-xs leading-5 text-red-200">
              {error}
            </p>
          </div>
        )}

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            icon={<Users className="h-4 w-4" />}
            label="Active Assignments"
            value={activeAssignments.toLocaleString('en-IN')}
          />

          <MetricCard
            icon={<Clock3 className="h-4 w-4" />}
            label="Pending Invitations"
            value={pendingCount.toLocaleString('en-IN')}
          />

          <MetricCard
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Accepted Invitations"
            value={acceptedInvites.length.toLocaleString('en-IN')}
            valueClass="text-emerald-300"
          />
        </div>

        {/* ACTIVATION INFO */}
        <section className="rounded-2xl border border-white/[0.08] bg-[#080808] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D6B47A]/20 bg-[#D6B47A]/[0.06]">
              <Smartphone className="h-4 w-4 text-[#D6B47A]" />
            </div>

            <div>
              <p className="text-sm font-semibold text-white">
                Mobile activation
              </p>

              <p className="mt-1 max-w-3xl text-xs leading-5 text-white/40">
                Volunteers activate their assignment by signing in to
                the CtrlPass mobile app with the invited email. Email
                delivery is not configured yet, so assignments can be
                shared directly for now.
              </p>
            </div>
          </div>
        </section>

        {/* INVITATIONS */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#D6B47A]">
                Access management
              </p>

              <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">
                Invitations
              </h2>
            </div>

            <span className="text-xs text-white/25">
              {invitations.length} total
            </span>
          </div>

          {pendingInvites.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#080808] p-8 text-center">
              <Mail className="mx-auto h-5 w-5 text-white/20" />

              <p className="mt-3 text-xs font-medium text-white/45">
                No pending invitations
              </p>

              <p className="mt-1 text-[11px] text-white/25">
                New volunteer invitations will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingInvites.map((invitation) => (
                <div
                  key={invitation.id}
                  className="rounded-2xl border border-white/[0.08] bg-[#080808] p-5 transition hover:border-white/[0.13]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                          <Mail className="h-4 w-4 text-white/40" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white/80">
                            {invitation.email}
                          </p>

                          <p className="mt-1 text-[11px] text-white/30">
                            {invitation.event?.name ?? 'Event'}
                            {' · '}
                            {formatRole(invitation.role)}
                          </p>
                        </div>
                      </div>

                      <p className="mt-4 text-[10px] text-white/25">
                        Expires{' '}
                        {formatDate(invitation.expires_at)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${STATUS_STYLE[invitation.status]}`}
                      >
                        {invitation.status}
                      </span>

                      {invitation.status !== 'REVOKED' && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              void handleResend(invitation.id)
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/55 transition hover:bg-white/[0.04] hover:text-white"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Resend
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void handleRevoke(invitation.id)
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 px-3 py-1.5 text-[11px] font-semibold text-red-300 transition hover:bg-red-500/[0.06]"
                          >
                            <XCircle className="h-3 w-3" />
                            Revoke
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ACTIVE VOLUNTEERS */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#D6B47A]">
                Event operations
              </p>

              <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">
                Active Volunteers
              </h2>
            </div>

            <span className="text-xs text-white/25">
              {activeAssignments} active
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-36 animate-pulse rounded-2xl border border-white/[0.06] bg-[#080808]"
                />
              ))}
            </div>
          ) : volunteers.length === 0 &&
            acceptedInvites.length === 0 ? (
            <EmptyState
              title="No Volunteers Assigned"
              description="Invite volunteers or gate staff to an event. They activate the assignment by signing in to the mobile app with the invited email."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {volunteers.map((volunteer) => (
                <div
                  key={volunteer.id}
                  className="rounded-2xl border border-white/[0.08] bg-[#080808] p-5 transition hover:border-white/[0.13]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6B47A]/20 bg-[#D6B47A]/[0.06]">
                      <UserCheck className="h-4 w-4 text-[#D6B47A]" />
                    </div>

                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                      ACTIVE
                    </span>
                  </div>

                  <p className="mt-5 text-sm font-semibold text-white/80">
                    {formatRole(volunteer.role)}
                  </p>

                  <p className="mt-1 text-xs text-white/35">
                    {volunteer.event?.name ?? 'Event'}
                  </p>

                  <p className="mt-4 truncate font-mono text-[10px] text-white/20">
                    {volunteer.user_id}
                  </p>
                </div>
              ))}

              {acceptedInvites.map((invitation) => (
                <div
                  key={invitation.id}
                  className="rounded-2xl border border-white/[0.08] bg-[#080808] p-5 transition hover:border-white/[0.13]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06]">
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    </div>

                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                      ACCEPTED
                    </span>
                  </div>

                  <p className="mt-5 text-sm font-semibold text-white/80">
                    {formatRole(invitation.role)}
                  </p>

                  <p className="mt-1 text-xs text-white/35">
                    {invitation.event?.name ?? 'Event'}
                  </p>

                  <p className="mt-4 truncate text-[11px] text-white/30">
                    {invitation.email}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* INVITE MODAL */}
      {showInviteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setShowInviteModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0B0B] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#D6B47A]">
                  Staff access
                </p>

                <h3 className="mt-1 text-lg font-semibold text-white">
                  Invite Volunteer
                </h3>

                <p className="mt-1 text-xs text-white/30">
                  Assign event access to a staff member.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/[0.05] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="invite-event"
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/40"
                >
                  Event
                </label>

                <select
                  id="invite-event"
                  value={inviteEvent}
                  onChange={(event) =>
                    setInviteEvent(event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#050505] px-3 py-3 text-xs text-white outline-none transition focus:border-[#D6B47A]/50"
                >
                  <option value="">Select an event...</option>

                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="invite-email"
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/40"
                >
                  Volunteer email
                </label>

                <input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(event) =>
                    setInviteEmail(event.target.value)
                  }
                  placeholder="volunteer@example.com"
                  className="w-full rounded-xl border border-white/10 bg-[#050505] px-3 py-3 text-xs text-white outline-none transition placeholder:text-white/20 focus:border-[#D6B47A]/50"
                />
              </div>

              <div>
                <label
                  htmlFor="invite-role"
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/40"
                >
                  Role
                </label>

                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(event) =>
                    setInviteRole(
                      event.target.value as typeof inviteRole,
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#050505] px-3 py-3 text-xs text-white outline-none transition focus:border-[#D6B47A]/50"
                >
                  <option value="VOLUNTEER">Volunteer</option>
                  <option value="SCANNER">Scanner</option>
                  <option value="EVENT_MANAGER">
                    Event Manager
                  </option>
                </select>
              </div>

              {inviteError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3">
                  <p className="text-xs text-red-300">
                    {inviteError}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => void handleInvite()}
                  disabled={inviting}
                  className="flex-1 rounded-xl bg-[#D6B47A] px-4 py-3 text-xs font-semibold text-[#050505] transition hover:bg-[#E1C58F] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {inviting
                    ? 'Creating...'
                    : 'Create Invitation'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="rounded-xl border border-white/10 px-4 py-3 text-xs font-semibold text-white/60 transition hover:bg-white/[0.04] hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function MetricCard({
  icon,
  label,
  value,
  valueClass = 'text-white',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#080808] p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[#D6B47A]">
          {icon}
        </div>

        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/20">
          Live
        </span>
      </div>

      <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
        {label}
      </p>

      <p
        className={`mt-1 text-2xl font-semibold tracking-tight ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

function formatRole(role: string): string {
  return role
    .toLowerCase()
    .split('_')
    .map(
      (part) => part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(' ');
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}