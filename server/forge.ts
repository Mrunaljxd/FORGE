import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { storagePut } from "./storage";
import {
  adminMetrics,
  adminUsers,
  createCommunityPost,
  createDbExercise,
  createDbMeal,
  createDbProgram,
  deleteDbExercise,
  deleteDbMeal,
  deleteDbProgram,
  getProfile,
  joinChallenge,
  listCommunityPosts,
  listDbExercises,
  listDbMeals,
  listDbPrograms,
  listProgress,
  listSessions,
  saveProfile,
  saveProgress,
  saveWorkout,
  supportCommunityPost,
  updateDbExercise,
  updateDbMeal,
  updateDbProgram,
  updateUserRole,
} from "./forgeDb";
import { seedExercises, seedMeals, seedPrograms } from "../shared/catalog";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access required." });
  return next({ ctx });
});
const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 112);
const libraryInput = z.object({ search: z.string().max(100).optional(), muscleGroup: z.string().max(100).optional(), difficulty: z.string().max(40).optional(), goal: z.string().max(60).optional(), maxDuration: z.number().int().min(1).max(120).optional() }).optional();
const exerciseFields = z.object({
  name: z.string().min(2).max(140), category: z.string().min(2).max(60), muscleGroup: z.string().min(2).max(100),
  difficulty: z.string().min(2).max(32), equipment: z.literal("None").optional(), durationMinutes: z.number().int().min(1).max(120),
  description: z.string().min(5).max(1800), benefits: z.string().min(3).max(1200), formInstructions: z.string().min(5).max(1800),
  commonMistakes: z.string().min(3).max(1200), correctMediaUrl: z.string().max(500).nullable().optional(), wrongMediaUrl: z.string().max(500).nullable().optional(),
});
const programFields = z.object({
  name: z.string().min(2).max(120), description: z.string().min(5).max(1800), difficulty: z.string().min(2).max(32),
  durationWeeks: z.number().int().min(1).max(52), equipment: z.literal("None required").optional(),
  sampleWorkouts: z.array(z.string().trim().min(3).max(180)).max(20).default([]),
});
const mealFields = z.object({ name: z.string().min(2).max(140), category: z.string().min(2).max(60), description: z.string().min(5).max(1500), ingredients: z.string().min(3).max(1200), prepMinutes: z.number().int().min(1).max(240) });

function parseSampleWorkouts(value: string | null, fallback: string[] = []): string[] {
  if (!value) return fallback;
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string").slice(0, 20) : fallback;
  } catch {
    return fallback;
  }
}

function isEquipmentFree(record: { equipment?: string | null }): boolean {
  const equipment = (record.equipment ?? "None").trim().toLowerCase();
  return equipment === "" || equipment === "none" || equipment === "bodyweight" || equipment === "none required";
}

