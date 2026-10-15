import { describe, expect, it } from "vitest";
import { seedExercises, seedPrograms, progressionTracks } from "../shared/catalog";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const baseContext = (user: TrpcContext["user"]): TrpcContext => ({
  user,
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

const member = {
  id: 21,
  openId: "forge-test-member",
  email: "member@example.test",
  name: "Forge Member",
  loginMethod: "manus",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const admin = { ...member, id: 22, openId: "forge-test-admin", role: "admin" as const };

describe("FORGE bodyweight recommendations and access control", () => {
  it("builds the exact six-movement 20-minute beginner strength session with no equipment input", async () => {
    const caller = appRouter.createCaller(baseContext(null));
    const result = await caller.forge.recommendation.generate({ duration: 20, focus: "Strength", level: "Beginner" });
    expect(result.name).toBe("20-Minute Full Body Strength");
    expect(result.duration).toBe(20);
    expect(result.exercises.map((exercise) => exercise.name)).toEqual([
      "Bodyweight Squat",
      "Incline Push-Up",
      "Reverse Lunge",
      "Glute Bridge",
      "Bird Dog",
      "Forearm Plank",
    ]);
    expect(result.exercises.every((exercise) => Boolean(exercise.formInstructions) && exercise.equipment === "None")).toBe(true);
    expect(result.note).toMatch(/No equipment or mat required/);
  });

  it("keeps all seeded movements and programs equipment-free and every progression step linked to a real movement", () => {
    expect(seedExercises.length).toBeGreaterThan(30);
    expect(seedExercises.every((exercise) => exercise.equipment === "None")).toBe(true);
    expect(seedPrograms.every((program) => program.equipment === "None required")).toBe(true);
    const exerciseSlugs = new Set(seedExercises.map((exercise) => exercise.slug));
    expect(progressionTracks.every((track) => track.steps.every((slug) => exerciseSlugs.has(slug)))).toBe(true);
    const names = new Set(seedExercises.map((exercise) => exercise.name));
    expect(names.has("Wall Push-Up")).toBe(true);
    expect(names.has("Incline Push-Up")).toBe(true);
    expect(names.has("Bent-Knee Leg Raise")).toBe(true);
  });

  it("creates complete no-gear recommendations across every offered duration and focus", async () => {
    const caller = appRouter.createCaller(baseContext(null));
    for (const duration of [10, 20, 30, 45, 60]) {
      for (const focus of ["Strength", "Full Body", "Mobility", "Energy", "Recovery"] as const) {
        const result = await caller.forge.recommendation.generate({ duration, focus, level: "Beginner" });
        expect(result.exercises.length).toBeGreaterThan(0);
        expect(result.exercises.every((exercise) => exercise.equipment === "None")).toBe(true);
        expect(result.exercises.every((exercise) => Boolean(exercise.formInstructions))).toBe(true);
      }
    }
  }, 20000);

  it("rejects a guest trying to complete a workout on the backend", async () => {
    const caller = appRouter.createCaller(baseContext(null));
    await expect(caller.forge.workouts.complete({
      workoutId: "20-strength-beginner",
      workoutName: "20-Minute Full Body Strength",
      focus: "Strength",
      durationMinutes: 20,
      exercisesCompleted: 6,
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("blocks regular members from administrator procedures", async () => {
    const caller = appRouter.createCaller(baseContext(member));
    await expect(caller.forge.admin.dashboard()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("blocks regular members from changing account roles", async () => {
    const caller = appRouter.createCaller(baseContext(member));
    await expect(caller.forge.admin.setUserRole({ userId: 23, role: "admin" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("prevents an administrator from removing their own access", async () => {
    const caller = appRouter.createCaller(baseContext(admin));
    await expect(caller.forge.admin.setUserRole({ userId: admin.id, role: "user" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("keeps administrator access available to administrator identities", async () => {
    const caller = appRouter.createCaller(baseContext(admin));
    const result = await caller.forge.admin.dashboard();
    expect(result.customExercises).toBeGreaterThanOrEqual(0);
    expect(result.totalUsers).toBeGreaterThanOrEqual(0);
  });
});
