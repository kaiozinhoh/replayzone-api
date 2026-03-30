# Documentação Completa da API ReplayZone

## Visão Geral

A ReplayZone API é uma aplicação Node.js/Express que gerencia um sistema de quadras esportivas, reservas, vídeos, clientes e cobranças. A API utiliza autenticação via API Key e oferece endpoints para gestão completa do negócio.

### Informações Técnicas
- **Framework**: Express.js
- **Linguagem**: JavaScript (ES6+)
- **Banco de Dados**: MySQL
- **Autenticação**: API Key (Header: `x-api-key`)
- **Porta Padrão**: 3000

---

## Autenticação

### API Key
Todas as rotas protegidas (prefixo `/api`) requerem uma API Key válida no header:
```
x-api-key: Kaioh@30052003
```

### CORS
A API permite requisições das seguintes origens:
- `https://app.replayzone.com.br`
- `https://www.replayzone.com.br`
- `https://admin.replayzone.com.br`
- `http://localhost:5173`

---

## Rotas Públicas (Sem Autenticação)

### Health Check
- **GET** `/health`
- **Descrição**: Verifica se a API está funcionando
- **Resposta**: `{ "ok": true, "service": "replayzone-api" }`

### Teste de Inadimplência
- **POST** `/teste-inadimplencia`
- **Descrição**: Executa manualmente a verificação de inadimplência e bloqueio de quadras
- **Resposta**: Objeto com resumo de clientes atrasados e quadras bloqueadas/desbloqueadas

### Status do Cliente
- **GET** `/status-cliente/:clienteId`
- **Descrição**: Verifica o status de um cliente específico
- **Parâmetros**: `clienteId` (path) - ID do cliente
- **Resposta**: Status detalhado do cliente

### Vincular Cliente à Quadra
- **POST** `/vincular-cliente-quadra`
- **Descrição**: Vincula um cliente a uma quadra
- **Body**: `{ "quadraId": "string", "clienteId": "string" }`
- **Resposta**: `{ "success": true, "message": "Cliente vinculado à quadra com sucesso" }`

---

## Rotas Protegidas (Requerem API Key)

## 📋 Módulo de Administração

### Autenticação de Admin
- **POST** `/api/adminlogin`
- **Descrição**: Login de administrador
- **Body**: `{ email, senha }`
- **Resposta**: Token de autenticação

- **POST** `/api/admin-forgot-password`
- **Descrição**: Recuperação de senha de admin
- **Body**: `{ email }`

### Gestão de Administradores
- **POST** `/api/adminregister`
- **Descrição**: Criar novo administrador
- **Body**: Dados do admin

- **GET** `/api/admins`
- **Descrição**: Listar todos os administradores
- **Resposta**: Array de administradores

- **GET** `/api/admins/:id`
- **Descrição**: Obter administrador específico
- **Parâmetros**: `id` (path) - ID do admin

- **PUT** `/api/admins/:id`
- **Descrição**: Atualizar dados completos do administrador
- **Body**: Dados atualizados do admin

- **PATCH** `/api/admins/:id/cargo`
- **Descrição**: Atualizar apenas o cargo do administrador
- **Body**: `{ cargo: "string" }`

- **DELETE** `/api/admins/:id`
- **Descrição**: Excluir administrador
- **Parâmetros**: `id` (path) - ID do admin

- **PUT** `/api/admins/:id/password`
- **Descrição**: Atualizar senha do administrador (por outro admin)
- **Body**: `{ password: "string" }`

---

## 👥 Módulo de Usuários

### Autenticação de Usuário
- **POST** `/api/login`
- **Descrição**: Login de usuário comum
- **Body**: `{ email, senha }`

- **POST** `/api/register`
- **Descrição**: Criar novo usuário
- **Body**: Dados do usuário

### Autenticação via Telefone
- **POST** `/api/phone-login`
- **Descrição**: Iniciar login com telefone
- **Body**: `{ telefone: "string" }`

- **POST** `/api/verify-code`
- **Descrição**: Verificar código enviado por SMS
- **Body**: `{ telefone: "string", codigo: "string" }`

