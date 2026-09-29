/*
  Warnings:

  - A unique constraint covering the columns `[checkoutRequestId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "GalleryCategory" AS ENUM ('EXTERIOR', 'ROOM', 'SPA', 'GYM', 'POOL', 'CONFERENCE', 'DINING', 'GROUNDS');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "checkoutRequestId" TEXT,
ADD COLUMN     "phoneNumber" TEXT;

-- AlterTable
ALTER TABLE "room_types" ADD COLUMN     "images" TEXT[];

-- CreateTable
CREATE TABLE "gallery_images" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "category" "GalleryCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gallery_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_checkoutRequestId_key" ON "payments"("checkoutRequestId");
