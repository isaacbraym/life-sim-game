# 08 — Locais e Cômodos

## Visão geral

O mundo do jogo é composto por **locais** (academia, escola, restaurante) que contêm **cômodos** (sala de musculação, sala de aula, salão). O jogador escolhe um local no `WorldMapScreen` e entra em seu cômodo de entrada. Dentro do cômodo, explora, interage com objetos e NPCs, e sai quando quiser.

Locais e cômodos são **declarativos e modulares** — adicionados via JSON sem reescrever o core do jogo.

## Hierarquia

```
WorldMapScreen
└── LocationDefinition
    └── ComodoDefinition (1..N cômodos por local)
        ├── InteractableObject[] (objetos e slots de NPC)
        ├── NavZona[] (áreas andáveis)
        └── PontoDeSaida[] (transições para outros cômodos ou para o mapa)
```

## WorldMapScreen

Tela de seleção de locais com ícones clicáveis. Não é um mundo aberto contínuo — é um seletor modular de destinos.

Locais visíveis são filtrados em runtime por:
1. `LifePhase` atual do personagem
2. `requisitos` da `LocationDefinition` (predicados: dinheiro, flags, atributos)
3. `disponibilidadeEra` (certos locais só existem em certas épocas)

O save guarda `currentLocationId` e `currentRoomId` para restaurar o contexto após fechar o jogo.

## Locais do MVP

### Casa
**Cômodos**: Quarto / Sala / Cozinha / Banheiro
**Fase mínima**: Bebe (sempre disponível)
**Especial**: hub pessoal do jogador. Ver `10-casa-e-moveis.md`.

### Escola
**Cômodos**: Sala de Aula / Corredor / Pátio
**Fase mínima**: Criança (6+ anos)
**Fase máxima**: Adolescente (até 17 anos)
**NPCs presentes**: colegas de classe, professores, diretor
**Ações principais**: estudar, interagir com colegas, provocar/ser provocado, participar de atividades

### Parque
**Cômodos**: Área de Lazer / Quadra Esportiva
**Fase mínima**: Criança
**NPCs presentes**: crianças do bairro, adultos, namorado/a se tiver
**Ações principais**: brincar, correr, jogar bola, encontrar pessoas

### Academia
**Cômodos**: Área de Musculação / Esteiras / Recepção
**Fase mínima**: Adolescente
**Custo por visita**: sim (mensalidade descontada mensalmente)
**NPCs presentes**: personal trainer, frequentadores regulares
**Ações principais**: treinar aparelhos, esteiras, interagir com personal, paquerar

### Restaurante
**Cômodos**: Salão / Balcão
**Fase mínima**: Adolescente
**Custo por visita**: sim (preço da refeição)
**NPCs presentes**: garçom, frequentadores, possível namorado/a
**Ações principais**: comer, conversar, paquerar, fazer proposta

### Shopping
**Cômodos**: Praça de Alimentação / Área de Lojas
**Fase mínima**: Adolescente
**Ações principais**: comprar roupa, comer, encontrar pessoas, gastar dinheiro

### Trabalho
**Cômodos**: Escritório / Sala de Reunião / Corredor
**Fase mínima**: Jovem Adulto
**NPCs presentes**: chefe, colegas de trabalho
**Ações principais**: trabalhar, networking, confrontar chefe, pedir aumento

### Bar
**Cômodos**: Balcão / Mesas
**Fase mínima**: Jovem Adulto (18+)
**Content tag**: `substance` (pode ser bloqueado nas configurações)
**Ações principais**: beber, paquerar, brigar, jogos de azar

### Hospital
**Cômodos**: Recepção / Consultório
**Fase mínima**: qualquer (evento de saúde)
**NPCs presentes**: médico, enfermeiro
**Ações principais**: consultar médico, fazer exames

### Banco
**Cômodos**: Atendimento / Caixa eletrônico
**Fase mínima**: Jovem Adulto
**Ações principais**: sacar dinheiro, fazer empréstimo, verificar saldo

## ComodoDefinition — spec completa

Cada arquivo em `content/locations/{local}/{comodo}.json`:

