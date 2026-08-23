// ============================================================
// Maverick Barbier — inject Netlify env vars at build time
//
// Runs automatically on every Netlify deploy (see the build
// "command" in netlify.toml). Reads SUPABASE_URL and
// SUPABASE_ANON_KEY from Netlify's Environment variables panel
// and swaps them into js/supabase-client.js before the site is
// published — so the real keys never have to sit in git.
//
// Pure Node, no dependencies, safe to run locally too:
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/inject-env.js
// ============================================================

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'js', 'supabase-client.js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn(
    '[inject-env] SUPABASE_URL and/or SUPABASE_ANON_KEY are not set in this ' +
    'environment — leaving the placeholder tokens in place. The booking form ' +
    'will show "not connected yet" until these are set in Netlify\'s ' +
    'Environment variables panel (Site configuration → Environment variables) ' +
    'and the site is redeployed.'
  );
  process.exit(0); // not a build failure — just means it isn't wired up yet
}

let content = fs.readFileSync(FILE, 'utf8');

if (!content.includes('__SUPABASE_URL__') || !content.includes('__SUPABASE_ANON_KEY__')) {
  console.warn('[inject-env] Placeholder tokens not found in supabase-client.js — skipping (already replaced manually?).');
  process.exit(0);
}

content = content
  .replace('__SUPABASE_URL__', url)
  .replace('__SUPABASE_ANON_KEY__', key);

fs.writeFileSync(FILE, content, 'utf8');
console.log('[inject-env] Supabase URL and anon key injected into js/supabase-client.js for this build.');
