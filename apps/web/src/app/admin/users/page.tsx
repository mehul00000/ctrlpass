'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import EmptyState from '@/components/EmptyState';
import { adminService } from '@/services/admin';
import {
  Search,
  Users,
  UserCheck,
  Shield,
  RefreshCw,
  UserRound,
} from 'lucide-react';

type UserRecord = {
  id: string;
  email?: string | null;
  status?: string | null;
  created_at: string;
  profile?: {
    full_name?: string | null;
  } | null;
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: typeof Users;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
            {label}
          </p>

          <p
            className={`mt-3 text-2xl font-semibold tracking-tight ${
              accent ? 'text-[#D6B47A]' : 'text-[#F5F5F2]'
            }`}
          >
            {value}
          </p>

          <p className="mt-1.5 text-xs text-[#77736C]">
            {description}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
            accent
              ? 'border-[#D6B47A]/20 bg-[#D6B47A]/10 text-[#D6B47A]'
              : 'border-white/[0.07] bg-[#111111] text-[#A7A39B]'
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadUsers() {
    try {
      setLoading(true);
      setError(null);

      const data = await adminService.listUsers();

      const normalized: UserRecord[] = data.map((item) => {
        const record = item as {
          id: string;
          email?: string | null;
          status?: string | null;
          created_at: string;
          profile?: {
            full_name?: string | null;
          } | null;
        };

        return {
          id: record.id,
          email: record.email,
          status: record.status,
          created_at: record.created_at,
          profile: record.profile ?? null,
        };
      });

      setUsers(normalized);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load user accounts.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) => {
      const email = user.email?.toLowerCase() ?? '';
      const name = user.profile?.full_name?.toLowerCase() ?? '';

      return email.includes(query) || name.includes(query);
    });
  }, [users, search]);

  const metrics = useMemo(() => {
    const active = users.filter(
      (user) => (user.status || 'ACTIVE').toLowerCase() === 'active',
    ).length;

    const named = users.filter(
      (user) => Boolean(user.profile?.full_name?.trim()),
    ).length;

    return {
      total: users.length,
      active,
      named,
    };
  }, [users]);

  return (
    <DashboardLayout
      role="admin"
      title="User Accounts"
      subtitle="Platform-wide identity records and account activity."
      actions={
        <button
          type="button"
          onClick={() => void loadUsers()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#D6B47A]/25 bg-[#D6B47A]/10 px-4 py-2.5 text-xs font-semibold text-[#D6B47A] transition hover:bg-[#D6B47A]/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
          />
          Refresh
        </button>
      }
    >
      <div className="space-y-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            label="Total Users"
            value={metrics.total}
            description="Accounts returned by the admin service"
            icon={Users}
            accent
          />

          <MetricCard
            label="Active Accounts"
            value={metrics.active}
            description="Users currently marked active"
            icon={UserCheck}
          />

          <MetricCard
            label="Named Profiles"
            value={metrics.named}
            description="Accounts with a profile name"
            icon={UserRound}
          />
        </section>

        <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b]">
          <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#D6B47A]" />

                <h2 className="text-sm font-semibold text-[#F5F5F2]">
                  Identity Directory
                </h2>
              </div>

              <p className="mt-1 text-xs text-[#77736C]">
                Search registered platform accounts by name or email.
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#77736C]" />

              <input
                type="text"
                placeholder="Search name or email..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-[#111111] py-2.5 pl-10 pr-4 text-xs text-[#F5F5F2] outline-none placeholder:text-[#77736C] transition focus:border-[#D6B47A]/40"
              />
            </div>
          </div>

          {error && (
            <div className="mx-5 mt-5 rounded-xl border border-[#D96B6B]/20 bg-[#D96B6B]/5 px-4 py-3 text-xs text-[#D96B6B]">
              {error}
            </div>
          )}

          {loading ? (
            <div className="px-6 py-16 text-center">
              <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#D6B47A]" />

              <p className="mt-4 text-sm font-medium text-[#F5F5F2]">
                Loading user accounts
              </p>

              <p className="mt-1 text-xs text-[#77736C]">
                Fetching the latest identity records...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title={search ? 'No Matching Users' : 'No Users Registered'}
                description={
                  search
                    ? 'Try another name or email search.'
                    : 'No user records are currently available from the admin service.'
                }
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                        User
                      </th>

                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                        Email
                      </th>

                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                        Status
                      </th>

                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                        User ID
                      </th>

                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                        Joined
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((user) => {
                      const status = user.status || 'ACTIVE';
                      const name =
                        user.profile?.full_name?.trim() || 'Anonymous User';

                      return (
                        <tr
                          key={user.id}
                          className="border-b border-white/[0.045] transition hover:bg-white/[0.018]"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-[#111111] text-[#D6B47A]">
                                <UserRound className="h-4 w-4" />
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-[#F5F5F2]">
                                  {name}
                                </p>

                                <p className="mt-0.5 text-[10px] text-[#77736C]">
                                  Platform account
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-xs text-[#A7A39B]">
                            {user.email || '—'}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                                status.toLowerCase() === 'active'
                                  ? 'border-[#7FBF9A]/20 bg-[#7FBF9A]/10 text-[#7FBF9A]'
                                  : 'border-white/[0.08] bg-[#111111] text-[#A7A39B]'
                              }`}
                            >
                              {status}
                            </span>
                          </td>

                          <td className="px-5 py-4 font-mono text-[11px] text-[#77736C]">
                            {user.id.slice(0, 8)}...
                          </td>

                          <td className="px-5 py-4 text-xs text-[#77736C]">
                            {formatDate(user.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-white/[0.06] px-5 py-3">
                <p className="text-[11px] text-[#77736C]">
                  Showing{' '}
                  <span className="text-[#A7A39B]">
                    {filtered.length.toLocaleString('en-IN')}
                  </span>{' '}
                  of{' '}
                  <span className="text-[#A7A39B]">
                    {users.length.toLocaleString('en-IN')}
                  </span>{' '}
                  user accounts.
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}