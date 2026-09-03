# SISRURAL V15.11 — Inteligência Operacional: ocorrência com prioridade temporal

## Base
Derivada diretamente da V15.10 EXP — Controle de Dispositivo, preservando a camada de segurança e as funcionalidades operacionais existentes.

## Alterações desta versão
- Mantida a regra do IPPR V2: **ocorrências territoriais são o principal fator (40%)**.
- **Plantio não aumenta a pontuação do IPPR**; permanece apenas como informação sazonal.
- Ocorrências dentro dos últimos 90 dias passam a receber **peso temporal**: até 30 dias = 100% do peso; 31–60 dias = 75%; 61–90 dias = 50%.
- Na prioridade individual da propriedade, a ocorrência recente também recebe esse peso temporal.
- O ranking de propriedades passa a guardar a **ocorrência mais recente**, permitindo exibir natureza e data diretamente na tabela de prioridades.
- Os cards dos quadrantes passam a destacar a **última ocorrência do quadrante**, com propriedade e data.
- Mantido o botão **Ver ocorrência no mapa**.
- Mantido o vínculo **ocorrência → propriedade → quadrante → município**.
- Cache do PWA atualizado para `sisrural-v15-11-exp` para garantir distribuição da nova versão.

## Não alterado
- Login e Firebase Authentication.
- Controle de dispositivos / modo estrito.
- Firestore e sincronização.
- Cadastro de propriedades.
- Cadastro de visitas.
- Offline.
- Mapa Leaflet.
- Relatórios.
- Fotos e Cloudinary.
- Auditoria.

## Validação técnica
- `node --check js/firebase-admin.js` sem erro de sintaxe.
- Estrutura do pacote preservada.
- Versão visual atualizada para V15.11 EXP.

## Homologação recomendada
1. Abrir a Inteligência Operacional como Administrador.
2. Confirmar a ocorrência recente e a propriedade vinculada.
3. Confirmar que a propriedade aparece na prioridade com natureza/data da ocorrência.
4. Confirmar que ocorrência recente pesa mais que ocorrência antiga da mesma natureza.
5. Testar `Ver ocorrência no mapa`.
6. Testar login de Policial em dispositivo autorizado e confirmar que o controle de dispositivo continua funcionando.
