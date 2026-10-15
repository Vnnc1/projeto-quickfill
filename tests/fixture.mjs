/* Dados sintéticos no formato do serviço (SCRUM_SPRINT / DESIGN_HUS) para testes e preview. */
const today = "2026-10-15";
const ms = (iso, h = 12) => Date.parse(`${iso}T${String(h).padStart(2, "0")}:00:00`);
const P = { hi: { id: "2", name: "High", rank: 1 }, md: { id: "3", name: "Medium", rank: 2 }, cr: { id: "1", name: "Highest", rank: 0 } };
const people = { ana: { id: "a1", name: "Ana Souza" }, bruno: { id: "b2", name: "Bruno Lima" }, carla: { id: "c3", name: "Carla QA" }, dani: { id: "d4", name: "Dani Rocha" } };
const tr = (at, fromStage, toStage, fromName, toName, byName = "Carla QA") => ({ at: ms(at), from: "", to: "", fromName, toName, fromStage, toStage, by: "", byName });

let n = 100;
const issue = (o) => ({
  key: `MEED-${n++}`, project: "MEED", summary: o.summary || "Ajustar tela de cadastro", type: "Tarefa", isSubtask: false, parentKey: null,
  status: { id: "1", name: "Em andamento", cat: "indeterminate" }, kind: "other", assignee: null, priority: P.md, points: 3,
  flagged: false, due: null, created: ms("2026-10-06", 9), updated: ms(today), catChanged: null, labels: [], estimate: 0, spent: 0,
  sprints: [{ id: 7, name: "Sprint 16", state: "active" }], transitions: [], ...o,
});

const st = {
  todo: { status: { id: "10", name: "A fazer", cat: "new" }, kind: "other" },
  doing: { status: { id: "11", name: "Em andamento", cat: "indeterminate" }, kind: "other" },
  feito: { status: { id: "15", name: "Feito", cat: "indeterminate" }, kind: "feito" },
  ready: { status: { id: "12", name: "Deploy HMP", cat: "indeterminate" }, kind: "deploy" },
  qa: { status: { id: "13", name: "Validação", cat: "indeterminate" }, kind: "qa" },
  done: { status: { id: "14", name: "Concluído", cat: "done" }, kind: "done" },
};

export const scrum = {
  generatedAt: Date.now(), today, url: "https://exemplo.atlassian.net",
  me: { accountId: "c3", name: "Carla QA" },
  fields: { points: true, flagged: true },
  settings: { staleDays: 3, wipLimit: 2 },
  priorities: Object.values(P),
  spaces: [{
    project: "MEED", label: "MEED", board: { id: 1, name: "MEED" }, source: "quadro", error: null,
    next: { name: "Sprint 17", start: "2026-10-20", end: "2026-10-31" },
    velocity: [
      { id: 6, name: "Sprint 15", start: "2026-09-22", end: "2026-10-03", total: 14, done: 11, points: 40, pointsDone: 31 },
      { id: 5, name: "Sprint 14", start: "2026-09-08", end: "2026-09-19", total: 12, done: 12, points: 35, pointsDone: 35 },
      { id: 4, name: "Sprint 13", start: "2026-08-25", end: "2026-09-05", total: 15, done: 10, points: 44, pointsDone: 29 },
    ],
    sprints: [{
      id: 7, name: "Sprint 16", goal: "Cadastro de pacientes em produção", start: "2026-10-06", end: "2026-10-17", truncated: false,
      issues: [
        issue({ ...st.done, assignee: people.ana, catChanged: ms("2026-10-08"), summary: "Validar CPF no cadastro" }),
        issue({ ...st.done, assignee: people.bruno, catChanged: ms("2026-10-10"), summary: "Listagem paginada" }),
        issue({ ...st.done, assignee: people.ana, catChanged: ms("2026-10-13"), points: 5 }),
        issue({ ...st.qa, assignee: people.carla, summary: "Filtro por convênio", transitions: [tr("2026-10-09", "doing", "qa", "Em andamento", "Validação", "Ana Souza")] }),
        issue({ ...st.qa, assignee: people.carla, summary: "Exportar PDF", transitions: [tr("2026-10-08", "doing", "qa", "Em andamento", "Validação")] }),
        issue({ ...st.qa, assignee: people.carla, summary: "Busca por nome", transitions: [tr("2026-10-14", "doing", "qa", "Em andamento", "Validação")] }),
        issue({ ...st.doing, assignee: people.bruno, summary: "Integração com agenda", flagged: true, transitions: [tr("2026-10-07", "todo", "doing", "A fazer", "Em andamento", "Bruno Lima")] }),
        issue({ ...st.doing, assignee: people.bruno, summary: "Tela de prontuário", priority: P.hi, estimate: 240, spent: 420, transitions: [tr("2026-10-13", "qa", "doing", "Validação", "Em andamento")] }),
        issue({ ...st.doing, assignee: people.bruno, summary: "Upload de exames", transitions: [tr("2026-10-14", "todo", "doing", "A fazer", "Em andamento", "Bruno Lima")] }),
        issue({ ...st.ready, assignee: people.ana, summary: "Máscara de telefone" }),
        issue({ ...st.feito, assignee: people.ana, summary: "Ajuste de layout do login", labels: ["retorno-layout-ui"], transitions: [tr("2026-10-12", "qa", "doing", "Validação", "Em andamento"), tr("2026-10-14", "doing", "feito", "Em andamento", "Feito", "Ana Souza")] }),
        issue({ ...st.feito, assignee: people.bruno, summary: "Correção do filtro" }),
        issue({ ...st.todo, key: "MEED-900", isSubtask: true, parentKey: "MEED-106", parentSummary: "Integração com agenda", type: "Subtarefa", assignee: people.carla, summary: "Testes Manuais" }),
        issue({ ...st.done, key: "MEED-901", isSubtask: true, parentKey: "MEED-106", type: "Subtarefa", assignee: people.bruno, summary: "Backend" }),
        issue({ ...st.todo, summary: "Relatório de atendimentos", priority: P.cr, due: "2026-10-14", created: ms("2026-10-09") }),
        issue({ ...st.todo, assignee: people.dani, summary: "Ajuste de acessibilidade" }),
        issue({ ...st.todo, summary: "Tooltip de ajuda", parentKey: null }),
      ],
    }],
  }, {
    project: "SUS", label: "SUS", error: "Nenhuma sprint encontrada para SUS (nem no quadro, nem nas demandas).", sprints: [], velocity: [],
  }],
};

