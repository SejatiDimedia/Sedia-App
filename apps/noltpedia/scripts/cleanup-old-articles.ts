import 'dotenv/config';
import { db, articles, eq } from "../src/lib/db";
import { isNull } from "drizzle-orm";

async function main() {
  console.log("🗑️ Cleaning up old TypeScript articles...\n");

  // Find old articles (authorId is null)
  const oldArticles = await db.query.articles.findMany({
    where: (articles, { eq, and, isNull }) =>
      and(
        eq(articles.topicId, "typescript-dasar"),
        isNull(articles.authorId)
      ),
  });

  console.log(`Found ${oldArticles.length} old articles to delete:`);
  oldArticles.forEach((article, i) => {
    console.log(`  ${i + 1}. ${article.title} (slug: ${article.slug})`);
  });

  // Delete old articles
  for (const article of oldArticles) {
    try {
      await db.delete(articles).where(eq(articles.id, article.id));
      console.log(`   ✅ Deleted: "${article.title}"`);
    } catch (e: any) {
      console.error(`   ❌ Error deleting "${article.title}":`, e.message);
    }
  }

  console.log("\n🎉 Cleanup completed!");
  process.exit(0);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
