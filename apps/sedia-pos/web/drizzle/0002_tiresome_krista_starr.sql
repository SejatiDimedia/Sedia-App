CREATE TABLE "sedia_pos"."payment_methods" (
	"id" text PRIMARY KEY NOT NULL,
	"outlet_id" text,
	"name" text NOT NULL,
	"type" text DEFAULT 'cash' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sedia_pos"."roles" (
	"id" text PRIMARY KEY NOT NULL,
	"outlet_id" text,
	"name" text NOT NULL,
	"description" text,
	"permissions" text NOT NULL,
	"is_system" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sedia_pos"."shifts" (
	"id" text PRIMARY KEY NOT NULL,
	"outlet_id" text,
	"employee_id" text,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp,
	"starting_cash" numeric(15, 2) NOT NULL,
	"ending_cash" numeric(15, 2),
	"expected_cash" numeric(15, 2),
	"difference" numeric(15, 2),
	"status" text DEFAULT 'open' NOT NULL,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "sedia_pos"."employees" ADD COLUMN "role_id" text;--> statement-breakpoint
ALTER TABLE "sedia_pos"."payment_methods" ADD CONSTRAINT "payment_methods_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."roles" ADD CONSTRAINT "roles_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."shifts" ADD CONSTRAINT "shifts_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."shifts" ADD CONSTRAINT "shifts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "sedia_pos"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."employees" ADD CONSTRAINT "employees_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "sedia_pos"."roles"("id") ON DELETE no action ON UPDATE no action;