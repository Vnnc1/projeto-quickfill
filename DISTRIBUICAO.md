# Como distribuir e atualizar os QuickFill na equipe

Repositório **público**: <https://github.com/Vnnc1/projeto-quickfill> (branch `master`). Não precisa de
token nem de conta no GitHub para instalar ou atualizar.

## Para a equipe: mande só isto

> **Instalar o QuickFill:** abra <https://github.com/Vnnc1/projeto-quickfill> e siga o "Instalar (1 minuto)".

Não precisa mandar arquivo nenhum. O instalador sempre baixa a versão mais nova.

| Quando | O que a pessoa faz |
|---|---|
| **Primeira vez** | Win+R › cola o comando do README › escolhe o perfil › carrega a pasta (já copiada) em `chrome://extensions` › preenche as Opções |
| **Versão nova** | Clica em **Copiar comando de atualização** no aviso do QuickFill › Win+R › Ctrl+V › Enter › **Recarregar extensão** |

- A extensão fica em `Documentos\QuickFill\<pasta>` (ex.: `C:\Users\Fernanda\Documents\QuickFill\jira-quickfill-dev`).
  Se o Documentos estiver no OneDrive, vai para lá.
- O instalador atualiza só os perfis que a pessoa já tem. Para instalar outro, basta rodar e escolher.

## Para você: publicar uma versão

1. Altere o código em `jira-quickfill-qa/`.
2. Em `build.mjs`, aumente `VERSION` (ex.: `4.1.0` → `4.2.0`). Em `release.config.json`, escreva em `notes`
   o que mudou (é o texto que aparece no aviso).
3. Rode `npm test` e depois `npm run zip`.
4. Faça `git add -A`, `git commit -m "QuickFill 4.2.0"` e `git push`.

Em até 6 horas, quem abrir o QuickFill vê o aviso de versão nova.

## Arquivos de publicação (gerados pelo `npm run zip`)

| Arquivo | Para quê |
|---|---|
| `update.json` | Versão mais nova, notas e o comando de instalação, lidos pela extensão para avisar |
| `dist/jira-quickfill-*.zip` | Os quatro pacotes |
| `dist/quickfill.ps1` | O instalador (baixado direto pelo comando) |
| `dist/atualizar-quickfill.bat` | O mesmo comando em um arquivo, para quem prefere dois cliques |

## Perguntas comuns

- **"Desative extensões no modo de desenvolvedor"** ao abrir o Chrome: é o aviso normal para extensões fora
  da loja. É só fechar.
- **Win+R está bloqueado na máquina:** abra o **PowerShell** pelo menu Iniciar e cole o mesmo comando.
- **O Windows avisou que o .bat é de fonte desconhecida:** clique em *Mais informações › Executar assim mesmo*,
  ou use o comando pelo Win+R, que não passa por esse aviso.
- **Quero 100% automático, sem nem colar o comando:** só publicando na Chrome Web Store como **não listada**
  (US$ 5 uma vez), ou pelo Google Workspace da empresa. O código é o mesmo.
- **E o token de leitura da versão anterior (repositório privado)?** Não é mais necessário. Quem já tinha
  continua funcionando; pode apagá-lo no GitHub se quiser.
