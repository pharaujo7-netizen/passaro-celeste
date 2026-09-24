import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    birthDate: text("birth_date"),
    gender: text("gender", { enum: ["F", "M", "NA"] }),
    role: text("role", {
      enum: [
        "creator",
        "director",
        "secretary",
        "instructor",
        "pathfinder",
        "guardian",
      ],
    }).notNull(),
    status: text("status", {
      enum: ["pre_registered", "active", "blocked", "archived"],
    })
      .notNull()
      .default("pre_registered"),
    photoKey: text("photo_key"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    uniqueIndex("users_phone_unique").on(t.phone),
    index("idx_users_role_status").on(t.role, t.status),
  ],
);

export const guardianships = sqliteTable(
  "guardianships",
  {
    id: text("id").primaryKey(),
    pathfinderId: text("pathfinder_id")
      .notNull()
      .references(() => users.id),
    guardianId: text("guardian_id")
      .notNull()
      .references(() => users.id),
    relationship: text("relationship").notNull(),
    mayAccess: integer("may_access", { mode: "boolean" })
      .notNull()
      .default(true),
    consentAt: integer("consent_at", { mode: "timestamp_ms" }),
  },
  (t) => [uniqueIndex("guardianship_unique").on(t.pathfinderId, t.guardianId)],
);

export const units = sqliteTable(
  "units",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    gender: text("gender", { enum: ["F", "M"] }).notNull(),
    minAge: integer("min_age").notNull(),
    maxAge: integer("max_age").notNull(),
    photoKey: text("photo_key"),
  },
  (t) => [uniqueIndex("units_name_unique").on(t.name)],
);

export const unitMembers = sqliteTable(
  "unit_members",
  {
    unitId: text("unit_id")
      .notNull()
      .references(() => units.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    memberRole: text("member_role", {
      enum: ["pathfinder", "counselor", "assistant"],
    }).notNull(),
  },
  (t) => [
    uniqueIndex("unit_member_unique").on(t.unitId, t.userId),
    index("idx_unit_members_user").on(t.userId),
  ],
);

export const activationCodes = sqliteTable(
  "activation_codes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    codeHash: text("code_hash").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    usedAt: integer("used_at", { mode: "timestamp_ms" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("idx_activation_user_active").on(t.userId, t.usedAt)],
);

export const catalogItems = sqliteTable(
  "catalog_items",
  {
    id: text("id").primaryKey(),
    kind: text("kind", {
      enum: ["regular_class", "advanced_class", "grouped_class", "specialty"],
    }).notNull(),
    name: text("name").notNull(),
    category: text("category"),
    sourceEdition: text("source_edition").notNull(),
    sourceUrl: text("source_url"),
    badgeKey: text("badge_key"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
  },
  (t) => [
    uniqueIndex("catalog_kind_name_unique").on(t.kind, t.name),
    index("idx_catalog_category").on(t.kind, t.category),
  ],
);

export const requirements = sqliteTable(
  "requirements",
  {
    id: text("id").primaryKey(),
    catalogItemId: text("catalog_item_id")
      .notNull()
      .references(() => catalogItems.id),
    section: text("section"),
    position: integer("position").notNull(),
    text: text("text").notNull(),
    evidenceType: text("evidence_type", {
      enum: ["none", "text", "photo", "file", "mixed"],
    })
      .notNull()
      .default("mixed"),
  },
  (t) => [
    uniqueIndex("requirement_position_unique").on(t.catalogItemId, t.position),
  ],
);

export const enrollments = sqliteTable(
  "enrollments",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    catalogItemId: text("catalog_item_id")
      .notNull()
      .references(() => catalogItems.id),
    instructorId: text("instructor_id").references(() => users.id),
    status: text("status", {
      enum: ["active", "completed", "paused", "cancelled"],
    })
      .notNull()
      .default("active"),
    startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  },
  (t) => [
    uniqueIndex("enrollment_unique").on(t.userId, t.catalogItemId),
    index("idx_enrollment_instructor_status").on(t.instructorId, t.status),
  ],
);

export const submissions = sqliteTable(
  "submissions",
  {
    id: text("id").primaryKey(),
    enrollmentId: text("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    requirementId: text("requirement_id")
      .notNull()
      .references(() => requirements.id),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id),
    text: text("text"),
    status: text("status", {
      enum: ["draft", "submitted", "approved", "correction_required"],
    })
      .notNull()
      .default("draft"),
    submittedAt: integer("submitted_at", { mode: "timestamp_ms" }),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    index("idx_submission_review_queue").on(t.status, t.submittedAt),
    index("idx_submission_enrollment").on(t.enrollmentId),
  ],
);

export const evidenceFiles = sqliteTable(
  "evidence_files",
  {
    id: text("id").primaryKey(),
    submissionId: text("submission_id")
      .notNull()
      .references(() => submissions.id),
    objectKey: text("object_key").notNull(),
    fileName: text("file_name").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    uniqueIndex("evidence_object_key_unique").on(t.objectKey),
    index("idx_evidence_submission").on(t.submissionId),
  ],
);

export const reviews = sqliteTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    submissionId: text("submission_id")
      .notNull()
      .references(() => submissions.id),
    reviewerId: text("reviewer_id")
      .notNull()
      .references(() => users.id),
    decision: text("decision", {
      enum: ["approved", "correction_required"],
    }).notNull(),
    comment: text("comment"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("idx_reviews_submission").on(t.submissionId)],
);

export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    location: text("location"),
    startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
    endsAt: integer("ends_at", { mode: "timestamp_ms" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("idx_events_starts_at").on(t.startsAt)],
);

export const auditLog = sqliteTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id").references(() => users.id),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    details: text("details"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    index("idx_audit_entity").on(t.entityType, t.entityId),
    index("idx_audit_created").on(t.createdAt),
  ],
);

export const credentials = sqliteTable("credentials", {
  userId: text("user_id").primaryKey().references(() => users.id),
  salt: text("salt").notNull(),
  passwordHash: text("password_hash").notNull(),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: integer("locked_until").notNull().default(0),
});

export const sessions = sqliteTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  expiresAt: integer("expires_at").notNull(),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  readAt: integer("read_at"),
  createdAt: integer("created_at").notNull(),
}, (t) => [index("idx_notifications_user_created").on(t.userId, t.createdAt)]);

export const medicalRecords = sqliteTable("medical_records", {
  userId: text("user_id").primaryKey().references(() => users.id),
  allergies: text("allergies"),
  medications: text("medications"),
  conditions: text("conditions"),
  emergencyName: text("emergency_name"),
  emergencyPhone: text("emergency_phone"),
  updatedBy: text("updated_by").notNull().references(() => users.id),
  updatedAt: integer("updated_at").notNull(),
});

export const pushSubscriptions = sqliteTable("push_subscriptions", {
  endpoint: text("endpoint").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  createdAt: integer("created_at").notNull(),
}, (t) => [index("idx_push_user").on(t.userId)]);
