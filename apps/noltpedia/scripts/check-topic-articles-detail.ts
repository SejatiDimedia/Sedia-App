import 'dotenv/config';
import { db, articles, eq, asc } from "../src/lib/db";

async function check() {
  const articlesList = await db.query.articles.findMany({
    where: (articles, { eq }) => eq(articles.topicId, "typescript-dasar"),
    orderBy: (articles, { asc }) => [asc(articles.sortOrder)],
  });

  console.log("Articles for topic 'typescript-dasar':");
  articlesList.forEach((article, i) => {
    console.log(`${i + 1}. ${article.title} (sortOrder: ${article.sortOrder}, authorId: ${article.authorId}, slug: ${article.slug})`);
  });

  process.exit(0);
}

check().catch(console.error);
