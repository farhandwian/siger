-- CreateTable
CREATE TABLE "public"."activities" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sub_activities" (
    "id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activity_schedules" (
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

    CONSTRAINT "activity_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activity_schedules_activity_id_month_year_week_key" ON "public"."activity_schedules"("activity_id", "month", "year", "week");

-- CreateIndex
CREATE UNIQUE INDEX "activity_schedules_sub_activity_id_month_year_week_key" ON "public"."activity_schedules"("sub_activity_id", "month", "year", "week");

-- AddForeignKey
ALTER TABLE "public"."activities" ADD CONSTRAINT "activities_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sub_activities" ADD CONSTRAINT "sub_activities_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_schedules" ADD CONSTRAINT "activity_schedules_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_schedules" ADD CONSTRAINT "activity_schedules_sub_activity_id_fkey" FOREIGN KEY ("sub_activity_id") REFERENCES "public"."sub_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