### Gestão de Usuários
- **GET** `/api/getbyiduser/:id`
- **Descrição**: Obter dados de um usuário
- **Parâmetros**: `id` (path) - ID do usuário

- **PUT** `/api/changeuser/:id`
- **Descrição**: Atualizar dados do usuário
- **Parâmetros**: `id` (path) - ID do usuário
- **Body**: Dados atualizados

- **PUT** `/api/changepassword/:id`
- **Descrição**: Alterar senha do usuário
- **Parâmetros**: `id` (path) - ID do usuário
- **Body**: `{ password: "string" }`

- **PUT** `/api/changepasswordemail/:email`
- **Descrição**: Alterar senha por e-mail
- **Parâmetros**: `email` (path) - E-mail do usuário
- **Body**: `{ password: "string" }`

- **DELETE** `/api/deleteuser/:id`
- **Descrição**: Excluir usuário
- **Parâmetros**: `id` (path) - ID do usuário

---

## 🏟️ Módulo de Quadras

### Gestão de Quadras
- **GET** `/api/quadras`
- **Descrição**: Listar todas as quadras
- **Resposta**: Array de quadras

- **GET** `/api/quadrabyid/:id`
- **Descrição**: Obter quadra por ID
- **Parâmetros**: `id` (path) - ID da quadra

- **GET** `/api/quadras/slug/:slug`
- **Descrição**: Obter quadra por slug (URL amigável)
- **Parâmetros**: `slug` (path) - Slug da quadra

- **GET** `/api/quadrasuser/:usuario_id`
- **Descrição**: Obter quadras de um usuário específico
- **Parâmetros**: `usuario_id` (path) - ID do usuário

- **POST** `/api/quadras`
- **Descrição**: Criar nova quadra
- **Body**: Dados da quadra

- **PUT** `/api/quadras/:id`
- **Descrição**: Atualizar quadra existente
- **Parâmetros**: `id` (path) - ID da quadra
- **Body**: Dados atualizados

- **DELETE** `/api/deletequadra/:id`
- **Descrição**: Desvincular/excluir quadra
- **Parâmetros**: `id` (path) - ID da quadra

### Vínculo de Usuários
- **POST** `/api/vincular-usuario`
- **Descrição**: Vincular usuário à quadra
- **Body**: `{ usuario_id, quadra_id }`

### Gestão de Streaming (HLS)
- **POST** `/api/quadras/:quadra_id/restart-hls`
- **Descrição**: Reiniciar todos os streams HLS de uma quadra
- **Parâmetros**: `quadra_id` (path) - ID da quadra

- **POST** `/api/subquadras/:sub_quadra_id/restart-hls`
- **Descrição**: Reiniciar stream de uma subquadra específica
- **Parâmetros**: `sub_quadra_id` (path) - ID da subquadra

### Horário de Funcionamento
- **GET** `/api/horario-funcionamento/:quadra_id`
- **Descrição**: Obter horário de funcionamento da quadra
- **Parâmetros**: `quadra_id` (path) - ID da quadra

- **PUT** `/api/horario-funcionamento/:quadra_id`
- **Descrição**: Atualizar horário de funcionamento
- **Parâmetros**: `quadra_id` (path) - ID da quadra
- **Body**: Horários de funcionamento

### Patrocinadores
- **GET** `/api/sponsors/:quadra_id`
- **Descrição**: Obter patrocinadores da quadra
- **Parâmetros**: `quadra_id` (path) - ID da quadra

- **PUT** `/api/sponsors/:quadra_id`
- **Descrição**: Atualizar patrocinadores
- **Parâmetros**: `quadra_id` (path) - ID da quadra
- **Body**: Dados dos patrocinadores

- **POST** `/api/upload-sponsor-logo`
- **Descrição**: Upload de logo de patrocinador
- **Body**: Form data com imagem

- **GET** `/api/cleanup-unused-logos`
- **Descrição**: Limpar logos não utilizados

### Utilitários
- **GET** `/api/generate-test-video/:quadra_id`
- **Descrição**: Gerar vídeo de teste para a quadra
- **Parâmetros**: `quadra_id` (path) - ID da quadra

- **POST** `/api/quadras/generate-slugs`
- **Descrição**: Gerar slugs para quadras existentes (uso único)

