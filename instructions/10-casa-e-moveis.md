# 10 — Casa e Móveis

## Visão geral

A casa é o hub pessoal do jogador — o local sempre disponível, explorado como qualquer outro cômodo. Ela evolui com o personagem: começa simples (condizente com a origem familiar) e pode ser melhorada comprando móveis melhores ou mudando para uma casa mais espaçosa.

**O que é possível:**
- Explorar os cômodos da casa como em qualquer local
- Interagir com móveis (cada um tem `ActionDefinition`)
- Comprar e vender móveis via `FurnitureCatalog`
- Reposicionar móveis dentro do cômodo (modo de decoração)
- Comprar ou alugar uma casa melhor via `HousingMarket`

**O que não é possível (fora do escopo):**
- Construir paredes ou alterar a planta
- Criar novos cômodos
- Desenhar a casa do zero
- Expandir o terreno

## Estrutura de dados

```
HouseDefinition
└── RoomDefinition[] (cômodos fixos da casa)
    └── PlacedFurniture[] (móveis posicionados)

FurnitureCatalog
└── FurnitureDefinition[] (todos os móveis compráveis)

OwnedFurniture → móveis que o jogador possui mas não posicionou
PlacedFurniture → móveis posicionados com posição no grid

HomeSaveState → snapshot persistido em Dexie
HousingMarket → casas disponíveis para comprar/alugar
```

## HouseDefinition

```typescript
type HouseDefinition = {
  readonly id: string;
  readonly nome: string;                   // "Kitnet do bairro", "Apartamento médio"
  readonly classeSocialMinima: ClasseSocial;
  readonly preco: number | undefined;      // undefined = apenas aluguel
  readonly aluguelMensal: number;
  readonly comodosFixos: RoomDefinition[];
  readonly capacidadeMoveis: number;       // total de tiles disponíveis para móveis
  readonly availability: {
    readonly startYear: number;
    readonly endYear?: number;
  };
  readonly tags: string[];
  readonly descricao: string;
};
```

### Casas do MVP

| Casa | Cômodos | Classe inicial | Aluguel |
|---|---|---|---|
| Quarto de pensão | Quarto único | Baixa | R$ 150/mês |
| Kitnet simples | Quarto / Banheiro / Cozinha integrada | Baixa | R$ 350/mês |
| Apartamento simples | Quarto / Sala / Cozinha / Banheiro | Média baixa | R$ 600/mês |
| Apartamento médio | 2 quartos / Sala / Cozinha / Banheiro | Média | R$ 1.200/mês |
| Casa no bairro | 3 quartos / Sala / Cozinha / 2 banheiros / Quintal | Média alta | R$ 2.500/mês |

A casa inicial é determinada pelo `BirthProfile.condicaoHabitacional` e `BirthProfile.classeSocial`.

## FurnitureCatalog

Móveis são definidos em `content/furniture/` separados por era. Exemplos:

```json
{
  "id": "cama_solteiro_simples",
  "nome": "Cama de Solteiro Simples",
  "categoria": "cama",
  "assetId": "movel_cama_solteiro",
  "tamanhoGrid": { "largura": 2, "altura": 3 },
  "preco": 450,
  "valorDeRevenda": 200,
  "acoes": ["dormir", "descansar", "pensar_deitado"],
  "efeitos": { "energia": 2, "conforto": 1 },
  "availability": { "startYear": 1985 },
  "tags": ["basico", "sono"],
  "descricao": "Uma cama simples. Cumpre o papel."
}
```

```json
{
  "id": "videogame_mega_drive",
  "nome": "Videogame 16-bit",
  "categoria": "tecnologia",
  "assetId": "movel_videogame_megadrive",
  "tamanhoGrid": { "largura": 1, "altura": 1 },
  "preco": 800,
  "valorDeRevenda": 300,
  "acoes": ["jogar_videogame"],
  "efeitos": { "humor": 3 },
  "availability": { "startYear": 1990, "endYear": 2002 },
  "tags": ["entretenimento", "tecnologia_antiga"],
  "descricao": "Um clássico dos anos 90. Horas de diversão garantidas."
}
```

### Móveis por era (itens representativos)

**Anos 80 (1985–1989)**:
- Televisão CRT grande
- Rádio toca-discos
- Telefone fixo de disco
- Sofá retrô
- Geladeira com bordas arredondadas

**Anos 90 (1990–1999)**:
- Videogame 16-bit / 32-bit
- Televisão CRT com controle remoto
- Computador 486/Pentium
- Rádio relógio
- Telefone sem fio

**Anos 2000 (2000–2009)**:
- DVD player
- Computador com Windows XP
- Televisão de tela plana (inicial)
- Telefone celular (item de mesa decorativo)
- Mini-system

**Anos 2010+ (2010–)**:
- Smart TV
- Console moderno (PS3/PS4 era)
- Notebook
- Tablet como item de mesa
- Caixinha Bluetooth

## Sistema de Decoração (Furnishing Mode)

O jogador entra no modo de decoração ao selecionar "Decorar" no menu da casa. Neste modo:

- Um grid é sobreposto ao cômodo
- Móveis do inventário (`OwnedFurniture`) ficam disponíveis para posicionar
- Móveis posicionados podem ser movidos ou vendidos
- Clicar em "Comprar móvel" abre o `FurnitureCatalog` filtrado pela era atual

### Grid e placement