async function buildWorkout(input: { duration: number; focus: string; level: string }) {
  const persisted = await listDbExercises();
  const catalog = (persisted?.length ? persisted : seedExercises).filter(isEquipmentFree);
  const id = `${input.duration}-${slugify(input.focus)}-${slugify(input.level)}`;
  const restorative = ["Mobility", "Recovery"].includes(input.focus);
  const gentle = new Set(["cat-cow", "worlds-greatest-stretch", "hip-90-90", "thoracic-rotation", "ankle-rock", "hip-flexor-rock", "glute-bridge", "dead-bug", "bird-dog"]);
  let candidates = [...catalog];
  if (restorative) candidates = candidates.filter((item) => item.category === "Mobility" || gentle.has(item.slug));
  else if (input.focus === "Strength") candidates = candidates.filter((item) => item.category === "Strength" || item.category === "Core");
  else if (input.focus === "Full Body") candidates = candidates.filter((item) => ["Strength", "Core", "Full Body"].includes(item.category));
  else if (input.focus === "Energy") candidates = candidates.filter((item) => ["Strength", "Core", "Full Body"].includes(item.category));
  if (input.level === "Beginner") candidates = candidates.filter((item) => item.difficulty === "Beginner");
  else if (input.level === "Intermediate") candidates = candidates.filter((item) => item.difficulty !== "Advanced");
  if (candidates.length < 2) candidates = catalog.filter((item) => item.difficulty === "Beginner");
  const count = input.duration <= 10 ? 3 : input.duration <= 20 ? 6 : input.duration <= 30 ? 8 : input.duration <= 45 ? 10 : 12;
  const preferred = input.focus === "Strength" ? ["bodyweight-squat", "incline-push-up", "reverse-lunge", "glute-bridge", "bird-dog", "forearm-plank"]
    : restorative ? ["cat-cow", "worlds-greatest-stretch", "hip-90-90", "thoracic-rotation", "ankle-rock", "hip-flexor-rock", "bird-dog", "dead-bug"]
    : input.focus === "Energy" ? ["squat-to-knee-drive", "mountain-climber", "reverse-lunge-knee-drive", "bodyweight-squat", "plank-shoulder-tap"]
    : ["bodyweight-squat", "incline-push-up", "reverse-lunge", "glute-bridge", "bird-dog", "forearm-plank", "squat-to-reach"];
  const preferredRank = new Map(preferred.map((slug, index) => [slug, index]));
  const difficultyRank = input.level === "Advanced" ? { Advanced: 0, Intermediate: 1, Beginner: 2 } : { Beginner: 0, Intermediate: 1, Advanced: 2 };
  candidates.sort((a, b) => (preferredRank.get(a.slug) ?? 100) - (preferredRank.get(b.slug) ?? 100) || difficultyRank[a.difficulty as keyof typeof difficultyRank] - difficultyRank[b.difficulty as keyof typeof difficultyRank] || a.name.localeCompare(b.name));
  const selected = candidates.slice(0, count);
  const focusName = input.focus === "Full Body" || input.focus === "Strength" ? "Full Body Strength" : input.focus === "Recovery" ? "Restore & Reset" : input.focus;
  const timed = new Set(["forearm-plank", "high-plank", "side-plank", "wall-sit", "glute-bridge-hold", "bear-crawl"]);
  return {
    id,
    name: `${input.duration}-Minute ${focusName}`,
    duration: input.duration,
    difficulty: input.level,
    equipment: "None",
    focus: input.focus,
    exercises: selected.map((exercise) => ({ ...exercise, equipment: "None", reps: restorative ? "20–30 sec, easy pace" : timed.has(exercise.slug) ? "20–30 sec hold" : "8–10 controlled reps", sets: 2, restSeconds: restorative ? 20 : 30 })),
    note: "No equipment or mat required. Use a clear, safe floor or space; a wall is optional for support. Adjust or stop if something does not feel right.",
  };
}

