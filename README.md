# La Belle Divas - Sistema de Agendamento

Sistema de agendamento online e gestão administrativa para salão de beleza, integrado com Google Sheets para armazenamento de dados "Low-Code".

![Banner](banner.png)

## 🚀 Funcionalidades

### Para Clientes (`index.html`)

- **Agendamento Online**: Interface visual para escolha de serviços e horários.
- **Verificação de Disponibilidade**: Checagem em tempo real de dias lotados ou bloqueados.
- **Integração WhatsApp**: Redirecionamento automático com mensagem pré-formatada.
- **Design Responsivo**: Funciona bem em celulares e computadores.

### Para Administração (`admin.html`)

- **Dashboard**: Visão geral de agendamentos e status do sistema.
- **Gestão de Agendamentos**:
  - Visualização de agendamentos do dia.
  - Edição de status (Confirmado, Pendente, Cancelado).
  - Edição rápida de detalhes (Nome, Serviço).
- **Gestão de Calendário**:
  - Bloqueio manual de dias.
  - Definição de horários especiais.
  - Configuração da grade semanal (horários de funcionamento).
- **Configurações Gerais**:
  - Limite de atendimentos por dia.
  - Conexão com Google Sheet.

## 🛠️ Tecnologias

- **Frontend**: HTML5, Bootstrap 5, Javascript (Vanilla).
- **Backend**: Google Apps Script (Serverless).
- **Banco de Dados**: Google Sheets.

## 📦 Como Instalar / Replicar

1.  **Clone este repositório**.
2.  **Configuração do Backend**:
    - Crie uma nova planilha no Google Sheets.
    - Vá em `Extensões > Apps Script`.
    - Copie o conteúdo de `Code.gs` para o editor.
    - Publique como **Web App** (Acesso: "Qualquer pessoa").
    - Copie a URL gerada.
3.  **Configuração do Frontend**:
    - Abra o arquivo `config.js`.
    - Cole a URL do Web App na variável `API_URL`.
4.  **Hospedagem**:
    - Envie os arquivos para o **GitHub Pages** ou qualquer hospedagem estática.

## 📄 Estrutura de Arquivos

- `index.html`: Página principal (Cliente).
- `admin.html`: Painel Administrativo.
- `Code.gs`: Código do backend (Apps Script).
- `config.js`: Variáveis de configuração.
- `script.js`: Lógica principal do frontend.
