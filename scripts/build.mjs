import { copyFile, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await copySourceFiles('src', 'dist');

async function copySourceFiles(sourceDir, targetDir) {
  await mkdir(targetDir, { recursive: true });
  for (const entry of await readdir(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      await copySourceFiles(sourcePath, targetPath);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.js') && !entry.name.endsWith('.d.ts') && !entry.name.endsWith('.json')) continue;
    await copyFile(sourcePath, targetPath);
  }
}
