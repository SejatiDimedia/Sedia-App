import 'dotenv/config';
import { db, articles } from '../src/lib/db';
import { nanoid } from 'nanoid';

async function seed() {
    try {
        const content = `
Welcome to the interactive demo!

## Quiz Demo
\`\`\`quiz
{
 "question": "Which planet is known as the Red Planet?",
 "options": ["Venus", "Mars", "Jupiter", "Saturn"],
 "answer": 1
}
\`\`\`

## Callout Demo
\`\`\`callout
tip: Pro Tip
Always use const over let when possible.
\`\`\`

\`\`\`callout
warning: Careful!
Deleting the database is irreversible.
\`\`\`

## Challenge Demo
\`\`\`challenge
{
 "title": "Deploy to Production",
 "steps": ["Run build command", "Check environment variables", "Push to main branch"]
}
\`\`\`
`;

        await db.insert(articles).values({
            id: nanoid(),
            title: 'Interactive Components Demo',
            slug: 'interactive-demo',
            content: content,
            topicId: 'general',
            isPublished: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);

        console.log('Inserted successfully');
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

seed();
