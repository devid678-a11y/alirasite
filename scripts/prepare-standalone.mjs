import { cp, mkdir, readdir, rm, symlink } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const standaloneRoot = path.join(projectRoot, ".next", "standalone");
const publicRoot = path.join(projectRoot, "public");
const standalonePublicRoot = path.join(standaloneRoot, "public");
const standaloneUploads = path.join(standalonePublicRoot, "uploads");
const uploadsRoot = path.join(publicRoot, "uploads");
const staticRoot = path.join(projectRoot, ".next", "static");
const standaloneStaticRoot = path.join(standaloneRoot, ".next", "static");

await rm(standaloneStaticRoot, { recursive: true, force: true });
await mkdir(path.dirname(standaloneStaticRoot), { recursive: true });
await cp(staticRoot, standaloneStaticRoot, { recursive: true });

await mkdir(standalonePublicRoot, { recursive: true });
// Next's file tracing may already have copied user uploads into standalone/public.
// Keep the persistent uploads directory in one place and point standalone at it.
await rm(standaloneUploads, { recursive: true, force: true });
if (process.platform === "win32") {
  // Local Windows builds may not have symlink privileges; uploads are runtime data.
  await mkdir(standaloneUploads, { recursive: true });
} else {
  const uploadsTarget = path.relative(standalonePublicRoot, uploadsRoot);
  await symlink(uploadsTarget, standaloneUploads, "dir");
}

for (const entry of await readdir(publicRoot, { withFileTypes: true })) {
  // Uploads are already included by Next's file tracing and may contain user data.
  if (entry.name === "uploads") continue;

  const source = path.join(publicRoot, entry.name);
  const destination = path.join(standalonePublicRoot, entry.name);
  await cp(source, destination, { recursive: true, force: true });
}
