CREATE TABLE `TeamConversation` (
  `id` VARCHAR(191) NOT NULL,
  `participantIds` JSON NOT NULL DEFAULT ('[]'),
  `isGroup` BOOLEAN NOT NULL DEFAULT false,
  `groupName` VARCHAR(191) NULL,
  `isPinned` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `TeamMessage` (
  `id` VARCHAR(191) NOT NULL,
  `conversationId` VARCHAR(191) NOT NULL,
  `senderId` VARCHAR(191) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `type` VARCHAR(191) NOT NULL DEFAULT 'text',
  `readBy` JSON NOT NULL DEFAULT ('[]'),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `TeamMessage_conversationId_idx` (`conversationId`),
  CONSTRAINT `TeamMessage_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `TeamConversation` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
