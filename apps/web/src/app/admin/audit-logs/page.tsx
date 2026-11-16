'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import EmptyState from '@/components/EmptyState';
import { adminService } from '@/services/admin';
import {
  Activity,
  Clock3,
  FileText,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react';

type AuditLog = Awaited<
  ReturnType<typeof adminService.listAuditLogs>
>[number];

function formatDate(value: unknown) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return 'Unknown';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function getActionTone(action: unknown) {
  const value = typeof action === 'string' ? action.toUpperCase() : '';

  if (
    value.includes('DELETE') ||
    value.includes('REJECT') ||
    value.includes('REFUND') ||
    value.includes('SUSPEND')
  ) {
    return 'border-[#D96B6B]/20 bg-[#D96B6B]/[0.06] text-[#D96B6B]';
  }

  if (
    value.includes('CREATE') ||
    value.includes('APPROVE') ||
    value.includes('PUBLISH') ||
    value.includes('GRANT')
  ) {
    return 'border-[#7FBF9A]/20 bg-[#7FBF9A]/[0.06] text-[#7FBF9A]';
  }

  return 'border-[#D6B47A]/20 bg-[#D6B47A]/[0.06] text-[#D6B47A]';
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadLogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const data = await adminService.listAuditLogs();
      setLogs(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load the audit trail.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return logs;
    }

    return logs.filter((log) => {
      const action =
        typeof log.action === 'string' ? log.action.toLowerCase() : '';

      const actor =
        typeof log.actor_email === 'string'
          ? log.actor_email.toLowerCase()
          : '';

      const entity =
        typeof log.entity === 'string'
          ? log.entity.toLowerCase()
          : '';

      return (
        action.includes(query) ||
        actor.includes(query) ||
        entity.includes(query)
      );
    });
  }, [logs, search]);

  const actionCount = useMemo(
    () => new Set(logs.map((log) => log.action)).size,
    [logs],
  );

  const actorCount = useMemo(
    () =>
      new Set(
        logs
          .map((log) => log.actor_email)
          .filter(
            (email): email is string =>
              typeof email === 'string' && email.length > 0,
          ),
      ).size,
    [logs],
  );

  const latestLog = logs[0];

  return (
    <DashboardLayout
      role="admin"
      title="Audit & Security Trail"
      subtitle="Chronological record of privileged administrative actions across the platform"
    >
      <div className="space-y-6">
        {/* Overview */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<FileText className="h-4 w-4" />}
            label="Recorded Actions"
            value={logs.length.toLocaleString('en-IN')}
          />

          <MetricCard
            icon={<Activity className="h-4 w-4" />}
            label="Action Types"
            value={actionCount.toLocaleString('en-IN')}
          />

          <MetricCard
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Recorded Actors"
            value={actorCount.toLocaleString('en-IN')}
          />

          <MetricCard
            icon={<Clock3 className="h-4 w-4" />}
            label="Latest Activity"
            value={latestLog ? formatDate(latestLog.created_at) : '—'}
            compactValue
          />
        </div>

        {/* Controls */}
        <section className="rounded-2xl border border-white/[0.07] bg-[#0a0a0a]">
          <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#D6B47A]">
                Platform Governance
              </p>

              <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#F5F5F2]">
                Administrative activity
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77736C]" />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search actions, actors..."
                  className="w-full rounded-xl border border-white/[0.08] bg-[#111111] py-2.5 pl-10 pr-4 text-xs text-[#F5F5F2] outline-none placeholder:text-[#55524D] transition focus:border-[#D6B47A]/40 sm:w-64"
                />
              </div>

              <button
                type="button"
                onClick={() => void loadLogs(true)}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[#111111] px-4 py-2.5 text-xs font-medium text-[#A7A39B] transition hover:border-[#D6B47A]/30 hover:text-[#F5F5F2] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    refreshing ? 'animate-spin' : ''
                  }`}
                />

                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="m-5 rounded-xl border border-[#D96B6B]/20 bg-[#D96B6B]/[0.05] px-4 py-3 text-xs text-[#D96B6B]">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid gap-3 p-5">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-xl bg-[#111111]"
                />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No Audit Records"
                description="No administrative audit records are currently available from the platform audit service."
              />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-10 text-center">
              <Search className="mx-auto h-5 w-5 text-[#55524D]" />

              <p className="mt-3 text-sm font-medium text-[#F5F5F2]">
                No matching audit records
              </p>

              <p className="mt-1 text-xs text-[#77736C]">
                Try another action, actor, or entity.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-[0.14em] text-[#55524D]">
                      <th className="px-5 py-4 font-medium">Timestamp</th>
                      <th className="px-5 py-4 font-medium">Action</th>
                      <th className="px-5 py-4 font-medium">Actor</th>
                      <th className="px-5 py-4 font-medium">Target</th>
                      <th className="px-5 py-4 font-medium">Client</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/[0.045]">
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="transition hover:bg-white/[0.018]"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-xs text-[#77736C]">
                          {formatDate(log.created_at)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-lg border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide ${getActionTone(
                              log.action,
                            )}`}
                          >
                            {log.action || 'UNKNOWN'}
                          </span>
                        </td>

                        <td className="max-w-[220px] px-5 py-4">
                          <p className="truncate text-xs font-medium text-[#F5F5F2]">
                            {log.actor_email || 'System'}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-mono text-[11px] text-[#A7A39B]">
                            {log.entity || '—'}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-mono text-[11px] text-[#55524D]">
                            {log.ip_address || 'Not recorded'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y divide-white/[0.045] lg:hidden">
                {filteredLogs.map((log) => (
                  <article key={log.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <span
                        className={`inline-flex rounded-lg border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide ${getActionTone(
                          log.action,
                        )}`}
                      >
                        {log.action || 'UNKNOWN'}
                      </span>

                      <span className="text-right text-[10px] text-[#55524D]">
                        {formatDate(log.created_at)}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3">
                      <InfoRow
                        label="Actor"
                        value={log.actor_email || 'System'}
                      />

                      <InfoRow
                        label="Target"
                        value={log.entity || 'Not specified'}
                        mono
                      />

                      <InfoRow
                        label="Client"
                        value={log.ip_address || 'Not recorded'}
                        mono
                      />
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {!loading && logs.length > 0 && (
            <div className="border-t border-white/[0.06] px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#55524D]">
                Showing {filteredLogs.length.toLocaleString('en-IN')} of{' '}
                {logs.length.toLocaleString('en-IN')} records
              </p>
            </div>
          )}
        </section>

        <div className="flex items-center gap-2 text-[10px] text-[#55524D]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#D6B47A]" />
          <span>
            Audit data shown here is sourced from the platform audit service.
          </span>
        </div>
      </div>
    </DashboardLayout>
  );
}

function MetricCard({
  icon,
  label,
  value,
  compactValue = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  compactValue?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0a0a0a] p-5">
      <div className="flex items-center gap-2 text-[#D6B47A]">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
          {label}
        </span>
      </div>

      <p
        className={`mt-4 font-semibold tracking-tight text-[#F5F5F2] ${
          compactValue ? 'text-sm' : 'text-2xl'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[10px] uppercase tracking-[0.12em] text-[#55524D]">
        {label}
      </span>

      <span
        className={`max-w-[65%] text-right text-xs text-[#A7A39B] ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}