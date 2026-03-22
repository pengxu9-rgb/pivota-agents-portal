'use client';

import Link from 'next/link';
import { BookOpen, Globe2, RadioTower, Webhook } from 'lucide-react';
import PageHeader from '@/components/portal/PageHeader';
import SectionHeader from '@/components/portal/SectionHeader';
import StatusBadge from '@/components/portal/StatusBadge';
import SurfaceCard from '@/components/portal/SurfaceCard';
import { developerChannels } from '@/lib/developer-channels';

const statusToneMap = {
  partner_access: 'warning',
  beta: 'warning',
  planned: 'neutral',
} as const;

export default function ChannelsPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title="Channels & Standards"
        description="External distribution standards and partner-facing integration channels supported by Pivota."
        badge={<StatusBadge tone="production">Production</StatusBadge>}
        meta={<StatusBadge tone="neutral">{developerChannels.length} channel standard</StatusBadge>}
        actions={
          <Link
            href="/docs?tab=channels"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-3 py-2 text-sm font-medium text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)]"
          >
            <BookOpen className="h-4 w-4" />
            <span>Open standards docs</span>
          </Link>
        }
      />

      <div className="space-y-6 px-6 py-6">
        <SurfaceCard className="p-5">
          <SectionHeader
            title="Channel standards"
            description="These capabilities describe external channel alignment. They are not direct API endpoints and they do not replace core API or webhook integration."
          />

          <div className="mt-5 grid gap-4">
            {developerChannels.map((channel) => (
              <div
                key={channel.id}
                className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-[var(--portal-fg)]">{channel.label}</h2>
                      <StatusBadge tone={statusToneMap[channel.status]}>
                        {channel.status === 'partner_access'
                          ? 'Partner access'
                          : channel.status === 'beta'
                            ? 'Beta'
                            : 'Planned'}
                      </StatusBadge>
                      <StatusBadge tone="neutral">
                        {channel.audience === 'external_partners' ? 'External partners' : 'Internal'}
                      </StatusBadge>
                    </div>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--portal-fg-muted)]">{channel.summary}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={channel.docsHref}
                      className="inline-flex items-center gap-2 rounded-xl bg-[var(--portal-accent)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--portal-accent-strong)]"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>View docs</span>
                    </Link>
                    <a
                      href={channel.contactHref}
                      className="inline-flex items-center gap-2 rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-4 py-2.5 text-sm font-medium text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)]"
                    >
                      <span>Contact Pivota</span>
                    </a>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--portal-border)] bg-white px-4 py-4">
                    <div className="flex items-center gap-2 text-[var(--portal-fg)]">
                      <Globe2 className="h-4 w-4 text-[var(--portal-accent)]" />
                      <p className="text-sm font-semibold">Availability</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--portal-fg-muted)]">{channel.availability}</p>
                    <p className="mt-2 text-xs leading-5 text-[var(--portal-fg-subtle)]">
                      Requires partner onboarding and allowlisting.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--portal-border)] bg-white px-4 py-4">
                    <div className="flex items-center gap-2 text-[var(--portal-fg)]">
                      <RadioTower className="h-4 w-4 text-[var(--portal-accent)]" />
                      <p className="text-sm font-semibold">What it is for</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--portal-fg-muted)]">{channel.purpose}</p>
                  </div>

                  <div className="rounded-2xl border border-[var(--portal-border)] bg-white px-4 py-4">
                    <div className="flex items-center gap-2 text-[var(--portal-fg)]">
                      <Webhook className="h-4 w-4 text-[var(--portal-accent)]" />
                      <p className="text-sm font-semibold">How it relates to APIs</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--portal-fg-muted)]">{channel.relationToApi}</p>
                    <p className="mt-2 text-xs leading-5 text-[var(--portal-fg-subtle)]">
                      Not a public self-serve API surface today.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
