# Flowise

**Flowise** é uma plataforma de cuidado com a saúde mental e produtividade que combina cronômetro Pomodoro, gamificação por mascote virtual, registro emocional e agendamento com psicólogos parceiros. O app ajuda você a manter o foco, construir hábitos saudáveis e monitorar seu bem-estar — tudo em um ambiente seguro e privado.

---

## Problema / desafio abordado

Profissionais e estudantes enfrentam dificuldade em manter o foco, gerenciar a saúde mental e evitar o esgotamento (burnout). O Flowise ataca esses problemas com:

- **Estruturação do foco** via ciclos Pomodoro com ofensiva (streak) diária
- **Autoconhecimento emocional** com registro diário de emoções
- **Alertas inteligentes** de sobrecarga, cansaço e necessidade de pausa
- **Conexão com profissionais** de psicologia quando o autocuidado não é suficiente

---

## Integrantes da equipe

| Nome | GitHub |
|------|--------|
| João Victor Prange Hartmann | [@jjoaohartmann](https://github.com/jjoaohartmann) |
| Maria Eduarda Tessari | [@MariaTessari](https://github.com/MariaTessari) |
| Júlia Verissimo | [@juliaverissimo](https://github.com/juliaverissimo) |
| Fernando Rateke 

> *Projeto desenvolvido para o Hackathon Flowise.*

---

## Tecnologias utilizadas

| Tecnologia | Versão | Finalidade |
|------------|--------|------------|
| [Next.js](https://nextjs.org) | 14.2.3 | Framework React com App Router |
| [React](https://react.dev) | 18.3.1 | Biblioteca de interface |
| [Tailwind CSS](https://tailwindcss.com) | 3.4.4 | Estilização utilitária com suporte a dark mode |
| [Firebase Auth](https://firebase.google.com/products/auth) | 10.14.1 | Autenticação (e-mail/senha) |
| [Firebase Firestore](https://firebase.google.com/products/firestore) | 10.14.1 | Banco de dados NoSQL em tempo real |
| [Lucide React](https://lucide.dev) | 1.17.0 | Ícones SVG |
| [Vercel](https://vercel.com) | — | Hospedagem e deploy (recomendado) |

---

## Funcionalidades implementadas

### 🎯 Dashboard principal
- Cronômetro **Pomodoro** com 4 sessões de 25 minutos e pausas automáticas
- Barra de progresso diário de foco (integrada à meta da rotina)
- Alerta quando a meta saudável de foco é atingida (evitar overwork)
- Lembrete de sono baseado no horário configurado na rotina

### 🔥 Sistema de ofensiva (Streak)
- Contagem de dias consecutivos com acesso ao app
- Recorde pessoal de ofensiva
- Contagem de dias consecutivos com sessões de foco completadas
- Histórico diário de minutos focados (`focusHistory`)

### 🐣 Mascote virtual gamificado
- 8 níveis de evolução: Ovo → Caçula → Gordinho → Esperto → Sábio → Veterano → Lendário → Mítico
- Evolução atrelada ao streak do usuário (1, 3, 7, 14, 21, 30, 50 dias)
- Reações visuais diferentes durante o foco e em repouso

### 😌 Registro de emoções
- 6 emoções disponíveis: Feliz, Calmo, Focado, Estressado, Cansado, Frustrado
- Campo de nota opcional (até 200 caracteres)
- Histórico dos últimos registros com data
- **Privacidade garantida**: cada registro é vinculado ao `userId` e isolado por queries com `where("userId", "==", uid)`

### 📋 Configuração de rotina
- Objetivo diário personalizado
- Horários de sono (acordar/dormir)
- Horas de trabalho/estudo por dia
- Tempo de pausa a cada ciclo
- Minutos de exercício físico diário
- Limite de tempo de tela

### ✅ Validação inteligente da rotina (RN-VALID-01)
- Aviso se sono < 5h30 (risco à produtividade)
- Aviso se sono > 9h30 (possível sonolência)
- Alerta para jornada > 10h/dia (risco de esgotamento)
- Sugestão para aumento de exercício físico (< 15 min/dia)

### 📊 Relatórios e análise de consistência (RN-CONSIST-01)
- Score semanal de aderência à rotina (0–100%)
- Tendência: em alta ↑, estável → ou em queda ↓
- Conselhos personalizados baseados no score
- Gráfico de progresso com código de cores (verde/azul/âmbar)

### 📈 Relatórios avançados (Pro)
- Score semanal de bem-estar integrando emoções e foco
- Detecção de padrões de cansaço: alerta quando ≥ 3 dos últimos 5 registros indicam "Cansado" ou "Estressado"

### 📅 Agendamento com psicólogos (Pro)
- Listagem de psicólogos parceiros com CRP ativo
- Agendamento de consultas online diretamente pelo app
- Sistema de favoritos para salvar profissionais preferidos

### 👤 Autenticação e perfil
- Cadastro e login com e-mail/senha via Firebase Auth
- Proteção de rotas com redirecionamento automático
- Middleware de autenticação no lado do servidor
- Página de perfil com dados do usuário

### 💰 Planos e monetização
- **Plano Gratuito**: Pomodoro, mascote básico (5 estágios), 10 registros de emoções, streak diário
- **Flowise Pro** (R$ 19/mês): Relatórios avançados, detecção de cansaço, agendamento com psicólogos, histórico ilimitado, favoritos
- Simulação de pagamento no MVP (2s de processamento fake)

### 🌙 Temas
- Suporte a **dark mode** em todas as páginas
- Alternância via contexto `ThemeContext`

---

## Estrutura do banco de dados

O banco de dados utilizado é o **Firebase Firestore** (NoSQL).

### Coleção `users`
Documento: `users/{uid}`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `streakCount` | `number` | Dias consecutivos de acesso |
| `longestStreak` | `number` | Recorde de streak |
| `lastActiveDate` | `string` | Última data de acesso (`YYYY-MM-DD`) |
| `lastFocusDate` | `string` | Última data com sessão de foco |
| `totalFocusMinutes` | `number` | Total acumulado de minutos focados |
| `dailyFocusMinutes` | `number` | Minutos focados no dia atual |
| `focusHistory` | `map<string, number>` | Histórico diário: `{ "2026-01-10": 480, ... }` |
| `updatedAt` | `timestamp` | Data da última atualização |

### Subcoleção `users/{uid}/settings`

#### `routine`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `objetivo` | `string` | Objetivo diário |
| `wakeUp` | `string` | Horário de acordar (`HH:MM`) |
| `sleep` | `string` | Horário de dormir (`HH:MM`) |
| `workHours` | `string` | Horas de trabalho/estudo |
| `breakMinutes` | `string` | Minutos de pausa |
| `exerciseMin` | `string` | Minutos de exercício |
| `screenLimit` | `string` | Limite de tela (min) |
| `updatedAt` | `timestamp` | Data de atualização |

#### `subscription`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `plan` | `string` | `"free"` ou `"pro"` |
| `updatedAt` | `timestamp` | Data de alteração |

### Coleção `emocoes`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `userId` | `string` | UID do usuário (chave de privacidade) |
| `emoji` | `string` | Emoji da emoção |
| `label` | `string` | Rótulo (Feliz, Calmo, etc.) |
| `note` | `string` | Nota opcional |
| `date` | `string` | Data do registro |
| `createdAt` | `timestamp` | Data/hora exata |

> **Privacidade**: Todas as queries da coleção `emocoes` utilizam `where("userId", "==", uid)`, garantindo que cada usuário acesse apenas seus próprios registros.

---

## Modelo de monetização

| | Gratuito | Flowise Pro |
|---|---|---|
| **Preço** | R$ 0 | **R$ 19/mês** |
| Cronômetro Pomodoro (4×25min) | ✅ | ✅ |
| Mascote virtual | ✅ (5 estágios) | ✅ (8 estágios) |
| Registro de emoções | ✅ (últimos 10) | ✅ (ilimitado) |
| Streak e recorde pessoal | ✅ | ✅ |
| Configuração de rotina | ✅ | ✅ |
| Relatórios avançados | ❌ | ✅ |
| Detecção de cansaço/burnout | ❌ | ✅ |
| Agendamento com psicólogos | ❌ | ✅ |
| Favoritos | ❌ | ✅ |
| Histórico ilimitado de sessões | ❌ | ✅ |

O modelo segue **freemium**: o gratuito entrega valor real para engajar o usuário, enquanto o Pro oferece funcionalidades de cuidado profissional para quem precisa de suporte mais profundo.

---

## Instruções para execução local

### Pré-requisitos
- **Node.js** 18+ e **npm** 9+
- Projeto Firebase configurado com **Authentication** (e-mail/senha) e **Firestore Database**

### 1. Clone o repositório

```bash
git clone https://github.com/jjoaohartmann/Flowise-Hackaton.git
cd Flowise-Hackaton
```

### 2. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com as credenciais do seu projeto Firebase:

```bash
cp .env.local.example .env.local
```

Edite `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

> ⚠️ **Nunca faça commit** do arquivo `.env.local`. Ele já está no `.gitignore`.

### 3. Instale as dependências

```bash
npm install
```

### 4. Execute o servidor de desenvolvimento

```bash
npm run dev
```

Acesse **http://localhost:3000** no navegador.

### 5. Build de produção (opcional)

```bash
npm run build
npm start
```

---

## Link do deploy

**[Vercel](https:/flowise-hackaton/vercel.com)** — integração nativa com Next.js, deploy automático via git push, e suporte a variáveis de ambiente.