# Guia de Integração: Planilha Google (Backend)

Para que os agendamentos sejam salvos, precisamos conectar o site à sua Planilha Google.

## Passo 1: Preparar a Planilha

1.  Crie uma nova planilha em branco no Google Sheets com o nome **"Agendamentos"**.
2.  No menu superior, clique em **Extensões** > **Apps Script**.

## Passo 2: Instalar o Código

1.  O editor de código abrirá. Apague qualquer código que estiver no arquivo `Código.gs`.
2.  Copie TODO o conteúdo do arquivo **`Code.gs`** que está na pasta deste projeto.
3.  Cole no editor do Apps Script.
4.  Clique no ícone de **Salvar** (Diskette).

## Passo 3: Publicar como API

1.  No canto superior direito, clique em **Implantar** (Deploy) > **Nova implantação**.
2.  Na janela que abrir:
    - **Selecione o tipo**: App da Web.
    - **Descrição**: "API Agendamento".
    - **Executar como**: "Eu" (seu email).
    - **Quem pode acessar**: Selecione **"Qualquer pessoa"** (Critical: must be Anyone).
3.  Clique em **Implantar**.
4.  Dê as permissões necessárias quando o Google pedir.
5.  Copie a **URL do App da Web** (começa com `https://script.google.com/macros/s/...`).

## Passo 4: Conectar no Site

1.  Abra o arquivo **`config.js`** na pasta do projeto.
2.  Cole a URL copiada no campo `API_URL`.
    ```javascript
    API_URL: "https://script.google.com/macros/s/SEU_CODIGO_AQUI/exec",
    ```
3.  Salve o arquivo.

## Pronto! 🚀

Agora, sempre que alguém agendar no site, os dados aparecerão automaticamente na sua planilha.
