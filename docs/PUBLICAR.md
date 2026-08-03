# Publicar no GitHub + URL pública

O código já está pronto para subir. Siga estes passos **no Opera** (onde você já está logado no GitHub).

## Passo 1 — Criar repositório no GitHub

1. Abra no Opera: **https://github.com/new**
2. Nome do repositório: `requisicao-clientes-procer`
3. Deixe **Private** ou **Public** (recomendado Private)
4. **NÃO** marque "Add README" (já temos arquivos)
5. Clique em **Create repository**

## Passo 2 — Enviar o código

No terminal do Cursor (ou PowerShell), na pasta do projeto, rode:

```powershell
cd "C:\Users\willian.tramontin\Desktop\Requisição Clientes Procer"

git branch -M main
git remote add origin https://github.com/SEU_USUARIO/requisicao-clientes-procer.git
git push -u origin main
```

> Troque `SEU_USUARIO` pelo seu usuário do GitHub (aparece no canto superior direito do GitHub).

O Opera vai pedir login/autorização na primeira vez.

## Passo 3 — Colocar no ar (URL pública)

O GitHub guarda o código, mas para a **API funcionar na internet** use o **Render** (grátis, conecta direto no GitHub):

1. Acesse **https://render.com** e faça login com GitHub
2. Clique em **New +** → **Web Service**
3. Conecte o repositório `requisicao-clientes-procer`
4. Render detecta o `render.yaml` automaticamente
5. Clique em **Create Web Service**
6. Aguarde o deploy (~2 min)

### URLs que o Renan vai usar

| Uso | URL |
|-----|-----|
| **Painel de tarefas** | `https://requisicao-clientes-procer.onrender.com` |
| **API (agente envia aqui)** | `https://requisicao-clientes-procer.onrender.com/api/requisicoes` |
| **Molde JSON** | `https://requisicao-clientes-procer.onrender.com/api/molde` |

> A URL exata aparece no Render após o deploy. Atualize o molde se for diferente.

### API Key para o Renan

No painel do Render → **Environment** → copie o valor de `API_KEY` gerado automaticamente e passe para o Renan configurar no agente.

---

## O que informar ao Renan

1. URL da API: `https://SEU-APP.onrender.com/api/requisicoes`
2. Header: `X-API-Key: (chave do Render)`
3. Arquivo molde: `docs/molde-requisicao.json` (ou URL `/api/molde`)
4. **cliente_nome** = nome EXATO do contato no Omnichannel (como está no sistema Procer)

## Identificação do cliente

O agente deve enviar o **nome do contato exatamente como está cadastrado** no Omnichannel:

- `Copacol (Universo): Nova Aurora - PR`
- `Mario Wolf Filho (Fazenda Gamada)`
- `Ricardo Ramassotti - Vladimir Zancaner Basto`

A equipe olha esse nome no painel e já sabe qual cliente abrir no sistema Procer.
