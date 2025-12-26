# Guia de Replicação do Projeto (Template Genérico) 🚀

Este projeto é um **Modelo Universal**. Você pode usá-lo para criar sites de agendamento para **qualquer negócio** (Barbearia, Clínica, Dentista, etc.) sem tocar em código HTML complexo.

## Nova Estrutura de Edição

Tudo o que você precisa customizar está em arquivos soltos na pasta principal:

- **`config.js`**: Configure aqui Configurações, Serviços, Horários e Dados de Contato.
- **`*.txt`**: Arquivos de texto simples para mudar títulos, descrições e botões. Ex: `meta_title.txt`, `navbar_brand.txt`.
- **`*.png`**: Imagens do site. Basta substituir os arquivos mantendo o mesmo nome (ex: `banner.png`, `servicos.png`).

---

## Passo a Passo para Criar um Novo Site

### 1. Copie a Pasta

Duplique esta pasta e renomeie para o nome do novo projeto.

### 2. Configure a Identidade (`config.js`)

Abra o `config.js` e altere:

- `BUSINESS_NAME`: Nome do negócio.
- `WHATSAPP_NUMBER`: Número para receber agendamentos.
- `SERVICES`: Lista de serviços oferecidos.
- `TIME_SLOTS`: Horários de atendimento.

### 3. Personalize o Conteúdo (Sem Código)

Para mudar textos do site, **não** edite o `index.html`.
Apenas abra e edite os arquivos de texto correspondentes:

- `navbar_brand.txt` -> Nome no Topo
- `hero_cta.txt` -> Texto do botão principal
- `meta_description.txt` -> Descrição para o Google (SEO)
- _E todos os outros arquivos .txt que encontrar._

### 4. Troque as Imagens

Substitua as imagens na pasta:

- `banner.png` -> Banner principal (Topo)
- `servicos.png` -> Tabela ou Imagem de serviços
- `rodape.png` -> Fundo do rodapé
- `foto1.png` a `foto6.png` -> Fotos da Galeria

### 5. Backend (Planilha Google)

1. Crie uma nova Planilha no Google Sheets.
2. Configure o script (veja `INTEGRACAO_SHEETS.md` se disponível).
3. Pegue a URL do Web App gerada e cole em `config.js` no campo `API_URL`.

### 6. Pronto!

Seu site novo está pronto com textos, serviços e identidade visual novos, mantendo toda a inteligência de agendamento.
