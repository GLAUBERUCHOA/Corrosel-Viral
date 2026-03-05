# Backup - Alterações Estáveis (05/03/2026 Tarde)

Este documento registra todas as alterações feitas com sucesso no sistema, compiladas hoje à tarde e já estabilizadas na branch `main`. Este é um ponto seguro (backup) documentado.

## O que foi implementado e está funcionando:
1. **Sistema de Senha no Login (Primeiro Acesso):** Adicionada exigência de senha inicial e checagem via `bcryptjs` na API de autenticação.
2. **Visibilidade de Senha no Admin:** Implementado um ícone (button toggle / olho) para exibir ou ocultar senhas na gestão de usuários (`/admin/users`).
3. **Menu Lateral Responsivo (Sidebar):** O menu administrativo agora colapsa corretamente para mobile como uma gaveta responsiva.
4. **Área Dinâmica de Texto nos Slides (Mobile):** Removido o espaço de 50/50 rígido. O fundo do texto foi reprogramado para ter altura dinâmica (`min-h` / paddings justos) que acompanha o tamanho do texto real. Isso impede que o design cubra o meio das imagens.
5. **Limpeza Visual do Placeholder:** Remoção do texto excessivo ("Regra de Ouro") no modo manual do criador do carrossel, aliviando o visual.
6. **Sistema de Logout Seguro (Sair):** Opção "Sair" configurada no Header do membro e no footer da Sidebar, removendo os tokens de autenticação ativamente com feedback imediato.
