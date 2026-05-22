import {
  boolean,
  date,
  index,
  integer,
  text,
  pgTable,
  primaryKey,
  serial,
  timestamp,
  uuid,
  varchar,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  googleId: varchar('google_id', { length: 255 }).unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  emailVerified: boolean('email_verified').default(false).notNull(),
  emailVerificationTokenHash: varchar('email_verification_token_hash', {
    length: 255,
  }),
  emailVerificationTokenExpiresAt: timestamp(
    'email_verification_token_expires_at',
  ),
  passwordResetTokenHash: varchar('password_reset_token_hash', { length: 255 }),
  passwordResetTokenExpiresAt: timestamp('password_reset_token_expires_at'),
  lastPasswordChangeAt: timestamp('last_password_change_at'),
  loginAttempts: integer('login_attempts').default(0).notNull(),
  lockoutUntil: timestamp('lockout_until'),
  name: varchar('name', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 255 }).notNull().unique(),
    familyId: uuid('family_id').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    replacedByTokenId: uuid('replaced_by_token_id'),
    revokedAt: timestamp('revoked_at'),
    revokeReason: varchar('revoke_reason', { length: 255 }),
    userAgent: text('user_agent'),
    ipAddress: varchar('ip_address', { length: 64 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('refresh_tokens_user_id_idx').on(table.userId),
    index('refresh_tokens_family_id_idx').on(table.familyId),
    index('refresh_tokens_expires_at_idx').on(table.expiresAt),
  ],
);

export const courses = pgTable(
  'courses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    describtion: text('describtion'),
    thumbnailUrl: text('thumbnail_url'),
    youtubePlaylistId: varchar('youtube_playlist_id', { length: 255 }),
    totalDurationSeconds: integer('total_duration_second').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [unique().on(table.userId, table.youtubePlaylistId)],
);

export const videos = pgTable(
  'videos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    coursesId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    youtubeVideoId: varchar('youtube_video_id', { length: 255 }).notNull(),
    title: text('title').notNull(),
    durationSeconds: integer('duration_seconds').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    order: integer('order').default(0),
  },
  (table) => [unique().on(table.userId, table.youtubeVideoId)],
);

export const progress = pgTable(
  'progress',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    videoId: uuid('video_id')
      .notNull()
      .references(() => videos.id, { onDelete: 'cascade' }),
    checkpointSeconds: integer('checkpoint_seconds').default(0).notNull(), // Resume position
    totalWatchedSeconds: integer('total_watched_seconds').default(0).notNull(), // Aggregated watch time
    completed: boolean('completed').default(false).notNull(),
    lastWatchedAt: timestamp('last_watched_at').defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.videoId] })],
);

export const userActivity = pgTable('user_activity', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  videoId: uuid('video_id')
    .notNull()
    .references(() => videos.id, { onDelete: 'cascade' }),
  watchedSeconds: integer('watched_seconds').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

export const dailyActivity = pgTable(
  'daily_activity',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    totalSeconds: integer('total_seconds').default(0).notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.date] })],
);

export const courseProgress = pgTable(
  'course_progress',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    coursesId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    totalWatchedSeconds: integer('total_watched_seconds').default(0).notNull(),
    completedVideos: integer('completed_videos').default(0).notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.coursesId] })],
);

//////----//////
export const usersRelations = relations(users, ({ many }) => ({
  courses: many(courses),
  progress: many(progress),
  userActivity: many(userActivity),
  dailyActivity: many(dailyActivity),
  courseProgress: many(courseProgress),
  refreshTokens: many(refreshTokens),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  user: one(users, {
    fields: [courses.userId],
    references: [users.id],
  }),
  videos: many(videos),
  courseProgress: many(courseProgress),
}));

export const videosRelations = relations(videos, ({ one, many }) => ({
  course: one(courses, {
    fields: [videos.coursesId],
    references: [courses.id],
  }),
  progress: many(progress),
  userActivity: many(userActivity),
}));

export type NewUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
