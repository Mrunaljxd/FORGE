import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/** Manus OAuth identities are the only login authority. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const profiles = mysqlTable("forge_profiles", {
  userId: int("userId").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  ageRange: varchar("ageRange", { length: 32 }),
  fitnessLevel: varchar("fitnessLevel", { length: 32 }).default("Beginner"),
  primaryGoal: varchar("primaryGoal", { length: 80 }).default("Build strength"),
  availableTime: varchar("availableTime", { length: 12 }).default("20"),
  equipment: varchar("equipment", { length: 255 }).default("None"),
  preferredDays: varchar("preferredDays", { length: 100 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const exercises = mysqlTable("forge_exercises", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  name: varchar("name", { length: 140 }).notNull(),
  category: varchar("category", { length: 60 }).notNull(),
  muscleGroup: varchar("muscleGroup", { length: 100 }).notNull(),
  difficulty: varchar("difficulty", { length: 32 }).notNull(),
  equipment: varchar("equipment", { length: 100 }).default("None"),
  durationMinutes: int("durationMinutes").default(5).notNull(),
  description: text("description").notNull(),
  benefits: text("benefits").notNull(),
  formInstructions: text("formInstructions").notNull(),
  commonMistakes: text("commonMistakes").notNull(),
  correctMediaUrl: text("correctMediaUrl"),
  wrongMediaUrl: text("wrongMediaUrl"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const programs = mysqlTable("forge_programs", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description").notNull(),
  difficulty: varchar("difficulty", { length: 32 }).notNull(),
  durationWeeks: int("durationWeeks").notNull(),
  equipment: varchar("equipment", { length: 180 }).default("None required").notNull(),
  sampleWorkouts: text("sampleWorkouts"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const meals = mysqlTable("forge_meals", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 140 }).notNull(),
  category: varchar("category", { length: 60 }).notNull(),
  description: text("description").notNull(),
  ingredients: text("ingredients").notNull(),
  prepMinutes: int("prepMinutes").default(20).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const workoutSessions = mysqlTable("forge_workout_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  workoutId: varchar("workoutId", { length: 180 }).notNull(),
  workoutName: varchar("workoutName", { length: 180 }).notNull(),
  focus: varchar("focus", { length: 48 }).notNull(),
  durationMinutes: int("durationMinutes").notNull(),
  exercisesCompleted: int("exercisesCompleted").notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export const progressEntries = mysqlTable("forge_progress_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  metric: mysqlEnum("metric", ["energy", "sleep", "mobility", "mood", "strength", "hydration"]).notNull(),
  value: int("value").notNull(),
  note: varchar("note", { length: 240 }),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

export const communityPosts = mysqlTable("forge_community_posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: varchar("content", { length: 280 }).notNull(),
  kind: mysqlEnum("kind", ["milestone", "encouragement"]).default("milestone").notNull(),
  supportCount: int("supportCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const challengeParticipants = mysqlTable("forge_challenge_participants", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  challengeSlug: varchar("challengeSlug", { length: 120 }).notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type Program = typeof programs.$inferSelect;
export type Meal = typeof meals.$inferSelect;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type ProgressEntry = typeof progressEntries.$inferSelect;
