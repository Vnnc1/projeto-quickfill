# Como distribuir e atualizar os QuickFill na equipe

Repositório **privado**: <https://github.com/Vnnc1/projeto-quickfill> (branch `master`).

Você mantém o código aqui. A equipe instala uma vez e, a cada versão nova, a própria extensão avisa.
Para atualizar, a pessoa **roda um arquivo e clica em "Recarregar"**, sem você mandar arquivo para cada um.

Como o repositório é privado, o GitHub só entrega os arquivos com autenticação. Por isso o instalador e o
aviso de versão usam um **token só de leitura, só deste repositório**, criado por você uma vez e passado
à equipe. Ninguém da equipe precisa ter conta no GitHub.

---

## 1. Criar o token de leitura (você, uma vez)

1. Acesse <https://github.com/settings/personal-access-tokens/new> (token **fine-grained**).
2. Preencha assim:
   - **Token name:** `quickfill-leitura`
   - **Expiration:** 1 ano (ou o prazo que preferir; quando vencer, gere outro e repasse)
   - **Repository access:** *Only select repositories* › `projeto-quickfill`
   - **Permissions › Repository permissions › Contents:** **Read-only** (o resto fica *No access*)
3. Clique em **Generate token** e copie (começa com `github_pat_`).
4. Passe o token para a equipe **por mensagem privada** (Teams), nunca no repositório nem em grupo aberto.

> Esse token só consegue **ler** este repositório: não altera nada nem dá acesso a outros projetos.
> Se ele vazar, é só apagá-lo em *Settings › Developer settings › Personal access tokens* e gerar outro.

## 2. Instalar na máquina de cada pessoa (uma vez)

1. Mandar para a pessoa os dois arquivos da pasta `dist/` (só desta vez):
   `atualizar-quickfill.bat` e `atualizar-quickfill.ps1`. Os dois precisam ficar na mesma pasta.
2. A pessoa dá dois cliques no **`atualizar-quickfill.bat`**, cola o **token** quando pedir e escolhe o perfil:
   `qa`, `dev`, `scrum`, `design` ou `todos`.
   - Os QuickFill ficam na pasta **Documentos** da pessoa: `C:\Users\<pessoa>\Documents\QuickFill\<pasta>`
     (ex.: `C:\Users\Fernanda\Documents\QuickFill\jira-quickfill-dev`). Se o Documentos estiver no OneDrive, vai para lá.
   - O token fica guardado **criptografado** para aquele usuário do Windows; o instalador não pergunta de novo.
3. No Chrome: `chrome://extensions` › ligar **Modo do desenvolvedor** › **Carregar sem compactação** › escolher a pasta.
4. Nas **Opções** da extensão: URL do Jira, e-mail e token do Jira. Se preferir, use **Importar configuração**
   com um arquivo exportado por você.

## 3. Publicar uma versão nova (você)

1. Altere o código em `jira-quickfill-qa/`.
2. Em `build.mjs`, aumente `VERSION` (ex.: `4.0.1` → `4.1.0`). Em `release.config.json`, escreva em `notes`
   o que mudou (aparece no aviso da extensão).
3. Rode `npm test` e depois `npm run zip`.
4. Faça `git add -A`, `git commit -m "QuickFill 4.1.0"` e `git push`.

## 4. Receber a atualização (equipe)

1. Em até 6 horas (ou ao reabrir), aparece no topo do QuickFill: **"Nova versão 4.1.0 disponível"**.
2. A pessoa roda o **`atualizar-quickfill.bat`** de novo. Ele atualiza os perfis que ela já tem instalados.
3. Ao abrir o QuickFill aparece **"Recarregar extensão"**. Um clique e pronto: configuração, token do Jira e metas continuam.

---

### Perguntas comuns

- **"O GitHub recusou o acesso"** ao rodar o instalador: o token está errado ou venceu. Rode de novo e cole um
  token válido (o instalador já apagou o antigo). Para trocar de propósito: `atualizar-quickfill.bat -TrocarToken`.
- **O aviso de versão não aparece:** a extensão usa o token que o instalador grava na pasta dela
  (`update.local.json`). Quem instalou sem o instalador pode colar o token em
  **Opções › Aparência e abertura › Token de leitura do repositório**.
- **"Desative extensões no modo de desenvolvedor"** ao abrir o Chrome: é o aviso normal para extensões fora da
  loja. É só fechar.
- **Quero 100% automático, sem rodar o .bat:** só publicando na Chrome Web Store como **não listada**, ou pelo
  Google Workspace da empresa (o admin instala para todos). O código é o mesmo.
