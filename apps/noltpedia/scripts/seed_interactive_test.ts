
import 'dotenv/config';
import { db, articles, topics, eq } from '../src/lib/db';
import { nanoid } from 'nanoid';

const SEED_TOPIC_SLUG = 'interactive-features';
const SEED_ARTICLE_SLUG = 'interactive-components-showcase';

async function seed() {
    console.log('🌱 Seeding interactive test article...');

    // 1. Ensure Topic Exists
    let topic = await db.query.topics.findFirst({
        where: eq(topics.id, SEED_TOPIC_SLUG),
    });

    if (!topic) {
        console.log('Creating topic...');
        // Topics use ID as slug
        await db.insert(topics).values({
            id: SEED_TOPIC_SLUG,
            name: 'Interactive Features',
            description: 'Showcase of interactive learning components',
            isPublished: true,
        });
        topic = { id: SEED_TOPIC_SLUG } as any;
    }

    if (!topic) throw new Error("Failed to create/fetch topic");

    // 2. Create Article Content
    const content = `
# Interactive Learning Showcase

This article demonstrates the new interactive components available in NoltPedia.

## 1. Quiz Component

Test your knowledge with a quick quiz!

\`\`\`quiz
{
  "question": "Which framework is used for NoltPedia?",
  "options": ["Next.js", "Astro", "Remix", "Gatsby"],
  "answer": 1
}
\`\`\`

## 2. Callout Component

We have enhanced callouts for different scenarios.

\`\`\`callout
Info: Did You Know?
NoltPedia creates a static build for maximum performance.
\`\`\`

\`\`\`callout
Warning: Watch Out
Always valid your JSON in quiz blocks to prevent errors.
\`\`\`

\`\`\`callout
Tip: Pro Tip
Use the 'challenge' block to create actionable checklists for users.
\`\`\`

\`\`\`callout
Success: Great Job
You've successfully implemented the callout component!
\`\`\`

## 3. Challenge Component

A checklist for users to track their progress in a tutorial.

\`\`\`challenge
Title: Setup Environment
- Install Node.js
- Install dependencies with pnpm
- Run the development server
- Open localhost:4321
\`\`\`

## Conclusion

These components will make learning much more engaging.
`;

    // 3. Upsert Article
    const existingArticle = await db.query.articles.findFirst({
        where: eq(articles.slug, SEED_ARTICLE_SLUG),
    });

    if (existingArticle) {
        console.log('Updating existing article...');
        await db.update(articles)
            .set({
                title: 'Interactive Components Showcase',
                content: content,
                excerpt: 'A live demonstration of Quizzes, Callouts, and Challenges.',
                topicId: topic.id,
                updatedAt: new Date(),
            })
            .where(eq(articles.id, existingArticle.id));
    } else {
        console.log('Creating new article...');
        await db.insert(articles).values({
            id: nanoid(),
            title: 'Interactive Components Showcase',
            slug: SEED_ARTICLE_SLUG,
            content: content,
            excerpt: 'A live demonstration of Quizzes, Callouts, and Challenges.',
            topicId: topic.id,
            // authorId removed as it's not in schema
            isPublished: true,
            // coverImage removed as it's not in schema (I don't see coverImage in the schema file I viewed)
        });
    }

    console.log(`✅ Seed complete! Visit: http://localhost:4321/articles/${SEED_ARTICLE_SLUG}`);
    process.exit(0);
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
