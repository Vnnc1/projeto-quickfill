/**
 * Métricas do QuickFill SCRUM (sprint, pessoas, riscos) e do QuickFill DESIGN (HUs).
 * Funções puras sobre as issues que o serviço devolve (boardIssue), testáveis isoladamente.
 */

import { addDaysIso, isWeekendIso, DAY_MS } from "./dates.js";

/* ------------------------------------------------------------------ */
/* Etapas do fluxo (SCRUM)                                              */
/* ------------------------------------------------------------------ */

export const STAGES = [
  { id: "todo", label: "A fazer", icon: "○" },
  { id: "doing", label: "Em andamento", icon: "◐" },
  { id: "feito", label: "Feito", icon: "☑" },
  { id: "deploy", label: "Deploy", icon: "⇪" },
  { id: "qa", label: "Validação", icon: "🔍" },
  { id: "done", label: "Concluído", icon: "✓" },
];
const ORDER = Object.fromEntries(STAGES.map((s, i) => [s.id, i]));

/**
 * Etapa a partir do tipo da coluna (columnKind do serviço) e da categoria do status.
 * Colunas sem nome conhecido caem pela categoria: "new" = a fazer, o resto = em andamento.
 */
export function stageFrom(kind, cat) {
  if (cat === "done" || kind === "done") return "done";
  if (kind === "qa") return "qa";
  if (kind === "feito") return "feito";
  if (kind === "deploy" || kind === "prd") return "deploy";
  if (kind === "reopen") return "doing";
  if (cat === "new") return "todo";
  return "doing";
}
export const stageOf = (i) => stageFrom(i.kind, i.status?.cat);

/** Voltou no fluxo: saiu de Feito/Validação/Concluído para A fazer/Em andamento. */
export const isReturn = (t) => t.fromStage && t.toStage && ORDER[t.fromStage] >= ORDER.feito && ORDER[t.toStage] <= ORDER.doing;

/* ---------- nomes configuráveis (Opções) ---------- */

/** Sem acento e em minúsculas — para casar nomes de status/coluna. */
export const normName = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/**
 * Lista "Feito, Dev OK" → regex que casa qualquer um dos termos no começo de uma palavra
 * (sobre o nome já normalizado). Lista vazia devolve o `fallback`.
 */
export function termsRx(raw, fallback = null) {
  const terms = String(raw || "").split(/[\n,;]+/).map(normName).filter(Boolean);
  if (!terms.length) return fallback;
  const esc = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`(^|[^a-z0-9])(${esc.join("|")})`, "i");
}

/** Tipo da issue agrupado: HU (história), Bug ou Tarefa. */
export function typeGroup(type) {
  const n = normName(type);
  if (/hist|story|\bhu\b/.test(n)) return "hu";
  if (/bug|defeito|erro|incidente/.test(n)) return "bug";
  return "task";
}
export const TYPE_LABEL = { hu: "HUs", bug: "Bugs", task: "Tarefas" };

/** Causa do retorno registrada pelo QA (etiqueta "retorno-<categoria>"). */
export const returnCauses = (i) => (i.labels || []).filter((l) => /^retorno-/i.test(l)).map((l) => l.slice(8).replace(/-/g, " "));

/** Itens da sprint com as subtarefas de cada um (inclusive pais fora da sprint). */
export function sprintTree(issues) {
  const parents = new Map();
  for (const i of issues) if (!i.isSubtask) parents.set(i.key, { issue: i, subs: [] });
  for (const i of issues) {
    if (!i.isSubtask) continue;
    const k = i.parentKey || "?";
    if (!parents.has(k)) parents.set(k, { issue: { key: k, summary: i.parentSummary || "(tarefa pai fora da sprint)", type: "", status: { name: "", cat: "" }, outside: true }, subs: [] });
    parents.get(k).subs.push(i);
  }
  return [...parents.values()];
}

const isoOf = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

/** Dias úteis de a até b (inclusive nos dois lados). */
export function businessDays(a, b) {
  const out = [];
  if (!a || !b || a > b) return out;
  for (let d = a; d <= b; d = addDaysIso(d, 1)) if (!isWeekendIso(d)) out.push(d);
  return out;
}

/** Dias úteis desde `ms` até agora (0 = hoje). */
export function businessAge(ms, now = Date.now()) {
  if (!ms) return 0;
  return Math.max(0, businessDays(isoOf(ms), isoOf(now)).length - 1);
}

/** Último momento em que a issue mudou de status (ou foi criada). */
export const lastMove = (i) => (i.transitions?.length ? i.transitions[i.transitions.length - 1].at : i.created);

/* ------------------------------------------------------------------ */
/* Saúde da sprint                                                      */
/* ------------------------------------------------------------------ */

