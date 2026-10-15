CREATE TABLE `forge_challenge_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`challengeSlug` varchar(120) NOT NULL,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `forge_challenge_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forge_community_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`content` varchar(280) NOT NULL,
	`kind` enum('milestone','encouragement') NOT NULL DEFAULT 'milestone',
	`supportCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `forge_community_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forge_exercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(120) NOT NULL,
	`name` varchar(140) NOT NULL,
	`category` varchar(60) NOT NULL,
	`muscleGroup` varchar(100) NOT NULL,
	`difficulty` varchar(32) NOT NULL,
	`equipment` varchar(100) NOT NULL,
	`durationMinutes` int NOT NULL DEFAULT 5,
	`description` text NOT NULL,
	`benefits` text NOT NULL,
	`formInstructions` text NOT NULL,
	`commonMistakes` text NOT NULL,
	`correctMediaUrl` text,
	`wrongMediaUrl` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `forge_exercises_id` PRIMARY KEY(`id`),
	CONSTRAINT `forge_exercises_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `forge_meals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(140) NOT NULL,
	`category` varchar(60) NOT NULL,
	`description` text NOT NULL,
	`ingredients` text NOT NULL,
	`prepMinutes` int NOT NULL DEFAULT 20,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `forge_meals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forge_profiles` (
	`userId` int NOT NULL,
	`ageRange` varchar(32),
	`fitnessLevel` varchar(32) DEFAULT 'Beginner',
	`primaryGoal` varchar(80) DEFAULT 'Build strength',
	`availableTime` varchar(12) DEFAULT '20',
	`equipment` varchar(255) DEFAULT 'Bodyweight',
	`preferredDays` varchar(100),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `forge_profiles_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
CREATE TABLE `forge_programs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(120) NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text NOT NULL,
	`difficulty` varchar(32) NOT NULL,
	`durationWeeks` int NOT NULL,
	`equipment` varchar(180) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `forge_programs_id` PRIMARY KEY(`id`),
	CONSTRAINT `forge_programs_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `forge_progress_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`metric` enum('energy','sleep','mobility','mood','strength','hydration') NOT NULL,
	`value` int NOT NULL,
	`note` varchar(240),
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `forge_progress_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forge_workout_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workoutId` varchar(180) NOT NULL,
	`workoutName` varchar(180) NOT NULL,
	`focus` varchar(48) NOT NULL,
	`durationMinutes` int NOT NULL,
	`exercisesCompleted` int NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `forge_workout_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `forge_challenge_participants` ADD CONSTRAINT `forge_challenge_participants_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `forge_community_posts` ADD CONSTRAINT `forge_community_posts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `forge_profiles` ADD CONSTRAINT `forge_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `forge_progress_entries` ADD CONSTRAINT `forge_progress_entries_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `forge_workout_sessions` ADD CONSTRAINT `forge_workout_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;