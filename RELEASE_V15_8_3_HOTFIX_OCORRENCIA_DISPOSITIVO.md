# SISRURAL V15.8.3 — Hotfix Ocorrência + Modo Proteção

## Correções
- Corrigido o bloqueio recorrente do Modo Proteção causado pelo cadastro legado de dispositivo executado a cada login.
- O login agora deixa o `onAuthStateChanged` fazer uma única identificação/consulta do dispositivo estável.
- Dispositivo previamente autorizado deixa de ser sobrescrito como `Pendente` no login.
- Mantida a compatibilidade/migração com registros legados por navegador + resolução.
- Datas de ocorrência `YYYY-MM-DD` passam a ser calculadas como data local.
- O planejamento 5W2H da Inteligência Operacional passa a citar explicitamente a natureza da ocorrência recente (ex.: ROUBO) e, quando disponível, o local/propriedade relacionado.

## Teste recomendado
1. Atualizar o site/PWA.
2. Limpar cache apenas se o navegador continuar usando versão anterior.
3. Entrar com um policial cujo dispositivo já esteja `Autorizado`.
4. Confirmar que não aparece bloqueio de dispositivo.
5. Abrir Inteligência Operacional Rural e conferir o 5W2H: ocorrências recentes devem aparecer no WHAT/WHY/WHERE/HOW.
