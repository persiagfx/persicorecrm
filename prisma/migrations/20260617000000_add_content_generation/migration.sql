-- CreateEnum
CREATE TABLE IF NOT EXISTS `_prisma_migrations` (
    `id` VARCHAR(36) NOT NULL,
    `checksum` VARCHAR(64) NOT NULL,
    `finished_at` DATETIME(3),
    `migration_name` VARCHAR(255) NOT NULL,
    `logs` TEXT,
    `rolled_back_at` DATETIME(3),
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `applied_steps_count` INT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable add isSuperAdmin support (already handled in JWT)

-- CreateTable ContentUser
CREATE TABLE IF NOT EXISTS `ContentUser` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191),
    `phone` VARCHAR(191),
    `passwordHash` VARCHAR(191),
    `plan` ENUM('FREE', 'PRO', 'PLUS') NOT NULL DEFAULT 'FREE',
    `usedThisMonth` INT NOT NULL DEFAULT 0,
    `monthResetAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ContentUser_email_key`(`email`),
    UNIQUE INDEX `ContentUser_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable ContentSubscription
CREATE TABLE IF NOT EXISTS `ContentSubscription` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `plan` ENUM('FREE', 'PRO', 'PLUS') NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `expiresAt` DATETIME(3) NOT NULL,
    `zarinpalRefId` VARCHAR(191),
    `authority` VARCHAR(191),
    `amount` INT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ContentSubscription_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable ContentGeneration
CREATE TABLE IF NOT EXISTS `ContentGeneration` (
    `id` VARCHAR(191) NOT NULL,
    `contentUserId` VARCHAR(191),
    `crmUserId` VARCHAR(191),
    `platform` VARCHAR(191) NOT NULL,
    `language` VARCHAR(191) NOT NULL DEFAULT 'fa',
    `topic` VARCHAR(191) NOT NULL,
    `subtopics` JSON NOT NULL,
    `tone` VARCHAR(191) NOT NULL,
    `contentType` VARCHAR(191) NOT NULL,
    `keyword` VARCHAR(191),
    `textOutput` LONGTEXT NOT NULL,
    `editedText` LONGTEXT,
    `imageUrl` VARCHAR(191),
    `seoScore` INT,
    `metadata` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ContentGeneration_contentUserId_createdAt_idx`(`contentUserId`, `createdAt` DESC),
    INDEX `ContentGeneration_crmUserId_createdAt_idx`(`crmUserId`, `createdAt` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable ContentSettings
CREATE TABLE IF NOT EXISTS `ContentSettings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'global',
    `freePlanLimit` INT NOT NULL DEFAULT 5,
    `proPlanLimit` INT NOT NULL DEFAULT 20,
    `plusPlanLimit` INT NOT NULL DEFAULT 50,
    `proPlanPrice` INT NOT NULL DEFAULT 0,
    `plusPlanPrice` INT NOT NULL DEFAULT 0,
    `apiKey` VARCHAR(191) NOT NULL DEFAULT '',
    `textModel` VARCHAR(191) NOT NULL DEFAULT 'gpt-5.4',
    `imageModel` VARCHAR(191) NOT NULL DEFAULT 'gemini-3-pro-image-preview',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ContentSubscription` ADD CONSTRAINT `ContentSubscription_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `ContentUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ContentGeneration` ADD CONSTRAINT `ContentGeneration_contentUserId_fkey`
    FOREIGN KEY (`contentUserId`) REFERENCES `ContentUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
