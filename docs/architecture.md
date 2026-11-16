# CtrlPass Architecture Overview

## Separation of Concerns

### Mobile App (`apps/mobile`)
Dedicated exclusively to mobile-native personas:
1. **Attendee**:
   - Event discovery & filtering
   - Ticket selection, registration fields & booking checkout
   - Digital tickets with dynamic QR codes
   - Profile management
2. **Volunteer**:
   - High-throughput camera QR gate scanner
   - Instant ticket validation (single-entry, multi-scan, duplicate detection)
   - Gate access check-in history

*Note: Mobile does NOT contain Organizer or Admin workspaces.*

### Web Application (`apps/web`)
Dedicated to desktop management:
1. **Organizer Portal (`/organizer/*`)**:
   - Event creation, drafting, and publishing
   - Ticket tier and inventory configuration
   - Attendee list & live check-in monitoring
   - Order management, volunteer gate assignments, and financial payouts
2. **Admin Command Center (`/admin/*`)**:
   - Event review & approval pipeline
   - Platform-wide organizers, attendees, and user management
   - Financial audit logs, cashfree reconciliations, and refund processing
   - Platform system settings & security policies

### Shared Packages (`packages/*`)
- `@ctrlpass/types`: Canonical database schema types, domain models, and API interfaces.
- `@ctrlpass/ui`: Cross-platform design tokens (colors, typography, radii, spacing).
- `@ctrlpass/config`: Shared platform constants, validation schemas, and environment specifications.
