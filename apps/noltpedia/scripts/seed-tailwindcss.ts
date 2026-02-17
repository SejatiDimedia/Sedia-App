import 'dotenv/config';
import { db } from "../src/lib/db";
import { schema } from "../src/lib/db";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOPIC_ID = "tailwindcss";
const ARTICLES_DIR = path.join(__dirname, 'articles');
const METADATA_FILE = path.join(ARTICLES_DIR, 'metadata.json');

// Load metadata from JSON file
const articlesMetadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));

async function loadArticleContent(slug) {
  const filePath = path.join(ARTICLES_DIR, `${slug}.md`);
  return fs.readFileSync(filePath, 'utf-8');
}

async function main() {
  console.log("🚀 Starting Tailwind CSS v3 content seed...\\n");

  // 1. Create topic
  console.log("📂 Creating Tailwind CSS topic...");
  try {
    const existingTopic = await db.query.topics.findFirst({
      where: eq(schema.topics.id, TOPIC_ID),
    });

    if (!existingTopic) {
      await db.insert(schema.topics).values({
        id: TOPIC_ID,
        name: "Tailwind CSS",
        description: "Framework utility-first CSS untuk membangun UI modern dan responsive",
        icon: "🎨",
        sortOrder: 2,
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("   ✅ Topic 'Tailwind CSS' created");
    } else {
      console.log("   ⏭️ Topic 'Tailwind CSS' already exists, skipping");
    }
  } catch (e) {
    console.error("   ❌ Error creating topic:", e.message);
  }

  // 2. Insert articles
  console.log("\\n📝 Creating articles...");
  const createdArticleIds = [];

  for (const articleMeta of articlesMetadata) {
    try {
      const existing = await db.query.articles.findFirst({
        where: eq(schema.articles.slug, articleMeta.slug),
      });

      if (existing) {
        console.log("   ⏭️ \"" + articleMeta.title + "\" already exists, skipping");
        createdArticleIds.push(existing.id);
        continue;
      }

      const content = await loadArticleContent(articleMeta.slug);
      const articleId = nanoid();

      await db.insert(schema.articles).values({
        id: articleId,
        title: articleMeta.title,
        slug: articleMeta.slug,
        content: content,
        excerpt: articleMeta.excerpt,
        topicId: TOPIC_ID,
        difficulty: articleMeta.difficulty,
        authorId: "system",
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      createdArticleIds.push(articleId);
      console.log("   ✅ \"" + articleMeta.title + "\"");
    } catch (e) {
      console.error("   ❌ Error creating \"" + articleMeta.title + "\":", e.message);
    }
  }

  // 3. Create Learning Path
  console.log("\\n🗺️ Creating Learning Path...");
  const pathId = nanoid();
  const PATH_SLUG = "tailwindcss-v3-master-class";

  try {
    const existingPath = await db.query.paths.findFirst({
      where: eq(schema.paths.slug, PATH_SLUG),
    });

    if (existingPath) {
      console.log("   ⏭️ Path 'Tailwind CSS v3 Master Class' already exists, skipping");
    } else {
      await db.insert(schema.paths).values({
        id: pathId,
        title: "Tailwind CSS v3 Master Class: Dari Nol Sampai Mahir",
        description: "Learning path lengkap untuk menguasai Tailwind CSS v3 — mulai dari pengenalan, core concepts, arbitrary values, advanced features, real-world components, hingga best practices dan optimization.",
        slug: PATH_SLUG,
        isPublished: true,
        createdAt: new Date(),
      });
      console.log("   ✅ Path 'Tailwind CSS v3 Master Class' created");

      // 4. Add steps to the path
      console.log("\\n📋 Adding path steps...");
      for (let i = 0; i < createdArticleIds.length; i++) {
        await db.insert(schema.pathSteps).values({
          id: nanoid(),
          pathId: pathId,
          articleId: createdArticleIds[i],
          stepOrder: i + 1,
        });
        console.log("   ✅ Step " + (i + 1) + ": " + articlesMetadata[i].title.substring(0, 50) + "...");
      }
    }
  } catch (e) {
    console.error("   ❌ Error creating path:", e.message);
  }

  console.log("\\n🎉 Tailwind CSS v3 content seed completed!");
  console.log("   📝 " + createdArticleIds.length + " articles");
  console.log("   🗺️ 1 learning path with " + createdArticleIds.length + " steps");
  process.exit(0);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
