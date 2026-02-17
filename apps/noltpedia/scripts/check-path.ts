import 'dotenv/config';
import { db } from "../src/lib/db";
import { schema } from "../src/lib/db";
import { eq } from "drizzle-orm";

async function check() {
  const path = await db.query.paths.findFirst({
    where: eq(schema.paths.slug, "typescript-fundamentals"),
    with: {
      steps: {
        orderBy: (steps, { asc }) => [asc(steps.stepOrder)],
        with: {
          article: true
        }
      }
    }
  });

  if (path) {
    console.log("Path Steps:");
    path.steps.forEach((step, i) => {
      console.log(`${i + 1}. ${step.article?.title} (order: ${step.stepOrder})`);
    });
  }

  process.exit(0);
}

check().catch(console.error);
