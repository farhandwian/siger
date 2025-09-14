/*
  Warnings:

  - You are about to drop the `cumulative_scheduleplans` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."cumulative_scheduleplans" DROP CONSTRAINT "cumulative_scheduleplans_project_id_fkey";

-- DropTable
DROP TABLE "public"."cumulative_scheduleplans";
