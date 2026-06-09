import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const [, , envPath, command, ...args] = process.argv;

if (!envPath || !command) {
  console.error("Uso esperado: node scripts/with-env-file.mjs <arquivo-env> <comando> [args...]");
  process.exit(1);
}

const text = await readFile(envPath, "utf8").catch((error) => {
  console.error(`Configuracao local pendente: nao foi possivel ler ${envPath}.`);
  console.error(error.message);
  process.exit(1);
});

const env = { ...process.env };
for (const rawLine of text.split(/\r?\n/)) {
  const line = rawLine.trim();
  if (!line || line.startsWith("#")) continue;
  const separator = line.indexOf("=");
  if (separator < 1) continue;
  const key = line.slice(0, separator).trim();
  let value = line.slice(separator + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  env[key] = value;
}

if (process.env.npm_lifecycle_event === "check:supabase:write") {
  env.SUPABASE_WRITE_TEST = "1";
}

const child = spawn(command, args, {
  env,
  shell: process.platform === "win32",
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
