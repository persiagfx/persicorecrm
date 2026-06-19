-- Blog Migration — run this on your MySQL server if prisma migrate dev fails
-- Usage: mysql -u persicore -p persicore_crm < manual_blog_migration.sql

CREATE TABLE IF NOT EXISTS `BlogCategory` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `color` VARCHAR(191) NOT NULL DEFAULT '#8B5CF6',
  `order` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `BlogCategory_slug_key` (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `BlogPost` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `excerpt` TEXT NULL,
  `content` LONGTEXT NOT NULL,
  `mdxContent` LONGTEXT NULL,
  `contentType` VARCHAR(191) NOT NULL DEFAULT 'rich',
  `coverImage` VARCHAR(191) NULL,
  `authorId` VARCHAR(191) NOT NULL,
  `categoryId` VARCHAR(191) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
  `featured` BOOLEAN NOT NULL DEFAULT false,
  `publishedAt` DATETIME(3) NULL,
  `scheduledAt` DATETIME(3) NULL,
  `readingTime` INT NOT NULL DEFAULT 0,
  `views` INT NOT NULL DEFAULT 0,
  `seoTitle` VARCHAR(191) NULL,
  `seoDesc` TEXT NULL,
  `seoKeywords` VARCHAR(191) NULL,
  `ogImage` VARCHAR(191) NULL,
  `tags` JSON NOT NULL DEFAULT '[]',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `BlogPost_slug_key` (`slug`),
  INDEX `BlogPost_status_publishedAt_idx` (`status`, `publishedAt`),
  INDEX `BlogPost_slug_idx` (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `BlogPost`
  ADD CONSTRAINT `BlogPost_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `BlogPost_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `BlogCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS `SiteSettings` (
  `id` VARCHAR(191) NOT NULL DEFAULT 'main',
  `siteName` VARCHAR(191) NOT NULL DEFAULT 'Persicore',
  `siteTagline` VARCHAR(191) NULL,
  `siteDesc` TEXT NULL,
  `logoUrl` VARCHAR(191) NULL,
  `faviconUrl` VARCHAR(191) NULL,
  `seoKeywords` VARCHAR(191) NULL,
  `googleAnalytics` VARCHAR(191) NULL,
  `twitter` VARCHAR(191) NULL,
  `instagram` VARCHAR(191) NULL,
  `linkedin` VARCHAR(191) NULL,
  `github` VARCHAR(191) NULL,
  `blogPostsPerPage` INT NOT NULL DEFAULT 9,
  `blogShowAuthor` BOOLEAN NOT NULL DEFAULT true,
  `navItems` JSON NOT NULL DEFAULT '[]',
  `footerLinks` JSON NOT NULL DEFAULT '[]',
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Default site settings
INSERT IGNORE INTO `SiteSettings` (`id`, `siteName`, `updatedAt`) VALUES ('main', 'Persicore', NOW());