---

## 🎯 Módulo de Subquadras

### Gestão de Subquadras
- **GET** `/api/allsubquadras`
- **Descrição**: Listar todas as subquadras
- **Resposta**: Array de subquadras

- **GET** `/api/subquadras/:quadra_id`
- **Descrição**: Obter subquadras de uma quadra específica
- **Parâmetros**: `quadra_id` (path) - ID da quadra

- **GET** `/api/subquadras/detalhadas/:quadra_id`
- **Descrição**: Obter subquadras detalhadas com contagem de vídeos
- **Parâmetros**: `quadra_id` (path) - ID da quadra

- **GET** `/api/subquadras/slug/:quadraSlug`
- **Descrição**: Obter subquadras pelo slug da quadra
- **Parâmetros**: `quadraSlug` (path) - Slug da quadra

- **GET** `/api/subquadras/detalhadas/slug/:quadraSlug`
- **Descrição**: Obter subquadras detalhadas pelo slug da quadra
- **Parâmetros**: `quadraSlug` (path) - Slug da quadra

- **GET** `/api/subquadraid/:id`
- **Descrição**: Obter subquadra específica por ID
- **Parâmetros**: `id` (path) - ID da subquadra

- **GET** `/api/subquadras/videos/:subquadra_id`
- **Descrição**: Obter todos os vídeos de uma subquadra
- **Parâmetros**: `subquadra_id` (path) - ID da subquadra

- **POST** `/api/subquadras`
- **Descrição**: Criar nova subquadra
- **Body**: Dados da subquadra

- **PUT** `/api/subquadras/:id`
- **Descrição**: Atualizar subquadra existente
- **Parâmetros**: `id` (path) - ID da subquadra
- **Body**: Dados atualizados

---

## 📅 Módulo de Reservas

### Consulta de Reservas
- **GET** `/api/horarios-livres`
- **Descrição**: Buscar horários livres das subquadras em um dia
- **Query**: `quadra_id`, `data`, `subquadra_id` (opcional)

- **GET** `/api/horario-funcionamento`
- **Descrição**: Obter horário de funcionamento para reserva
- **Query**: `quadra_id`

- **GET** `/api/reservasportelefone`
- **Descrição**: Buscar reservas por telefone
- **Query**: `telefone`

- **GET** `/api/reservasporquadra`
- **Descrição**: Buscar reservas por quadra
- **Query**: `quadra_id`

- **GET** `/api/reservasportoken`
- **Descrição**: Buscar reserva por token
- **Query**: `token`

- **GET** `/api/reservas-por-data`
- **Descrição**: Buscar reservas por quadra e data
- **Query**: `quadra_id`, `data`

- **GET** `/api/reservas-pendentes`
- **Descrição**: Buscar reservas pendentes a partir de uma data
- **Query**: `data_inicio`

### Gestão de Reservas
- **POST** `/api/reservas`
- **Descrição**: Criar nova reserva
- **Body**: Dados da reserva

- **POST** `/api/reserva-manual`
- **Descrição**: Criar reserva manual (admin)
- **Body**: Dados completos da reserva

### Status de Reservas
- **GET** `/api/cancelarreserva`
- **Descrição**: Cancelar reserva
- **Query**: `id` da reserva

- **GET** `/api/cancelar-reserva-especifica`
- **Descrição**: Cancelar reserva específica
- **Query**: `id` da reserva

- **GET** `/api/recusarreserva`
- **Descrição**: Recusar reserva
- **Query**: `id` da reserva

- **GET** `/api/confirmarreserva`
- **Descrição**: Confirmar reserva
- **Query**: `id` da reserva

- **POST** `/api/enviarconfirmacao`
- **Descrição**: Enviar confirmação por WhatsApp
- **Body**: `{ id: "string" }`

### Reservas Fixas
- **GET** `/api/reservas-fixas`
- **Descrição**: Listar reservas fixas
- **Query**: `quadra_id` (opcional)

- **POST** `/api/reservas-fixas`
- **Descrição**: Criar reserva fixa
- **Body**: Dados da reserva fixa

- **DELETE** `/api/reservas-fixas`
- **Descrição**: Excluir reserva fixa
- **Query**: `id` da reserva fixa

