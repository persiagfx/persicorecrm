ALTER TABLE `PortalUser` ADD COLUMN `resetToken` VARCHAR(191) NULL, ADD COLUMN `resetTokenExpiry` DATETIME(3) NULL, ADD UNIQUE INDEX `PortalUser_resetToken_key` (`resetToken`);
