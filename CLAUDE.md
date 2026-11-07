# Diário de Estudo — notas para o Claude Code

- Responde sempre em português de Portugal.
- O dono do projeto está a aprender a programar: explica o que mudas e porquê, em poucas linhas, antes de mexer em muitos ficheiros.
- App estática: `index.html` + `db.js`, sem build nem frameworks. Mantém assim, a não ser que te peçam o contrário.
- Todo o acesso a dados passa pelo `LocalDB` em `db.js`, com a API `collection(nome).add/onSnapshot` e `doc("col/id").update/delete`. Não chames `localStorage` diretamente no `index.html`.
- Coleções: `manuais`, `sessoes` (com `revisoes: {"1","7","30"}`), `testes`, `horario` (`dia` 1–5 = segunda a sexta).
- As cores estão em variáveis CSS no `:root`, com tema claro e escuro. Usa sempre as variáveis.
- Depois de mudar o código, abre a página e confirma que adicionar, recarregar e apagar continuam a funcionar.
