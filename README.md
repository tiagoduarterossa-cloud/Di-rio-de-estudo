# Diário de Estudo

App para organizar o estudo: manuais, o que estudei em cada dia, testes e trabalhos, horário das aulas e revisões a 1, 7 e 30 dias.

## Como abrir
Abre o `index.html` no browser (duplo clique). Não precisa de instalar nada nem de internet, só as letras vêm do Google Fonts.

## Revisões
- "Revi sem olhar": lembraste-te, a revisão fica feita.
- "Não me lembrei": a matéria recomeça. Volta a aparecer amanhã, depois daqui a 7 e a 30 dias, contados a partir desse dia.

Tudo (manuais, registos, testes e aulas) tem um botão "Editar".

## Estudar para testes
Cada teste ganha 3 dias de estudo: 7 dias antes, 3 dias antes e na véspera (se algum já tiver passado quando registas o teste, fica para esse dia). Aparecem no separador Hoje. Ao carregar em "Estudei", a app abre o formulário para registares o que estudaste, e isso entra nas revisões.

## Onde ficam os dados
Há duas maneiras, e a app escolhe sozinha pelo `config.js`:

1. **Só no browser** (o `config.js` está vazio). Os dados ficam no `localStorage`, com a chave `diario-estudo-v1`, só nesse browser e nesse computador. Se limpares os dados do browser, perdes tudo, por isso usa "Descarregar cópia" no separador Manuais.
2. **Online, no Supabase** (o `config.js` tem o URL e a chave). Entras com o email e vês os mesmos dados no telemóvel e no PC. Da primeira vez que entras, o que estava no browser vai sozinho para a conta.

## Pôr a app no telemóvel (GitHub Pages)
1. No GitHub, abre o repositório > **Settings** > **Pages**.
2. Em "Branch" escolhe o ramo onde está a app e a pasta `/ (root)`. Carrega em **Save**.
3. Passado um minuto, a app fica em `https://tiagoduarterossa-cloud.github.io/Di-rio-de-estudo/`.
4. No telemóvel, abre esse link e usa "Adicionar ao ecrã principal".

## Ligar o Supabase (guardar online)
Faz isto depois do GitHub Pages, porque o login por email não funciona a abrir o ficheiro com duplo clique.

1. Cria uma conta grátis em supabase.com e um projeto novo.
2. Em **SQL Editor**, cola e corre isto:

```sql
create table registos (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  colecao text not null,
  dados jsonb not null,
  atualizado timestamptz not null default now()
);
alter table registos enable row level security;
create policy "cada um só vê os seus registos" on registos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

3. Em **Authentication** > **URL Configuration**, põe o link do GitHub Pages em "Site URL" e também em "Redirect URLs".
4. Em **Project Settings** > **API**, copia o "Project URL" e a "anon public key" para o `config.js`.
5. Faz commit e push. Abre a app pelo link, escreve o email e carrega no link que recebes.

A chave "anon" pode estar no GitHub sem problema: a regra da tabela só deixa cada pessoa ver os seus registos. A outra chave, a "service_role", nunca a ponhas no código.

## Ficheiros
- `index.html`: a página toda (aspeto e lógica).
- `db.js`: guarda e lê os dados, no browser ou no Supabase.
- `config.js`: os dados de ligação ao Supabase (vazio = só no browser).
- `logo.svg`: o logo. Os `.png` são o mesmo logo em tamanhos para o ícone do telemóvel; se mudares o logo, gera-os outra vez e sobe o `?v=` no `index.html` e no `manifest.json`, para o browser não mostrar o antigo.

## Ideias para continuar
1. Resumos com quiz e teste.
2. Ver numa semana só o tempo de estudo por disciplina.
