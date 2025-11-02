#!/usr/bin/env node
// Lightweight .env.local loader to avoid extra deps
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const envPath = path.resolve(rootDir, '.env.local');
try {
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      if (!line || line.trim().startsWith('#')) continue;
      const idx = line.indexOf('=');
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch {}
/**
 * Grant full test access to a user email across all orgs.
 * - Ensures auth user exists (creates if missing, email confirmed)
 * - Ensures user_profiles row exists
 * - Upserts org_members as owner for all organizations
 * - Sets organizations subscription_tier to 'enterprise'
 *
 * Usage:
 *   node scripts/grant-access.mjs [email]
 *   EMAIL=... node scripts/grant-access.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const emailArg = process.argv[2] || process.env.EMAIL || "vojta.skuplik@gmail.com";

function die(msg) {
  console.error(`\n[grant-access] ${msg}\n`);
  process.exit(1);
}

if (!SUPABASE_URL) die("Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) env");
if (!SERVICE_ROLE_KEY) die("Missing SUPABASE_SERVICE_ROLE_KEY env");
if (!emailArg || !emailArg.includes("@")) die("Provide a valid email as arg or EMAIL env");

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function ensureAuthUser(email) {
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1, email });
  if (listErr) throw listErr;
  const found = list?.users?.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
  if (found) return found;
  // Create user (confirmed) with a temporary password
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: Math.random().toString(36).slice(2) + "Aa1!",
    email_confirm: true,
  });
  if (error) throw error;
  return data.user;
}

async function main() {
  console.log(`[grant-access] Ensuring full access for ${emailArg}`);
  const user = await ensureAuthUser(emailArg);

  // Ensure user_profiles exists
  const { data: profile, error: profileErr } = await admin
    .from("user_profiles")
    .select("id,user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileErr) throw profileErr;
  if (!profile) {
    const display = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
    const { error: insErr } = await admin.from("user_profiles").insert({ user_id: user.id, display_name: display, full_name: display });
    if (insErr) throw insErr;
  }

  // Get all orgs
  const { data: orgs, error: orgsErr } = await admin.from("organizations").select("id, name, subscription_tier");
  if (orgsErr) throw orgsErr;
  if (!orgs || orgs.length === 0) {
    // Create a default org if none exists
    const slug = "ease-test";
    const { data: created, error: orgCreateErr } = await admin
      .from("organizations")
      .insert({ name: "Ease Test Org", slug })
      .select("id")
      .single();
    if (orgCreateErr) throw orgCreateErr;
    orgs?.push({ id: created.id, name: "Ease Test Org" });
  }

  // Upsert owner membership for all orgs
  for (const org of orgs) {
    const { data: mem, error: memErr } = await admin
      .from("org_members")
      .select("id, role")
      .eq("org_id", org.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (memErr) throw memErr;

    if (!mem) {
      const { error: insMemErr } = await admin.from("org_members").insert({ org_id: org.id, user_id: user.id, role: "owner" });
      if (insMemErr) throw insMemErr;
    } else if (mem.role !== "owner") {
      const { error: updMemErr } = await admin.from("org_members").update({ role: "owner" }).eq("id", mem.id);
      if (updMemErr) throw updMemErr;
    }

    // Set subscription tier to enterprise
    const { error: subErr } = await admin
      .from("organizations")
      .update({ subscription_tier: "enterprise" })
      .eq("id", org.id);
    if (subErr) throw subErr;
  }

  console.log(`[grant-access] Done. ${emailArg} is owner in ${orgs.length} org(s) with enterprise tier.`);
}

main().catch((e) => {
  console.error("[grant-access] Error:", e?.message || e);
  process.exit(1);
});
