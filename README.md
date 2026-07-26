# Ryber

Entenda como uma IA de publicidade provavelmente interpreta um criativo (vídeo ou imagem) antes de investir em mídia.

Você sobe um vídeo ou uma imagem (em qualquer formato — incluindo HEIC de iPhone) ou cola um link, o app extrai
os frames e o áudio (quando é vídeo), transcreve a fala localmente e manda tudo para o Claude, que devolve uma
leitura objetiva do criativo: produto, material, público, posicionamento, benefícios, emoção, alertas e uma
narrativa de "o que a IA acredita" — além de compatibilidade com um briefing, se você fornecer um.

**Sobre links de imagem:** funciona para URLs diretas de imagem (ex: CDN, link terminando em `.jpg`). Posts de
imagem do Instagram especificamente **não funcionam por link** — o Instagram bloqueia esse tipo de acesso
anônimo (diferente de vídeo, que ainda funciona via `yt-dlp`). Nesse caso, baixe a imagem e envie por upload.

## Estrutura

- `backend/` — API em Python (FastAPI). Faz a extração de frames/áudio (ffmpeg), transcrição local (faster-whisper)
  e a interpretação via Claude (Anthropic).
- `frontend/` — App em React (Vite + Tailwind). Tela de upload, progresso e dashboard de resultado.

## Pré-requisitos

- **Python 3.11+**
- **Node.js 20+**
- **ffmpeg** — necessário para extrair frames e áudio do vídeo.
  - Windows: `winget install --id Gyan.FFmpeg -e`
  - Depois de instalar, **abra um novo terminal** (o PATH só é atualizado em sessões novas).
- **Uma API key da Anthropic** — necessária para a IA realmente interpretar os criativos.
  - Crie a sua em https://console.anthropic.com/settings/keys
  - Sem a key, o app funciona normalmente até a etapa de "Interpretando Criativo", que falha com uma mensagem
    clara pedindo para configurar a key.

## Configuração

### Backend

```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Edite `backend/.env` e cole sua key, e defina um `SIGNUP_INVITE_CODE` (é exigido no cadastro — a
plataforma não tem cadastro aberto):

```
ANTHROPIC_API_KEY=sk-ant-...
SIGNUP_INVITE_CODE=escolha-um-codigo
```

Rode a migração do banco (cria as tabelas em `data/ryber.db`):

```
alembic upgrade head
```

### Frontend

```
cd frontend
npm install
copy .env.example .env
```

## Rodando localmente

Use o `start.bat` na raiz do projeto — ele abre duas janelas, uma com o backend (`uvicorn`, porta 8000) e outra
com o frontend (`vite`, porta 5173).

Ou manualmente, em dois terminais:

```
# Terminal 1
cd backend
.venv\Scripts\activate
uvicorn app.main:app --port 8000

# Terminal 2
cd frontend
npm run dev
```

**Importante:** depois de qualquer mudança no código do backend, feche a janela do backend e rode `start.bat`
de novo pra aplicar. O backend não usa `--reload` de propósito — nesse ambiente, o reload automático do uvicorn
ficava deixando processos "zumbis" presos na porta 8000, fazendo o app rodar código antigo silenciosamente.

Acesse http://localhost:5173

## Notas

- Login é obrigatório em toda a plataforma. Cadastro exige `SIGNUP_INVITE_CODE`; alternativa sem convite:
  `python scripts/create_user.py <email> <senha>` (dentro de `backend/`, venv ativo).
- Banco de dados real (SQLite local, Postgres em produção) via SQLAlchemy + Alembic — cada análise é uma linha
  na tabela `analyses`, vinculada ao `user_id` do dono. Os vídeos e frames extraídos continuam em disco
  (`backend/data/uploads/`, `backend/data/raw/`), não no banco.
- O primeiro carregamento do modelo Whisper local baixa os pesos automaticamente (uma vez só).
- Colar um link (YouTube, TikTok, Instagram etc.) usa `yt-dlp` para baixar o vídeo antes de processar.
- Frontend e backend são independentes e falam por HTTP — dá para publicar o backend (Render/Railway) e o
  frontend (Vercel) separadamente mais adiante, só ajustando `VITE_API_BASE_URL` e `CORS_ORIGIN`.

## Deploy (Render)

`render.yaml` já define os três serviços (backend Docker, frontend estático, Postgres) no **tier gratuito**.
Passos manuais que só você pode fazer (exigem sua conta):

1. Criar um repositório no GitHub e dar `git push` (o repositório local já existe, só falta o remoto).
2. No Render, criar um "Blueprint" apontando pro repositório — ele lê o `render.yaml` automaticamente.
3. Preencher no painel do Render as variáveis marcadas `sync: false` no `render.yaml` (API keys, `CORS_ORIGIN`
   com a URL real do frontend, `FRONTEND_URL`, etc.) — nunca vão para o repositório.
4. Criar uma conta de teste no [Stripe](https://dashboard.stripe.com) (modo teste) pra pegar
   `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` e configurar o webhook (`STRIPE_WEBHOOK_SECRET`) apontando pra
   `https://<seu-backend>.onrender.com/api/billing/webhook`.

**Lembrete crítico:** o Postgres gratuito do Render é apagado automaticamente após 30 dias, e sem disco
persistente (que exige plano pago) os vídeos brutos em disco podem se perder a qualquer reinício mesmo antes
disso. Migre banco + backend pro plano Starter (com disco persistente) antes desse prazo.

## Construindo sua própria IA (dados de treino)

O app já usa o Claude para interpretar os criativos, mas está estruturado para, com o tempo, virar a base de um
modelo próprio (fine-tunado nos seus dados), em vez de depender para sempre de uma API de terceiro:

- Cada análise guarda os **frames extraídos e a transcrição** em `backend/data/raw/<id>/` — o "input" bruto que
  a IA viu/ouviu — em vez de descartar isso depois de gerar o resultado.
- No dashboard de resultado, o botão **"Corrigir leitura"** deixa você editar a leitura da IA (produto, material,
  público, benefícios, alertas, narrativa...). Essa correção é o "gabarito" — o dado rotulado por um humano.
- Rode `python scripts/export_training_data.py` (dentro de `backend/`, com o venv ativo) para juntar tudo isso
  num `data/training_export.jsonl`: cada linha é um exemplo `{frames, transcrição, leitura original da IA,
  correção humana}`, pronto para virar dado de fine-tuning quando você tiver volume suficiente.

Quanto mais criativos você analisar e corrigir, maior a base própria de dados — esse é o caminho realista para
"sua própria IA": validar o produto com um modelo forte já pronto agora, e treinar o modelo próprio depois, com
dados reais.
