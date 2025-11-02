#!/usr/bin/env node
/**
 * Seed sample Talk data for a given email in all orgs.
 * - Creates a 'General' topic space if missing
 * - Creates a welcome thread with a couple of messages
 * - Ensures the user is a participant
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

// Inline .env.local loader (same as grant-access)
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2] || process.env.EMAIL || 'vojta.skuplik@gmail.com';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('[seed-talk] Missing env NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function getUserAndProfile(email) {
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1, email });
  if (listErr) throw listErr;
  const user = list?.users?.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
  if (!user) throw new Error(`User ${email} not found. Run grant-access first.`);
  const { data: profile, error: pErr } = await admin
    .from('user_profiles')
    .select('id,user_id,display_name')
    .eq('user_id', user.id)
    .maybeSingle();
  if (pErr) throw pErr;
  if (!profile) throw new Error('user_profiles row missing. Run grant-access.');
  return { user, profile };
}

async function ensureGeneralSpace(orgId, createdByProfileId) {
  // find existing General topic space
  const { data: existing, error: selErr } = await admin
    .from('talk_spaces')
    .select('id')
    .eq('org_id', orgId)
    .eq('space_type', 'topic')
    .eq('title', 'General')
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) return existing.id;

  const { data, error } = await admin
    .from('talk_spaces')
    .insert({ org_id: orgId, space_type: 'topic', title: 'General', description: 'Org-wide announcements and discussion', created_by: createdByProfileId })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function seedThreadWithMessages(spaceId, profileId, displayName) {
  // create thread if none exists
  const { data: threads, error: thErr } = await admin
    .from('talk_threads')
    .select('id')
    .eq('space_id', spaceId)
    .limit(1);
  if (thErr) throw thErr;

  let threadId = threads?.[0]?.id;
  if (!threadId) {
    const { data: created, error: cErr } = await admin
      .from('talk_threads')
      .insert({ space_id: spaceId, title: 'Welcome to Ease Talk', context_summary: 'Introduce yourself and say hello', created_by: profileId })
      .select('id')
      .single();
    if (cErr) throw cErr;
    threadId = created.id;
  }

  // ensure participant (ignore if exists)
  await admin
    .from('talk_participants')
    .upsert({ thread_id: threadId, user_id: profileId }, { onConflict: 'thread_id,user_id', ignoreDuplicates: true });

  // add two messages if less than 2 exist
  const { data: msgCount, error: cntErr } = await admin
    .from('talk_messages')
    .select('id', { count: 'exact', head: true })
    .eq('thread_id', threadId);
  if (cntErr) throw cntErr;

  if ((msgCount?.length ?? 0) < 2) {
    const welcome = `Ahoj ${displayName || 'there'}! 👋\nTady můžeš zkusit vlákna, reakce a AI náhledy.`;
    const followup = `Zkus napiš první zprávu. Pro demo jsem přidal pár ukázkových zpráv.`;
    const { error: insErr } = await admin.from('talk_messages').insert([
      { thread_id: threadId, sender_id: profileId, message: welcome, sentiment: 'positive' },
      { thread_id: threadId, sender_id: profileId, message: followup, sentiment: 'supportive' },
    ]);
    if (insErr) throw insErr;
  }

  return threadId;
}

async function main() {
  console.log(`[seed-talk] Seeding Talk for ${email}`);
  const { profile } = await getUserAndProfile(email);

  const { data: orgs, error: orgErr } = await admin.from('organizations').select('id, name');
  if (orgErr) throw orgErr;

  for (const org of orgs || []) {
    const spaceId = await ensureGeneralSpace(org.id, profile.id);
    await seedThreadWithMessages(spaceId, profile.id, profile.display_name);
    console.log(`[seed-talk] Org ${org.name}: ready`);
  }

  console.log('[seed-talk] Done. Open /[orgSlug]/talk to explore.');
}

main().catch((e) => {
  console.error('[seed-talk] Error:', e?.message || e);
  process.exit(1);
});
