CREATE TABLE "sedia_pos"."employee_outlets" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"outlet_id" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sedia_pos"."employees" ALTER COLUMN "outlet_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sedia_pos"."employees" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sedia_pos"."employee_outlets" ADD CONSTRAINT "employee_outlets_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "sedia_pos"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."employee_outlets" ADD CONSTRAINT "employee_outlets_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE cascade ON UPDATE no action;