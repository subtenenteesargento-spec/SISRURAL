# SISRURAL V8.4 - Consolidação

Base preservada da V8.

Inclui:
- cadastro offline preservado;
- visitas offline preservadas;
- sincronização manual pelo ADMIN;
- indicador de pendências;
- cadastro/atualização de perfil de policial no SISRURAL;
- painel do comandante e relatórios preservados;
- auditoria preservada.

Observação importante:
O SISRURAL consegue criar/alterar o PERFIL do policial no Firestore. Para o primeiro login, o e-mail também precisa existir em Firebase Authentication. A criação automática da conta de autenticação exigirá Cloud Functions em etapa futura.

Teste sugerido:
https://subtenenteesargento-spec.github.io/SISRURAL/?v=84consolidacao
