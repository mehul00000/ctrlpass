import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/*
 * CtrlPass Convex schema — ported 1:1 from the Supabase/Postgres schema.
 * All money is integer minor units (paise), currency INR.
 * Timestamps are epoch milliseconds (number).
 */

export default defineSchema({
  // ─── Identity ────────────────────────────────────────────────────────────
  appUsers: defineTable({
    clerkUserId: v.string(), // Clerk subject (user_xxx)
    email: v.optional(v.string()),
    emailVerifiedAt: v.optional(v.number()),
    status: v.union(
      v.literal("ACTIVE"),
      v.literal("PENDING"),
      v.literal("SUSPENDED"),
      v.literal("DISABLED"),
    ),
    lastLoginAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  }).index("by_clerk_user", ["clerkUserId"]).index("by_email", ["email"]),

  profiles: defineTable({
    userId: v.id("appUsers"),
    fullName: v.optional(v.string()),
    phone: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  userRoles: defineTable({
    userId: v.id("appUsers"),
    role: v.union(
      v.literal("ATTENDEE"),
      v.literal("VOLUNTEER"),
      v.literal("ORGANIZER"),
      v.literal("ADMIN"),
    ),
    status: v.union(v.literal("ACTIVE"), v.literal("REVOKED")),
    grantedBy: v.optional(v.id("appUsers")),
    grantedAt: v.number(),
    revokedBy: v.optional(v.id("appUsers")),
    revokedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user_role", ["userId", "role"])
    .index("by_role_status", ["role", "status"]),

  // ─── Organizer ───────────────────────────────────────────────────────────
  organizers: defineTable({
    name: v.string(),
    type: v.union(v.literal("COLLEGE"), v.literal("EXTERNAL")),
    description: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    address: v.optional(v.string()),
    status: v.union(
      v.literal("ACTIVE"),
      v.literal("SUSPENDED"),
      v.literal("DISABLED"),
    ),
    verificationStatus: v.union(
      v.literal("PENDING"),
      v.literal("VERIFIED"),
      v.literal("REJECTED"),
    ),
    createdBy: v.id("appUsers"),
    approvedBy: v.optional(v.id("appUsers")),
    approvedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_creator", ["createdBy"]),

  organizerMembers: defineTable({
    organizerId: v.id("organizers"),
    userId: v.id("appUsers"),
    membershipRole: v.union(
      v.literal("OWNER"),
      v.literal("MANAGER"),
      v.literal("FINANCE"),
      v.literal("EVENT_MANAGER"),
    ),
    status: v.union(
      v.literal("ACTIVE"),
      v.literal("INVITED"),
      v.literal("REVOKED"),
    ),
    invitedBy: v.optional(v.id("appUsers")),
    joinedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organizer", ["organizerId"])
    .index("by_user", ["userId"])
    .index("by_organizer_user", ["organizerId", "userId"]),

  organizerVerifications: defineTable({
    organizerId: v.id("organizers"),
    submittedBy: v.id("appUsers"),
    status: v.union(
      v.literal("PENDING"),
      v.literal("UNDER_REVIEW"),
      v.literal("APPROVED"),
      v.literal("REJECTED"),
      v.literal("MORE_INFORMATION_REQUIRED"),
    ),
    submittedAt: v.number(),
    reviewedBy: v.optional(v.id("appUsers")),
    reviewedAt: v.optional(v.number()),
    rejectionReason: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_organizer", ["organizerId"]),

  organizerDocuments: defineTable({
    organizerId: v.id("organizers"),
    verificationId: v.optional(v.id("organizerVerifications")),
    documentType: v.string(),
    storagePath: v.string(),
    status: v.string(),
    uploadedBy: v.id("appUsers"),
    uploadedAt: v.number(),
    reviewedBy: v.optional(v.id("appUsers")),
    reviewedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_organizer", ["organizerId"]),

  venues: defineTable({
    name: v.string(),
    addressLine: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    pincode: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    mapsReference: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),

  // ─── Events ──────────────────────────────────────────────────────────────
  events: defineTable({
    organizerId: v.id("organizers"),
    name: v.string(),
    shortDescription: v.string(),
    description: v.string(),
    category: v.string(),
    coverImageUrl: v.optional(v.string()),
    format: v.union(v.literal("PHYSICAL"), v.literal("ONLINE"), v.literal("HYBRID")),
    status: v.union(
      v.literal("DRAFT"),
      v.literal("SUBMITTED_FOR_REVIEW"),
      v.literal("APPROVED"),
      v.literal("PUBLISHED"),
      v.literal("SALES_OPEN"),
      v.literal("SALES_CLOSED"),
      v.literal("ONGOING"),
      v.literal("COMPLETED"),
      v.literal("CANCELLED"),
    ),
    visibility: v.union(v.literal("PUBLIC"), v.literal("PRIVATE"), v.literal("UNLISTED")),
    venueId: v.optional(v.id("venues")),
    startAt: v.number(),
    endAt: v.number(),
    timezone: v.string(),
    doorsOpenAt: v.optional(v.number()),
    capacity: v.optional(v.number()),
    createdBy: v.id("appUsers"),
    submittedAt: v.optional(v.number()),
    approvedAt: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    originalStartAt: v.optional(v.number()),
    originalEndAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organizer", ["organizerId"])
    .index("by_status_start", ["status", "startAt"])
    .index("by_status_visibility", ["status", "visibility"]),

  eventOnlineDetails: defineTable({
    eventId: v.id("events"),
    platform: v.optional(v.string()),
    accessUrl: v.optional(v.string()),
    accessInstructions: v.optional(v.string()),
    passwordReference: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_event", ["eventId"]),

  eventMembers: defineTable({
    eventId: v.id("events"),
    userId: v.id("appUsers"),
    role: v.union(
      v.literal("EVENT_MANAGER"),
      v.literal("VOLUNTEER"),
      v.literal("SCANNER"),
    ),
    status: v.union(v.literal("ACTIVE"), v.literal("INVITED"), v.literal("REVOKED")),
    invitedBy: v.optional(v.id("appUsers")),
    joinedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_event_user_role", ["eventId", "userId", "role"])
    .index("by_user_status", ["userId", "status"]),

  refundPolicies: defineTable({
    eventId: v.id("events"),
    policyType: v.string(),
    refundDeadline: v.optional(v.number()),
    organizerCancelRefund: v.boolean(),
    attendeeCancelAllowed: v.boolean(),
    bookingFeeRefundable: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_event", ["eventId"]),

  ticketTypes: defineTable({
    eventId: v.id("events"),
    name: v.string(),
    description: v.optional(v.string()),
    priceMinor: v.number(),
    currency: v.string(),
    quantity: v.number(),
    reservedQuantity: v.number(),
    soldQuantity: v.number(),
    minPerBooking: v.number(),
    maxPerBooking: v.number(),
    salesStartAt: v.optional(v.number()),
    salesEndAt: v.optional(v.number()),
    visibility: v.union(v.literal("VISIBLE"), v.literal("HIDDEN")),
    status: v.union(v.literal("ACTIVE"), v.literal("DISABLED")),
    refundPolicyId: v.optional(v.id("refundPolicies")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_event_visibility_status", ["eventId", "visibility", "status"]),

  registrationFields: defineTable({
    eventId: v.id("events"),
    label: v.string(),
    fieldKey: v.string(),
    fieldType: v.union(
      v.literal("TEXT"),
      v.literal("EMAIL"),
      v.literal("PHONE"),
      v.literal("NUMBER"),
      v.literal("DATE"),
      v.literal("SELECT"),
      v.literal("MULTI_SELECT"),
      v.literal("CHECKBOX"),
    ),
    required: v.boolean(),
    displayOrder: v.number(),
    options: v.optional(v.any()),
    validationRules: v.optional(v.any()),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_event", ["eventId"]),

  // ─── Bookings / payments / tickets ───────────────────────────────────────
  bookings: defineTable({
    userId: v.id("appUsers"),
    eventId: v.id("events"),
    bookingReference: v.string(),
    status: v.union(
      v.literal("CREATED"),
      v.literal("RESERVED"),
      v.literal("PAYMENT_PENDING"),
      v.literal("CONFIRMED"),
      v.literal("CANCELLED"),
      v.literal("EXPIRED"),
      v.literal("FAILED"),
      v.literal("REFUND_PENDING"),
      v.literal("REFUNDED"),
      v.literal("PARTIALLY_REFUNDED"),
    ),
    subtotalMinor: v.number(),
    bookingFeeMinor: v.number(),
    discountMinor: v.number(),
    taxMinor: v.number(),
    totalAmountMinor: v.number(),
    currency: v.string(),
    ticketCount: v.number(),
    attendeeName: v.string(),
    attendeeEmail: v.string(),
    attendeePhone: v.optional(v.string()),
    extraFields: v.optional(v.any()),
    expiresAt: v.optional(v.number()),
    confirmedAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    reservationId: v.optional(v.id("reservations")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId", "createdAt"])
    .index("by_event", ["eventId"])
    .index("by_status_expires", ["status", "expiresAt"])
    .index("by_reference", ["bookingReference"]),

  reservations: defineTable({
    bookingId: v.id("bookings"),
    status: v.union(
      v.literal("ACTIVE"),
      v.literal("EXPIRED"),
      v.literal("RELEASED"),
      v.literal("CONSUMED"),
    ),
    expiresAt: v.number(),
    releasedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_booking", ["bookingId"])
    .index("by_status_expires", ["status", "expiresAt"]),

  bookingItems: defineTable({
    bookingId: v.id("bookings"),
    ticketTypeId: v.id("ticketTypes"),
    quantity: v.number(),
    unitPriceMinor: v.number(),
    subtotalMinor: v.number(),
    refundedQuantity: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_booking", ["bookingId"]),

  registrationAnswers: defineTable({
    bookingId: v.id("bookings"),
    fieldId: v.id("registrationFields"),
    value: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_booking", ["bookingId"]),

  paymentAttempts: defineTable({
    bookingId: v.id("bookings"),
    provider: v.string(),
    providerOrderId: v.optional(v.string()),
    providerPaymentId: v.optional(v.string()),
    providerSessionId: v.optional(v.string()),
    attemptNumber: v.number(),
    amountMinor: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("INITIATED"),
      v.literal("PENDING"),
      v.literal("AUTHORIZED"),
      v.literal("CAPTURED"),
      v.literal("FAILED"),
    ),
    idempotencyKey: v.string(),
    initiatedAt: v.number(),
    completedAt: v.optional(v.number()),
    failureCode: v.optional(v.string()),
    failureReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_booking", ["bookingId"])
    .index("by_idempotency", ["idempotencyKey"])
    .index("by_order", ["providerOrderId"]),

  payments: defineTable({
    bookingId: v.id("bookings"),
    paymentAttemptId: v.optional(v.id("paymentAttempts")),
    provider: v.string(),
    providerPaymentId: v.optional(v.string()),
    providerOrderId: v.optional(v.string()),
    amountMinor: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("INITIATED"),
      v.literal("PENDING"),
      v.literal("AUTHORIZED"),
      v.literal("CAPTURED"),
      v.literal("FAILED"),
      v.literal("REFUND_PENDING"),
      v.literal("PARTIALLY_REFUNDED"),
      v.literal("REFUNDED"),
      v.literal("DISPUTED"),
    ),
    capturedAt: v.optional(v.number()),
    failedAt: v.optional(v.number()),
    disputedAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_booking", ["bookingId"]),

  paymentWebhooks: defineTable({
    provider: v.string(),
    providerEventId: v.optional(v.string()),
    eventType: v.optional(v.string()),
    payload: v.any(),
    signature: v.optional(v.string()),
    signatureVerified: v.boolean(),
    processingStatus: v.union(
      v.literal("RECEIVED"),
      v.literal("SIGNATURE_VERIFIED"),
      v.literal("PROCESSING"),
      v.literal("PROCESSED"),
      v.literal("PROCESSING_FAILED"),
    ),
    receivedAt: v.number(),
    processedAt: v.optional(v.number()),
    processingError: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_provider_event", ["provider", "providerEventId"]),

  tickets: defineTable({
    bookingId: v.id("bookings"),
    bookingItemId: v.id("bookingItems"),
    ticketTypeId: v.id("ticketTypes"),
    eventId: v.id("events"),
    ownerUserId: v.id("appUsers"),
    ticketReference: v.string(),
    qrToken: v.string(),
    status: v.union(
      v.literal("PENDING"),
      v.literal("ACTIVE"),
      v.literal("CANCELLED"),
      v.literal("USED"),
      v.literal("EXPIRED"),
    ),
    issuedAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    checkedInAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerUserId"])
    .index("by_event", ["eventId"])
    .index("by_booking", ["bookingId"])
    .index("by_qr_token", ["qrToken"]),

  ticketCredentials: defineTable({
    ticketId: v.id("tickets"),
    qrToken: v.string(),
    createdAt: v.number(),
  }).index("by_ticket", ["ticketId"]),

  checkIns: defineTable({
    ticketId: v.optional(v.id("tickets")),
    eventId: v.id("events"),
    scannedBy: v.id("appUsers"),
    result: v.union(
      v.literal("SUCCESS"),
      v.literal("DUPLICATE"),
      v.literal("INVALID"),
      v.literal("CANCELLED"),
      v.literal("EXPIRED"),
      v.literal("WRONG_EVENT"),
    ),
    scannedAt: v.number(),
    deviceReference: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_event_time", ["eventId", "scannedAt"]),

  refunds: defineTable({
    bookingId: v.id("bookings"),
    paymentId: v.optional(v.id("payments")),
    status: v.union(
      v.literal("REQUESTED"),
      v.literal("PENDING"),
      v.literal("PROCESSING"),
      v.literal("SUCCESS"),
      v.literal("FAILED"),
      v.literal("REJECTED"),
    ),
    amountMinor: v.number(),
    currency: v.string(),
    reason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_booking", ["bookingId"]),

  ledgerEntries: defineTable({
    organizerId: v.optional(v.id("organizers")),
    eventId: v.optional(v.id("events")),
    bookingId: v.optional(v.id("bookings")),
    paymentId: v.optional(v.id("payments")),
    refundId: v.optional(v.id("refunds")),
    settlementId: v.optional(v.id("settlements")),
    entryType: v.string(),
    direction: v.union(v.literal("DEBIT"), v.literal("CREDIT")),
    amountMinor: v.number(),
    currency: v.string(),
    referenceType: v.optional(v.string()),
    referenceId: v.optional(v.string()),
    description: v.optional(v.string()),
    createdAt: v.number(),
    metadata: v.optional(v.any()),
  })
    .index("by_organizer", ["organizerId"])
    .index("by_event", ["eventId"])
    .index("by_booking", ["bookingId"]),

  settlements: defineTable({
    organizerId: v.id("organizers"),
    eventId: v.optional(v.id("events")),
    status: v.union(
      v.literal("PENDING"),
      v.literal("ELIGIBLE"),
      v.literal("ON_HOLD"),
      v.literal("PROCESSING"),
      v.literal("COMPLETED"),
      v.literal("FAILED"),
      v.literal("REVERSED"),
    ),
    grossAmountMinor: v.number(),
    refundsMinor: v.number(),
    commissionMinor: v.number(),
    gatewayFeesMinor: v.number(),
    adjustmentsMinor: v.number(),
    netAmountMinor: v.number(),
    provider: v.optional(v.string()),
    providerSettlementId: v.optional(v.string()),
    settlementReference: v.optional(v.string()),
    eligibleAt: v.optional(v.number()),
    initiatedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    failedAt: v.optional(v.number()),
    failureReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_organizer", ["organizerId"]),

  notifications: defineTable({
    userId: v.id("appUsers"),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
    readAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
  }).index("by_user_time", ["userId", "createdAt"]),

  notificationDeliveries: defineTable({
    notificationId: v.id("notifications"),
    channel: v.union(
      v.literal("IN_APP"),
      v.literal("EMAIL"),
      v.literal("PUSH"),
      v.literal("SMS"),
    ),
    provider: v.optional(v.string()),
    providerReference: v.optional(v.string()),
    status: v.string(),
    sentAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    failedAt: v.optional(v.number()),
    failureReason: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_notification", ["notificationId"]),

  auditLogs: defineTable({
    actorUserId: v.optional(v.id("appUsers")),
    actorRole: v.optional(v.string()),
    action: v.string(),
    resourceType: v.optional(v.string()),
    resourceId: v.optional(v.string()),
    eventId: v.optional(v.id("events")),
    organizerId: v.optional(v.id("organizers")),
    beforeData: v.optional(v.any()),
    afterData: v.optional(v.any()),
    ipReference: v.optional(v.string()),
    userAgentReference: v.optional(v.string()),
    createdAt: v.number(),
    metadata: v.optional(v.any()),
  }).index("by_action", ["action"]),

  // ─── Product completion (migration 0005) ─────────────────────────────────
  userConsents: defineTable({
    userId: v.id("appUsers"),
    consentType: v.string(),
    granted: v.boolean(),
    policyVersion: v.optional(v.string()),
    grantedAt: v.number(),
    revokedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_type", ["userId", "consentType"])
    .index("by_user", ["userId"]),

  referralCodes: defineTable({
    userId: v.id("appUsers"),
    code: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_code", ["code"]),

  referrals: defineTable({
    referrerId: v.id("appUsers"),
    referredUserId: v.id("appUsers"),
    status: v.string(),
    qualifiedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_referrer", ["referrerId"])
    .index("by_referred", ["referredUserId"]),

  volunteerInvitations: defineTable({
    eventId: v.id("events"),
    email: v.string(),
    role: v.union(v.literal("VOLUNTEER"), v.literal("SCANNER"), v.literal("EVENT_MANAGER")),
    status: v.union(
      v.literal("PENDING"),
      v.literal("SENT"),
      v.literal("ACCEPTED"),
      v.literal("EXPIRED"),
      v.literal("REVOKED"),
    ),
    token: v.string(),
    invitedBy: v.optional(v.id("appUsers")),
    expiresAt: v.number(),
    acceptedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_event_email", ["eventId", "email"])
    .index("by_email_status", ["email", "status"]),

  userSettings: defineTable({
    userId: v.id("appUsers"),
    settings: v.any(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
});
