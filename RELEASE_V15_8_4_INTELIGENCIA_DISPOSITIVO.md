# SISRURAL V15.8.4 — Identificação persistente de dispositivo + prioridade de ocorrências

## Segurança de dispositivo
- Identificador persistente com localStorage + cookie de primeiro acesso.
- Reconhecimento de registros confiáveis anteriores por assinatura do aparelho.
- Dispositivo Autorizado não volta para Pendente por simples novo login.
- Migração para a chave estável atual sem apagar histórico.
- Administrador/Supervisor continuam fora do bloqueio de dispositivo.

## Inteligência Operacional
- Ocorrências territoriais passam a ser o principal componente do IPPR (40%).
- Baixa cobertura: 25%.
- Atraso de visitas: 20%.
- Colheita: 10%.
- Situações de atenção em campo: 5%.
- Plantio não aumenta mais a pontuação do IPPR.
- Naturezas mais graves recebem maior impacto no componente de ocorrência; roubo tem peso máximo.
- Datas futuras são ignoradas nos indicadores de 30/60/90 dias.
- O 5W2H passa a colocar ocorrência recente na justificativa e na ação recomendada.

## Teste obrigatório
1. Entrar no mesmo computador com policial já autorizado.
2. Confirmar que o registro permanece Autorizado.
3. Registrar um Roubo em um quadrante.
4. Abrir Inteligência Operacional e confirmar que o quadrante da ocorrência recebe prioridade.
