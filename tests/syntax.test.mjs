import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

async function javascriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return javascriptFiles(target);
    return entry.isFile() && entry.name.endsWith(".js") ? [target] : [];
  }));
  return nested.flat();
}

test("all production classic scripts parse independently", async () => {
  const files = ["game.js", ...(await javascriptFiles("js"))];
  assert.ok(files.length > 10);

  for (const file of files) {
    const source = await readFile(file, "utf8");
    assert.doesNotThrow(() => new vm.Script(source, { filename: file }), file);
  }
});
