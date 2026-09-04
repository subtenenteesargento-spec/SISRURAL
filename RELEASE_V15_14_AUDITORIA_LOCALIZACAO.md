# SISRURAL V15.14 EXP — Auditoria e Validação de Localização

## Objetivo
Adicionar uma camada administrativa de conferência das coordenadas das propriedades rurais, preservando integralmente a operação existente da V15.13.

## Entregas
- Auditoria das propriedades contra a malha municipal do IBGE quando disponível.
- Classificação informativa: localização compatível, próxima da divisa/conferir, ou suspeita/distante.
- Nenhuma coordenada existente é alterada automaticamente.
- Painel administrativo com resumo e filtro de ocorrências de localização.
- Acesso rápido para ver/corrigir a localização.
- Correção manual por mapa, marcador arrastável ou coordenadas.
- Registro da coordenada anterior/nova, usuário e data na auditoria.
- Recalculo do quadrante e atualização do link do Google Maps após correção.
- Validação preventiva no novo cadastro: se a posição estiver fora/ próxima da área municipal, o operador é avisado antes de salvar.
- Cadastros offline preservam a avaliação de localização para sincronização posterior.

## Regra de segurança
A classificação é apoio à conferência. Propriedades próximas de divisa não são automaticamente consideradas erradas. O sistema não esconde nem remove propriedades do mapa para resolver inconsistências.

## Preservação
Mantidos Login, Firebase/Firestore, perfis, dispositivos, offline, sincronização, propriedades, visitas, fotos, ocorrências, mapa, quadrantes, relatórios, Inteligência Operacional, IPPR e Plano de Ação.

## Homologação recomendada
1. Propriedade dentro do município.
2. Propriedade próxima da divisa.
3. Propriedade com coordenada claramente distante.
4. Novo cadastro com posição incompatível.
5. Correção manual pelo mapa.
6. Verificação do Google Maps após correção.
7. Verificação do quadrante.
8. Verificação da ocorrência vinculada.
9. Teste offline/sincronização.
10. Login e controle de dispositivos.

## Observação
A V15.13 permanece como base anterior preservada. Esta V15.14 é EXP e deve ser homologada antes de qualquer publicação na versão de produção.
