# Curso Pedreiro Pro — versão protegida

O domínio raiz do site é uma página pública de apresentação e vendas. A área privada dos alunos fica em `/alunos`. Enquanto `VITE_COURSE_CHECKOUT_URL` não estiver configurada, o botão principal apresenta o conteúdo do curso; quando houver um checkout oficial, defina a variável no build do Cloudflare para ligar os botões de matrícula a ele.

Reconstrução da área de membros em React + Vite para deploy no Cloudflare Pages, com Firebase Auth/Firestore e Pages Functions.

A lista pública do curso tem 71 aulas. Nesta versão os 71 IDs do YouTube **não entram no bundle do navegador**. Eles ficam em `../videos-pedreiro-secret.json`, arquivo ignorado pelo Git, e devem ser enviados ao Cloudflare como o secret `VIDEO_CATALOG_JSON`. O aluno autenticado recebe somente o ID da aula que abriu.

> Limite técnico importante: ao reproduzir uma aula do YouTube, o ID **daquela aula atual** pode ser descoberto pelo navegador. Não existe como esconder totalmente um ID do YouTube que precisa ser entregue ao player. Esta arquitetura evita entregar o catálogo inteiro de uma vez e bloqueia usuários sem acesso. Para controle mais forte, use Cloudflare Stream/Vimeo com URLs assinadas.

## O que já está pronto

- 71 aulas cadastradas, com títulos e descrições do site atual.
- Login e cadastro por Firebase Authentication.
- Controle de aluno ativo pelo documento `access/{uid}`.
- IDs do YouTube fora do frontend.
- Progresso por aluno salvo no Firestore.
- Player individual com anterior/próxima aula.
- Busca e filtro por módulo.
- 5 bônus.
- 5 ofertas para alunos com os checkouts atuais.
- Formulário de sugestão de aula.
- Layout responsivo para celular e desktop.
- Pages Function `/api/lesson/:lesson` para validar login e acesso antes de entregar o vídeo.

## 1. Criar/configurar o Firebase

No Firebase Console, use um projeto existente ou crie um novo.

Em **Authentication > Sign-in method**, habilite **E-mail/Senha**.

Crie o **Cloud Firestore**.

Copie `.env.example` para `.env` e coloque os dados do seu Web App Firebase:

```bash
cp .env.example .env
```

Depois preencha:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Publique as regras que estão em `firebase.rules`. Se preferir, copie o conteúdo do arquivo e cole em **Firestore Database > Rules**.

## 2. Como liberar um aluno

O aluno cria a conta com e-mail e senha. A tela mostrará o UID se ainda não estiver liberado.

No Firestore, crie:

```text
Coleção: access
Documento: UID_DO_ALUNO
Campo: active (boolean) = true
```

Depois de recarregar a página, a área de aulas será liberada.

Para bloquear, altere `active` para `false` ou apague o documento.

## 3. Rodar localmente

```bash
npm ci
npm run dev
```

O frontend abre normalmente, mas o vídeo protegido depende do Pages Function. Para testar o backend localmente, crie `.dev.vars` a partir de `.dev.vars.example` e coloque:

```env
FIREBASE_API_KEY="a-mesma-api-key-do-firebase"
FIREBASE_PROJECT_ID="seu-project-id"
VIDEO_CATALOG_JSON='{"aula-01":"..."}'
```

Para usar o catálogo completo localmente, copie o JSON inteiro de `../videos-pedreiro-secret.json` para `VIDEO_CATALOG_JSON`.

Faça o build e execute com Wrangler:

```bash
npm run build
npx wrangler pages dev dist
```

## 4. Subir no GitHub

`../videos-pedreiro-secret.json`, `.env` e `.dev.vars` já estão no `.gitignore` e **não devem ser enviados ao GitHub**.

```bash
git init
git add .
git commit -m "Área de membros Pedreiro Residencial"
git branch -M main
git remote add origin https://github.com/nsnexus/cursopedreiro.git
git push -u origin main
```

Confirme antes do push:

```bash
git status
```

O arquivo `../videos-pedreiro-secret.json` não deve aparecer na lista do commit.

## 5. Publicar no Cloudflare Pages

