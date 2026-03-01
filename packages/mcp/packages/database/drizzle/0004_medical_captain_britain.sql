CREATE TABLE "adaptation_reflections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"adapted_lesson_id" uuid NOT NULL,
	"reflection_data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "adapted_lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lesson_title" text NOT NULL,
	"original_lesson_text" text NOT NULL,
	"adaptation_summary" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "selected_adaptations" CASCADE;--> statement-breakpoint
ALTER TABLE "adaptation_reflections" ADD CONSTRAINT "adaptation_reflections_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adaptation_reflections" ADD CONSTRAINT "adaptation_reflections_adapted_lesson_id_adapted_lessons_id_fk" FOREIGN KEY ("adapted_lesson_id") REFERENCES "public"."adapted_lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adapted_lessons" ADD CONSTRAINT "adapted_lessons_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."user"("id") ON DELETE no action ON UPDATE no action;