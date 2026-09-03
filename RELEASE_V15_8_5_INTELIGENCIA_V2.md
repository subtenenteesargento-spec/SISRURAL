# SISRURAL V15.8.5 — Inteligência Operacional V2

## Alteração principal
- Painel de ocorrências da Inteligência Operacional passa a exibir, em destaque, o **nome da propriedade vinculada à ocorrência**.
- Para ocorrências sem o nome gravado, o painel tenta recuperar o nome pelo `propriedadeId` no cadastro de propriedades.
- Exibe também data, hora, município, quadrante, BOPM (quando informado) e observação.
- Mostra até 10 ocorrências dos últimos 90 dias, da mais recente para a mais antiga.

## Inteligência
- Mantida a prioridade das ocorrências no IPPR: 40%.
- Plantio continua sem aumentar a pontuação do IPPR.
- O 5W2H continua utilizando a ocorrência e o local/propriedade como referência do planejamento.

## Preservação
- Não altera login, Firebase Authentication, Firestore, cadastro de propriedades, visitas, offline, sincronização, relatórios, PWA ou controle de dispositivos.
- Cache do PWA atualizado para `sisrural-v15-8-5-exp` para evitar carregamento de arquivos antigos.

## Teste
1. Registrar uma ocorrência vinculada a uma propriedade.
2. Abrir Inteligência Operacional.
3. Conferir se o nome da propriedade aparece em destaque no painel de ocorrências.
4. Conferir se o quadrante/natureza e a ocorrência continuam influenciando a prioridade.
