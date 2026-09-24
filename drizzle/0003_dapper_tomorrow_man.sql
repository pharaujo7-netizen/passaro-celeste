CREATE TABLE `medical_records` (
	`user_id` text PRIMARY KEY NOT NULL,
	`allergies` text,
	`medications` text,
	`conditions` text,
	`emergency_name` text,
	`emergency_phone` text,
	`updated_by` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
