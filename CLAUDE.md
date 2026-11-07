# Diário de Estudo — notas para o Claude Code

- Responde sempre em português de Portugal.
- O dono do projeto está a aprender a programar: explica o que mudas e porquê, em poucas linhas, antes de mexer em muitos ficheiros.
- App estática: `index.html` + `db.js`, sem build nem frameworks. Mantém assim, a não ser que te peçam o contrário.
- Todo o acesso a dados passa pelo objeto que `abrirBD()` devolve em `db.js` (`LocalDB` no browser ou a versão Supabase, conforme o `config.js`), com a API `collection(nome).add/onSnapshot` e `doc("col/id").update/delete`. Não chames `localStorage` diretamente no `index.html`.
- Coleções: `manuais`, `sessoes` (com `revisoes: {"1","7","30"}` e, depois de "Não me lembrei", `base` = dia a partir do qual contam as revisões e `falhas`), `testes`, `horario` (`dia` 1–5 = segunda a sexta).
- As cores estão em variáveis CSS no `:root`. O tema é sempre preto (escolha do Tiago, a combinar com o logo). Usa sempre as variáveis.
- Depois de mudar o código, abre a página e confirma que adicionar, recarregar e apagar continuam a funcionar.
