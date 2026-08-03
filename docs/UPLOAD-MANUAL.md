# SUBIR PROJETO SEM TERMINAL (mais fácil)

Se o git push não funciona, use o upload direto no GitHub:

## Passo 1 — Arquivo pronto

Na sua **Área de Trabalho** tem o arquivo:
**requisicao-clientes-procer.zip**

## Passo 2 — Abrir repositório no Opera

https://github.com/willianprocer-byte/requisicao-clientes-procer

(Se o repositório não existir, crie em https://github.com/new com esse nome)

## Passo 3 — Upload

1. Clique em **"Add file"** → **"Upload files"**
2. Arraste o arquivo **requisicao-clientes-procer.zip** OU extraia o zip e arraste as **pastas e arquivos** de dentro
3. Mensagem: `Sistema de requisições Procer`
4. Clique em **"Commit changes"**

## Passo 4 — URL pública (Render)

1. https://render.com → Login with GitHub
2. New → Web Service → repositório `requisicao-clientes-procer`
3. Deploy (~2 min)
4. URL para o Renan: `https://requisicao-clientes-procer.onrender.com/api/requisicoes`

---

## Se quiser corrigir o token depois

Token precisa ser **Classic** (começa com `ghp_`) com **`repo`** marcado.
Tokens fine-grained (`github_pat_`) precisam de "Contents: Read and write" no repositório.

Revogue tokens antigos: https://github.com/settings/tokens
