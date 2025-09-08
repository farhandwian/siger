/*
  Warnings:

  - A unique constraint covering the columns `[sub_activity_id,tanggal_progres,user_id]` on the table `daily_sub_activities` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `daily_sub_activities` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."daily_sub_activities_sub_activity_id_tanggal_progres_key";

-- AlterTable
ALTER TABLE "public"."daily_sub_activities" ADD COLUMN     "user_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "phone_number" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "daily_sub_activities_sub_activity_id_tanggal_progres_user_i_key" ON "public"."daily_sub_activities"("sub_activity_id", "tanggal_progres", "user_id");

-- AddForeignKey
ALTER TABLE "public"."daily_sub_activities" ADD CONSTRAINT "daily_sub_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