No Cloudflare Dashboard, vá em **Workers & Pages > Create application > Pages > Import an existing Git repository**.

Use:

```text
Build command: npm run build
Build output directory: dist
Production branch: main
```

A pasta `/functions` na raiz é reconhecida automaticamente pelo Pages e vira o backend da aplicação.

## 6. Variáveis e secrets no Cloudflare

No projeto do Pages, abra **Settings > Variables and Secrets**.

Adicione:

```text
FIREBASE_API_KEY = API key do Firebase
FIREBASE_PROJECT_ID = ID do projeto Firebase
```

Adicione também o secret `VIDEO_CATALOG_JSON`.

O jeito mais fácil é fazer login no Wrangler e rodar:

```bash
npx wrangler login
npm run cf:video-secret -- NOME_DO_SEU_PROJETO_PAGES "../videos-pedreiro-secret.json"
```

Esse comando valida as 71 entradas do arquivo externo e o lê localmente e envia o conteúdo diretamente como secret ao Cloudflare. O arquivo continua fora do Git.

Também adicione no Cloudflare as variáveis `VITE_FIREBASE_*` usadas no build, com os mesmos valores do `.env` local. Variáveis `VITE_` são públicas por natureza e fazem parte do JavaScript do app; a segurança fica nas regras do Firebase e no Pages Function.

## 7. Domínio autorizado no Firebase

Depois que o Cloudflare gerar o endereço `seu-projeto.pages.dev`, inclua esse domínio em **Firebase Authentication > Settings > Authorized domains**. Faça o mesmo com seu domínio próprio quando conectar um.

## Estrutura principal

```text
src/
  App.tsx
  firebase.ts
  styles.css
  data/
    lessons.ts       # títulos e descrições, SEM IDs do YouTube
    bonuses.ts
    offers.ts
functions/
  api/lesson/[lesson].ts  # API protegida
scripts/
  upload-video-secret.mjs
firebase.rules
../videos-pedreiro-secret.json # catálogo real FORA do repositório
```

## Observação sobre os preços das ofertas

A área antiga mostra **R$ 8,90** para as ofertas. No momento da conferência, os quatro checkouts da Wiapy abriram exibindo **R$ 9,90**, enquanto o checkout da Cakto de Serralheiro exibiu **R$ 8,90**. O código mantém R$ 8,90 na vitrine para reproduzir o site atual. Confira os preços na Wiapy antes de publicar.

## Validação e deploy deste repositório

Repositório: https://github.com/nsnexus/cursopedreiro. Use Node 22.18 ou superior.

Execute `npm ci` e `npm run check`. A validação inclui TypeScript do frontend e da API, testes da autorização com respostas simuladas do Firebase, build Vite, compilação das Pages Functions e busca por segredos/IDs. O GitHub Actions repete estas verificações em push e pull request.

Antes de cada commit: `git add .` e `node scripts/check-secrets.mjs --staged`. O verificador é preventivo, não substitui a revisão do diff.

No Cloudflare Pages conecte este repositório, branch `main`, comando `npm run build`, saída `dist`, Node 22. As variáveis do Dashboard são a fonte da configuração; não há credenciais no repositório. Configure separadamente produção e preview; prefira um Firebase de teste para previews.

No Firebase, publique `firebase.rules` pelo Console ou com `firebase deploy --only firestore:rules --project SEU_PROJECT_ID` (Firebase CLI autenticado). As regras não são publicadas automaticamente pelo build do Cloudflare.

Ainda é necessário fornecer as variáveis Firebase e o catálogo privado no Cloudflare. Não coloque IDs de vídeos em variáveis VITE_, arquivos de src/public, GitHub Actions ou README. O script de envio exige um arquivo externo ao repositório e funciona também no Windows.

Teste após configurar: conta sem liberação recebe bloqueio; conta com access/{uid}.active=true abre uma aula; após revogar, a próxima chamada de vídeo retorna 403; progresso persiste ao entrar novamente. Testes locais usam serviços simulados e não validam suas credenciais reais.

Os bônus continuam hospedados nos endereços externos originais. Confira disponibilidade e preços dos checkouts antes de abrir vendas.

Referências: [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/) e [Firebase Auth REST](https://firebase.google.com/docs/reference/rest/auth).
