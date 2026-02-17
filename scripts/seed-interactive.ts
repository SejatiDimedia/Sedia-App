
import { db } from '../apps/noltpedia/src/lib/db';
import { articles, topics } from '@shared-db/schema';
import { initialTopics } from '@shared-db/seed-data';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

async function seedInteractiveTest() {
    console.log('Seeding interactive test article...');

    // Ensure a topic exists
    let topic = await db.query.topics.findFirst();
    if (!topic) {
        console.log('No topics found, creating one...');
        await db.insert(topics).values({
            id: nanoid(),
            ...initialTopics[0]
        });
        topic = await db.query.topics.findFirst();
    }

    if (!topic) throw new Error("Failed to find or create topic");

    const content = `
# Interactive Components Showcase

This article demonstrates the new interactive MDX components.

## 1. Quiz Component

Test your knowledge with this quiz:

\`\`\`quiz
{
  "question": "Which framework is used for this project?",
  "options": ["Next.js", "Astro", "Remix", "Nuxt"],
  "answer": 1
}
\`\`\`

## 2. Callout Component

Here are some callouts:

\`\`\`callout
info: Note
This is an informational callout to highlight important context.
\`\`\`

\`\`\`callout
warning: Caution
Be careful when modifying database schemas!
\`\`\`

\`\`\`callout
success: Great Job
You have successfully implemented the feature.
\`\`\`

## 3. Challenge Component

Can you complete this challenge?

\`\`\`challenge
Title: Deployment Checklist
Step 1: Run build command
Step 2: Check for errors
Step 3: Deploy to Vercel
Step 4: Verify production URL
\`\`\`

## End of Test
  `;

    const slug = 'interactive-test-v2'; // unique slug to avoid conflicts

    const existing = await db.query.articles.findFirst({
        where: eq(articles.slug, slug)
    });

    if (existing) {
        console.log('Article already exists, updating...');
        await db.update(articles).set({
            content,
            title: 'Interactive Components Showcase',
            updatedAt: new Date()
        }).where(eq(articles.slug, slug));
    } else {
        await db.insert(articles).values({
            id: nanoid(),
            title: 'Interactive Components Showcase',
            slug,
            content,
            excerpt: 'A showcase of interactive MDX components.',
            topicId: topic.id,
            difficulty: 'Beginner',
            isPublished: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    console.log(`Seeded article: /articles/${slug}`);
    process.exit(0);
}

seedInteractiveTest().catch(err => {
    console.error(err);
    process.exit(1);
});