const dstat = (name, cat) => ({ status: { id: name, name, cat } });
export const design = {
  generatedAt: Date.now(), today, from: "2026-08-17", url: "https://exemplo.atlassian.net",
  me: { accountId: "d4", name: "Dani Rocha" }, labels: ["design", "ux", "ui"], weeklyGoal: 3, priorities: Object.values(P), truncated: false,
  issues: [
    issue({ ...dstat("Em design", "indeterminate"), assignee: people.dani, mine: true, designLabel: true, hasFigma: true, summary: "HU 12 — Fluxo de agendamento", priority: P.hi, transitions: [tr("2026-10-13", null, null, "A fazer", "Em design", "Dani Rocha")] }),
    issue({ ...dstat("Revisão de design", "indeterminate"), assignee: people.dani, mine: true, designLabel: true, hasFigma: true, summary: "HU 9 — Prontuário mobile", transitions: [tr("2026-10-01", null, null, "A fazer", "Em design"), tr("2026-10-06", null, null, "Em design", "Revisão de design"), tr("2026-10-07", null, null, "Revisão de design", "Em design"), tr("2026-10-10", null, null, "Em design", "Revisão de design")] }),
    issue({ ...dstat("A fazer", "new"), designLabel: true, mine: false, hasFigma: false, summary: "HU 15 — Tela de convênios", priority: P.cr }),
    issue({ ...dstat("A fazer", "new"), designLabel: true, mine: false, hasFigma: false, summary: "HU 16 — Onboarding", sprints: [] }),
    issue({ ...dstat("Em andamento", "indeterminate"), assignee: people.bruno, mine: false, designLabel: true, hasFigma: false, summary: "HU 7 — Cadastro", transitions: [tr("2026-09-29", null, null, "A fazer", "Em design"), tr("2026-10-02", null, null, "Em design", "Pronto para dev")] }),
    issue({ ...dstat("Concluído", "done"), assignee: people.ana, mine: false, designLabel: true, hasFigma: true, summary: "HU 4 — Login", sprints: [], transitions: [tr("2026-09-15", null, null, "A fazer", "Em design"), tr("2026-09-19", null, null, "Em design", "Pronto para dev"), tr("2026-10-01", null, null, "Validação", "Concluído")] }),
    issue({ ...dstat("Pronto para dev", "indeterminate"), mine: false, designLabel: true, hasFigma: true, summary: "HU 11 — Notificações", transitions: [tr("2026-10-08", null, null, "A fazer", "Em design"), tr("2026-10-14", null, null, "Em design", "Pronto para dev")] }),
  ],
};
