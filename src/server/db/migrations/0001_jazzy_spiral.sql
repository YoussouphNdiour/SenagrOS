CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"type" varchar(20) NOT NULL,
	"client_name" varchar(255) NOT NULL,
	"client_email" varchar(255),
	"client_phone" varchar(30),
	"client_address" text,
	"items" jsonb DEFAULT '[]'::jsonb,
	"total_amount" numeric(15, 2) NOT NULL,
	"tax_amount" numeric(15, 2) DEFAULT '0',
	"status" varchar(20) DEFAULT 'draft',
	"issue_date" timestamp with time zone NOT NULL,
	"due_date" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"notes" text,
	"data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"label" varchar(500) NOT NULL,
	"debit" numeric(15, 2) DEFAULT '0',
	"credit" numeric(15, 2) DEFAULT '0',
	"category" varchar(50),
	"account" varchar(100),
	"transaction_id" uuid,
	"invoice_id" uuid,
	"reference" varchar(100),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"category" varchar(50),
	"description" varchar(500) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"client_name" varchar(255),
	"product_name" varchar(255),
	"quantity" numeric(15, 4),
	"unit_price" numeric(15, 2),
	"unit" varchar(20),
	"payment_method" varchar(30),
	"status" varchar(20) DEFAULT 'completed',
	"notes" text,
	"data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invoices_farm_id_idx" ON "invoices" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "invoices_type_idx" ON "invoices" USING btree ("type");--> statement-breakpoint
CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "journal_entries_farm_id_idx" ON "journal_entries" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "journal_entries_date_idx" ON "journal_entries" USING btree ("date");--> statement-breakpoint
CREATE INDEX "transactions_farm_id_idx" ON "transactions" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "transactions_type_idx" ON "transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "transactions_date_idx" ON "transactions" USING btree ("date");