export const forgeRouter = router({
  library: router({
    exercises: publicProcedure.input(libraryInput).query(async ({ input }) => {
      const persisted = await listDbExercises();
      const catalog = (persisted ?? seedExercises).filter(isEquipmentFree);
      const query = input?.search?.trim().toLowerCase();
      return catalog.filter((item) => {
        const searchable = `${item.name} ${item.category} ${item.muscleGroup} ${item.description}`.toLowerCase();
        return isEquipmentFree(item) && (!query || searchable.includes(query)) && (!input?.muscleGroup || item.muscleGroup.toLowerCase().includes(input.muscleGroup.toLowerCase())) && (!input?.difficulty || item.difficulty === input.difficulty) && (!input?.goal || item.category === input.goal) && (!input?.maxDuration || item.durationMinutes <= input.maxDuration);
      }).map((item) => ({ ...item, equipment: "None" }));
    }),
    exercise: publicProcedure.input(z.object({ slug: z.string().min(1).max(120) })).query(async ({ input }) => {
      const persisted = await listDbExercises();
      const catalog = (persisted ?? seedExercises).filter(isEquipmentFree);
      const item = catalog.find((record) => record.slug === input.slug);
      return item ? { ...item, equipment: "None" } : null;
    }),
  }),
  programs: router({
    list: publicProcedure.query(async () => {
      const persisted = await listDbPrograms();
      if (persisted === null) return seedPrograms;
      const priority = new Map(seedPrograms.map((program, index) => [program.slug, index]));
      return persisted.filter(isEquipmentFree)
        .map((item) => ({ ...item, equipment: "None required", sampleWorkouts: parseSampleWorkouts(item.sampleWorkouts) }))
        .sort((left, right) => (priority.get(left.slug) ?? 999) - (priority.get(right.slug) ?? 999) || left.name.localeCompare(right.name));
    }),
    detail: publicProcedure.input(z.object({ slug: z.string().min(1).max(120) })).query(async ({ input }) => {
      const persisted = await listDbPrograms();
      if (persisted === null) return seedPrograms.find((item) => item.slug === input.slug) ?? null;
      const item = persisted.find((record) => record.slug === input.slug && isEquipmentFree(record));
      return item ? { ...item, equipment: "None required", sampleWorkouts: parseSampleWorkouts(item.sampleWorkouts) } : null;
    }),
  }),
  meals: router({
    list: publicProcedure.query(async () => (await listDbMeals()) ?? seedMeals),
    plan: publicProcedure.input(z.object({ style: z.enum(["Flexible", "Vegetarian", "Quick meals"]), days: z.number().int().min(1).max(7) })).mutation(async ({ input }) => {
      const persisted = await listDbMeals();
      const pool = (persisted?.length ? persisted : seedMeals).filter((meal) => input.style !== "Vegetarian" || !/egg|chicken|fish/i.test(`${meal.name} ${meal.ingredients}`));
      const plan = Array.from({ length: input.days }, (_, day) => ({
        day: day + 1,
        breakfast: pool[(day + (input.style === "Quick meals" ? 2 : 0)) % pool.length],
        lunch: pool[(day + 1) % pool.length],
        dinner: pool[(day + 3) % pool.length],
        snack: pool[(day + 4) % pool.length],
      }));
      return { plan, label: "Preference-based starting point · not medical advice", note: "Swap meals freely, follow your appetite, and use foods that work for your household and budget." };
    }),
  }),
  recommendation: router({
    generate: publicProcedure.input(z.object({ duration: z.number().int().refine((n) => [10, 20, 30, 45, 60].includes(n)), focus: z.enum(["Strength", "Full Body", "Mobility", "Energy", "Recovery"]), level: z.enum(["Beginner", "Intermediate", "Advanced"]) })).mutation(({ input }) => buildWorkout(input)),
  }),
  profile: router({
    get: protectedProcedure.query(({ ctx }) => getProfile(ctx.user.id)),
    update: protectedProcedure.input(z.object({ ageRange: z.string().max(32).nullable().optional(), fitnessLevel: z.enum(["Beginner", "Intermediate", "Advanced"]), primaryGoal: z.enum(["Build strength", "Move better", "Improve energy", "Build consistency", "Feel capable"]), availableTime: z.enum(["10", "20", "30", "45", "60"]), preferredDays: z.string().max(100).optional() })).mutation(async ({ ctx, input }) => {
      await saveProfile(ctx.user.id, { ageRange: input.ageRange ?? null, fitnessLevel: input.fitnessLevel, primaryGoal: input.primaryGoal, availableTime: input.availableTime, equipment: "None", preferredDays: input.preferredDays ?? null });
      return { saved: true };
    }),
  }),
  workouts: router({
    complete: protectedProcedure.input(z.object({ workoutId: z.string().min(1).max(180), workoutName: z.string().min(1).max(180), focus: z.string().min(1).max(48), durationMinutes: z.number().int().min(1).max(120), exercisesCompleted: z.number().int().min(1).max(20) })).mutation(async ({ ctx, input }) => {
      await saveWorkout({ userId: ctx.user.id, ...input });
      const sessions = await listSessions(ctx.user.id, 1000);
      const achievement = sessions.length === 1 ? "First session" : sessions.length === 5 ? "Five sessions completed" : null;
      return { saved: true, achievement, totalSessions: sessions.length };
    }),
  }),
  progress: router({
    list: protectedProcedure.query(({ ctx }) => listProgress(ctx.user.id)),
    record: protectedProcedure.input(z.object({ metric: z.enum(["energy", "sleep", "mobility", "mood", "strength", "hydration"]), value: z.number().int().min(1).max(10), note: z.string().max(240).optional() })).mutation(async ({ ctx, input }) => {
      await saveProgress({ userId: ctx.user.id, metric: input.metric, value: input.value, note: input.note ?? null });
      return { saved: true };
    }),
  }),
  dashboard: router({
    summary: protectedProcedure.query(async ({ ctx }) => {
      const [profile, sessions, progress] = await Promise.all([getProfile(ctx.user.id), listSessions(ctx.user.id, 12), listProgress(ctx.user.id, 40)]);
      const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const thisWeek = sessions.filter((session) => new Date(session.completedAt).getTime() >= since).length;
      const preferredFocus = profile?.primaryGoal === "Move better" ? "Mobility" : profile?.primaryGoal === "Improve energy" ? "Energy" : "Strength";
      const trainedRecently = sessions[0] && Date.now() - new Date(sessions[0].completedAt).getTime() < 24 * 60 * 60 * 1000;
      const focus = trainedRecently ? "Recovery" : preferredFocus;
      const recommendation = await buildWorkout({ duration: Number(profile?.availableTime || 20), focus, level: profile?.fitnessLevel || "Beginner" });
      return { name: ctx.user.name?.split(" ")[0] || "there", profile, sessions, progress, recommendation, weeklySessions: thisWeek, totalSessions: sessions.length, achievements: sessions.length ? ["First session"] : [] };
    }),
    history: protectedProcedure.query(({ ctx }) => listSessions(ctx.user.id, 100)),
  }),
  community: router({
    posts: publicProcedure.query(() => listCommunityPosts()),
    post: protectedProcedure.input(z.object({ content: z.string().min(3).max(280), kind: z.enum(["milestone", "encouragement"]) })).mutation(async ({ ctx, input }) => { await createCommunityPost(ctx.user.id, input.content, input.kind); return { posted: true }; }),
    support: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => { await supportCommunityPost(input.id); return { supported: true }; }),
    joinChallenge: protectedProcedure.input(z.object({ slug: z.string().min(1).max(120) })).mutation(({ ctx, input }) => joinChallenge(ctx.user.id, input.slug)),
  }),
  admin: router({
    dashboard: adminProcedure.query(() => adminMetrics()),
    users: adminProcedure.query(() => adminUsers()),
    exercises: adminProcedure.query(async () => {
      const persisted = await listDbExercises();
      return (persisted ?? seedExercises).filter(isEquipmentFree).map((item) => ({ ...item, equipment: "None" }));
    }),
    setUserRole: adminProcedure.input(z.object({ userId: z.number().int().positive(), role: z.enum(["user", "admin"]) })).mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id && input.role === "user") throw new TRPCError({ code: "FORBIDDEN", message: "You cannot remove your own administrator access." });
      const result = await updateUserRole(input.userId, input.role);
      if (result === "not-found") throw new TRPCError({ code: "NOT_FOUND", message: "That member account was not found." });
      if (result === "last-admin") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The last administrator cannot be demoted." });
      return { updated: true, role: input.role };
    }),
    createExercise: adminProcedure.input(exerciseFields).mutation(async ({ input }) => { await createDbExercise({ ...input, equipment: "None", slug: slugify(input.name) }); return { saved: true }; }),
    updateExercise: adminProcedure.input(z.object({ id: z.number().int().positive(), values: exerciseFields.partial() })).mutation(async ({ input }) => { await updateDbExercise(input.id, { ...input.values, equipment: "None" }); return { saved: true }; }),
    deleteExercise: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => { await deleteDbExercise(input.id); return { deleted: true }; }),
    createProgram: adminProcedure.input(programFields).mutation(async ({ input }) => {
      const { sampleWorkouts, ...fields } = input;
      await createDbProgram({ ...fields, equipment: "None required", sampleWorkouts: JSON.stringify(sampleWorkouts), slug: slugify(input.name) });
      return { saved: true };
    }),
    updateProgram: adminProcedure.input(z.object({ id: z.number().int().positive(), values: programFields.partial() })).mutation(async ({ input }) => {
      const { sampleWorkouts, ...fields } = input.values;
      await updateDbProgram(input.id, { ...fields, equipment: "None required", ...(sampleWorkouts !== undefined ? { sampleWorkouts: JSON.stringify(sampleWorkouts) } : {}) });
      return { saved: true };
    }),
    deleteProgram: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => { await deleteDbProgram(input.id); return { deleted: true }; }),
    createMeal: adminProcedure.input(mealFields).mutation(async ({ input }) => { await createDbMeal(input); return { saved: true }; }),
    updateMeal: adminProcedure.input(z.object({ id: z.number().int().positive(), values: mealFields.partial() })).mutation(async ({ input }) => { await updateDbMeal(input.id, input.values); return { saved: true }; }),
    deleteMeal: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => { await deleteDbMeal(input.id); return { deleted: true }; }),
    upload: adminProcedure.input(z.object({ filename: z.string().min(1).max(180), mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"]), dataBase64: z.string().min(1).max(12_000_000) })).mutation(async ({ ctx, input }) => {
      const bytes = Buffer.from(input.dataBase64, "base64");
      if (!bytes.length || bytes.byteLength > 8 * 1024 * 1024) throw new TRPCError({ code: "BAD_REQUEST", message: "Media files must be smaller than 8 MB." });
      const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-100);
      const { key, url } = await storagePut(`forge/${ctx.user.id}/${nanoid(8)}-${safeName}`, bytes, input.mimeType);
      return { key, url };
    }),
  }),
});