- **POST** `/api/gerar-reservas-fixas`
- **Descrição**: Gerar reservas a partir das fixas
- **Body**: `{ data_inicio, data_fim }`

### Relatórios
- **GET** `/api/relatorios`
- **Descrição**: Gerar relatórios de reservas
- **Query**: `quadra_id`, `data_inicio`, `data_fim`, `tipo`

- **GET** `/api/estatisticas`
- **Descrição**: Obter estatísticas das reservas
- **Query**: `quadra_id`, `periodo`

---

## 🎥 Módulo de Vídeos

### Consulta de Vídeos
- **POST** `/api/subquadravideos`
- **Descrição**: Buscar vídeos por subquadra, data e tipo
- **Body**: `{ subquadra_id, data, tipo }`

- **GET** `/api/videoid/:id`
- **Descrição**: Buscar vídeo específico por ID
- **Parâmetros**: `id` (path) - ID do vídeo

- **POST** `/api/videos-hora`
- **Descrição**: Buscar vídeos por intervalo de 1 hora
- **Body**: `{ subquadra_id, data_hora }`

### Vídeos Agrupados
- **POST** `/api/videos-agrupados`
- **Descrição**: Obter vídeos agrupados por critérios
- **Body**: Filtros de agrupamento

- **POST** `/api/videos-agrupados-data`
- **Descrição**: Obter vídeos agrupados por data
- **Body**: `{ data, subquadra_id }`

---

## 👤 Módulo de Clientes

### Gestão de Clientes
- **POST** `/api/clientescriar`
- **Descrição**: Criar novo cliente
- **Body**: Dados do cliente

- **GET** `/api/clientes`
- **Descrição**: Listar todos os clientes
- **Resposta**: Array de clientes

- **GET** `/api/clientesbyid/:id`
- **Descrição**: Obter cliente por ID
- **Parâmetros**: `id` (path) - ID do cliente

- **GET** `/api/clientesbywidepayid/:id`
- **Descrição**: Obter cliente por ID do WidePay
- **Parâmetros**: `id` (path) - ID do WidePay

- **GET** `/api/clientesinadimplentes/`
- **Descrição**: Listar clientes inadimplentes
- **Resposta**: Array de clientes inadimplentes

- **PUT** `/api/clientesalterar/:id`
- **Descrição**: Atualizar dados do cliente
- **Parâmetros**: `id` (path) - ID do cliente
- **Body**: Dados atualizados

- **DELETE** `/api/clientesdeletar/:id`
- **Descrição**: Excluir cliente
- **Parâmetros**: `id` (path) - ID do cliente

### Status de Pagamento
- **PUT** `/api/clientespago/:id`
- **Descrição**: Marcar cliente como pago/desbloqueado
- **Parâmetros**: `id` (path) - ID do cliente

- **PUT** `/api/clientesatrasado/:id`
- **Descrição**: Marcar cliente como atrasado
- **Parâmetros**: `id` (path) - ID do cliente

- **PUT** `/api/clientespendente/:id`
- **Descrição**: Marcar cliente como pendente
- **Parâmetros**: `id` (path) - ID do cliente

### Webhooks e Status
- **GET** `/api/clientes-status-bloqueio`
- **Descrição**: Obter clientes com status de bloqueio (para N8N)
- **Resposta**: Array com status de bloqueio

- **GET** `/api/clientes-status-bloqueio/:id`
- **Descrição**: Obter status de bloqueio de cliente específico
- **Parâmetros**: `id` (path) - ID do cliente

- **POST** `/api/webhook-status-bloqueio`
- **Descrição**: Webhook para atualizar status de bloqueio (N8N)
- **Body**: Dados do webhook

---

## 💰 Módulo de Cobranças

### Gestão de Cobranças
- **GET** `/api/cobrancas`
- **Descrição**: Listar todas as cobranças
- **Resposta**: Array de cobranças

- **GET** `/api/cobrancas/pendentes`
- **Descrição**: Listar cobranças pendentes
- **Resposta**: Array de cobranças pendentes

- **GET** `/api/cobrancas/cliente/:id`
- **Descrição**: Listar cobranças de um cliente
- **Parâmetros**: `id` (path) - ID do cliente

