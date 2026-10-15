/**
 * Gera os pacotes do QuickFill a partir de um código só.
 *
 *   node build.mjs            → atualiza as pastas DEV, SCRUM e DESIGN a partir da pasta QA
 *   node build.mjs --zip      → idem, e gera também os .zip para distribuir
 *
 * A pasta jira-quickfill-qa é a fonte: edite lá e rode o build. Os arquivos que mudam
 * por perfil (lib/role.js, manifest.json, content.js, content.css) são gerados aqui;
 * o README de cada pacote é mantido à mão.
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { renderIcon, ICON_SIZES } from "./tools/icons.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, "jira-quickfill-qa");
const VERSION = "3.4.0";

const ROLES = {
  qa: {
    dir: "jira-quickfill-qa",
    name: "Jira QuickFill QA",
    title: "Jira QuickFill QA",
    description: "QA: preenche datas, estimativa, apontamento e status de subtarefas (Testes Manuais), em uma tarefa ou em lote, com painel, equipe e meu dia.",
    key: "J", hint: "Abrir o modal do Jira QuickFill na aba atual",
    launcher: { text: "⏱", bottom: 18, color: "#579dff" }, frame: [520, 700],
  },
  dev: {
    dir: "jira-quickfill-dev",
    name: "Jira QuickFill DEV — Meu progresso",
    title: "Jira QuickFill DEV",
    description: "DEV: seu dia e seu progresso no Jira — meta do dia, sequência, histórico, suas demandas (com o QA, voltaram, entregues) e a equipe.",
    key: "Y", hint: "Abrir o QuickFill DEV na aba atual",
    launcher: { text: "DEV", bottom: 66, color: "#4bce97" }, frame: [600, 760],
  },
  scrum: {
    dir: "jira-quickfill-scrum",
    name: "Jira QuickFill SCRUM — Sprint e equipe",
    title: "Jira QuickFill SCRUM",
    description: "SCRUM: saúde da sprint (burndown, previsão, velocidade), quem está com o quê, riscos (impedidas, paradas, fila do QA) e a equipe ao vivo.",
    key: "K", hint: "Abrir o QuickFill SCRUM na aba atual",
    launcher: { text: "SM", bottom: 114, color: "#f5cd47" }, frame: [600, 760],
  },
  design: {
    dir: "jira-quickfill-design",
    name: "Jira QuickFill DESIGN — HUs e metas",
    title: "Jira QuickFill DESIGN",
    description: "DESIGN: suas HUs por etapa (fila, em design, revisão, com o dev), quem está aguardando design, meta semanal de entregas, seu dia e a equipe.",
    key: "E", hint: "Abrir o QuickFill DESIGN na aba atual",
    launcher: { text: "UX", bottom: 162, color: "#e774bb" }, frame: [600, 760],
  },
};

const PER_ROLE = new Set(["lib/role.js", "manifest.json", "content.js", "content.css", "README.md", ...ICON_SIZES.map((n) => `icons/icon${n}.png`)]);

function listFiles(dir, base = "") {
  const out = [];
  for (const e of readdirSync(join(dir, base), { withFileTypes: true })) {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...listFiles(dir, rel));
    else out.push(rel);
  }
  return out;
}

function roleJs(role) {
  return `/**
 * Perfil do pacote. O mesmo código gera quatro extensões:
 *   "qa"     — Jira QuickFill QA     (o modelo completo: Tarefa, Lote, Painel, Equipe, Meu dia)
 *   "dev"    — Jira QuickFill DEV    (meu progresso: Hoje, Progresso, Demandas, Equipe)
 *   "scrum"  — Jira QuickFill SCRUM  (Sprint, Pessoas, Riscos, Equipe)
 *   "design" — Jira QuickFill DESIGN (Hoje, HUs, Progresso, Equipe)
 * Gerado pelo build.mjs — não edite à mão.
 */