```typescript
const TILE_SIZE = 32; // pixels por tile

function calcularPosicaoNoGrid(posicaoMundo: Vec2): { gridX: number; gridY: number } {
  return {
    gridX: Math.floor(posicaoMundo.x / TILE_SIZE),
    gridY: Math.floor(posicaoMundo.y / TILE_SIZE),
  };
}

function validarPlacement(
  movel: FurnitureDefinition,
  gridX: number,
  gridY: number,
  comodo: ComodoDefinition,
  movelsPosicionados: PlacedFurniture[]
): boolean {
  // 1. todos os tiles do móvel estão dentro da navZona?
  const tilesDoMovel = calcularTilesOcupados(movel, gridX, gridY);
  if (!tilesDoMovel.every(t => estaNaTilesAndaveis(t, comodo))) return false;

  // 2. sem sobreposição com outros móveis?
  if (tilesDoMovel.some(t => colideComMovelExistente(t, movelsPosicionados))) return false;

  return true;
}
```

### Drag-and-drop

Implementado em PixiJS puro (não React overlay) para o drag em si:

```typescript
movelSprite.eventMode = 'static';
movelSprite.on('pointerdown', () => {
  estaArrastando = movelSprite;
  movelSprite.alpha = 0.7;
  gridOverlay.visible = true;
});

app.stage.on('pointermove', (e) => {
  if (!estaArrastando) return;
  const posLocal = mundoContainer.toLocal(e.global);
  const { gridX, gridY } = calcularPosicaoNoGrid(posLocal);
  estaArrastando.x = gridX * TILE_SIZE;
  estaArrastando.y = gridY * TILE_SIZE;

  const valido = validarPlacement(estaArrastando.definicao, gridX, gridY, comodoAtual, movelsPosicionados);
  estaArrastando.tint = valido ? 0xffffff : 0xff4444;
});

app.stage.on('pointerup', () => {
  if (!estaArrastando) return;
  if (validarPlacement(...)) {
    commitarPlacement(estaArrastando);
  } else {
    reverterPosicao(estaArrastando);
  }
  estaArrastando.alpha = 1;
  estaArrastando.tint = 0xffffff;
  gridOverlay.visible = false;
  estaArrastando = null;
});
```

## Interações com móveis

Cada móvel tem `ActionDefinition[]` que aparecem no ActionBubble ao clicar:

| Móvel | Ações disponíveis |
|---|---|
| Cama | Dormir (timeCost: noite, +Energia), Descansar (timeCost: periodo, +Energia parcial), Pensar deitado |
| Computador | Trabalhar em casa, Estudar online, Jogar online, Navegar |
| Sofá | Descansar, Assistir TV (se TV próxima), Conversar com NPC |
| Geladeira | Comer (restaura energia), Verificar o que tem |
| Espelho | Ver aparência, Praticar discurso (check Carisma) |
| Equipamento de treino | Treinar em casa (check Constituição, menor bônus que academia) |
| Estante/Livros | Ler (sem custo, +Inteligência leve, +Humor) |
| Televisão | Assistir TV (routine, +Humor leve, -Energia às vezes), Ver notícias |
| Videogame | Jogar (+Humor, -Energia, às vezes -Tempo) |
| Fogão | Cozinhar (check Constituição, refeição caseira mais barata) |

## Efeitos passivos dos móveis

Móveis posicionados podem ter bônus passivos que se aplicam automaticamente:

```typescript
function calcularBonusPassivoDaCasa(
  movelsPosicionados: PlacedFurniture[],
  catalogo: FurnitureDefinition[]
): BonusCasa {
  return movelsPosicionados.reduce((acc, movelPos) => {
    const def = catalogo.find(m => m.id === movelPos.furnitureId);
    if (!def?.efeitos) return acc;
    return {
      conforto: acc.conforto + (def.efeitos.conforto ?? 0),
      humor: acc.humor + (def.efeitos.humor ?? 0),
      energia: acc.energia + (def.efeitos.energia ?? 0),
      statusSocial: acc.statusSocial + (def.efeitos.statusSocial ?? 0),
    };
  }, { conforto: 0, humor: 0, energia: 0, statusSocial: 0 });
}
```

O bônus de `conforto` afeta a regeneração de energia ao dormir. O bônus de `statusSocial` pode modificar eventos de visita de NPCs.

## HousingMarket

Casas disponíveis para comprar ou alugar, filtradas por `YearContext` e `ClasseSocial` atual:

```typescript
type HousingMarket = {
  listarDisponiveis(estadoJogo: GameState): HouseDefinition[];
  comprar(houseId: string, estadoJogo: GameState): ResultadoCompra;
  alugar(houseId: string, estadoJogo: GameState): ResultadoAluguel;
  venderAtual(estadoJogo: GameState): ResultadoVenda;
};
```

Ao mudar de casa:
1. Móveis posicionados vão para `OwnedFurniture` (inventário)
2. Player escolhe quais móveis leva (movimentação de caminhão tem custo)
3. Nova casa tem seus cômodos vazios (apenas móveis que vieram junto)
4. `HomeSaveState` atualizado com nova `houseId` e novos `movelPosicionados`

## HomeSaveState — persistência

```typescript
// tabela Dexie: home_save (1 registro por save)
await db.homeSave.put({
  saveId: salvoAtual.id,
  houseId: casaAtual.id,
  movelComprados: [...],
  movelPosicionados: [...],
  valorEstimadoImovel: calcularValorImovel(casaAtual, movelPosicionados),
  aluguelMensal: casaAtual.aluguelMensal,
});
```

O aluguel é descontado automaticamente no início de cada mês jogado. Se o jogador não tiver dinheiro, eventos de inadimplência são disparados.

## Evolução planejada (Fase 2+)

- Visitas de NPCs à casa (eventos domésticos)
- Encontros românticos em casa
- Festas que afetam relacionamentos
- Móveis raros ou herdados (eventos de herança)
- Efeitos de qualidade da casa em relacionamentos ("minha casa é pequena demais para ela")
- Casas com histórias (assombrada, vizinho problemático, localização especial)
