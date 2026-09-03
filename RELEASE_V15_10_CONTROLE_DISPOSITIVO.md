# SISRURAL V15.10 — Estabilização do controle de dispositivos

## Objetivo
Corrigir a criação/reaparecimento de registros **Pendente** para o mesmo aparelho já autorizado.

## Alterações
- Identidade determinística do aparelho baseada nos dados técnicos já coletados pelo SISRURAL.
- O registro atual Pendente pode reaproveitar um dispositivo Autorizado do mesmo usuário quando a assinatura técnica atingir a correspondência mínima.
- Dispositivo Revogado continua bloqueado e não pode ser automaticamente adotado.
- Mantido o vínculo por usuário e município.
- Registro passa a indicar a chave de identidade e a versão do mecanismo.
- Não altera cadastro de propriedades, visitas, ocorrências, mapa, Inteligência Operacional, relatórios ou sincronização.

## Regra de segurança
Administradores e Supervisores continuam fora do bloqueio de dispositivo. Para Policiais, em modo estrito, somente dispositivo Autorizado permite acesso.

## Homologação recomendada
1. Entrar como Policial em aparelho já autorizado.
2. Sair e entrar novamente.
3. Confirmar que permanece **Autorizado**.
4. Limpar dados do site/localStorage e entrar novamente no mesmo aparelho.
5. Confirmar que o sistema reconhece o aparelho autorizado, sem criar Pendente novo.
6. Testar aparelho realmente novo: deve aparecer como **Pendente**.
7. Testar aparelho Revogado: deve permanecer bloqueado.
