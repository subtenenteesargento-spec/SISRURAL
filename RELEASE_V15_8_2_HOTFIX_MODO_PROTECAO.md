# SISRURAL V15.8.2 HOTFIX — Modo Proteção

Correção do fluxo de autenticação e controle de dispositivos.

## Correções
- Mantido o acesso administrativo e de supervisão, independentemente do status do dispositivo.
- Policial em modo estrito: somente dispositivo `Autorizado` entra.
- Dispositivo `Revogado` permanece bloqueado em qualquer modo.
- Falha de consulta ao Firestore não é tratada como simples aparelho novo.
- Compatibilidade com registros legados: quando o mesmo usuário e equipamento já possuem registro compatível, o status anterior é reaproveitado.
- Registro passa a gravar também navegador/resolução para compatibilidade e auditoria.
- Versão do registro atualizada para `15.8.2`.

## Homologação recomendada
1. Administrador entra normalmente.
2. Supervisor entra normalmente.
3. Policial com dispositivo autorizado entra.
4. Policial em aparelho novo recebe bloqueio/pendência quando o modo estrito estiver ativo.
5. Dispositivo revogado continua bloqueado.
