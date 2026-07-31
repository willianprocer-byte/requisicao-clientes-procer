# Requisição Clientes Procer

Sistema para receber solicitações dos clientes via agente de IA (Omnichannel) e gerenciar como lista de tarefas.

## Como rodar

```bash
npm install
npm start
```

Acesse o painel em: **http://localhost:3000**

## Tipos de pedido (baseado nos clientes reais)

| Tipo | O que o cliente pede | Exemplo |
|------|---------------------|---------|
| `atualizar_nivel_silo` | Marcar silo cheio, vazio ou finalizando | "Silo pulmão 102 cheio favor atualizar" |
| `atualizar_amostragem` | Informar UMD, IMP, AVR da retirada do grão | "SILO 3 (SOJA) UMD=12.50 IMP=0.6 AVR=6.5" |
| `atualizar_produto` | Trocar produto/umidade no silo | "Silos 12 e 15 soja, restante milho 14% a baixo" |

## Integração com o Agente de IA (Convert)

Envie o arquivo **`docs/molde-requisicao.json`** para o Renan. Ele contém exemplos reais dos 3 casos acima.

### Endpoint

```
POST http://SEU_SERVIDOR:3000/api/requisicoes
Header: X-API-Key: procer-api-key-2026
Content-Type: application/json
```

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/requisicoes` | Listar requisições |
| POST | `/api/requisicoes` | Criar requisição (agente IA) |
| PATCH | `/api/requisicoes/:id` | Atualizar status |
| GET | `/api/molde` | Molde JSON completo |

## Configuração

```
PORT=3000
API_KEY=sua-chave-segura-aqui
```
