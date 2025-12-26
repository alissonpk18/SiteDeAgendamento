# Como Publicar Seu Site no GitHub (Grátis) 🌍

Este guia vai te ajudar a colocar seu site no ar usando o **GitHub Pages**, que é gratuito e perfeito para este tipo de projeto.

## Passo 1: Criar o Repositório no GitHub

1.  Acesse [github.com/new](https://github.com/new) (faça login se precisar).
2.  Em **Repository name**, digite um nome (ex: `meu-site-agendamento`).
3.  Deixe como **Public**.
4.  **NÃO** marque as caixas "Add a README file" ou ".gitignore" (nós já temos isso aqui).
5.  Clique em **Create repository**.

## Passo 2: Enviar os Arquivos

Copie os comandos que aparecerão na tela do GitHub sob o título **"…or push an existing repository from the command line"**.
Eles serão parecidos com isso (substitua `SEU-USUARIO` e `REPOSITORIO` pelos seus dados):

```bash
git remote add origin https://github.com/SEU-USUARIO/REPOSITORIO.git
git branch -M main
git push -u origin main
```

Abra o terminal na pasta deste projeto e cole esses comandos.

## Passo 3: Ativar o Site (GitHub Pages)

1.  Na página do seu repositório no GitHub, clique em **Settings** (Configurações) no menu superior.
2.  No menu lateral esquerdo, clique em **Pages**.
3.  Em **Build and deployment** / **Source**, selecione **Deploy from a branch**.
4.  Em **Branch**, selecione `main` e a pasta `/ (root)`.
5.  Clique em **Save**.

⏳ **Aguarde cerca de 1 a 2 minutos.**
O GitHub vai gerar um link (ex: `https://seu-usuario.github.io/meu-site-agendamento`).

## Passo 4: Atenção com os Textos! ⚠️

Como seu site agora carrega textos de arquivos externos (`.txt`), ele precisa estar neste endereço `https` que o GitHub criou.
Se você tentar abrir sem ser pelo link (ou sem o servidor local), os textos podem não aparecer correta.

Use sempre o link oficial do GitHub para enviar aos clientes!
