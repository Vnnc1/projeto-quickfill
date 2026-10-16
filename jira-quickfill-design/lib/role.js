/**
 * Perfil do pacote. O mesmo código gera quatro extensões:
 *   "qa"     — Jira QuickFill QA     (o modelo completo: Tarefa, Lote, Painel, Equipe, Meu dia)
 *   "dev"    — Jira QuickFill DEV    (meu progresso: Hoje, Progresso, Demandas, Equipe)
 *   "scrum"  — Jira QuickFill SCRUM  (Sprint, Pessoas, Riscos, Equipe)
 *   "design" — Jira QuickFill DESIGN (Hoje, HUs, Progresso, Equipe)
 * Gerado pelo build.mjs — não edite à mão.
 */
export const ROLE = "design";
/** update.json do repositório da equipe (aviso de nova versão). Vazio = sem aviso. */
export const UPDATE_URL = "https://api.github.com/repos/Vnnc1/projeto-quickfill/contents/update.json?ref=master";
