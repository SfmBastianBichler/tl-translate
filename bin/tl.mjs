#!/usr/bin/env node
// tl – free translator for the terminal (no API keys, no dependencies)
//
//   tl Hallo Welt                 -> translates in the configured direction (default: German -> English)
//   tl --config english german    -> change the direction permanently
//   tl -t fr Good morning         -> one-off target language French
//   tl -c Hello                   -> also copy the result to the clipboard
//   echo "text" | tl              -> read text from a pipe
//   tl                            -> interactive mode (line by line, empty line/exit quits)

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import readline from "node:readline";

const CONFIG_FILE = join(homedir(), ".tl.json");
const DEFAULT_CONFIG = { from: "de", to: "en" };

// Language names accepted on the command line (English and German spellings)
const LANG_NAMES = {
  german: "de", deutsch: "de", english: "en", englisch: "en", french: "fr", französisch: "fr", franzoesisch: "fr",
  spanish: "es", spanisch: "es", italian: "it", italienisch: "it", portuguese: "pt", portugiesisch: "pt",
  dutch: "nl", niederländisch: "nl", niederlaendisch: "nl", polish: "pl", polnisch: "pl", russian: "ru", russisch: "ru",
  turkish: "tr", türkisch: "tr", tuerkisch: "tr", ukrainian: "uk", ukrainisch: "uk", czech: "cs", tschechisch: "cs",
  swedish: "sv", schwedisch: "sv", danish: "da", dänisch: "da", daenisch: "da", norwegian: "no", norwegisch: "no",
  finnish: "fi", finnisch: "fi", greek: "el", griechisch: "el", croatian: "hr", kroatisch: "hr", hungarian: "hu",
  ungarisch: "hu", romanian: "ro", rumänisch: "ro", rumaenisch: "ro", arabic: "ar", arabisch: "ar",
  chinese: "zh-CN", chinesisch: "zh-CN", japanese: "ja", japanisch: "ja", korean: "ko", koreanisch: "ko",
};
const CODE_NAMES = { de: "German", en: "English", fr: "French", es: "Spanish", it: "Italian", pt: "Portuguese",
  nl: "Dutch", pl: "Polish", ru: "Russian", tr: "Turkish", uk: "Ukrainian", cs: "Czech", sv: "Swedish",
  da: "Danish", no: "Norwegian", fi: "Finnish", el: "Greek", hr: "Croatian", hu: "Hungarian", ro: "Romanian",
  ar: "Arabic", "zh-CN": "Chinese", ja: "Japanese", ko: "Korean" };

// "english", "Englisch", "EN" -> "en"; unknown codes (2-3 letters, optional region) are passed through
function langCode(input) {
  const s = String(input || "").trim().toLowerCase();
  if (LANG_NAMES[s]) return LANG_NAMES[s];
  if (/^[a-z]{2,3}(-[a-z]{2})?$/i.test(s)) return s;
  throw new Error(`Unknown language: "${input}"`);
}
const langName = (code) => CODE_NAMES[code] || code;