/**
 * Totais por etapa, burndown (itens e pontos) e previsão de fim no ritmo atual.
 * Subtarefas ficam de fora da contagem: o compromisso da sprint são as tarefas pai.
 */
export function sprintHealth(sprint, today) {
  const items = sprint.issues.filter((i) => !i.isSubtask);
  const byStage = Object.fromEntries(STAGES.map((s) => [s.id, []]));
  for (const i of items) byStage[stageOf(i)].push(i);
  const pts = (list) => list.reduce((s, i) => s + (i.points || 0), 0);

  const end = sprint.end || today;
  const days = businessDays(sprint.start, end);
  const elapsed = days.filter((d) => d <= today).length;
  const doneDate = (i) => {
    if (stageOf(i) !== "done") return null;
    const d = i.catChanged ? isoOf(i.catChanged) : today;
    return d < sprint.start ? sprint.start : d;
  };
  const doneDates = items.map((i) => [i, doneDate(i)]).filter(([, d]) => d);
  const totalPts = pts(items);
  const series = days.map((d, idx) => {
    const doneBy = doneDates.filter(([, dd]) => dd <= d);
    const ideal = days.length > 1 ? items.length * (1 - idx / (days.length - 1)) : 0;
    const idealPts = days.length > 1 ? totalPts * (1 - idx / (days.length - 1)) : 0;
    return d > today
      ? { date: d, future: true, ideal, idealPts }
      : { date: d, remaining: items.length - doneBy.length, remainingPts: totalPts - pts(doneBy.map(([i]) => i)), ideal, idealPts };
  });

  const done = byStage.done.length;
  const rate = elapsed ? done / elapsed : 0;                 // itens por dia útil
  const left = Math.max(0, days.length - elapsed);
  const forecast = Math.min(items.length, Math.round(done + rate * left));
  const startMs = Date.parse(`${sprint.start}T23:59:59`);
  const added = items.filter((i) => i.created && i.created > startMs);

  return {
    items, byStage, total: items.length, done, totalPts, donePts: pts(byStage.done),
    days, elapsed, left, timePct: days.length ? elapsed / days.length : 0,
    workPct: items.length ? done / items.length : 0,
    series, forecast, onTrack: forecast >= items.length,
    added,
  };
}

/* ------------------------------------------------------------------ */
/* Pessoas: quem está com o quê                                         */
/* ------------------------------------------------------------------ */

/**
 * Carga por pessoa na sprint. `wipLimit` marca quem está com itens demais em andamento;
 * para o que está sem responsável sugere quem já atua na mesma tarefa pai e tem menos WIP.
 */
export function peopleLoad(issues, { wipLimit = 2, staleDays = 3, now = Date.now() } = {}) {
  const people = new Map();
  const unassigned = [];
  const person = (a) => {
    if (!people.has(a.id)) people.set(a.id, { id: a.id, name: a.name, stages: Object.fromEntries(STAGES.map((s) => [s.id, []])),
      points: 0, donePts: 0, returns: 0, stalled: 0, parents: new Set() });
    return people.get(a.id);
  };
  for (const i of issues) {
    const st = stageOf(i);
    if (!i.assignee) { if (st !== "done") unassigned.push(i); continue; }
    const p = person(i.assignee);
    p.stages[st].push(i);
    p.points += i.points || 0;
    if (st === "done") p.donePts += i.points || 0;
    p.returns += (i.transitions || []).filter(isReturn).length;
    if (st === "doing" && businessAge(lastMove(i), now) >= staleDays) p.stalled++;
    p.parents.add(i.parentKey || i.key);
  }
  const list = [...people.values()].map((p) => {
    const wip = p.stages.doing.length;
    const open = STAGES.filter((s) => s.id !== "done").reduce((n, s) => n + p.stages[s.id].length, 0);
    const oldest = p.stages.doing.reduce((m, i) => Math.max(m, businessAge(lastMove(i), now)), 0);
    return { ...p, wip, open, oldest, overWip: wip > wipLimit, free: open === 0 };
  }).sort((a, b) => b.open - a.open || a.name.localeCompare(b.name));

  const suggest = (i) => {
    const fam = i.parentKey || i.key;
    const near = list.filter((p) => p.parents.has(fam) && !p.overWip).sort((a, b) => a.wip - b.wip || a.open - b.open);
    if (near.length) return { person: near[0], why: `já atua em ${fam}` };
    const light = list.filter((p) => !p.overWip).sort((a, b) => a.wip - b.wip || a.open - b.open);
    return light.length ? { person: light[0], why: light[0].wip ? `menor WIP (${light[0].wip})` : "sem nada em andamento" } : null;
  };
  return { people: list, unassigned: unassigned.map((i) => ({ issue: i, suggestion: suggest(i) })) };
}

