# Como resolver erro 127.0.0.1 ao publicar no GitHub

Esse erro acontece quando o Git abre o navegador para login (OAuth) e o callback em `127.0.0.1` falha.

## Solução recomendada — login por código (sem erro de navegador)

Abra um **terminal novo** no Cursor e rode **um comando por vez**:

### 1. Login no GitHub (modo código)

```powershell
$env:Path = "C:\Program Files\GitHub CLI;C:\Program Files\Git\bin;" + $env:Path
gh auth login
```

Responda assim:
- **GitHub.com** → Enter
- **HTTPS** → Enter
- **Login with a web browser?** → digite **`n`** (Não)
- Copie o **código** que aparecer (ex: `ABCD-1234`)
- Abra no Opera: **https://github.com/login/device**
- Cole o código → Authorize
- Volte ao terminal → Enter

### 2. Configurar Git e enviar

```powershell
cd "C:\Users\willian.tramontin\Desktop\Requisição Clientes Procer"
gh auth setup-git
git remote set-url origin https://github.com/willianprocer-byte/requisicao-clientes-procer.git
git push -u origin main
```

### 3. Confirmar

Abra: **https://github.com/willianprocer-byte/requisicao-clientes-procer**

---

## Se o repositório ainda não existe

Antes do push, crie em: **https://github.com/new**
- Nome: `requisicao-clientes-procer`
- Sem README

Ou pelo terminal (depois do login):

```powershell
gh repo create requisicao-clientes-procer --private --source=. --remote=origin --push
```

---

## Alternativa — Token manual

Se preferir token em vez do `gh`:

1. Crie em: **https://github.com/settings/tokens/new** (marque **repo**)
2. Rode:

```powershell
git config --global credential.gitHubAuthModes pat
git push -u origin main
```

- Username: `willianprocer-byte`
- Password: cole o token `ghp_...` (não use sua senha)

---

## Depois: URL pública para o Renan

1. **https://render.com** → Login with GitHub
2. New → Web Service → `requisicao-clientes-procer`
3. Deploy (~2 min)
4. URL: `https://requisicao-clientes-procer.onrender.com`