export const ROLE = "${role}";
`;
}

function manifest(role, r) {
  const src = JSON.parse(readFileSync(join(SRC, "manifest.json"), "utf8"));
  const icons = Object.fromEntries(ICON_SIZES.map((n) => [String(n), `icons/icon${n}.png`]));
  // Só o DESIGN conversa com a API do Figma (achar a tela da HU).
  const hosts = (src.host_permissions || []).filter((h) => !h.includes("figma.com"));
  return JSON.stringify({
    ...src,
    host_permissions: role === "design" ? [...hosts, "https://api.figma.com/*"] : hosts,
    icons,
    name: r.name,
    version: VERSION,
    description: r.description,
    action: { ...src.action, default_title: r.title, default_icon: icons },
    commands: { "open-quickfill": { suggested_key: { default: `Ctrl+Shift+${r.key}`, mac: `Command+Shift+${r.key}` }, description: r.hint } },
  }, null, 2) + "\n";
}

function contentJs(role, r) {
  let s = readFileSync(join(SRC, "content.js"), "utf8");
  const suffix = role === "qa" ? "" : `-${role}`;
  const swap = (a, b) => { if (!s.includes(a)) throw new Error(`content.js: trecho não encontrado: ${a}`); s = s.split(a).join(b); };
  swap(`const HOST_ID = "jira-quickfill-host";`, `const HOST_ID = "jira-quickfill${suffix}-host";`);
  swap(`frame.className = "jqf-frame";`, `frame.className = "jqf-frame jqf-frame-${role}";`);
  swap(`"jqf-launcher")) return;`, `"jqf-launcher${suffix}")) return;`);
  swap(`btn.id = "jqf-launcher";`, `btn.id = "jqf-launcher${suffix}";`);
  swap(`btn.className = "jqf-launcher";`, `btn.className = "jqf-launcher jqf-${role}";`);
  swap(`btn.title = "Jira QuickFill QA (Ctrl+Shift+J)";`, `btn.title = "${r.title} (Ctrl+Shift+${r.key})";`);
  swap(`btn.textContent = "⏱";`, `btn.textContent = "${r.launcher.text}";`);
  swap(`const BASE_W = 520, BASE_H = 700;`, `const BASE_W = ${r.frame[0]}, BASE_H = ${r.frame[1]};`);
  return s;
}

function contentCss(role, r) {
  const base = readFileSync(join(SRC, "content.css"), "utf8").replace(/\n\/\* QuickFill [\s\S]*$/, "\n");
  if (role === "qa") return base;
  return `${base.trimEnd()}

/* QuickFill ${role.toUpperCase()}: botão empilhado acima dos outros perfis, moldura mais larga */
.jqf-launcher.jqf-${role} { bottom: ${r.launcher.bottom}px; font-size: 10px; font-weight: 800; letter-spacing: .02em; color: ${r.launcher.color}; }
.jqf-frame.jqf-frame-${role} { width: ${r.frame[0]}px; height: ${r.frame[1]}px; }
`;
}

const shared = listFiles(SRC).filter((f) => !PER_ROLE.has(f));
// A fonte guarda o content.js/css do QA; os outros perfis são derivados dele.
const qaContent = { js: readFileSync(join(SRC, "content.js"), "utf8"), css: readFileSync(join(SRC, "content.css"), "utf8") };

for (const [role, r] of Object.entries(ROLES)) {
  const out = join(ROOT, r.dir);
  mkdirSync(join(out, "lib"), { recursive: true });
  if (role !== "qa") {
    for (const f of shared) {
      mkdirSync(dirname(join(out, f)), { recursive: true });
      copyFileSync(join(SRC, f), join(out, f));
    }
    writeFileSync(join(out, "content.js"), contentJs(role, r));
    writeFileSync(join(out, "content.css"), contentCss(role, r));
  } else {
    writeFileSync(join(out, "content.js"), qaContent.js);
    writeFileSync(join(out, "content.css"), qaContent.css);
  }
  writeFileSync(join(out, "lib/role.js"), roleJs(role));
  writeFileSync(join(out, "manifest.json"), manifest(role, r));
  mkdirSync(join(out, "icons"), { recursive: true });
  for (const n of ICON_SIZES) writeFileSync(join(out, `icons/icon${n}.png`), renderIcon(role, n));
  if (!existsSync(join(out, "README.md"))) writeFileSync(join(out, "README.md"), `# ${r.title}\n`);
  console.log(`✓ ${r.dir} (${role})`);

  if (process.argv.includes("--zip")) {
    const zip = join(ROOT, `${r.dir}.zip`);
    try {
      execFileSync("powershell", ["-NoProfile", "-Command", `Compress-Archive -Path '${out}' -DestinationPath '${zip}' -Force`], { stdio: "ignore" });
      console.log(`  zip: ${zip}`);
    } catch { console.log("  (não foi possível gerar o .zip — compacte a pasta manualmente)"); }
  }
}
