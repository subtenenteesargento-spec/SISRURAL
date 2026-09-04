# SISRURAL V15.13 EXP — Plano de Ação e Áreas de Atenção

## Base
Derivada diretamente da V15.12 EXP — Segurança de Dispositivo, preservando as funcionalidades já homologadas.

## Objetivo
Evoluir a Inteligência Operacional Rural para transformar os indicadores do IPPR em orientação gerencial prática, sem automatizar emprego de efetivo.

## Alterações
- Criado **Plano de ação sugerido** para o quadrante prioritário.
- A recomendação considera ocorrência recente, cobertura dos últimos 30 dias, propriedades sem visita há mais de 30 dias e colheita.
- Criado bloco **Áreas que exigem atenção**, priorizando propriedades com ocorrência recente, nunca visitadas ou com maior intervalo sem visita.
- Mantido o vínculo ocorrência → propriedade → quadrante → município.
- Mantido o botão de localização da ocorrência no mapa.
- Mantido o 5W2H como camada gerencial complementar.
- Atualizado cache do PWA para `sisrural-v15-13-exp`.

## Não alterado
- Login/Firebase Authentication.
- Controle de dispositivos e modo estrito.
- Firestore e sincronização.
- Cadastro de propriedades e visitas.
- Offline/PWA.
- Mapa Leaflet.
- Relatórios.
- Auditoria.

## Regra de segurança
A V15.12 permanece preservada como base anterior. A V15.13 é experimental e deve ser homologada antes de qualquer publicação em produção.

## Validação técnica
- `node --check js/firebase-admin.js` deve ser executado antes da homologação.
- Testar Inteligência Operacional com ocorrência recente.
- Confirmar que o plano aponta primeiro para o quadrante prioritário.
- Confirmar que propriedades relacionadas à ocorrência aparecem nas áreas de atenção.
- Confirmar `Ver ocorrência no mapa`.
- Confirmar login em dispositivo autorizado e comportamento do modo estrito.
