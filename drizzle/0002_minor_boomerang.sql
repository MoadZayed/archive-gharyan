CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`text` text NOT NULL,
	`fileID` int NOT NULL,
	`studentID` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentID` int NOT NULL,
	`fileID` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fileVotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fileID` int NOT NULL,
	`studentID` int NOT NULL,
	`voteType` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fileVotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('LIKE','SYSTEM') NOT NULL DEFAULT 'SYSTEM',
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `semesterVotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentID` int NOT NULL,
	`voteDate` timestamp NOT NULL DEFAULT (now()),
	`isNewSemester` boolean NOT NULL,
	CONSTRAINT `semesterVotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `semesters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`startDate` timestamp NOT NULL DEFAULT (now()),
	`isActive` boolean NOT NULL DEFAULT true,
	`consensusReached` boolean NOT NULL DEFAULT false,
	CONSTRAINT `semesters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userCourses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentID` int NOT NULL,
	`courseName` varchar(255) NOT NULL,
	`courseCode` varchar(50),
	`semester` varchar(20),
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userCourses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `students` MODIFY COLUMN `studentID` varchar(50);--> statement-breakpoint
ALTER TABLE `students` MODIFY COLUMN `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `academicFiles` ADD `courseCode` varchar(20);--> statement-breakpoint
ALTER TABLE `academicFiles` ADD `doctorName` varchar(255);--> statement-breakpoint
ALTER TABLE `academicFiles` ADD `fileHash` varchar(64);--> statement-breakpoint
ALTER TABLE `academicFiles` ADD `lectureNumber` int;--> statement-breakpoint
ALTER TABLE `academicFiles` ADD `academicYear` varchar(20);--> statement-breakpoint
ALTER TABLE `academicFiles` ADD `views` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `academicFiles` ADD `downloads` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `academicFiles` ADD `isApproved` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `academicFiles` ADD `reportsCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `academicFiles` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `academicFiles` ADD `status` enum('uploading','processing','ready','failed') DEFAULT 'ready' NOT NULL;--> statement-breakpoint
ALTER TABLE `academicFiles` ADD `failReason` text;--> statement-breakpoint
ALTER TABLE `students` ADD `googleId` varchar(255);--> statement-breakpoint
ALTER TABLE `students` ADD `role` enum('student','professor','admin') DEFAULT 'student' NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `students` ADD `resetToken` varchar(255);--> statement-breakpoint
ALTER TABLE `students` ADD `resetTokenExpiry` timestamp;--> statement-breakpoint
ALTER TABLE `students` ADD `securityQuestion` text;--> statement-breakpoint
ALTER TABLE `students` ADD `securityAnswerHash` varchar(255);--> statement-breakpoint
ALTER TABLE `students` ADD `failedAttempts` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `lockoutUntil` timestamp;--> statement-breakpoint
ALTER TABLE `students` ADD `enrolledCourses` text;--> statement-breakpoint
ALTER TABLE `students` ADD `coursesUpdatedAt` timestamp;--> statement-breakpoint
ALTER TABLE `students` ADD `lastInteractionAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `students` ADD `isAccountLocked` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `students` ADD `petals` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `verificationStatus` enum('PENDING','VERIFIED','REJECTED') DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `onboardingCompleted` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `googleId` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `academicFiles` ADD CONSTRAINT `academicFiles_fileHash_unique` UNIQUE(`fileHash`);--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_googleId_unique` UNIQUE(`googleId`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_googleId_unique` UNIQUE(`googleId`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `isRead_idx` ON `notifications` (`isRead`);--> statement-breakpoint
CREATE INDEX `courseCode_idx` ON `academicFiles` (`courseCode`);--> statement-breakpoint
CREATE INDEX `uploader_idx` ON `academicFiles` (`uploadedByStudentID`);--> statement-breakpoint
CREATE INDEX `fileHash_idx` ON `academicFiles` (`fileHash`);--> statement-breakpoint
CREATE INDEX `deletedAt_idx` ON `academicFiles` (`deletedAt`);