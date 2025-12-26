# Relatório Arquitetônico: Sistema de Agendamento

## 1. Visão Geral do Fluxo

O sistema opera em um modelo híbrido onde a inteligência de validação reside no Google Apps Script (Backend), enquanto a interface (Frontend) atua como um coletor de dados e facilitador da comunicação via WhatsApp.

### Diagrama Simplificado do Fluxo:

1.  **Seleção de Data**: O usuário escolhe uma data no calendário.
2.  **Validação Assíncrona**: O site consulta a API (`Code.gs`) para verificar o status daquela data.
3.  **Feedback Visual**:
    - Se a data estiver bloqueada ou cheia: O campo é limpo e um alerta é exibido.
    - Se disponível: Os horários ocupados são desabilitados no dropdown de seleção.
4.  **Submissão**: O usuário preenche os dados e clica em "Agendar".
5.  **Reserva no Backend**: O sistema registra o agendamento na planilha Google Sheets como "Confirmado".
6.  **Redirecionamento WhatsApp**: O site abre o WhatsApp com uma mensagem pré-preenchida para o cliente enviar ao estabelecimento.

---

## 2. Lógica de Validação e Bloqueio

A validação ocorre em duas etapas: no carregamento da data (para UX) e na submissão (para segurança).

### 2.1 Validação de Data (`getAvailability` no Code.gs)

Ao selecionar um dia, o sistema verifica três camadas de restrição:

1.  **Bloqueios Manuais (Prioridade Alta)**: Verifica na aba `Bloqueios` se a data específica foi travada manualmente pelo administrador.
2.  **Agenda Semanal (Recorrência)**: Verifica na configuração JSON (`weeklySchedule`) se aquele dia da semana (ex: Domingo) está marcado como fechado.
    - _Nota_: Um `Horário Especial` pode sobrescrever a regra semanal (ex: abrir num domingo específico).
3.  **Capacidade (Limite Diário)**:
    - Conta quantos agendamentos existem na aba `Agendamentos` para a data.
    - Compara com `MAX_AGENDAMENTOS_DIA` (Padrão: 10).
    - Se `Agendamentos >= Limite`, retorna `isFull: true`.

### 2.2 Validação de Horários (Slots)

Se a data é válida, o sistema filtra os horários disponíveis:

- **Slots Ocupados**: Retorna uma lista de horários já agendados para aquele dia. O Frontend desabilita essas opções no dropdown.
- **Janela de Funcionamento**: Se houver um horário de funcionamento definido (ex: 09:00 às 18:00), o Frontend bloqueia opções fora desse intervalo (ex: um slot de 19h seria desabilitado).

---

## 3. Experiência do Usuário (UX) Atual

### Pontos Fortes:

- **Verificação em Tempo Real**: Evita que o usuário tente agendar em dias cheios sem saber.
- **Feedback Imediato**: Mensagens claras de "Dia Indisponível" ou "Agenda Lotada".

### Pontos de Atenção (Gargalos):

- **O "Falso" Confirmado**: O sistema salva o agendamento na planilha _antes_ do cliente enviar a mensagem no WhatsApp.
  - _Risco_: Se o cliente fechar a janela do WhatsApp sem enviar a mensagem, a planilha terá um agendamento "Confirmado", mas o estabelecimento não saberá (cliente "fantasma").
- **Interface de Data**: O `input type="date"` nativo permite clicar em dias bloqueados/passados para só _depois_ avisar que é inválido (limpa o campo). Isso pode frustrar o usuário.

---

## 4. Sugestões de Melhoria (Roadmap)

Para tornar a experiência mais fluida e profissional, recomendo as seguintes evoluções:

### 4.1 Melhoria Crítica: Status "Pendente"

Alterar o status inicial na planilha de "Confirmado" para "**Pendente via WhatsApp**".

- **Por que?** Isso sinaliza ao administrador que aquele agendamento foi iniciado no site, mas requer a confirmação final via mensagem. O administrador só muda para "Confirmado" após receber o "Oi" no WhatsApp.

### 4.2 Melhoria de Interface: Calendário Inteligente

Substituir o input nativo por uma biblioteca de calendário (como _Flatpickr_ ou _FullCalendar_).

- **Benefício**: Pintar de vermelho/cinza os dias bloqueados ou cheios _antes_ do usuário clicar. Mostrar visualmente os dias disponíveis.
- **API**: A API precisaria de um endpoint leve para retornar "dias indisponíveis do mês" para pintar o calendário.

### 4.3 Página de Sucesso Intermediária

Ao invés de abrir o WhatsApp direto, redirecionar para uma "Página de Obrigado".

- **Fluxo**: Agendar -> Tela de Sucesso ("Reserva pré-realizada! Finalize abaixo") -> Botão Grande "Enviar Comprovante/Mensagem no WhatsApp".
- **Benefício**: Reforça a instrução de que o processo só acaba ao enviar a mensagem.

### 4.4 Recuperação de Slots

Implementar uma rotina (Script Trigger) que limpa agendamentos "Pendentes" antigos (ex: feitos há mais de 24h) que não foram confirmados manualmente, liberando a vaga para outros clientes.
