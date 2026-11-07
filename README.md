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

## Fotos
No "Registar o que estudei" podes juntar fotos do caderno ou do manual. São reduzidas antes de guardar (cerca de 70 KB cada) e aparecem no Histórico e nas revisões. Carrega numa foto para a ver em grande.
Atenção: a "Descarregar cópia" não leva as fotos, só o texto.

## Faltas
Em Hoje > "Faltei a aulas" escolhes o dia e as aulas (vêm do horário). Cada falta fica em "Para compensar" com dois passos: "Já tenho a matéria" e "Compensei". Este último abre o registo, para a matéria entrar nas revisões. As faltas de disciplinas com teste perto aparecem primeiro.

## Resumos, quiz e testes
Os resumos fazem-se no Claude e guardam-se na app:
1. Separador Resumos > "Novo resumo" > "Copiar pedido para o Claude".
2. Cola o pedido numa conversa nova no Claude e junta as fotos dos apontamentos (ou cola um resumo antigo para o converter).
3. Copia a resposta toda (o bloco JSON) e cola-a na app. Carrega em "Guardar resumo".

Cada resumo tem:
- **Matéria**: com títulos, tópicos, termos a amarelo e tabelas.
- **Quiz**: escolha múltipla e verdadeiro/falso, com nível à escolha (Fácil, Médio, Difícil ou Tudo) e a correção e explicação logo a seguir.
- **Teste**: por grupos (ligar, verdadeiro/falso, escolha múltipla, resposta escrita), com nível à escolha e nota só no fim. Na resposta escrita escreves, vês a resposta modelo e dizes se ficou certa, meio certa ou errada.
- **Teste final**: as perguntas marcadas como finais (ou uma mistura de todos os níveis e tipos), com nota em %.

Os resultados ficam guardados. O `resumos-prontos.json` tem resumos já convertidos, que se carregam no separador Resumos.

## Calendário e notas
No separador Testes há um calendário do mês (testes, dias de estudo, faltas e dias em que estudaste; toca num dia para ver o que tem) e o painel "Notas e estudo": escreve a nota de cada teste (Editar) e vês quantas vezes estudaste essa disciplina nas duas semanas antes.

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

   E para as fotos, cria em **Storage** um bucket privado chamado `fotos` e corre isto no SQL Editor:

```sql
create policy "cada um mexe nas suas fotos" on storage.objects
  for all to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
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
1. Ver numa semana só o tempo de estudo por disciplina.
