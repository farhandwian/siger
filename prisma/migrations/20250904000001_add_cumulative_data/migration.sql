-- CreateTable
CREATE TABLE "cumulative_schedules" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "cumulative_plan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cumulative_actual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cumulative_deviation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cumulative_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cumulative_schedules_project_id_month_year_week_key" ON "cumulative_schedules"("project_id", "month", "year", "week");

-- AddForeignKey
ALTER TABLE "cumulative_schedules" ADD CONSTRAINT "cumulative_schedules_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
