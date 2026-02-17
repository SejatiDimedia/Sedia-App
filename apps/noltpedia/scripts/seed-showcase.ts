import { db } from "../src/lib/db";
import { schema } from "../src/lib/db";
import { nanoid } from "nanoid";

async function main() {
  const topicId = "interactive-features";
  const articleId = nanoid();

  const content = `# NoltPedia Interactive Showcase

Welcome to the feature showcase! This article demonstrates the interactive components we developed for Phase 7.

## 1. Callouts
Callouts are used to highlight important information.

\`\`\`callout
info: Basic Information
This is a standard information callout.
\`\`\`

\`\`\`callout
tip: Pro Tip
Use neobrutalist design for better visual impact!
\`\`\`

\`\`\`callout
warning: Warning
Don't forget to push your changes!
\`\`\`

\`\`\`callout
success: Success
You have successfully implemented Phase 7.
\`\`\`

## 2. Interactive Quizzes
Test your knowledge with these quizzes.

\`\`\`quiz
{
  "question": "What design style does NoltPedia use?",
  "options": ["Material Design", "Neobrutalism", "Minimalist"],
  "answer": 1
}
\`\`\`

## 3. Challenges
Actionable steps to ensure you're on track.

### Simple List Challenge
\`\`\`challenge
Title: Indonesian Independence
- Learn about 17 August 1945
- Visit the monument
- Celebrate with the community
\`\`\`

### JSON Challenge
\`\`\`challenge
{
  "title": "Mastering Drizzle",
  "steps": [
    "Define your schema",
    "Run migrations",
    "Query your data"
  ]
}
\`\`\`

---
Enjoy learning!
`;

  try {
    await db.insert(schema.articles).values({
      id: articleId,
      title: "Feature Showcase: Interactive Learning",
      slug: "interactive-showcase",
      content,
      topicId,
      isPublished: true,
      authorId: "system", // Or a valid user ID if needed, but schema might allow string
      difficulty: "Beginner",
      excerpt: "Explore the new interactive components of NoltPedia: Callouts, Quizzes, and Challenges.",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("Showcase article created successfully!");
  } catch (e) {
    console.error("Failed to create showcase article:", e);
  }
}

main().catch(console.error);
