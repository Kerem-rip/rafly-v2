const { execFileSync } = require("node:child_process");
const { cpSync, mkdirSync, readdirSync, rmSync } = require("node:fs");
const path = require("node:path");

const desktop = path.resolve(__dirname, "..");
const repo = path.dirname(desktop);
const docs = path.join(repo, "docs");
const panel = path.join(repo, "panel-src");
const site = path.join(desktop, "site");

// The web and desktop releases use the same panel source.
execFileSync(process.execPath, [path.join(panel, "node_modules/typescript/bin/tsc")], {
  cwd: panel,
  stdio: "inherit",
});
execFileSync(process.execPath, [path.join(panel, "node_modules/vite/bin/vite.js"), "build"], {
  cwd: panel,
  stdio: "inherit",
});

rmSync(site, { recursive: true, force: true });
mkdirSync(site);
for (const entry of readdirSync(docs)) {
  if (entry === "panel" || entry === "CNAME" || entry.startsWith(".")) continue;
  cpSync(path.join(docs, entry), path.join(site, entry), { recursive: true });
}
cpSync(path.join(panel, "dist"), path.join(site, "panel"), { recursive: true });
