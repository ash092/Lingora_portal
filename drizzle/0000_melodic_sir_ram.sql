CREATE TABLE `admin_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`role` enum('vendor_manager','super_admin') NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp,
	CONSTRAINT `admin_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_accounts_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `admin_sessions` (
	`id` varchar(64) NOT NULL,
	`adminId` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorId` int NOT NULL,
	`actorName` varchar(255),
	`actorType` enum('admin','freelancer') NOT NULL,
	`action` varchar(255) NOT NULL,
	`entityType` varchar(100),
	`entityId` int,
	`details` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`freelancerId` int,
	`adminId` int NOT NULL,
	`adminName` varchar(255),
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`recipientName` varchar(255),
	`status` enum('sent','failed') NOT NULL DEFAULT 'sent',
	`isBatch` boolean NOT NULL DEFAULT false,
	`batchId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `freelancer_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`freelancerId` int NOT NULL,
	`adminId` int NOT NULL,
	`adminName` varchar(255),
	`note` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `freelancer_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `freelancers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`country` varchar(100),
	`services` json NOT NULL,
	`sourceLanguages` json,
	`targetLanguages` json,
	`areasOfExpertise` json,
	`catTools` json,
	`authoringTools` json,
	`rates` json,
	`linkedinUrl` text,
	`prozUrl` text,
	`cvFileKey` text,
	`cvFileUrl` text,
	`cvFileName` text,
	`portfolioFiles` json,
	`paymentMethod` enum('payoneer','bank_transfer'),
	`payoneerEmail` varchar(320),
	`bankAccountName` varchar(255),
	`bankAccountNumber` varchar(100),
	`bankName` varchar(255),
	`bankSwiftCode` varchar(20),
	`bankIban` varchar(50),
	`bankCountry` varchar(100),
	`status` enum('pending','active','inactive') NOT NULL DEFAULT 'pending',
	`tier` enum('tier1','tier2','tier3'),
	`tierNote` text,
	`passwordHash` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `freelancers_id` PRIMARY KEY(`id`),
	CONSTRAINT `freelancers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`freelancerId` int NOT NULL,
	`poId` int,
	`poNumber` varchar(50),
	`serviceDescription` text NOT NULL,
	`languagePair` varchar(100),
	`quantity` decimal(10,2) NOT NULL,
	`unit` varchar(50) NOT NULL,
	`rate` decimal(10,4) NOT NULL,
	`currency` enum('USD','EUR','EGP') NOT NULL DEFAULT 'USD',
	`totalAmount` decimal(12,2) NOT NULL,
	`invoiceDate` timestamp NOT NULL,
	`dueDate` timestamp NOT NULL,
	`invoiceFileKey` text,
	`invoiceFileUrl` text,
	`invoiceFileName` text,
	`status` enum('submitted','under_review','approved','rejected','paid') NOT NULL DEFAULT 'submitted',
	`adminNote` text,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`freelancerId` int NOT NULL,
	`senderRole` enum('admin','vendor') NOT NULL,
	`senderName` varchar(255),
	`body` text NOT NULL,
	`poId` int,
	`invoiceId` int,
	`isReadByAdmin` boolean NOT NULL DEFAULT false,
	`isReadByVendor` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchase_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`poNumber` varchar(50) NOT NULL,
	`freelancerId` int NOT NULL,
	`projectName` varchar(255) NOT NULL,
	`serviceType` varchar(100) NOT NULL,
	`languagePair` varchar(100),
	`description` text,
	`quantity` decimal(10,2) NOT NULL,
	`unit` varchar(50) NOT NULL,
	`rate` decimal(10,4) NOT NULL,
	`currency` enum('USD','EUR','EGP') NOT NULL DEFAULT 'USD',
	`totalValue` decimal(12,2) NOT NULL,
	`dueDate` timestamp,
	`status` enum('draft','sent','accepted','declined','completed','cancelled') NOT NULL DEFAULT 'draft',
	`freelancerNote` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`sentAt` timestamp,
	`respondedAt` timestamp,
	CONSTRAINT `purchase_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `purchase_orders_poNumber_unique` UNIQUE(`poNumber`)
);
--> statement-breakpoint
DROP TABLE `posts`;