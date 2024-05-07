-- CreateTable
CREATE TABLE `CryptoCurrency` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `short_name` VARCHAR(191) NOT NULL,
    `price` VARCHAR(191) NOT NULL,
    `day_percent` VARCHAR(191) NOT NULL,
    `is_positive` BOOLEAN NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CryptoCurrency_short_name_key`(`short_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
