-- CreateTable
CREATE TABLE "public"."action_plan_scheduleplans" (
    "id" TEXT NOT NULL,
    "activity_id" TEXT,
    "sub_activity_id" TEXT,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "plan_percentage" DOUBLE PRECISION DEFAULT 0,
    "actual_percentage" DOUBLE PRECISION DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "action_plan_scheduleplans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "action_plan_scheduleplans_activity_id_month_year_week_key" ON "public"."action_plan_scheduleplans"("activity_id", "month", "year", "week");

-- CreateIndex
CREATE UNIQUE INDEX "action_plan_scheduleplans_sub_activity_id_month_year_week_key" ON "public"."action_plan_scheduleplans"("sub_activity_id", "month", "year", "week");

-- AddForeignKey
ALTER TABLE "public"."action_plan_scheduleplans" ADD CONSTRAINT "action_plan_scheduleplans_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."action_plan_scheduleplans" ADD CONSTRAINT "action_plan_scheduleplans_sub_activity_id_fkey" FOREIGN KEY ("sub_activity_id") REFERENCES "public"."sub_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