/* ------------------------------------------------------------------ */
/* Riscos da sprint                                                     */
/* ------------------------------------------------------------------ */

export const RISKS = [
  { id: "flagged", label: "Impedidas", icon: "🚩", tip: "Sinalizadas como impedimento no Jira" },
  { id: "returned", label: "Voltaram", icon: "🔁", tip: "Saíram de Feito/Validação/Concluído e voltaram para desenvolvimento durante a sprint" },
  { id: "stalled", label: "Paradas", icon: "⏳", tip: "Em andamento sem mudar de status há vários dias úteis" },
  { id: "feitoQueue", label: "Aguardando deploy", icon: "☑", tip: "Em Feito esperando quem faz o deploy mover para Deploy" },
  { id: "qaQueue", label: "Fila do QA", icon: "🔍", tip: "Aguardando validação — o gargalo mais comum no fim da sprint" },
  { id: "overdue", label: "Atrasadas", icon: "📅", tip: "Data limite já passou e ainda não concluíram" },
  { id: "highTodo", label: "Prioridade alta parada", icon: "⚠", tip: "Prioridade alta ou crítica ainda em A fazer" },
  { id: "unassigned", label: "Sem responsável", icon: "👤", tip: "Itens abertos da sprint sem ninguém atribuído" },
  { id: "overEstimate", label: "Passaram da estimativa", icon: "⌛", tip: "Tempo apontado maior que a estimativa original" },
  { id: "added", label: "Entraram depois do início", icon: "➕", tip: "Criadas depois do primeiro dia da sprint (mudança de escopo)" },
];

export function sprintRisks(sprint, { staleDays = 3, today, now = Date.now(), isHigh = () => false } = {}) {
  const startMs = Date.parse(`${sprint.start}T00:00:00`);
  const out = Object.fromEntries(RISKS.map((r) => [r.id, []]));
  for (const i of sprint.issues) {
    const st = stageOf(i);
    const open = st !== "done";
    const age = businessAge(lastMove(i), now);
    if (open && i.flagged) out.flagged.push({ issue: i, age });
    const rets = (i.transitions || []).filter((t) => t.at >= startMs && isReturn(t));
    if (rets.length) out.returned.push({ issue: i, count: rets.length, last: rets[rets.length - 1] });
    if (st === "doing" && age >= staleDays) out.stalled.push({ issue: i, age });
    if (st === "qa") out.qaQueue.push({ issue: i, age });
    if (st === "feito") out.feitoQueue.push({ issue: i, age });
    if (open && i.due && i.due < today) out.overdue.push({ issue: i, age, late: businessDays(i.due, today).length - 1 });
    if (st === "todo" && isHigh(i.priority)) out.highTodo.push({ issue: i, age });
    if (open && !i.assignee && !i.isSubtask) out.unassigned.push({ issue: i, age });
    if (i.estimate && i.spent > i.estimate) out.overEstimate.push({ issue: i, age, over: i.spent - i.estimate });
    if (!i.isSubtask && i.created && i.created > startMs + DAY_MS) out.added.push({ issue: i, age });
  }
  for (const k of ["stalled", "qaQueue", "feitoQueue", "flagged"]) out[k].sort((a, b) => b.age - a.age);
  return out;
}

/* ------------------------------------------------------------------ */
/* DESIGN: etapas da HU                                                 */
/* ------------------------------------------------------------------ */

/** Checklist de handoff Design → DEV (salvo na propriedade "quickfill.handoff" da HU). */
export const HANDOFF_ITEMS = [
  ["figma", "Link do Figma (tela e protótipo) na HU"],
  ["states", "Estados: vazio, carregando, erro e sucesso"],
  ["responsive", "Responsivo (desktop e mobile)"],
  ["a11y", "Acessibilidade: contraste, foco e textos alternativos"],
  ["copy", "Textos finais revisados"],
  ["ds", "Componentes do Design System identificados"],
  ["proto", "Protótipo navegável do fluxo"],
  ["criteria", "Critérios de aceite alinhados com o PO"],
];

export const DESIGN_STAGES = [
  { id: "queue", label: "Na fila", icon: "○" },
  { id: "doing", label: "Prototipando", icon: "✎" },
  { id: "review", label: "Em revisão", icon: "👁" },
  { id: "handoff", label: "Entregue (backlog do dev)", icon: "⇢" },
  { id: "delivered", label: "Implementadas", icon: "✓" },
];

