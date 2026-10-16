# Como distribuir e atualizar os QuickFill na equipe

Modelo escolhido: **repositório + aviso de nova versão**. Você mantém o código aqui; a equipe instala
uma vez e, a cada versão nova, a própria extensão avisa. Atualizar é **rodar um arquivo e clicar em
"Recarregar"**, sem mandar arquivo para ninguém.

> O Chrome não permite que uma extensão fora da Chrome Web Store se atualize 100% sozinha. Se um dia
> quiserem isso, o caminho é publicar como **não listada** na Web Store (US$ 5 uma vez); o código continua o mesmo.

---

## 1. Preparar o repositório (uma vez)

1. Crie um repositório no GitHub (ex.: `novetech/quickfill`). **Ele precisa ser público** para o aviso de
   versão e o download funcionarem sem login. O código não tem nenhum token ou senha: cada pessoa coloca
   o próprio token nas Opções, e ele fica só no Chrome dela.
   *Se o repositório tiver que ser privado:* hospede só o `update.json` e a pasta `dist/` num lugar público
   (GitHub Pages, por exemplo) e preencha `updateUrl` e `downloadBase` no `release.config.json`.
2. Preencha o `release.config.json` na raiz do projeto:

   ```json
   { "repo": "https://github.com/novetech/quickfill", "branch": "main", "notes": "" }
   ```

3. Gere os pacotes e envie:

   ```
   npm run zip
   git remote add origin https://github.com/novetech/quickfill.git
   git add -A && git commit -m "QuickFill 4.0.0" && git push -u origin main
   ```

   O `npm run zip` gera:
   - as 4 pastas das extensões;
   - `dist/*.zip`, um por perfil;
   - `update.json`, que a extensão lê para saber a versão mais nova;
   - `dist/atualizar-quickfill.bat`, o instalador e atualizador da equipe, já apontando para o repositório.

## 2. Instalar na máquina de cada pessoa (uma vez)

1. Baixar `dist/atualizar-quickfill.bat` **e** `dist/atualizar-quickfill.ps1` do repositório (ou mandar os dois uma única vez).
2. Dar dois cliques no `.bat` e escolher o perfil: `qa`, `dev`, `scrum`, `design` ou `todos`.
   Ele baixa e extrai em `C:\Users\<pessoa>\QuickFill\<pasta>`.
3. No Chrome, abrir `chrome://extensions`, ligar o **Modo do desenvolvedor**, clicar em **Carregar sem compactação** e escolher essa pasta.
4. Nas **Opções**, preencher URL do Jira, e-mail e token. Também dá para usar **Importar configuração** com um arquivo exportado por você.

## 3. Publicar uma versão nova (você)

1. Altere o código em `jira-quickfill-qa/`.
2. Em `build.mjs`, aumente `VERSION` (ex.: `4.0.0` → `4.1.0`) e escreva o que mudou em `notes` no `release.config.json`.
3. Rode `npm test` e depois `npm run zip`.
4. Faça `git commit` e `git push`.

## 4. Receber a atualização (equipe)

1. Em até 6 horas (ou ao reabrir), aparece no topo da extensão:
   **"Nova versão 4.1.0 disponível"**, com os botões **Baixar** e **Como atualizar**.
2. A pessoa roda o `atualizar-quickfill.bat` de novo. Ele atualiza os perfis que ela já tem instalados.
3. Ao abrir a extensão aparece **"Recarregar extensão"**. Um clique e pronto: configuração, token e
   metas continuam.

---

### Perguntas comuns

- **O Chrome mostra "Desative extensões no modo de desenvolvedor" ao abrir.** É o aviso normal para
  extensões carregadas sem a loja. É só fechar.
- **Posso testar uma versão antes de publicar?** Sim: rode `npm run build` e recarregue as pastas daqui; só
  faça o `push` quando estiver tudo ok.
- **E se alguém não rodar o atualizador?** A extensão continua funcionando na versão dela e o aviso
  segue aparecendo até atualizar (o ✕ esconde até a próxima versão).