- **GET** `/api/cobrancas/:id`
- **Descrição**: Obter cobrança específica
- **Parâmetros**: `id` (path) - ID da cobrança

- **POST** `/api/cobrancas`
- **Descrição**: Criar nova cobrança
- **Body**: Dados da cobrança

- **POST** `/api/cobrancas/gerar-mensais`
- **Descrição**: Gerar cobranças mensais automáticas
- **Body**: `{ mes, ano }`

- **PUT** `/api/cobrancas/:id`
- **Descrição**: Atualizar cobrança
- **Parâmetros**: `id` (path) - ID da cobrança
- **Body**: Dados atualizados

- **DELETE** `/api/cobrancas/:id`
- **Descrição**: Excluir cobrança
- **Parâmetros**: `id` (path) - ID da cobrança

### Operações de Cobrança
- **PUT** `/api/cobrancas/:id/baixar`
- **Descrição**: Dar baixa em cobrança (marcar como paga)
- **Parâmetros**: `id` (path) - ID da cobrança
- **Body**: `{ data_pagamento, forma_pagamento }`

- **POST** `/api/cobrancas/:id/enviar-whatsapp`
- **Descrição**: Enviar cobrança por WhatsApp
- **Parâmetros**: `id` (path) - ID da cobrança

---

## 🏢 Módulo de Gerentes

### Gestão de Usuários por Gerente
- **POST** `/api/usuarios`
- **Descrição**: Criar novo usuário (gerente)
- **Body**: Dados do usuário

- **GET** `/api/usuarios/quadra/:quadra_id`
- **Descrição**: Buscar usuários por quadra
- **Parâmetros**: `quadra_id` (path) - ID da quadra

- **PUT** `/api/usuarios/:id`
- **Descrição**: Atualizar usuário
- **Parâmetros**: `id` (path) - ID do usuário
- **Body**: Dados atualizados

- **DELETE** `/api/usuarios/:id`
- **Descrição**: Excluir usuário
- **Parâmetros**: `id` (path) - ID do usuário

---

## 📁 Arquivos Estáticos

### Logos de Patrocinadores
- **GET** `/videos/logos/*`
- **Descrição**: Acessar logos de patrocinadores
- **Path**: Configurável via `STATIC_VIDEOS_PATH` (default: `/home/ftp/videos/logos`)

---

## 🚀 Deploy e Configuração

### Variáveis de Ambiente
- `PORT`: Porta do servidor (default: 3000)
- `API_KEY`: Chave de autenticação (default: 'Kaioh@30052003')
- `STATIC_VIDEOS_PATH`: Caminho para vídeos estáticos

### Docker
A aplicação está preparada para deploy com Docker:
- **Health Check**: `/health`
- **Graceful Shutdown**: Suporte a SIGTERM/SIGINT
- **Logs**: Detalhados no console

### Scripts
- `npm start`: Inicia produção
- `npm dev`: Inicia com watch para desenvolvimento

---

## 🔧 Estrutura do Projeto

```
src/
├── controller/     # Lógica de negócio
├── models/         # Modelos de dados
├── routes/         # Definição das rotas
├── middleware/     # Middlewares
├── services/       # Serviços auxiliares
├── financeiro/     # Módulo financeiro
├── utils/          # Utilitários
└── server.js       # Arquivo principal
```

---

## 📝 Observações Importantes

1. **Autenticação**: Todas as rotas `/api` requerem API Key válida
2. **Logging**: A API possui logging detalhado de todas as requisições
3. **CORS**: Configurado para domínios específicos da ReplayZone
4. **Validação**: Validação de dados implementada nos controllers
5. **Error Handling**: Tratamento de erros centralizado
6. **Segurança**: Senhas criptografadas com bcrypt

---

## 📞 Suporte

Para dúvidas ou problemas técnicos:
- Verificar os logs no console para detalhes dos erros
- Confirmar se a API Key está sendo enviada corretamente
- Validar se os parâmetros obrigatórios estão presentes
- Verificar se a origem da requisição está permitida no CORS

---

*Documentação gerada automaticamente em 30/03/2026*