```json
{
  "id": "academia_musculacao",
  "localId": "academia",
  "nome": "Área de Musculação",
  "backgroundAsset": "bg_academia_musculacao",
  "tamanho": { "largura": 960, "altura": 540 },
  "navZonas": [
    {
      "id": "zona_principal",
      "poligono": [
        { "x": 80, "y": 300 }, { "x": 880, "y": 300 },
        { "x": 880, "y": 480 }, { "x": 80, "y": 480 }
      ]
    }
  ],
  "pontosDeSaida": [
    {
      "id": "saida_recepcao",
      "posicao": { "x": 50, "y": 390 },
      "destino": { "tipo": "comodo", "comodoId": "academia_recepcao" },
      "rotulo": "Recepção"
    },
    {
      "id": "saida_mapa",
      "posicao": { "x": 50, "y": 420 },
      "destino": { "tipo": "mapa" },
      "rotulo": "Sair da academia"
    }
  ],
  "objetos": [
    {
      "id": "supino",
      "tipo": "aparelho_musculacao",
      "posicao": { "x": 300, "y": 340 },
      "tamanho": { "largura": 120, "altura": 80 },
      "posicaoDeInteracao": { "x": 360, "y": 400 },
      "orientacaoAoInteragir": "PERFIL_DIREITO",
      "assetId": "aparelho_supino",
      "acoes": ["treinar_peito", "descansar_no_banco"],
      "disponibilidadeEra": { "startYear": 1985 }
    },
    {
      "id": "slot_personal",
      "tipo": "npc_slot",
      "posicao": { "x": 500, "y": 360 },
      "tamanho": { "largura": 60, "altura": 120 },
      "posicaoDeInteracao": { "x": 570, "y": 410 },
      "assetId": "placeholder_npc",
      "acoes": [],
      "npcSlot": "personal_trainer"
    }
  ],
  "npcsElegiveis": [
    {
      "papel": "personal_trainer",
      "slot": "slot_personal",
      "persistencia": "recorrente"
    }
  ],
  "ambientTags": ["fisico", "saude"],
  "eraStyle": "nineties"
}
```

## Pipeline de geração de cômodo via IA

Ver `05-pipeline-ia-conteudo.md` para detalhes. Resumo:

1. Autor descreve o cômodo em PT-BR (arquétipo, era, objetos esperados)
2. CLI `generate-room` chama Claude com `ComodoDefinition` schema + few-shots validados
3. Claude gera grid ASCII + JSON estruturado
4. Pipeline valida via Zod
5. Room Validator renderiza o cômodo visualmente
6. Autor valida, ajusta posições e navzonas
7. Aprovação salva em `content/locations/`

## Evolução de locais por era

Locais mudam visualmente conforme o ano do personagem. Isso é controlado por `eraStyle` no cômodo e `disponibilidadeEra` nos objetos:

- Aparelho de fax na recepção da academia → `endYear: 2005`
- Computador com Windows 95 no escritório → `startYear: 1995, endYear: 2003`
- Smartphone em qualquer local → `startYear: 2008`
- Academia com equipamentos modernos → `startYear: 2000` (versão "vintage" tem `endYear: 1999`)

O `EraResolver` filtra automaticamente quais objetos aparecem no cômodo dado o `YearContext` atual.

## Transições entre cômodos

Transição é um fade simples (fade out → load novo cômodo → fade in):

```typescript
async function transitarParaComodo(comodoId: string): Promise<void> {
  useGameStore.setState({ interactionLock: true });
  await gsap.to(overlayFade, { alpha: 1, duration: 0.3 }).then();
  await carregarComodo(comodoId);
  await gsap.to(overlayFade, { alpha: 0, duration: 0.3 }).then();
  useGameStore.setState({ interactionLock: false });
}
```

## Placeholders para MVP

No MVP, todos os assets de background e objetos são **placeholders gerados via código**:
- Background: retângulo colorido com label do cômodo
- Objetos: retângulos coloridos com label do tipo
- NPCs: silhueta simplificada com nome acima

Isso permite validar **toda a mecânica** antes de investir em arte. A substituição por sprites reais não requer mudança de código — apenas trocar o `assetId` por uma referência a sprite real.

## NavZona e áreas andáveis

No MVP, a navZona é um polígono simples (geralmente um retângulo) definindo a área onde o personagem pode caminhar. Verificação de clique:

```typescript
function estaNaAreaAndavel(ponto: Vec2, zonas: NavZona[]): boolean {
  return zonas.some(zona => pontoEstaDentroDePoligono(ponto, zona.poligono));
}
```

Clique fora de navZona → ignorado (personagem não se move).

## Estado salvo de localização

```typescript
// no saveStore
currentLocationId: string | undefined;
currentRoomId: string | undefined;
lastVisitedLocationId: string | undefined;
estadoNpcsNoLocal: Record<string, NpcLocalState>; // posição/estado de NPCs no local atual
```