const D_REVIEW = /revis|review|aprova|feedback|validacao (de )?(design|ux|ui|layout|prototipo)/i;
const D_DOING = /design|prototip|wirefram|\bux\b|\bui\b|layout|figma|discovery|descoberta|pesquisa|research|ideac|benchmark/i;
const D_DELIVERED = /pronto (para|p\/) ?dev|ready for dev|sprint backlog|refinad|entregue/i;
const D_DEV = /dev|desenvolv|codig|code|deploy|feito|valida|homolog|teste|\bqa\b|pronto|ready/i;
const D_DONE = /conclu|\bdone\b|fechad|resolvid|closed/i;

/** Regras de nome de status do Design: as listas das Opções substituem o padrão. */
export function designRules(raw = {}) {
  return {
    doing: termsRx(raw.doing, D_DOING),
    review: termsRx(raw.review, D_REVIEW),
    delivered: termsRx(raw.delivered, D_DELIVERED),
  };
}
const DEFAULT_DR = designRules();

/**
 * Etapa de design pelo nome do status. "Entregue" = protótipo concluído e a HU seguiu para o
 * backlog da sprint do dev; depois disso, qualquer status de desenvolvimento conta como entregue,
 * e só a categoria Concluído vira "Implementada".
 */
export function designStageOf(name, cat, mine = false, R = DEFAULT_DR) {
  const n = normName(name);
  if (cat === "done" || (!cat && D_DONE.test(n))) return "delivered";
  if (R.delivered.test(n)) return "handoff";
  if (R.review.test(n) && !/codigo|code/.test(n)) return "review";
  if (R.doing.test(n)) return "doing";
  if (cat === "new") return "queue";
  if (D_DEV.test(n)) return "handoff";
  return mine ? "doing" : "handoff";
}

/**
 * Ciclo de cada HU: quando entrou em prototipação, quando foi entregue ao dev (handoff),
 * quantas vezes voltou da revisão e o lead time do design.
 */
export function designCycle(i, R = DEFAULT_DR) {
  let started = null, handoff = null, rounds = 0;
  for (const t of i.transitions || []) {
    const from = designStageOf(t.fromName, null, i.mine, R), to = designStageOf(t.toName, null, i.mine, R);
    if (to === "doing" && !started) started = t.at;
    if (from === "review" && to === "doing") rounds++;
    if ((from === "doing" || from === "review") && (to === "handoff" || to === "delivered") && !handoff) handoff = t.at;
  }
  return { started, handoff, rounds, lead: started && handoff && handoff > started ? handoff - started : null };
}


/** Segunda-feira da semana de `iso`. */
export function weekStart(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = (dt.getUTCDay() + 6) % 7;
  return addDaysIso(iso, -dow);
}

export function designBoard(data, { project = "", weeks = 6 } = {}) {
  const issues = data.issues.filter((i) => !project || i.project === project);
  const groups = Object.fromEntries(DESIGN_STAGES.map((s) => [s.id, []]));
  const R = designRules(data.designRules || {});
  const rows = issues.map((i) => {
    let stage = designStageOf(i.status.name, i.status.cat, i.mine, R);
    const cycle = designCycle(i, R);
    const inSprint = (i.sprints || []).some((s) => s.state === "active");
    // Protótipo já trabalhado e HU colocada numa sprint (ativa ou futura) = entregue ao dev.
    if (stage === "queue" && cycle.started && (i.sprints || []).some((s) => s.state === "active" || s.state === "future")) stage = "handoff";
    return { issue: i, stage, cycle, inSprint, age: businessAge(lastMove(i)) };
  });
  for (const r of rows) groups[r.stage].push(r);
  for (const g of Object.values(groups)) g.sort((a, b) => (a.issue.priority?.rank ?? 99) - (b.issue.priority?.rank ?? 99) || b.age - a.age);

  // Entregas por semana (pelo momento do handoff)
  const thisWeek = weekStart(data.today);
  const series = [];
  for (let k = weeks - 1; k >= 0; k--) {
    const ws = addDaysIso(thisWeek, -7 * k), we = addDaysIso(ws, 6);
    const n = rows.filter((r) => r.cycle.handoff && isoOf(r.cycle.handoff) >= ws && isoOf(r.cycle.handoff) <= we).length;
    series.push({ week: ws, count: n, current: k === 0 });
  }
  const leads = rows.map((r) => r.cycle.lead).filter(Boolean);
  const avgLead = leads.length ? leads.reduce((s, x) => s + x, 0) / leads.length : null;
  const waiting = rows.filter((r) => r.inSprint && ["queue", "doing", "review"].includes(r.stage));
  const noFigma = rows.filter((r) => ["doing", "review", "handoff"].includes(r.stage) && !r.issue.hasFigma);
  const rounds = rows.reduce((s, r) => s + r.cycle.rounds, 0);

  return { rows, groups, series, thisWeek: series[series.length - 1].count, avgLead, waiting, noFigma, rounds };
}
