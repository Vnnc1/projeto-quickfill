/**
 * Perfil do pacote. O mesmo código gera quatro extensões:
 *   "qa"     — Jira QuickFill QA     (o modelo completo: Tarefa, Lote, Painel, Equipe, Meu dia)
 *   "dev"    — Jira QuickFill DEV    (meu progresso: Hoje, Progresso, Demandas, Equipe)
 *   "scrum"  — Jira QuickFill SCRUM  (Sprint, Pessoas, Riscos, Equipe)
 *   "design" — Jira QuickFill DESIGN (Hoje, HUs, Progresso, Equipe)
 * Gerado pelo build.mjs — não edite à mão.
 */
export const ROLE = "scrum";
/** update.json do repositório da equipe (aviso de nova versão). Vazio = sem aviso. */
export const UPDATE_URL = "https://raw.githubusercontent.com/Vnnc1/quickfill-jira/master/update.json";
/** Comando de instalação/atualização (Win+R). Com QF_EXT_ID também ativa o botão "Atualizar agora". */
export const INSTALL_CMD = "powershell -NoProfile -ExecutionPolicy Bypass -Command \"irm https://raw.githubusercontent.com/Vnnc1/quickfill-jira/master/dist/quickfill.ps1 | iex\"";
