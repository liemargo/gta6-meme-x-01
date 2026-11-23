// Entry program for the gta6-meme-x-01 bounty.
//
// The actual entry is the X post named in POST.json. All this program
// has to do is hand that file to the grader: read POST.json from the
// bot directory, sanity-check its shape, and place an unchanged copy
// in the output directory. Nothing else is produced.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Locations come from the environment so the same file works inside
// the grading container (where the defaults apply) and in a plain
// local checkout (where the caller points both variables at folders
// relative to the repo root).
function botDir() {
  return process.env.MAKEFUN_BOT_DIR || '/bot';
}

function outputDir() {
  return process.env.MAKEFUN_OUTPUT_DIR || '/output';
}

// POST.json only counts if it is a JSON object carrying the post's
// address in a non-empty "url" string. Anything else is a broken
// entry, and failing loudly here beats handing the grader a file it
// would reject anyway.
function loadPost(bot) {
  const path = join(bot, 'POST.json');
  if (!existsSync(path)) {
    throw new Error('POST.json is missing from ' + bot);
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    throw new Error('POST.json in ' + bot + ' is not valid JSON');
  }
  if (parsed === null || typeof parsed !== 'object' || typeof parsed.url !== 'string' || parsed.url.trim().length === 0) {
    throw new Error('POST.json must be an object with a non-empty "url" string');
  }
  // The address has to be a usable link, not just any string: reject a
  // malformed URL here, where the mistake is easy to see, instead of
  // letting the grader discover it.
  try {
    new URL(parsed.url);
  } catch {
    throw new Error('POST.json "url" is not a valid URL: ' + parsed.url);
  }
  return path;
}

function main() {
  const bot = botDir();
  const out = outputDir();
  const source = loadPost(bot);
  mkdirSync(out, { recursive: true });
  // Copy the bytes as they are on disk rather than re-serialising the
  // parsed object, so the grader receives exactly the file submitted.
  writeFileSync(join(out, 'POST.json'), readFileSync(source));
}

try {
  main();
} catch (err) {
  console.error('gta6-meme entry failed: ' + (err instanceof Error ? err.message : String(err)));
  process.exit(1);
}
