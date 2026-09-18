#!/usr/bin/env node
/**
 * scripts/validate.mjs — dependency-free static checks for this project.
 *
 * `tsc` and `next build` need the npm registry, which is not always reachable
 * (offline installs, locked-down CI). This script catches the classes of
 * mistake that would otherwise only surface at build time, plus the project's
 * own security rules:
 *
 *   1. every "@/..." and relative import resolves to a real file
 *   2. every named import actually exists in the target module
 *   3. every internal href matches a real App Router route
 *   4. brackets balance in every source file
 *   5. every process.env key is documented in .env.example
 *   6. no server-only secret is read from a client component
 *   7. no server-only module is imported by a client component
 *   8. no real secret value is hard-coded anywhere
 *   9. Tailwind colour tokens exist in the palette
 *  10. all routes promised by the spec are present
 *
 * Run:  node scripts/validate.mjs
 * Exit: 0 when there are no errors (warnings are allowed), 1 otherwise.
 */

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIRS = ["app", "components", "lib", "services", "types"];
const SOURCE_EXT = [".ts", ".tsx", ".mjs"];
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "public", "supabase"]);

const errors = [];
const warnings = [];

const fail = (file, message) => errors.push({ file, message });
const warn = (file, message) => warnings.push({ file, message });
const rel = (absolute) => relative(ROOT, absolute).split(sep).join("/");

/* ---------------------------------------------------------------- file tree */

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const allFiles = [];
for (const dir of SOURCE_DIRS) {
  const full = join(ROOT, dir);
  if (existsSync(full)) walk(full, allFiles);
}
for (const loose of ["middleware.ts", "next.config.ts", "tailwind.config.ts"]) {
  const full = join(ROOT, loose);
  if (existsSync(full)) allFiles.push(full);
}

const sourceFiles = allFiles.filter((file) =>
  SOURCE_EXT.some((ext) => file.endsWith(ext)),
);

const fileCache = new Map();
function read(file) {
  if (!fileCache.has(file)) fileCache.set(file, readFileSync(file, "utf8"));
  return fileCache.get(file);
}

console.log(`Scanning ${sourceFiles.length} source files in ${rel(ROOT)}/\n`);

/* ------------------------------------------------- 0. import extraction */

const IMPORT_RE =
  /import\s+(?:type\s+)?([\s\S]*?)\s*from\s*["']([^"']+)["']|import\s*["']([^"']+)["']|export\s+(?:type\s+)?(?:\*|\{[\s\S]*?\})\s*from\s*["']([^"']+)["']/g;

/** All import/re-export statements in a file, with their clause text. */
function importsOf(file) {
  const found = [];
  for (const match of read(file).matchAll(IMPORT_RE)) {
    const spec = match[2] ?? match[3] ?? match[4];
    if (spec) found.push({ spec, clause: match[1] ?? "", raw: match[0] });
  }
  return found;
}

/** Named bindings inside an import clause, ignoring the default binding. */
function namedBindings(clause) {
  const braces = clause.match(/\{([\s\S]*)\}/);
  if (!braces) return [];
  return braces[1]
    .split(",")
    .map((part) => part.trim().replace(/^type\s+/, ""))
    .filter(Boolean)
    .map((part) => {
      const [imported, alias] = part.split(/\s+as\s+/).map((piece) => piece.trim());
      return { imported, local: alias ?? imported };
    })
    .filter((entry) => /^[A-Za-z_$][\w$]*$/.test(entry.imported));
}

function hasDefaultBinding(clause) {
  const head = clause.split("{")[0].trim();
  if (!head) return false;
  return /^[A-Za-z_$][\w$]*/.test(head) && !head.startsWith("*");
}

/* --------------------------------------- 1./2. resolution + named exports */

/** Packages declared in package.json, plus the ones Node/Next provide. */
const manifest = JSON.parse(read(join(ROOT, "package.json")));
const BARE_ALLOWED = new Set([
  ...Object.keys(manifest.dependencies ?? {}),
  ...Object.keys(manifest.devDependencies ?? {}),
  "server-only",
  "client-only",
]);