function loadConfig() {
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(readFileSync(CONFIG_FILE, "utf8")) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

const config = loadConfig();

const c = process.stdout.isTTY
  ? { dim: (s) => `\x1b[2m${s}\x1b[0m`, bold: (s) => `\x1b[1m${s}\x1b[0m`, cyan: (s) => `\x1b[36m${s}\x1b[0m`, red: (s) => `\x1b[31m${s}\x1b[0m`, yellow: (s) => `\x1b[33m${s}\x1b[0m` }
  : { dim: (s) => s, bold: (s) => s, cyan: (s) => s, red: (s) => s, yellow: (s) => s };

function usage() {
  const h = (s) => c.bold(c.yellow(s));
  const cmd = (s) => c.cyan(s.padEnd(34));
  const langs = Object.entries(CODE_NAMES).map(([code, name]) => `${name} (${code})`);
  const langRows = [];
  for (let i = 0; i < langs.length; i += 4) langRows.push("  " + langs.slice(i, i + 4).map((l) => l.padEnd(20)).join(""));

  console.log(`
${c.bold("tl")} ${c.dim("– free translator for the terminal")}

  Current direction: ${c.bold(c.cyan(`${langName(config.from)} → ${langName(config.to)}`))}

${h("TRANSLATE")}
  ${cmd('tl "ich mag Äpfel"')}translate in the configured direction
  ${cmd("tl ich mag Äpfel")}quotes are optional
  ${cmd("tl")}interactive mode (empty line quits)
  ${cmd("Get-Content text.txt | tl")}read text from a file or pipe

${h("SET DIRECTION")} ${c.dim("(saved permanently)")}
  ${cmd("tl --config english german")}from now on English → German
  ${cmd("tl --config german english")}back to the default
  ${cmd("tl --config")}show the current setting

${h("OPTIONS")} ${c.dim("(apply to this call only)")}
  ${cmd("-t, --to <language>")}other target language, e.g. ${c.cyan("tl -t french Hello")}
  ${cmd("-s, --from <language>")}fix the source language instead of auto-detecting
  ${cmd("-c, --copy")}copy the result to the clipboard
  ${cmd("-v, --verbose")}show the direction, e.g. ${c.dim("[de → en]")}
  ${cmd("-h, --help")}this overview

${h("INTERACTIVE MODE")}
  ${cmd(":to <language>")}change target language
  ${cmd(":from <language>")}fix source language
  ${cmd(":auto")}back to the configured direction
  ${cmd(":copy")}toggle clipboard copy

${h("LANGUAGES")} ${c.dim("(English or German name, or code, e.g. spanish, spanisch, es)")}
${langRows.join("\n")}

${h("GOOD TO KNOW")}
  • If the text is already in the target language, it is translated back automatically.
  • Free via Google Translate, falls back to MyMemory automatically if Google fails.
  • Settings: ${c.dim(CONFIG_FILE)}
`);
}

function setConfig(args) {
  if (args.length === 0) {
    console.log(`Current: ${langName(config.from)} -> ${langName(config.to)}  (${CONFIG_FILE})`);
    return;
  }
  if (args.length !== 2) throw new Error("Usage: tl --config <from> <to>, e.g. tl --config english german");
  const next = { from: langCode(args[0]), to: langCode(args[1]) };
  writeFileSync(CONFIG_FILE, JSON.stringify(next, null, 2));
  console.log(`Switched: ${langName(next.from)} -> ${langName(next.to)}`);
}

function parseArgs(argv) {
  const opts = { from: "auto", to: null, copy: false, verbose: false, words: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--config") { opts.config = argv.slice(i + 1); break; }
    else if (a === "-t" || a === "--to") opts.to = langCode(argv[++i]);
    else if (a === "-s" || a === "--from") opts.from = langCode(argv[++i]);
    else if (a === "-v" || a === "--verbose") opts.verbose = true;
    else if (a === "-c" || a === "--copy") opts.copy = true;
    else if (a === "-h" || a === "--help" || a === "-?") opts.help = true;
    else if (a === "--") { opts.words.push(...argv.slice(i + 1)); break; }
    else opts.words.push(a);
  }
  return opts;
}

// Backend 1: Google endpoint used by the Chrome dictionary extension (no key required)
// Response with sl=auto: [["translation","detected language"]], otherwise: ["translation"]
async function google(text, from, to) {
  const url = new URL("https://clients5.google.com/translate_a/t");
  url.search = new URLSearchParams({ client: "dict-chrome-ex", sl: from, tl: to, q: text });
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Google HTTP ${res.status}`);
  const [first] = await res.json();
  if (Array.isArray(first)) return { text: first[0], detected: first[1] || from };
  return { text: first, detected: from };
}

// Backend 2 (fallback): MyMemory, free up to ~5000 characters/day
async function mymemory(text, from, to) {
  const url = new URL("https://api.mymemory.translated.net/get");
  url.search = new URLSearchParams({ q: text, langpair: `${from === "auto" ? "Autodetect" : from}|${to}` });
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);
  const data = await res.json();
  // Detected language == target language: MyMemory reports an error instead of returning the text
  if (/DISTINCT LANGUAGES/i.test(data.responseDetails)) return { text, detected: to };
  if (data.responseStatus !== 200) throw new Error(`MyMemory: ${data.responseDetails}`);
  return { text: data.responseData.translatedText, detected: data.responseData.detectedLanguage || from };
}

async function translateWith(backend, text, from, to) {
  if (to) return { ...(await backend(text, from, to)), to };
  // Configured direction; if the text is already in the target language -> back to the source language
  const r = await backend(text, from, config.to);
  if (r.detected.split("-")[0] !== config.to.split("-")[0]) return { ...r, to: config.to };
  return { ...(await backend(text, config.to, config.from)), detected: config.to, to: config.from };
}

async function translate(text, from, to) {
  try {
    return await translateWith(google, text, from, to);
  } catch {
    return await translateWith(mymemory, text, from, to);
  }
}

function copyToClipboard(text) {
  try {
    if (process.platform === "win32") {
      const ps = "[Console]::InputEncoding=[Text.Encoding]::UTF8; Set-Clipboard -Value ([Console]::In.ReadToEnd())";
      execSync(`powershell -NoProfile -Command "${ps}"`, { input: text });
    } else if (process.platform === "darwin") {
      execSync("pbcopy", { input: text });
    } else {
      execSync("xclip -selection clipboard", { input: text });
    }
    return true;
  } catch {
    return false;
  }
}

async function run(text, opts) {
  const r = await translate(text, opts.from, opts.to);
  const prefix = opts.verbose ? c.dim(`[${r.detected} → ${r.to}] `) : "";
  console.log(prefix + c.bold(c.cyan(r.text)));
  if (opts.copy && copyToClipboard(r.text)) console.log(c.dim("(copied to clipboard)"));
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8").trim();
}

async function interactive(opts) {
  console.log(c.dim("tl interactive – type text, Enter translates. Empty line or 'exit' quits."));
  console.log(c.dim("Commands: :to <lang>  :from <lang>  :auto  :copy"));
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "› " });
  rl.prompt();
  for await (const line of rl) {
    const t = line.trim();
    if (!t || t === "exit" || t === "quit") break;
    try {
      if (t.startsWith(":to ")) opts.to = langCode(t.slice(4));
      else if (t.startsWith(":from ")) opts.from = langCode(t.slice(6));
      else if (t === ":auto") { opts.to = null; opts.from = "auto"; }
      else if (t === ":copy") { opts.copy = !opts.copy; console.log(c.dim(`copy ${opts.copy ? "on" : "off"}`)); }
      else await run(t, opts);
    } catch (e) {
      console.error(c.red(`Error: ${e.message}`));
    }
    rl.prompt();
  }
  rl.close();
}

try {
  const opts = parseArgs(process.argv.slice(2));
  let text = opts.words.join(" ").trim();
  if (opts.help) usage();
  else if (opts.config) setConfig(opts.config);
  else if (text) await run(text, opts);
  else if (process.stdin.isTTY) await interactive(opts);
  else if ((text = await readStdin())) await run(text, opts);
  else usage();
} catch (e) {
  console.error(c.red(`Error: ${e.message}`));
  process.exitCode = 1;
}
