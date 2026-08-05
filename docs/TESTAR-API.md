# Como testar a API (Postman / Insomnia / PowerShell)

## Dados fixos para todos os testes

| Campo | Valor |
|-------|-------|
| **URL** | `https://requisicao-clientes-procer.onrender.com/api/requisicoes` |
| **Método** | POST |
| **Header Content-Type** | `application/json` |
| **Header X-API-Key** | `procer-api-key-2026` |

**Painel para ver resultado:** https://requisicao-clientes-procer.onrender.com

---

## Teste 1 — Atualizar nível do silo

**Body (JSON):**
```json
{
  "tipo": "atualizar_nivel_silo",
  "cliente_nome": "Mario Wolf Filho - Fazenda Gamada",
  "solicitante": "Sidiclei (Operador)",
  "regiao": "MT",
  "descricao": "Silo pulmão 102 cheio favor atualizar",
  "dados": {
    "silos": [
      {
        "identificador": "Silo pulmão 102",
        "numero": "102",
        "tipo_silo": "pulmao",
        "nivel": "cheio"
      }
    ]
  }
}
```

**Sucesso:** status `201` + `"status": "pendente"` na resposta.

---

## Teste 2 — Atualizar amostragem

**Body (JSON):**
```json
{
  "tipo": "atualizar_amostragem",
  "cliente_nome": "Ricardo Ramassotti - Vladimir Zancaner Basto",
  "descricao": "SILO 3 soja UMD 12.50 IMP 0.6 AVR 6.5",
  "dados": {
    "silos": [
      {
        "identificador": "SILO 3",
        "numero": "3",
        "produto": "SOJA",
        "amostragem": {
          "umd": 12.50,
          "imp": 0.6,
          "avr": 6.5
        }
      }
    ]
  }
}
```

---

## Teste 3 — Atualizar produto

**Body (JSON):**
```json
{
  "tipo": "atualizar_produto",
  "cliente_nome": "Copacol (Universo): Nova Aurora - PR",
  "solicitante": "Francismar Rovani",
  "regiao": "PR",
  "descricao": "Silos 12 e 15 soja, restante milho 14%",
  "dados": {
    "silos": [
      { "numero": "12", "produto": "SOJA" },
      { "numero": "15", "produto": "SOJA" },
      { "identificador": "Demais silos", "produto": "MILHO", "umidade_percentual_max": 14 }
    ]
  }
}
```

---

## No Postman (passo a passo)

1. Abra **https://www.postman.com** ou app Postman
2. **New** → **HTTP Request**
3. Método: **POST**
4. URL: `https://requisicao-clientes-procer.onrender.com/api/requisicoes`
5. Aba **Headers:**
   - `Content-Type` → `application/json`
   - `X-API-Key` → `procer-api-key-2026`
6. Aba **Body** → **raw** → **JSON**
7. Cole um dos JSONs acima
8. **Send**
9. Abra o painel e confira se a tarefa apareceu

---

## Erros comuns

| Erro | Causa |
|------|-------|
| `401` | API Key errada ou faltando header X-API-Key |
| `400` | JSON incompleto (falta silo, nivel, umd, etc.) |
| Demora 30s | Render free "acordando" — normal na 1ª vez |
