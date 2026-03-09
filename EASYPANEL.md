# Deploy no EasyPanel (Docker + Git)

Este projeto está pronto para rodar no **EasyPanel** com **Docker** e **deploy automático** a cada push no Git.

## 1. Primeiro deploy (conectar repositório)

1. No EasyPanel, crie um novo **App** (ou **Service**).
2. Em **Source**, escolha **GitHub** (ou **Git** via SSH se usar outro provedor).
3. Conecte sua conta GitHub em **Settings > Github** (token com permissão de repositório e webhooks).
4. Selecione o repositório `replayzone-api` e o branch (ex: `main`).
5. O EasyPanel detecta o **Dockerfile** e faz o build da imagem.

## 2. Variáveis de ambiente

No painel do serviço, em **Variables**, adicione:

| Variável        | Obrigatório | Exemplo / Descrição        |
|-----------------|------------|----------------------------|
| `PORT`          | Não        | EasyPanel costuma definir automaticamente |
| `DB_HOST`       | Sim        | Host do MySQL              |
| `DB_USER`       | Sim        | Usuário do banco           |
| `DB_PASSWORD`   | Sim        | Senha do banco             |
| `DB_NAME`       | Sim        | Nome do banco              |
| `API_KEY`       | Recomendado| Chave usada no header `x-api-key` |
| `STATIC_VIDEOS_PATH` | Não   | Caminho para `/videos/logos` (volume) |

## 3. Porta e domínio

- O app escuta na porta definida por **PORT** (padrão 3000).
- Em **Domains**, configure o domínio (ex: `api.replayzone.com.br`) e deixe o EasyPanel fazer o proxy para a porta do container.

## 4. Deploy automático a cada push (Git)

1. Depois do primeiro deploy, em **Settings** do serviço, ative **Auto Deploy** (ou **Webhook**).
2. O EasyPanel registra um webhook no GitHub; a cada **push** no branch configurado, um novo build e deploy são disparados.
3. Para outros Git (GitLab, etc.), use a opção **Git SSH** e adicione a chave SSH do EasyPanel no repositório.

## 5. Testar localmente com Docker

```bash
# Build
docker build -t replayzone-api .

# Rodar (passando env ou usando .env)
docker run --rm -p 3000:3000 \
  -e DB_HOST=db.replayzone.com.br \
  -e DB_USER=replayzone \
  -e DB_PASSWORD=sua_senha \
  -e DB_NAME=replayzone \
  -e API_KEY=sua_api_key \
  replayzone-api
```

Healthcheck: `GET http://localhost:3000/health` deve retornar `{"ok":true,"service":"replayzone-api"}`.

---

## Erro "npm error signal SIGTERM"

Se aparecer `npm error command failed` / `npm error signal SIGTERM` ao parar o container:

- **Causa:** O comando de start está como `npm start`. Assim o processo principal é o npm; quando o Docker envia SIGTERM (parar/restart), o npm repassa e exibe esse erro.
- **Solução:** No EasyPanel, em **Settings** do serviço, em **Start Command** (ou **Command**), deixe **vazio** para usar o do Dockerfile, ou defina explicitamente: `node src/server.js`. Não use `npm start`.

O app já trata SIGTERM/SIGINT e encerra o servidor com graceful shutdown antes de sair.
