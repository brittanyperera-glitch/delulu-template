CREATE TYPE "public"."bet_status" AS ENUM('proposed', 'open', 'declined', 'settled');--> statement-breakpoint
CREATE TYPE "public"."bomb_trigger" AS ENUM('day', 'count', 'event');--> statement-breakpoint
CREATE TYPE "public"."dare_status" AS ENUM('open', 'accepted', 'negotiating', 'chickened', 'done');--> statement-breakpoint
CREATE TYPE "public"."jar_size" AS ENUM('tiny', 'tonight', 'weekend', 'planning', 'feral');--> statement-breakpoint
CREATE TYPE "public"."post_type" AS ENUM('text', 'photo', 'link', 'voice', 'video');--> statement-breakpoint
CREATE TYPE "public"."verdict" AS ENUM('fulfilled', 'delulu');--> statement-breakpoint
CREATE TABLE "bets" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" integer NOT NULL,
	"proposer" text NOT NULL,
	"opponent" text NOT NULL,
	"claim" text NOT NULL,
	"stakes" text NOT NULL,
	"status" "bet_status" DEFAULT 'proposed' NOT NULL,
	"loser" text,
	"receipt_post_id" integer,
	"settled_day" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bets_two_people" CHECK ("bets"."proposer" <> "bets"."opponent"),
	CONSTRAINT "bets_loser_is_party" CHECK ("bets"."loser" is null or "bets"."loser" in ("bets"."proposer", "bets"."opponent"))
);
--> statement-breakpoint
CREATE TABLE "bombs" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" integer NOT NULL,
	"sender" text NOT NULL,
	"recipient" text NOT NULL,
	"body" text NOT NULL,
	"skin_id" integer NOT NULL,
	"armed_day" integer NOT NULL,
	"detonate_day" integer,
	"trigger_kind" "bomb_trigger" DEFAULT 'day' NOT NULL,
	"trigger_payload" jsonb,
	"post_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bombs_two_people" CHECK ("bombs"."sender" <> "bombs"."recipient")
);
--> statement-breakpoint
CREATE TABLE "checkpoints" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" integer NOT NULL,
	"day" integer NOT NULL,
	"recap_json" jsonb,
	"jar_item_id" integer,
	"post_id" integer,
	"opened_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"author" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dares" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" integer NOT NULL,
	"darer" text NOT NULL,
	"dared" text NOT NULL,
	"body" text NOT NULL,
	"stake" text,
	"status" "dare_status" DEFAULT 'open' NOT NULL,
	"counter" text,
	"done_post_id" integer,
	"done_day" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dares_two_people" CHECK ("dares"."darer" <> "dares"."dared")
);
--> statement-breakpoint
CREATE TABLE "delusions" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" integer NOT NULL,
	"about" text NOT NULL,
	"added_by" text NOT NULL,
	"body" text NOT NULL,
	"skin_id" integer,
	"trululu_post_id" integer,
	"trululu_day" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jar_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" integer NOT NULL,
	"author" text NOT NULL,
	"body" text NOT NULL,
	"size" "jar_size" NOT NULL,
	"put_back_count" integer DEFAULT 0 NOT NULL,
	"drawn_at" timestamp with time zone,
	"drawn_by" text,
	"done_post_id" integer,
	"done_day" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manifesto_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" integer NOT NULL,
	"body" text NOT NULL,
	"author" text NOT NULL,
	"day" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"slug" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"colour" text NOT NULL,
	"sort_order" integer NOT NULL,
	CONSTRAINT "members_slug_format" CHECK ("members"."slug" ~ '^[a-z0-9-]{1,32}$')
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" integer NOT NULL,
	"author" text NOT NULL,
	"day" integer NOT NULL,
	"skin_id" integer NOT NULL,
	"type" "post_type" NOT NULL,
	"body" text,
	"media_url" text,
	"media_seconds" integer,
	"link_meta" jsonb,
	"stamps" text[] DEFAULT '{}'::text[] NOT NULL,
	"paper" text,
	"source" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"hidden_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "prophecies" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" integer NOT NULL,
	"author" text NOT NULL,
	"about" text NOT NULL,
	"body" text NOT NULL,
	"day" integer DEFAULT 1 NOT NULL,
	"verdict" "verdict",
	"verdict_day" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"author" text NOT NULL,
	"word" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"day_one" date NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "skins" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" integer NOT NULL,
	"owner" text NOT NULL,
	"name" text NOT NULL,
	"portrait_url" text,
	"line" text,
	"paper" text,
	"pattern" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spoilers" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" integer NOT NULL,
	"image_url" text NOT NULL,
	"line" text,
	"skin_id" integer,
	"happened_day" integer,
	"post_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "track_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"track_id" integer NOT NULL,
	"author" text NOT NULL,
	"body" text NOT NULL,
	"parent_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" integer NOT NULL,
	"author" text NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"artist" text,
	"art_url" text,
	"provider" text,
	"day" integer DEFAULT 1 NOT NULL,
	"post_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by" text,
	CONSTRAINT "tracks_not_self_approved" CHECK ("tracks"."approved_by" is null or "tracks"."approved_by" <> "tracks"."author")
);
--> statement-breakpoint
CREATE TABLE "truth_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" integer NOT NULL,
	"day" integer NOT NULL,
	"author" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_proposer_members_slug_fk" FOREIGN KEY ("proposer") REFERENCES "public"."members"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_opponent_members_slug_fk" FOREIGN KEY ("opponent") REFERENCES "public"."members"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_loser_members_slug_fk" FOREIGN KEY ("loser") REFERENCES "public"."members"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_receipt_post_id_posts_id_fk" FOREIGN KEY ("receipt_post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bombs" ADD CONSTRAINT "bombs_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bombs" ADD CONSTRAINT "bombs_sender_members_slug_fk" FOREIGN KEY ("sender") REFERENCES "public"."members"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bombs" ADD CONSTRAINT "bombs_recipient_members_slug_fk" FOREIGN KEY ("recipient") REFERENCES "public"."members"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bombs" ADD CONSTRAINT "bombs_skin_id_skins_id_fk" FOREIGN KEY ("skin_id") REFERENCES "public"."skins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bombs" ADD CONSTRAINT "bombs_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkpoints" ADD CONSTRAINT "checkpoints_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkpoints" ADD CONSTRAINT "checkpoints_jar_item_id_jar_items_id_fk" FOREIGN KEY ("jar_item_id") REFERENCES "public"."jar_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkpoints" ADD CONSTRAINT "checkpoints_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkpoints" ADD CONSTRAINT "checkpoints_opened_by_members_slug_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."members"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_members_slug_fk" FOREIGN KEY ("author") REFERENCES "public"."members"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dares" ADD CONSTRAINT "dares_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dares" ADD CONSTRAINT "dares_darer_members_slug_fk" FOREIGN KEY ("darer") REFERENCES "public"."members"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dares" ADD CONSTRAINT "dares_dared_members_slug_fk" FOREIGN KEY ("dared") REFERENCES "public"."members"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dares" ADD CONSTRAINT "dares_done_post_id_posts_id_fk" FOREIGN KEY ("done_post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delusions" ADD CONSTRAINT "delusions_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delusions" ADD CONSTRAINT "delusions_about_members_slug_fk" FOREIGN KEY ("about") REFERENCES "public"."members"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delusions" ADD CONSTRAINT "delusions_added_by_members_slug_fk" FOREIGN KEY ("added_by") REFERENCES "public"."members"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delusions" ADD CONSTRAINT "delusions_skin_id_skins_id_fk" FOREIGN KEY ("skin_id") REFERENCES "public"."skins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delusions" ADD CONSTRAINT "delusions_trululu_post_id_posts_id_fk" FOREIGN KEY ("trululu_post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jar_items" ADD CONSTRAINT "jar_items_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jar_items" ADD CONSTRAINT "jar_items_author_members_slug_fk" FOREIGN KEY ("author") REFERENCES "public"."members"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jar_items" ADD CONSTRAINT "jar_items_drawn_by_members_slug_fk" FOREIGN KEY ("drawn_by") REFERENCES "public"."members"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jar_items" ADD CONSTRAINT "jar_items_done_post_id_posts_id_fk" FOREIGN KEY ("done_post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manifesto_versions" ADD CONSTRAINT "manifesto_versions_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manifesto_versions" ADD CONSTRAINT "manifesto_versions_author_members_slug_fk" FOREIGN KEY ("author") REFERENCES "public"."members"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_members_slug_fk" FOREIGN KEY ("author") REFERENCES "public"."members"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_skin_id_skins_id_fk" FOREIGN KEY ("skin_id") REFERENCES "public"."skins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prophecies" ADD CONSTRAINT "prophecies_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prophecies" ADD CONSTRAINT "prophecies_author_members_slug_fk" FOREIGN KEY ("author") REFERENCES "public"."members"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prophecies" ADD CONSTRAINT "prophecies_about_members_slug_fk" FOREIGN KEY ("about") REFERENCES "public"."members"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_author_members_slug_fk" FOREIGN KEY ("author") REFERENCES "public"."members"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skins" ADD CONSTRAINT "skins_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skins" ADD CONSTRAINT "skins_owner_members_slug_fk" FOREIGN KEY ("owner") REFERENCES "public"."members"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spoilers" ADD CONSTRAINT "spoilers_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spoilers" ADD CONSTRAINT "spoilers_skin_id_skins_id_fk" FOREIGN KEY ("skin_id") REFERENCES "public"."skins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spoilers" ADD CONSTRAINT "spoilers_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_comments" ADD CONSTRAINT "track_comments_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_comments" ADD CONSTRAINT "track_comments_author_members_slug_fk" FOREIGN KEY ("author") REFERENCES "public"."members"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_comments" ADD CONSTRAINT "track_comments_parent_id_track_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."track_comments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_author_members_slug_fk" FOREIGN KEY ("author") REFERENCES "public"."members"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_approved_by_members_slug_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."members"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "truth_answers" ADD CONSTRAINT "truth_answers_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "truth_answers" ADD CONSTRAINT "truth_answers_author_members_slug_fk" FOREIGN KEY ("author") REFERENCES "public"."members"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bombs_season_day" ON "bombs" USING btree ("season_id","detonate_day");--> statement-breakpoint
CREATE UNIQUE INDEX "checkpoints_season_day" ON "checkpoints" USING btree ("season_id","day");--> statement-breakpoint
CREATE INDEX "jar_items_season_size" ON "jar_items" USING btree ("season_id","size");--> statement-breakpoint
CREATE UNIQUE INDEX "members_sort_order" ON "members" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "posts_season_created" ON "posts" USING btree ("season_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reactions_post_author_word" ON "reactions" USING btree ("post_id","author","word");--> statement-breakpoint
CREATE UNIQUE INDEX "seasons_number" ON "seasons" USING btree ("number");--> statement-breakpoint
CREATE UNIQUE INDEX "tracks_season_url" ON "tracks" USING btree ("season_id","url");--> statement-breakpoint
CREATE UNIQUE INDEX "truth_answers_season_day_author" ON "truth_answers" USING btree ("season_id","day","author");