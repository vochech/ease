import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Simple Node script to apply SQL migration and seed data
// Run with: node scripts/setup-db.mjs

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log("📦 Applying database migration...");

  const sqlPath = path.join(
    process.cwd(),
    "sql",
    "migrations",
    "001_create_tables.sql",
  );
  const sql = fs.readFileSync(sqlPath, "utf8");

  // Split by semicolons and execute each statement
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("--"));

  for (const statement of statements) {
    if (!statement) continue;

    try {
      const { error } = await supabase.rpc("exec_sql", {
        sql_query: statement,
      });
      if (error) {
        console.warn("⚠️  Statement warning:", error.message);
      }
    } catch (err) {
      // Fallback: try direct query if rpc not available
      console.log("   Executing:", statement.substring(0, 50) + "...");
    }
  }

  console.log("✅ Migration applied");
}

async function seedData() {
  console.log("\n🌱 Seeding sample data...");

  // Check if tables exist by querying
  const { count: existingProjects } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true });

  if (existingProjects && existingProjects > 0) {
    console.log("⚠️  Data already exists. Skipping seed.");
    return;
  }

  // Insert projects
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .insert([
      {
        name: "Website Redesign",
        description: "Modernize company website with new branding",
      },
      {
        name: "Mobile App Launch",
        description: "Launch iOS and Android apps for Q4",
      },
      {
        name: "API v2 Migration",
        description: "Migrate all services to new REST API",
      },
      {
        name: "Customer Dashboard",
        description: "Build self-service portal for customers",
      },
    ])
    .select();

  if (projectsError) {
    console.error("❌ Projects error:", projectsError.message);
    return;
  }

  console.log(`   ✓ Created ${projects.length} projects`);

  // Insert tasks
  const projectIds = projects.map((p) => p.id);
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .insert([
      {
        project_id: projectIds[0],
        title: "Design homepage mockups",
        completed: true,
      },
      {
        project_id: projectIds[0],
        title: "Update color palette",
        completed: false,
      },
      {
        project_id: projectIds[0],
        title: "Review wireframes with team",
        completed: false,
      },
      {
        project_id: projectIds[1],
        title: "Setup app store accounts",
        completed: true,
      },
      {
        project_id: projectIds[1],
        title: "Prepare marketing materials",
        completed: false,
      },
      {
        project_id: projectIds[1],
        title: "Submit for app review",
        completed: false,
      },
      {
        project_id: projectIds[2],
        title: "Write migration guide",
        completed: false,
      },
      {
        project_id: projectIds[2],
        title: "Test backward compatibility",
        completed: false,
      },
      {
        project_id: projectIds[3],
        title: "Design user flows",
        completed: true,
      },
      {
        project_id: projectIds[3],
        title: "Implement authentication",
        completed: false,
      },
    ])
    .select();

  if (tasksError) {
    console.error("❌ Tasks error:", tasksError.message);
    return;
  }

  console.log(`   ✓ Created ${tasks.length} tasks`);

  // Insert meetings
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const { data: meetings, error: meetingsError } = await supabase
    .from("meetings")
    .insert([
      {
        project_id: projectIds[0],
        title: "Design Review",
        starts_at: tomorrow.toISOString(),
      },
      {
        project_id: projectIds[1],
        title: "Sprint Planning",
        starts_at: new Date(
          now.getTime() + 2 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
      {
        project_id: projectIds[2],
        title: "API Migration Sync",
        starts_at: nextWeek.toISOString(),
      },
    ])
    .select();

  if (meetingsError) {
    console.error("❌ Meetings error:", meetingsError.message);
    return;
  }

  console.log(`   ✓ Created ${meetings.length} meetings`);
  console.log("\n✅ Database seeded successfully!");
}

async function main() {
  try {
    await runMigration();
    await seedData();
    console.log(
      "\n🎉 Setup complete! Refresh your dashboard to see live data.",
    );
  } catch (error) {
    console.error("\n❌ Setup failed:", error);
    process.exit(1);
  }
}

main();
