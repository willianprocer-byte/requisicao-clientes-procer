# Automação CeresWeb (app.procer.com.br)

Fluxo identificado no vídeo para **atualizar amostragem**.

## Passos manuais (vídeo)

1. Login em `https://app.procer.com.br/login`
2. Selecionar a **unidade/cliente** (botão **Filial** no topo — ex: "Procer Portas Abertas: Criciúma - SC")
3. Menu **Silos/Armazéns → Amostragens**
4. Clicar **"+ Incluir amostragem"**
5. Selecionar o **Silo/Armazém** pelo número descrito na requisição (ex: "3" → "Silo 03")
6. Preencher formulário **Adicionando Amostragens**:
   | Campo CeresWeb | Vem da requisição |
   |----------------|-------------------|
   | Silo/Armazém | `dados.silos[].numero` ou `identificador` |
   | Data amostra | data de hoje |
   | Umidade Controle (%) | `amostragem.umd` |
   | Avariados (%) | `amostragem.avr` |
   | Impurezas (%) | `amostragem.imp` |
   | Notas | `descricao` (opcional) |
7. Clicar **Salvar amostragem**

## Mapeamento API → Procer

```
cliente_nome  →  buscar na Filial (nome exato ou parcial)
dados.silos[].numero / identificador  →  busca automática no dropdown (ex: "3" encontra "Silo 03")
dados.silos[].amostragem.umd  →  Umidade Controle (%)
dados.silos[].amostragem.avr  →  Avariados (%)
dados.silos[].amostragem.imp  →  Impurezas (%)
```

## Onde roda a automação

A automação roda **no computador da Procer** (Windows), não no Render.

Motivo: precisa de navegador, login e acesso ao CeresWeb interno.

```
WhatsApp → Melissa → API (Render) → Painel
                              ↓
                    Worker local (Playwright)
                              ↓
                    app.procer.com.br
```

## Configuração

1. Copie `automation/config.example.json` → `automation/config.json`
2. Preencha login CeresWeb e mapeamentos de unidade
3. Instale: `cd automation && npm install`
4. Rode: `npm run processar`

## Mapeamento de unidades

No `config.json`, mapeie apenas o `cliente_nome` da requisição para o termo de busca na Filial.
**Não é necessário cadastrar ID de silo** — a automação lê o número/identificador da requisição e encontra o silo no dropdown do CeresWeb.

```json
{
  "unidades": [
    {
      "cliente_nome_contem": "Procer Teste",
      "filial_busca": "Procer Teste"
    }
  ]
}
```

### Como o silo é encontrado

A requisição traz `dados.silos[].numero` (ex: `"3"`) ou `identificador` (ex: `"Silo 3"`).
A automação lista as opções do formulário e escolhe a que corresponde — aceita variações como "Silo 03", "Silo 3", "Silo 003".

## Próximas fases

| Fase | Tipo requisição | Ação no CeresWeb |
|------|-----------------|------------------|
| 1 ✅ | atualizar_amostragem | Formulário amostragem |
| 2 | atualizar_nivel_silo | Dashboard silos / estoque |
| 3 | atualizar_produto | Alterar grão no silo |
