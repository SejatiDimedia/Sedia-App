
import type { APIRoute } from 'astro';
import { db, articles, topics, eq } from '../../lib/db'; // Use relative imports or existing aliases
import { nanoid } from 'nanoid';

export const GET: APIRoute = async () => {
    try {
        // Ensure a topic exists
        const allTopics = await db.query.topics.findMany();
        let topic = allTopics[0];

        if (!topic) {
            // Create a default topic if none exists
            const newTopicId = nanoid();
            await db.insert(topics).values({
                id: newTopicId,
                name: 'General',
                slug: 'general',
                description: 'General topics',
                icon: 'Hash', // Assuming this field exists based on schema knowledge or defaults
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            topic = await db.query.topics.findFirst({ where: eq(topics.id, newTopicId) }) as any;
        }

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

        const slug = 'interactive-test-v2';

        const existing = await db.query.articles.findFirst({
            where: eq(articles.slug, slug)
        });

        if (existing) {
            await db.update(articles).set({
                content,
                title: 'Interactive Components Showcase',
                updatedAt: new Date(),
            }).where(eq(articles.slug, slug));
            return new Response(JSON.stringify({ message: "Updated existing article", slug }), { status: 200 });
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
                updatedAt: new Date(),
            });
            return new Response(JSON.stringify({ message: "Created new article", slug }), { status: 201 });
        }

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
    }
}
