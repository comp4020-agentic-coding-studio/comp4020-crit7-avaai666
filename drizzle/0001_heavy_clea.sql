CREATE TABLE `activity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`course_code` text NOT NULL,
	`type` text NOT NULL,
	`group` text NOT NULL,
	`day` integer NOT NULL,
	`start_min` integer NOT NULL,
	`end_min` integer NOT NULL,
	FOREIGN KEY (`course_code`) REFERENCES `course`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activity_course_type_group_unique` ON `activity` (`course_code`,`type`,`group`);--> statement-breakpoint
CREATE TABLE `course` (
	`code` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pick` (
	`plan_id` text NOT NULL,
	`activity_id` integer NOT NULL,
	`course_code` text NOT NULL,
	`type` text NOT NULL,
	PRIMARY KEY(`plan_id`, `activity_id`),
	FOREIGN KEY (`activity_id`) REFERENCES `activity`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pick_plan_course_type_unique` ON `pick` (`plan_id`,`course_code`,`type`);