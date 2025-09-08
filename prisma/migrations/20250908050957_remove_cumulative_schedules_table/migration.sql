/*
  Warnings:

  - You are about to drop the `cumulative_schedules` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."cumulative_schedules" DROP CONSTRAINT "cumulative_schedules_project_id_fkey";

-- DropTable
DROP TABLE "public"."cumulative_schedules";
