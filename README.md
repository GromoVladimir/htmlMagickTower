# Magic Tower

Magic Tower остаётся браузерной игрой без сборщика и внешних зависимостей. `index.html`
можно открывать двойным кликом: все исходники подключаются обычными синхронными
`<script src="...">`, без ES-модулей и `fetch`.

## Пространство имён

Первым всегда загружается `js/namespace.js`. Это единственный файл, создающий глобальное
имя `window.MagicTower` (оно же `globalThis.MagicTower`). Остальные файлы используют его
секции:

- `MagicTower.data` — рекурсивно замороженные определения контента;
- `MagicTower.behaviors` — категорийные карты обработчиков;
- `MagicTower.systems` — игровые системы, работающие через `GameContext`;
- `MagicTower.ui` — ввод, renderer, HUD и overlay;
- `MagicTower.runtime` — изменяемые сервисы и состояние текущего запуска.

Единый индекс с поисковыми функциями доступен как `MagicTower.data.catalog`;
`MagicTower.runtime.catalog` остаётся ссылкой на тот же объект для совместимости.

После bootstrap доступен небольшой runtime-фасад для отладки из консоли:

```js
MagicTower.runtime.game.newGame();
MagicTower.runtime.game.startFloor(5);
MagicTower.runtime.game.dispatchKey("ArrowRight");
MagicTower.runtime.game.getState();
```

Раздел регистрируется целиком и ровно один раз:

```js
(function registerSpells(global) {
  'use strict';

  global.MagicTower.registerData('spells', {
    SPELLS: {
      fireball: { id: 'fireball', behaviorId: 'fireball', name: 'Огненный шар' },
    },
  });
})(globalThis);
```

Доступные регистраторы имеют одинаковую двухаргументную форму:

```text
registerData(category, value)       // value рекурсивно замораживается
registerBehavior(category, value)
registerSystem(name, value)
registerUi(name, value)
registerRuntime(name, value)
```

Общий контракт сложного обработчика: `handler(context, entity, params)`. Простые
`onAcquire`/`passives` остаются данными; artifact hooks объявляются в определении
артефакта через `phase`/`behaviorId`/`priority`. `js/behaviors/artifact-hooks.js`
индексирует эти объявления и выполняет только hooks активных runtime-артефактов.

Повтор имени, пустое имя и значение `undefined` считаются ошибкой загрузки. Это позволяет
увидеть конфликт сразу, а не получить тихо перезаписанный каталог. Объекты behavior,
system, UI и runtime не замораживаются глубоко: изменяемое состояние допустимо только за
границей `MagicTower.data`.

## Порядок classic scripts

Скрипты в `index.html` располагаются по зависимостям и исполняются сверху вниз:

1. `js/namespace.js`;
2. категорийные файлы `js/data/*` (настройки/палитра, заклинания, трейты, артефакты,
   враги, боссы, этажи/мир и события);
3. общие эффекты, затем installers из `js/systems/*` и `js/ui/*`, которые также
   регистрируют spell/enemy/boss/event behavior maps;
4. `js/data/catalog.js`, который строит индексы и проверяет все ссылки на handlers;
5. `js/core/context.js`, создающий изолированный `GameContext`;
6. корневой `game.js` — всегда последним: DOM/Canvas, сборка систем и render loop.

Файл может обращаться только к категориям, зарегистрированным выше него. В classic
scripts нельзя использовать `import`, `export` или асинхронную загрузку определений.

## Как расширять игру

- Новый враг добавляется в исходный каталог врагов с уникальным `id`. Особое поведение
  добавляется в карту enemy behaviors, а определение хранит только его `behaviorId`.
- Новый артефакт добавляется в каталог артефактов. Одноразовый эффект задаётся через
  `onAcquire`, пересчитываемые бонусы — через `passives`, сложные фазы — через hook ID.
- Новое заклинание получает определение в каталоге заклинаний и handler в spell behavior
  map. Эволюции ссылаются на существующие ID.
- Новое событие получает определение в каталоге событий и handler ID в карте event
  behaviors. Ссылки между каталогами проверяет validator.

### Основные схемы

```js
// Трейт: одноразовые изменения при старте забега.
{ id, name, type, element?, description, onAcquire: EffectDescriptor[] }

// Артефакт: неизменяемое определение; owned runtime хранит только definitionId/state.
{ id, name, rarity, tier?, cursed, bonusText, curseText?, onAcquire: [], passives: [], hooks?: [] }

// Враг/босс: числовые параметры остаются данными, особая логика выбирается по ID.
{ id, behaviorId?, name, glyph, color, hp, damage, speed, range, ...abilityParams }

// Комната-событие или секретная награда.
{ id, behaviorId, name? | title?, description? | effect? }
```

Одноразовый эффект имеет вид `{ type, ...params }`: используются `property`,
`changeMaxHp`, `changeMaxMana` и `capAt`. Для `property` обязательны `target`,
`operation: "add" | "max" | "set"` и `value`. Пассив использует те же операции и
может иметь условие `hasElementSpell`/`hasElementEvolution`.

Сложная механика артефакта объявляется так:

```js
hooks: [
  { phase: "afterDamageTaken", behaviorId: "damageShield", priority: 100 },
]
```

Допустимые фазы и их общий порядок: `spellCost`, `beforeSpellCast`,
`afterSpellCast`, `afterSpellResolved`, `enemyDefeated`, `beforeDamageTaken`,
`afterDamageTaken`, `beforePlayerDefeat`. Внутри фазы меньший `priority`
выполняется раньше; при равенстве сохраняется порядок объявлений каталога.

Определения являются шаблонами и никогда не меняются во время игры. Runtime-сущность
хранит `definitionId`, а собственные HP, статусы, кулдауны, массивы и множества создаёт
заново для каждого экземпляра.

Обычные комнаты не являются записями каталога: `js/systems/world.js` генерирует их
процедурно по `FLOOR_RULES`. Комнаты-события находятся в `js/data/events.js`. Книги,
сундуки, алтари и ловушки описаны как `WORLD_OBJECT_TYPES`, а не как инвентарь.

## Проверки

Нужен только Node.js с поддержкой встроенного `node:test`:

```powershell
npm.cmd test
npm.cmd run check
```

В оболочках без PowerShell execution-policy ограничения можно использовать обычные
`npm test` и `npm run check`. Эквивалент без npm: `node --test`.

Тестовый helper `tests/helpers/classic-script-loader.mjs` загружает browser classic scripts
через `node:vm` в том же порядке, что и `index.html`. DOM/canvas-заглушки можно передать в
`createClassicContext`, не добавляя test-зависимостей в проект.

Автотесты фиксируют число и порядок RNG-вызовов golden-снимками всех 15 этажей,
проверяют их генерацию и наполнение, секретную
комнату, 9 базовых заклинаний и 18 эволюций, все варианты комнат-событий и секретных
наград, особых врагов и трёх боссов, выбор реликвии, артефактные эффекты и автономную
classic-script загрузку. Финальный browser smoke — открыть `index.html` двойным кликом
и проверить: старт, движение, взаимодействие с объектом, применение и улучшение
заклинания, переход между этажами, выбор boss-реликвии, поражение и новый забег.
