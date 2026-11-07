# Diário de Estudo

App para organizar o estudo: manuais, o que estudei em cada dia, testes e trabalhos, horário das aulas e revisões a 1, 7 e 30 dias.

## Como abrir
Abre o `index.html` no browser (duplo clique). Não precisa de instalar nada nem de internet, só as letras vêm do Google Fonts.

## Onde ficam os dados
No `localStorage` do browser, com a chave `diario-estudo-v1`.
- Ficam só nesse browser e nesse computador.
- Se limpares os dados do browser, perdes tudo. Usa "Descarregar cópia" no separador Manuais de vez em quando.
- Para passar para outro computador: descarrega a cópia num e importa-a no outro.

## Ficheiros
- `index.html`: a página toda (aspeto e lógica).
- `db.js`: guarda e lê os dados. É o único ficheiro a mudar se um dia quiseres trocar para Supabase.

## Ideias para continuar
1. Trocar o `db.js` por Supabase, como no Planeador, para ter os dados no telemóvel e no PC.
2. Editar registos (para já só dá para apagar e voltar a criar).
3. Ver numa semana só o tempo de estudo por disciplina.
4. Pôr online no GitHub Pages.
