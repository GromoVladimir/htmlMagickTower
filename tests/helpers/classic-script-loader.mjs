import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

/**
 * Creates a browser-like VM context for dependency-free classic scripts.
 * Callers may provide DOM/canvas doubles through `globals` when a test needs them.
 *
 * @param {Record<string, unknown>} [globals]
 * @returns {vm.Context}
 */
export function createClassicContext(globals = {}) {
  const sandbox = {
    console,
    ...globals,
  };
  const context = vm.createContext(sandbox);
  context.window = context;
  context.self = context;
  return context;
}

/**
 * Loads classic scripts synchronously in the supplied order inside one VM context.
 * Script paths are resolved relative to `root`.
 *
 * @param {string[]} scriptPaths
 * @param {{root?: string, context?: vm.Context}} [options]
 * @returns {Promise<vm.Context>}
 */
export async function loadClassicScripts(scriptPaths, options = {}) {
  const root = options.root ?? process.cwd();
  const context = options.context ?? createClassicContext();

  for (const scriptPath of scriptPaths) {
    const filename = path.resolve(root, scriptPath);
    const source = await readFile(filename, 'utf8');
    const script = new vm.Script(source, { filename });
    script.runInContext(context);
  }

  return context;
}
