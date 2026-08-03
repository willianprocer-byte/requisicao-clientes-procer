# Configuração das Ferramentas — Agente Convert (Renan)

## Dados comuns para as 3 ferramentas

| Campo | Valor |
|-------|-------|
| **Método** | POST |
| **URL** | `https://requisicao-clientes-procer.onrender.com/api/requisicoes` |
| **Header Content-Type** | `application/json` |
| **Header X-API-Key** | *(copiar do Render → Environment → API_KEY)* |
| **Painel de tarefas** | https://requisicao-clientes-procer.onrender.com |

> As 3 ferramentas usam a **mesma URL**. O que muda é o campo `tipo` no corpo JSON.

---

## Ferramenta 1: `atualizar_nivel_silo`

**Quando usar:** Cliente pede para marcar silo cheio, vazio ou finalizando.

**Exemplo de corpo JSON:**
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

**Nível aceito:** `cheio` | `vazio` | `finalizando` | `parcial`

---

## Ferramenta 2: `atualizar_amostragem`

**Quando usar:** Cliente informa UMD, IMP, AVR da retirada do grão.

**Exemplo de corpo JSON:**
```json
{
  "tipo": "atualizar_amostragem",
  "cliente_nome": "Ricardo Ramassotti - Vladimir Zancaner Basto",
  "descricao": "Atualização SILO 3 com amostragem. Silos 1 e 4 vazios, Silo 2 finalizando.",
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
    ],
    "outros_silos": [
      { "numero": "1", "nivel": "vazio" },
      { "numero": "4", "nivel": "vazio" },
      { "numero": "2", "nivel": "finalizando" }
    ]
  }
}
```

---

## Ferramenta 3: `atualizar_produto`

**Quando usar:** Cliente informa troca de produto (soja/milho) ou umidade nos silos.

**Exemplo de corpo JSON:**
```json
{
  "tipo": "atualizar_produto",
  "cliente_nome": "Copacol (Universo): Nova Aurora - PR",
  "solicitante": "Francismar Rovani",
  "regiao": "PR",
  "descricao": "Silos 12 e 15 ainda soja. Restante milho com umidade 14% a baixo.",
  "dados": {
    "silos": [
      { "numero": "12", "identificador": "Silo 12", "produto": "SOJA" },
      { "numero": "15", "identificador": "Silo 15", "produto": "SOJA" },
      { "identificador": "Demais silos", "produto": "MILHO", "umidade_percentual_max": 14 }
    ]
  }
}
```

---

## Regra importante — `cliente_nome`

Usar o **nome EXATO do contato** cadastrado no Omnichannel, igual ao sistema Procer.
A equipe identifica o cliente por esse nome no painel.

---

## Lógica do prompt (sugestão para Renan)

1. Identificar o tipo de pedido (nível / amostragem / produto)
2. Coletar silos e valores com o cliente
3. **Confirmar** os dados antes de enviar
4. Chamar a ferramenta correspondente
5. Informar ao cliente que a solicitação foi registrada

---

## Resposta de sucesso da API

Status `201` — requisição criada com status `pendente` no painel Procer.

## Resposta de erro

Status `400` — campos faltando. O agente deve pedir a informação ao cliente e tentar novamente.
