ALTER TABLE "noltpedia_v1"."comments" DROP CONSTRAINT "comments_article_id_articles_id_fk";
--> statement-breakpoint
ALTER TABLE "noltpedia_v1"."comments" ADD CONSTRAINT "comments_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "noltpedia_v1"."articles"("id") ON DELETE cascade ON UPDATE no action;