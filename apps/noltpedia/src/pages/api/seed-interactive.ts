import type { APIRoute } from "astro";
import { db, schema } from "../../lib/db";

// Simple random ID generator (replaces nanoid to avoid ESM/dependency issues in this context)
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const GET: APIRoute = async () => {
    try {
        const topic = await db.query.topics.findFirst();

        if (!topic) {
            return new Response("No topic found to attach article to", { status: 400 });
        }

        const articleId = generateId();
        const content = `
# Interactive Learning Components Test

This article demonstrates the new interactive components.

## 1. Quiz Component

Here is a quick quiz to test your knowledge:

\`\`\`quiz
{
  "question": "Which planet is known as the Red Planet?",
  "options": ["Earth", "Mars", "Jupiter", "Venus"],
  "answer": 1
}
\`\`\`

## 2. Callout Component

We have different types of callouts (currently using custom blockquote or code block syntax, let's test code block syntax first based on renderer implementation):

\`\`\`callout
info: Did You Know?
The sun is actually a star.
\`\`\`

\`\`\`callout
warning: Caution
Do not look directly at the sun.
\`\`\`

\`\`\`callout
success: System Check
All systems are operational.
\`\`\`

## 3. Challenge Component

Time for a hands-on challenge!

\`\`\`challenge
{
  "title": "Setup Development Environment",
  "steps": [
    "Install Node.js",
    "Install Git",
    "Clone the repository",
    "Run npm install"
  ]
}
\`\`\`

End of test.
`;

        await db.insert(schema.articles).values({
            id: articleId,
            title: "Interactive Components Test",
            slug: "interactive-components-test",
            content: content,
            topicId: topic.id,
            isPublished: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return new Response(JSON.stringify({ success: true, slug: "interactive-components-test" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};
