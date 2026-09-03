# SISRURAL V15.12 — Segurança de dispositivo: 1 policial = 1 aparelho autorizado

## Base
Versão derivada integralmente da V15.11, preservando Inteligência Operacional, ocorrências vinculadas à propriedade, mapa, relatórios, sincronização e demais funções homologadas.

## Alteração principal
Para usuários com perfil **Policial**, o gerenciamento passa a manter somente **um dispositivo Autorizado por usuário**.

Ao autorizar um novo dispositivo de um policial que já possua outro aparelho autorizado:
- o Administrador Geral recebe confirmação;
- o dispositivo anterior é marcado como **Revogado**;
- o novo dispositivo passa a **Autorizado**;
- a substituição é registrada na auditoria.

Administradores e Supervisores continuam sem essa restrição.

## Proteções preservadas
- Modo estrito continua permitindo acesso de Policial somente por dispositivo Autorizado.
- Dispositivo Revogado continua bloqueado.
- Falha de consulta não é convertida em aparelho novo quando o modo estrito está ativo.
- Reconhecimento determinístico do aparelho e reaproveitamento de dispositivo autorizado permanecem.

## Homologação
1. Administrador entra normalmente.
2. Policial entra pelo aparelho autorizado e permanece autorizado após sair/entrar.
3. Novo aparelho do mesmo policial aparece como Pendente.
4. Ao autorizar o novo aparelho, o anterior fica Revogado.
5. O aparelho antigo não consegue entrar em modo estrito.
6. Administrador e Supervisor continuam acessando normalmente em seus dispositivos.
