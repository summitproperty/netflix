#!/usr/bin/env node
/*
 * scripts/setup-local.mjs — one-command local bootstrap.
 *
 * Dependency-free on purpose: it has to run before `npm install` has ever
 * succeeded. It does four things and nothing else:
 *
 *   1. checks the Node version against package.json `engines`
 *   2. creates .env.local from .env.example when it is missing (never
 *      overwrites an existing one, and never writes a real secret)
 *   3. reports which required keys are still blank
 *   4. installs dependencies if node_modules is absent
 *
 * It deliberately does NOT start the dev server, so `npm run setup` stays safe
 * to re-run. Start the site afterwards with `npm run dev`.
 */

import { execFileSync } from "node:child_process";
import { existsSync, copyFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const c = {
  reset: "\u001b[0m",
  dim: "\u001b[2m",
  red: "\u001b[31m",
  green: "\u001b[32m",
  yellow: "\u001b[33m",
  cyan: "\u001b[36m",
};

function say(message) {
  process.stdout.write(`${message}\n`);
}

function step(n, message) {
  say(`\n${c.cyan}[${n}/4]${c.reset} ${message}`);
}

/** Keys the site cannot render a catalog without. */
const REQUIRED_ANY_OF = [["TMDB_TOKEN", "TMDB_API_KEY"]];

/** Keys that only sign-in, My List and profiles depend on. */
const REQUIRED_FOR_ACCOUNTS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

/** Read `KEY=value` pairs without evaluating anything. */
function parseEnv(file) {
  const out = new Map();
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    out.set(trimmed.slice(0, eq).trim(), trimmed.slice(eq + 1).trim());
  }
  return out;
}

// --- 1. Node version ------------------------------------------------------

step(1, "Checking Node.js");

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const wanted = (pkg.engines?.node ?? ">=18.18.0").replace(/[^0-9.]/g, "");
const [wantMajor, wantMinor = 0] = wanted.split(".").map(Number);
const [haveMajor, haveMinor] = process.versions.node.split(".").map(Number);

if (haveMajor < wantMajor || (haveMajor === wantMajor && haveMinor < wantMinor)) {
  say(
    `${c.red}Node ${process.versions.node} is too old.${c.reset} ` +
      `This project needs ${pkg.engines?.node ?? ">=18.18.0"}. ` +
      `Install the current LTS from https://nodejs.org and run this again.`,
  );
  process.exit(1);
}
say(`  ${c.green}ok${c.reset} Node ${process.versions.node}`);

// --- 2. .env.local --------------------------------------------------------

step(2, "Checking .env.local");

const envLocal = join(root, ".env.local");
const envExample = join(root, ".env.example");
let justCreated = false;

if (existsSync(envLocal)) {
  say(`  ${c.green}ok${c.reset} .env.local already exists (left untouched)`);
} else if (existsSync(envExample)) {
  copyFileSync(envExample, envLocal);
  justCreated = true;
  say(`  ${c.green}created${c.reset} .env.local from .env.example`);
} else {
  say(`  ${c.red}missing${c.reset} .env.example — cannot create .env.local`);
  process.exit(1);
}

// --- 3. Which values are still blank -------------------------------------

step(3, "Checking required values");

const env = parseEnv(envLocal);
const blank = (key) => (env.get(key) ?? "") === "";
const missing = [];

for (const group of REQUIRED_ANY_OF) {
  if (group.every(blank)) missing.push(group.join(" or "));
}
const accountsMissing = REQUIRED_FOR_ACCOUNTS.filter(blank);

if (missing.length === 0) {
  say(`  ${c.green}ok${c.reset} TMDB credential present`);
} else {
  say(`  ${c.yellow}blank${c.reset} ${missing.join(", ")} — the catalog will be empty`);
  say(`         get one at ${c.dim}https://www.themoviedb.org/settings/api${c.reset}`);
}

if (accountsMissing.length === 0) {
  say(`  ${c.green}ok${c.reset} Supabase credentials present`);
} else {
  say(
    `  ${c.yellow}blank${c.reset} ${accountsMissing.join(", ")} — ` +
      `browsing works, sign-in / My List / profile will not`,
  );
}

// --- 4. Dependencies ------------------------------------------------------

step(4, "Checking dependencies");

if (existsSync(join(root, "node_modules"))) {
  say(`  ${c.green}ok${c.reset} node_modules present (delete it to force a reinstall)`);
} else {
  say(`  installing… this takes a minute or two on a first run`);
  try {
    execFileSync("npm", ["install"], {
      cwd: root,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
  } catch {
    say(
      `\n${c.red}npm install failed.${c.reset} This is almost always a network or ` +
        `registry problem, not a problem with the project. Check your connection ` +
        `(or proxy / registry settings) and run ${c.cyan}npm install${c.reset} again.`,
    );
    process.exit(1);
  }
}

// --- Done -----------------------------------------------------------------

say(`\n${c.green}Setup complete.${c.reset}`);
if (justCreated || missing.length > 0 || accountsMissing.length > 0) {
  say(`Fill in the blank values in ${c.cyan}.env.local${c.reset} first, then:`);
} else {
  say(`Start the site with:`);
}
say(`\n  ${c.cyan}npm run dev${c.reset}`);
say(`\nThen open ${c.cyan}http://localhost:3000${c.reset}\n`);
