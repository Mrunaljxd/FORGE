import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "./db";
import { challengeParticipants, communityPosts, exercises, meals, profiles, programs, progressEntries, users, workoutSessions } from "../drizzle/schema";

export async function listDbExercises() {
  const db = await getDb();
  return db ? db.select().from(exercises).orderBy(exercises.name) : null;
}
export async function createDbExercise(values: typeof exercises.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable");
  await db.insert(exercises).values(values);
}
export async function updateDbExercise(id: number, values: Partial<typeof exercises.$inferInsert>) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable");
  await db.update(exercises).set(values).where(eq(exercises.id, id));
}
export async function deleteDbExercise(id: number) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable");
  await db.delete(exercises).where(eq(exercises.id, id));
}
export async function listDbPrograms() {
  const db = await getDb();
  return db ? db.select().from(programs).orderBy(programs.name) : null;
}
export async function createDbProgram(values: typeof programs.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable");
  await db.insert(programs).values(values);
}
export async function updateDbProgram(id: number, values: Partial<typeof programs.$inferInsert>) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable");
  await db.update(programs).set(values).where(eq(programs.id, id));
}
export async function deleteDbProgram(id: number) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable");
  await db.delete(programs).where(eq(programs.id, id));
}
export async function listDbMeals() {
  const db = await getDb();
  return db ? db.select().from(meals).orderBy(meals.name) : null;
}
export async function createDbMeal(values: typeof meals.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable");
  await db.insert(meals).values(values);
}
export async function updateDbMeal(id: number, values: Partial<typeof meals.$inferInsert>) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable");
  await db.update(meals).set(values).where(eq(meals.id, id));
}
export async function deleteDbMeal(id: number) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable");
  await db.delete(meals).where(eq(meals.id, id));
}
export async function getProfile(userId: number) {
  const db = await getDb(); if (!db) return null;
  const rows = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return rows[0] ?? null;
}
export async function saveProfile(userId: number, values: Omit<typeof profiles.$inferInsert, "userId">) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable");
  await db.insert(profiles).values({ userId, ...values }).onDuplicateKeyUpdate({ set: values });
}
export async function saveWorkout(values: typeof workoutSessions.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable");
  await db.insert(workoutSessions).values(values);
}
export async function listSessions(userId: number, limit = 100) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(workoutSessions).where(eq(workoutSessions.userId, userId)).orderBy(desc(workoutSessions.completedAt)).limit(limit);
}
export async function saveProgress(values: typeof progressEntries.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable");
  await db.insert(progressEntries).values(values);
}
export async function listProgress(userId: number, limit = 200) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(progressEntries).where(eq(progressEntries.userId, userId)).orderBy(desc(progressEntries.recordedAt)).limit(limit);
}
export async function listCommunityPosts() {
  const db = await getDb(); if (!db) return [];
  return db.select({ id: communityPosts.id, content: communityPosts.content, kind: communityPosts.kind, supportCount: communityPosts.supportCount, createdAt: communityPosts.createdAt, name: users.name })
    .from(communityPosts).leftJoin(users, eq(users.id, communityPosts.userId)).orderBy(desc(communityPosts.createdAt)).limit(40);
}
export async function createCommunityPost(userId: number, content: string, kind: "milestone" | "encouragement") {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable");
  await db.insert(communityPosts).values({ userId, content, kind });
}
export async function supportCommunityPost(id: number) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable");
  await db.update(communityPosts).set({ supportCount: sql`${communityPosts.supportCount} + 1` }).where(eq(communityPosts.id, id));
}
export async function joinChallenge(userId: number, challengeSlug: string) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable");
  const existing = await db.select({ id: challengeParticipants.id }).from(challengeParticipants)
    .where(and(eq(challengeParticipants.userId, userId), eq(challengeParticipants.challengeSlug, challengeSlug))).limit(1);
  if (existing[0]) return { joined: true, alreadyJoined: true };
  await db.insert(challengeParticipants).values({ userId, challengeSlug });
  return { joined: true, alreadyJoined: false };
}
export async function adminMetrics() {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable");
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [userCount, activeCount, sessionCount, programRows, exerciseRows] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(users).where(gte(users.lastSignedIn, since)),
    db.select({ value: count() }).from(workoutSessions),
    db.select({ value: count() }).from(programs),
    db.select({ value: count() }).from(exercises),
  ]);
  return {
    totalUsers: Number(userCount[0]?.value ?? 0),
    activeUsers30d: Number(activeCount[0]?.value ?? 0),
    workoutsCompleted: Number(sessionCount[0]?.value ?? 0),
    savedPrograms: Number(programRows[0]?.value ?? 0),
    customExercises: Number(exerciseRows[0]?.value ?? 0),
  };
}
export async function adminUsers() {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable");
  return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn }).from(users).orderBy(desc(users.createdAt)).limit(100);
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable");
  const target = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  if (!target[0]) return "not-found" as const;
  if (target[0].role === "admin" && role === "user") {
    const admins = await db.select({ value: count() }).from(users).where(eq(users.role, "admin"));
    if (Number(admins[0]?.value ?? 0) <= 1) return "last-admin" as const;
  }
  await db.update(users).set({ role }).where(eq(users.id, userId));
  return "updated" as const;
}
