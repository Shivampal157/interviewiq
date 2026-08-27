import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { randomBytes } from "node:crypto";

const MAX_OUT = 12000;
const TIMEOUT_MS = 8000;

const texts = (rows) =>
  (rows || [])
    .map((row) => (typeof row === "string" ? row : row?.text || ""))
    .join("\n")
    .trim();

const clip = (value) => String(value || "").slice(0, MAX_OUT);

const runChild = (command, args, { cwd, stdin = "", timeoutMs = TIMEOUT_MS } = {}) =>
  new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env: { PATH: process.env.PATH, PYTHONIOENCODING: "utf-8", PYTHONUNBUFFERED: "1" },
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
    }, timeoutMs);
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (stdout.length > MAX_OUT) child.kill();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      if (stderr.length > MAX_OUT) child.kill();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({ stdout, stderr: error.message, code: 1 });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code });
    });
    child.stdin.write(stdin);
    child.stdin.end();
  });

const runJavascript = (code, stdin) => {
  const logs = [];
  const write = (...args) => logs.push(args.map((v) => (typeof v === "string" ? v : JSON.stringify(v))).join(" "));
  const sandbox = {
    console: { log: write, info: write, warn: write, error: write },
    stdin: String(stdin || ""),
  };
  try {
    vm.runInNewContext(code, sandbox, { timeout: 4000, filename: "solution.js" });
    return clip(logs.join("\n") || "Program finished. No stdout.");
  } catch (error) {
    const body = [logs.join("\n"), error.message].filter(Boolean).join("\n");
    throw new Error(body || "JavaScript failed");
  }
};

const runPython = async (code, stdin) => {
  const dir = path.join(os.tmpdir(), `iq-${randomBytes(8).toString("hex")}`);
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, "main.py");
  await fs.writeFile(file, code, "utf8");
  try {
    const result = await runChild("python", [file], { cwd: dir, stdin });
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    if (result.code !== 0 && !output) throw new Error("Python exited with an error");
    return clip(output || "Program finished. No stdout.");
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
};

const runGodbolt = async ({ compiler, lang, source, stdin, userArguments }) => {
  const response = await fetch(`https://godbolt.org/api/compiler/${compiler}/compile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "InterviewIQ",
    },
    signal: AbortSignal.timeout(25000),
    body: JSON.stringify({
      source,
      lang,
      options: {
        userArguments: userArguments || "",
        executeParameters: { args: [], stdin: String(stdin || "") },
        compilerOptions: { skipAsm: true, executorRequest: true },
        filters: { execute: true, binary: false, commentOnly: true, directives: true, intel: true, labels: true },
      },
    }),
  });

  if (!response.ok) {
    throw new Error("C++ / Java runner is busy. Try JavaScript or Python, or click Run again.");
  }

  const data = await response.json();
  const executed = data.execResult || data;
  const didExecute = Boolean(executed.didExecute);
  const compileErr = texts(data.buildResult?.stderr) || texts(executed.buildResult?.stderr);
  const stdout = texts(executed.stdout);
  const runErr = texts(didExecute ? executed.stderr : data.stderr);
  if (!didExecute) {
    throw new Error(compileErr || runErr || "Compilation failed");
  }
  const output = [stdout, runErr, compileErr].filter(Boolean).join("\n").trim();
  return clip(output || "Program finished. No stdout.");
};

export const executeInterviewCode = async ({ language, code, stdin }) => {
  const lang = ["javascript", "python", "java", "cpp"].includes(language) ? language : "javascript";
  const source = String(code || "");
  const input = String(stdin || "").slice(0, 4000);
  if (!source.trim()) throw new Error("Write some code first");
  if (source.length > 40000) throw new Error("Code is too long");

  if (lang === "javascript") return runJavascript(source, input);
  if (lang === "python") return runPython(source, input);
  if (lang === "cpp") {
    return runGodbolt({
      compiler: "g132",
      lang: "c++",
      source,
      stdin: input,
      userArguments: "-O2 -std=c++17",
    });
  }
  return runGodbolt({
    compiler: "java2100",
    lang: "java",
    source,
    stdin: input,
    userArguments: "",
  });
};
