import Link from 'next/link';
import BrandMark from './BrandMark';

const platformLinks = [
  { href: '/#discover', label: 'Discover Events' },
  { href: '/organizer/dashboard', label: 'Organizer Suite' },
  { href: '/admin/dashboard', label: 'Compliance & Review' },
];

const dashboardLinks = [
  { href: '/organizer/events', label: 'Event Management' },
  { href: '/organizer/check-ins', label: 'Gate Live Feed' },
  { href: '/organizer/finance', label: 'Revenue & Finance' },
  { href: '/admin/event-review', label: 'Event Review Queue' },
];

const accessLinks = [
  { href: '/login', label: 'Sign In' },
  { href: '/admin/login', label: 'Admin Gateway' },
  { href: '/signup', label: 'Register Organization' },
  { href: '/forgot-password', label: 'Account Recovery' },
];

/* Library photographs used by the pages of this site (imagery.md § 2).
   Each credit: author, licence, link. CC BY / CC BY-SA require it. */
const photoCredits = [
  {
    author: 'PinkBeachPlanet',
    licence: 'CC BY-SA 4.0',
    href: 'https://commons.wikimedia.org/wiki/File:Beach-Please-2022-crowd-stage-lights-night-performance.jpg',
  },
  {
    author: 'Ian T. McFarland',
    licence: 'CC BY-SA 2.0',
    href: 'https://commons.wikimedia.org/wiki/File:Lights_(2011-04-24_by_Ian_T._McFarland).jpg',
  },
  {
    author: '北京驱动文化传媒有限公司',
    licence: 'CC BY-SA 3.0',
    href: 'https://commons.wikimedia.org/wiki/File:Tianjin_Grand_Theater_Concert_Hall.jpg',
  },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-[color:var(--color-rule)] bg-[color:var(--color-paper)]">
      <div className="mx-auto w-full max-w-[1360px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
          {/* the letter */}
          <div>
            <BrandMark size={36} compact />

            <p className="mt-6 max-w-[46ch] font-display text-xl leading-[1.45] text-[color:var(--color-ink-2)] sm:text-2xl">
              One platform for the whole night: find the event, hold the
              ticket, walk through the gate.
            </p>

            <p className="mt-4 max-w-[52ch] text-sm leading-[1.6] text-[color:var(--color-muted)]">
              CtrlPass carries discovery, ticketing and gate access for
              organizers across India, from the first listing to the last
              scan at the door.
            </p>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            <FooterColumn title="Platform" links={platformLinks} />
            <FooterColumn title="Dashboards" links={dashboardLinks} />
            <FooterColumn title="Access" links={accessLinks} />
          </div>
        </div>

        <div
          data-credits
          className="mt-14 text-xs leading-[1.6] text-[color:var(--color-muted)]"
        >
          Photographs:{' '}
          {photoCredits.map((credit, index) => (
            <span key={credit.href}>
              <a
                href={credit.href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[color:var(--color-rule)] underline-offset-2 transition-colors hover:text-[color:var(--color-ink-2)]"
              >
                {credit.author}
              </a>{' '}
              ({credit.licence})
              {index < photoCredits.length - 1 ? ', ' : ''}
            </span>
          ))}{' '}
          (Wikimedia Commons).
        </div>

        <div className="mt-6 border-t border-[color:var(--color-rule)] pt-6 text-xs text-[color:var(--color-muted)]">
          © {new Date().getFullYear()} CtrlPass Technologies India Pvt Ltd.
          All rights reserved.
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div>
      <h4 className="text-sm font-medium text-[color:var(--color-ink)]">{title}</h4>

      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-[color:var(--color-muted)] transition-colors hover:text-[color:var(--color-ink)]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