function resolveModule(fromFile, spec) {
  let base;
  if (spec.startsWith("@/")) base = join(ROOT, spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(dirname(fromFile), spec);
  else return "external";

  const candidates = [
    base,
    ...SOURCE_EXT.map((ext) => base + ext),
    ...[".js", ".jsx"].map((ext) => base + ext),
    ...SOURCE_EXT.map((ext) => join(base, "index" + ext)),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/** Exported names of a module, following `export * from` one level deep. */
const exportCache = new Map();
function exportsOf(file, depth = 0) {
  if (exportCache.has(file)) return exportCache.get(file);
  const text = read(file);
  const names = new Set();

  const add = (name) => name && names.add(name);
  const patterns = [
    /export\s+(?:async\s+)?function\s+\*?\s*([A-Za-z_$][\w$]*)/g,
    /export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g,
    /export\s+(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/g,
    /export\s+(?:interface|type|enum)\s+([A-Za-z_$][\w$]*)/g,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) add(match[1]);
  }

  // export { a, b as c }  /  export type { X }
  for (const match of text.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const part of match[1].split(",")) {
      const piece = part.trim();
      if (!piece) continue;
      const alias = piece.split(/\s+as\s+/);
      add((alias[1] ?? alias[0]).replace(/^type\s+/, "").trim());
    }
  }

  if (/export\s+default\b/.test(text)) add("default");

  // export * from "./x" — pull the child's names in.
  if (depth < 3) {
    for (const match of text.matchAll(/export\s+\*\s*from\s*["']([^"']+)["']/g)) {
      const target = resolveModule(file, match[1]);
      if (target && target !== "external") {
        for (const name of exportsOf(target, depth + 1)) add(name);
      }
    }
  }

  exportCache.set(file, names);
  return names;
}

const resolvedGraph = new Map(); // file -> resolved local dependency files

for (const file of sourceFiles) {
  const deps = [];
  for (const { spec, clause } of importsOf(file)) {
    const target = resolveModule(file, spec);

    if (target === "external") {
      const root = spec.startsWith("@")
        ? spec.split("/").slice(0, 2).join("/")
        : spec.split("/")[0];
      const known =
        BARE_ALLOWED.has(spec) ||
        BARE_ALLOWED.has(root) ||
        root === "next" ||
        root === "@supabase" ||
        root.startsWith("node:");
      if (!known) warn(rel(file), `unrecognised package import "${spec}"`);
      continue;
    }
    if (!target) {
      fail(rel(file), `unresolved import "${spec}"`);
      continue;
    }
    deps.push(target);

    const available = exportsOf(target);
    for (const { imported } of namedBindings(clause)) {
      if (!available.has(imported)) {
        fail(rel(file), `"${imported}" is not exported by ${rel(target)}`);
      }
    }
    if (hasDefaultBinding(clause) && !available.has("default")) {
      fail(rel(file), `${rel(target)} has no default export`);
    }
  }
  resolvedGraph.set(file, deps);
}

/* -------------------------------------------------- 3. internal link check */

const pageRoutes = [];
const apiRoutes = [];
for (const file of allFiles) {
  const path = rel(file);
  if (!path.startsWith("app/")) continue;
  const match = path.match(/^app\/(.*)\/?(page|route)\.tsx?$/);
  if (!match) continue;
  const segments = path
    .replace(/^app\//, "")
    .replace(/\/?(page|route)\.tsx?$/, "")
    .split("/")
    .filter((segment) => segment && !/^\(.*\)$/.test(segment)); // route groups
  const route = "/" + segments.join("/");
  (match[2] === "page" ? pageRoutes : apiRoutes).push(route === "/" ? "/" : route);
}

// Handlers that exist as files but are reached by redirect, plus static assets.
const EXTRA_ROUTES = ["/sitemap.xml", "/robots.txt", "/favicon.ico"];
const knownRoutes = [...pageRoutes, ...apiRoutes, ...EXTRA_ROUTES];

function routeMatches(pattern, candidate) {
  const patternParts = pattern.split("/").filter(Boolean);
  const candidateParts = candidate.split("/").filter(Boolean);
  if (patternParts.some((part) => part.startsWith("[..."))) {
    const head = patternParts.findIndex((part) => part.startsWith("[..."));
    return candidateParts.length >= head;
  }
  if (patternParts.length !== candidateParts.length) return false;
  return patternParts.every((part, index) => {
    if (part.startsWith("[")) return true;
    if (candidateParts[index] === "*") return true; // interpolated segment
    return part === candidateParts[index];
  });
}

const LINK_PATTERNS = [
  /href=["'](\/[^"'`]*)["']/g,
  /href=\{`(\/[^`]*)`\}/g,
  /href=\{["'](\/[^"']*)["']\}/g,
  /(?:redirect|push|replace|safeRedirectPath)\(\s*["'](\/[^"']*)["']/g,
  /(?:redirect|push|replace)\(\s*`(\/[^`]*)`/g,
];

for (const file of sourceFiles) {
  const text = read(file);
  for (const pattern of LINK_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      const candidate = match[1]
        .replace(/\$\{[^}]*\}/g, "*")
        .split(/[?#]/)[0]
        .replace(/\/$/, "");
      const normalised = candidate === "" ? "/" : candidate;
      if (normalised.startsWith("//")) continue;
      if (knownRoutes.some((route) => routeMatches(route, normalised))) continue;
      fail(rel(file), `link "${match[1]}" has no matching route`);
    }
  }
}

/* ------------------------------------------------- 4. bracket balance scan */

/**
 * Counts brackets while skipping strings, template literals and comments.
 * Not a parser — it exists to catch a truncated or double-pasted file, which is
 * the realistic failure mode when generating many files.
 */
function unbalanced(text) {
  const stack = [];
  const pairs = { ")": "(", "]": "[", "}": "{" };
  let index = 0;
  let line = 1;
  let lastMeaningful = "";

  /**
   * A "/" starts a regex only where a value is expected. `<` and `>` are
   * deliberately excluded: in TSX, `</div>` is vastly more common than a regex
   * after a comparison.
   */
  const regexAllowed = () => {
    if (lastMeaningful === "") return true;
    if ("(,=:[!&|?{};+-*%~^".includes(lastMeaningful)) return true;
    // `return /x/`, `typeof /x/`, `case /x/` …
    if (/[A-Za-z]/.test(lastMeaningful)) {
      const before = text.slice(Math.max(0, index - 12), index).match(/([A-Za-z]+)\s*$/);
      return before
        ? ["return", "typeof", "case", "in", "of", "do", "else", "yield", "await"].includes(
            before[1],
          )
        : false;
    }
    return false;
  };

  while (index < text.length) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\n") { line += 1; index += 1; continue; }

    if (char === "/" && next === "/") {
      while (index < text.length && text[index] !== "\n") index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      index += 2;
      while (index < text.length && !(text[index] === "*" && text[index + 1] === "/")) {
        if (text[index] === "\n") line += 1;
        index += 1;
      }
      index += 2;
      continue;
    }
    if (char === '"' || char === "'") {
      index += 1;
      while (index < text.length && text[index] !== char) {
        if (text[index] === "\\") index += 1;
        if (text[index] === "\n") line += 1;
        index += 1;
      }
      index += 1;
      lastMeaningful = "x";
      continue;
    }
    if (char === "`") {
      index += 1;
      while (index < text.length && text[index] !== "`") {
        if (text[index] === "\\") { index += 2; continue; }
        if (text[index] === "\n") line += 1;
        // ${ ... } can contain any expression, including nested backticks.
        if (text[index] === "$" && text[index + 1] === "{") {
          let depth = 1;
          index += 2;
          while (index < text.length && depth > 0) {
            if (text[index] === "{") depth += 1;
            else if (text[index] === "}") depth -= 1;
            else if (text[index] === "\n") line += 1;
            index += 1;
          }
          continue;
        }
        index += 1;
      }
      index += 1;
      lastMeaningful = "x";
      continue;
    }
    if (char === "(" || char === "[" || char === "{") {
      stack.push({ char, line });
    } else if (char === ")" || char === "]" || char === "}") {
      const open = stack.pop();
      if (!open || open.char !== pairs[char]) {
        return `unexpected "${char}" on line ${line}`;
      }
    } else if (char === "/" && next === ">") {
      // JSX self-closing tag, e.g. <Icon width={22} />
      index += 2;
      lastMeaningful = ">";
      continue;
    } else if (char === "/" && regexAllowed()) {

      // Regex literal: brackets inside it must not be counted.
      let inClass = false;
      index += 1;
      while (index < text.length) {
        const current = text[index];
        if (current === "\\") { index += 2; continue; }
        if (current === "\n") break; // not a regex after all
        if (current === "[") inClass = true;
        else if (current === "]") inClass = false;
        else if (current === "/" && !inClass) break;
        index += 1;
      }
      index += 1;
      lastMeaningful = "x";
      continue;
    }

    if (!/\s/.test(char)) lastMeaningful = char;
    index += 1;
  }

  if (stack.length > 0) {
    const open = stack[stack.length - 1];
    return `unclosed "${open.char}" opened on line ${open.line}`;
  }
  return null;
}

for (const file of sourceFiles) {
  const problem = unbalanced(read(file));
  if (problem) fail(rel(file), problem);
}

/* --------------------------------------------- 5./6. environment variables */

const examplePath = join(ROOT, ".env.example");
if (!existsSync(examplePath)) {
  fail(".env.example", "missing — the spec requires a documented template");
}
const documented = new Set(
  existsSync(examplePath)
    ? read(examplePath)
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => line.split("=")[0].trim())
    : [],
);

const isClient = (file) => /^\s*["']use client["']/m.test(read(file));
const isServerAction = (file) => /^\s*["']use server["']/m.test(read(file));

/** Comments removed, so documentation examples are not mistaken for code. */
function codeOnly(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, "$1");
}

// Injected by the hosting platform, so they are not declared in .env.example.
const PLATFORM_ENV = new Set([
  "NODE_ENV",
  "VERCEL_URL",
  "NEXT_PUBLIC_VERCEL_URL",
  "VERCEL_ENV",
]);

for (const file of sourceFiles) {
  const text = codeOnly(read(file));
  const client = isClient(file);
  for (const match of text.matchAll(/process\.env\.([A-Z0-9_]+)/g)) {
    const key = match[1];
    if (PLATFORM_ENV.has(key)) continue;
    if (!documented.has(key)) {
      fail(rel(file), `process.env.${key} is not listed in .env.example`);
    }
    if (client && !key.startsWith("NEXT_PUBLIC_")) {
      fail(rel(file), `client component reads server-only env ${key}`);
    }
  }
}

/* ------------------------------------- 7. server-only / client boundary */

const serverOnly = new Set(
  sourceFiles.filter((file) => /import\s+["']server-only["']/.test(read(file))),
);

/**
 * Walks a client component's import graph looking for a server-only module.
 * Traversal stops at "use server" files on purpose: Next.js replaces a server
 * action import with a network reference, so its own imports never reach the
 * browser bundle.
 */
function reachesServerOnly(file, seen = new Set()) {
  if (seen.has(file)) return null;
  seen.add(file);
  for (const dep of resolvedGraph.get(file) ?? []) {
    if (isServerAction(dep)) continue;
    if (serverOnly.has(dep)) return rel(dep);
    const deeper = reachesServerOnly(dep, seen);
    if (deeper) return `${rel(dep)} -> ${deeper}`;
  }
  return null;
}

for (const file of sourceFiles) {
  if (!isClient(file)) continue;
  const chain = reachesServerOnly(file);
  if (chain) fail(rel(file), `client component pulls in server-only: ${chain}`);
}

/* ------------------------------------------------- 8. hard-coded secrets */

const SECRET_PATTERNS = [
  { label: "JWT / Supabase key", re: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/ },
  { label: "TMDB v3 key", re: /\b[a-f0-9]{32}\b/ },
  { label: "Google API key", re: /AIza[0-9A-Za-z_-]{30,}/ },
  { label: "Stripe-style secret", re: /\b(?:sk|rk)_(?:live|test)_[0-9A-Za-z]{16,}/ },
  { label: "Supabase project URL with key", re: /supabase\.co\/?\?apikey=/ },
  { label: "postgres connection string", re: /postgres(?:ql)?:\/\/[^\s"'`]*:[^\s"'`]*@/ },
];

for (const file of [...sourceFiles, examplePath].filter(existsSync)) {
  const text = read(file);
  for (const { label, re } of SECRET_PATTERNS) {
    const hit = text.match(re);
    if (!hit) continue;
    // Placeholders in docs are fine; a real-looking value is not.
    if (/example|placeholder|your[-_]?/i.test(hit[0])) continue;
    fail(rel(file), `possible hard-coded ${label}: ${hit[0].slice(0, 12)}…`);
  }
}

// A local env file may legitimately exist on a developer machine — that is where
// real credentials belong. What must never happen is git tracking it, so the
// check is against .gitignore rather than against the file's existence.
const gitignoreText = existsSync(join(ROOT, ".gitignore"))
  ? read(join(ROOT, ".gitignore"))
  : "";
const gitignoreLines = gitignoreText
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"));

for (const stray of [".env", ".env.local", ".env.production"]) {
  if (!existsSync(join(ROOT, stray))) continue;
  const ignored = gitignoreLines.some(
    (line) => line === stray || line === `/${stray}` || line === ".env*" || line === ".env*.local",
  );
  if (ignored) {
    warn(stray, "real env file present locally — gitignored, keep it off git/hosting exports");
  } else {
    fail(stray, "real env file present and NOT gitignored — it must never be committed");
  }
}

/* ------------------------------------------- 9. Tailwind colour tokens */

const paletteText = read(join(ROOT, "tailwind.config.ts"));
const paletteTokens = new Set();
for (const family of ["brand", "gold", "ink", "mist"]) {
  const block = paletteText.match(new RegExp(`${family}:\\s*\\{([^}]*)\\}`));
  paletteTokens.add(family);
  if (!block) continue;
  for (const match of block[1].matchAll(/(\d{3}|DEFAULT|hover|soft):/g)) {
    paletteTokens.add(match[1] === "DEFAULT" ? family : `${family}-${match[1]}`);
  }
}

const UTILITY_RE =
  /(?:^|[\s"'`:{[(])(?:hover:|focus:|focus-visible:|active:|group-hover:|disabled:|sm:|md:|lg:|xl:|2xl:|xs:|dark:)*(?:text|bg|border|ring|from|to|via|fill|stroke|shadow|decoration|outline|divide|placeholder|accent|caret)-(brand|gold|ink|mist)(?:-([A-Za-z0-9]+))?/g;

for (const file of sourceFiles.filter((f) => f.endsWith(".tsx"))) {
  for (const match of read(file).matchAll(UTILITY_RE)) {
    const family = match[1];
    const shade = match[2];
    if (!shade) continue;
    if (["hover", "soft"].includes(shade)) {
      if (!paletteTokens.has(`${family}-${shade}`)) {
        fail(rel(file), `unknown colour token ${family}-${shade}`);
      }
      continue;
    }
    if (/^\d+$/.test(shade) && !paletteTokens.has(`${family}-${shade}`)) {
      fail(rel(file), `unknown colour token ${family}-${shade}`);
    }
  }
}

/* --------------------------------------------- 10. required route coverage */

const REQUIRED_ROUTES = [
  "/",
  "/movies",
  "/tv",
  "/search",
  "/genres",
  "/movie/[tmdbId]",
  "/tv/[tmdbId]",
  "/watch/movie/[tmdbId]",
  "/watch/tv/[tmdbId]/[season]/[episode]",
  "/my-list",
  "/profile",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

for (const route of REQUIRED_ROUTES) {
  if (!pageRoutes.includes(route)) fail("app/", `missing required route ${route}`);
}

/* ----------------------------------------------------------- 11. hygiene */

for (const file of sourceFiles) {
  const text = read(file);
  if (/\bTODO\b|\bFIXME\b/.test(text)) warn(rel(file), "contains TODO/FIXME");
  if (/console\.log\(/.test(text) && !rel(file).startsWith("scripts/")) {
    warn(rel(file), "contains console.log");
  }
  if (/@ts-ignore|@ts-nocheck|:\s*any\b/.test(text)) {
    warn(rel(file), "uses any / ts-ignore");
  }

  // Unused imports: `next lint` would flag these, and it cannot run offline.
  const body = text.replace(IMPORT_RE, "");
  for (const { clause } of importsOf(file)) {
    for (const { local } of namedBindings(clause)) {
      const uses = body.match(new RegExp(`\\b${local}\\b`, "g"));
      if (!uses) warn(rel(file), `imported "${local}" is never used`);
    }
  }
}

/* ------------------------------------------------------------- report */

const group = (list) => {
  const byFile = new Map();
  for (const item of list) {
    if (!byFile.has(item.file)) byFile.set(item.file, []);
    byFile.get(item.file).push(item.message);
  }
  return [...byFile.entries()].sort(([a], [b]) => a.localeCompare(b));
};

console.log(`Routes: ${pageRoutes.length} pages, ${apiRoutes.length} API handlers`);
console.log(`Client components: ${sourceFiles.filter(isClient).length}`);
console.log(`server-only modules: ${serverOnly.size}`);
console.log(`Documented env keys: ${documented.size}\n`);

if (warnings.length > 0) {
  console.log(`WARNINGS (${warnings.length})`);
  for (const [file, messages] of group(warnings)) {
    console.log(`  ${file}`);
    for (const message of messages) console.log(`    - ${message}`);
  }
  console.log("");
}

if (errors.length > 0) {
  console.log(`ERRORS (${errors.length})`);
  for (const [file, messages] of group(errors)) {
    console.log(`  ${file}`);
    for (const message of messages) console.log(`    - ${message}`);
  }
  console.log("\nStatic validation FAILED");
  process.exit(1);
}

console.log("Static validation PASSED (no errors)");
console.log(
  "Note: this does not replace `npm run typecheck` / `npm run build`, which need the npm registry.",
);
