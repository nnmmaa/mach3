import Diamond from "../objects/Diamond.js";
import Bomb from "../objects/Bomb.js";

/**
 * Класс BoardController отвечает за создание, обмен и
 * прочие операции с тайлами (кристаллами/бомбами) на поле.
 */
export default class BoardController {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * createInitialTiles - Создает начальный набор тайлов при старте или перезапуске уровня.
     */
    createInitialTiles() {
        this.scene.gridArray = [];

        for (let row = 0; row < this.scene.rows; row++) {
            this.scene.gridArray[row] = [];
            for (let col = 0; col < this.scene.cols; col++) {
                const x = this.scene.gridX + col * this.scene.tileSize + this.scene.tileSize / 2;
                const y = this.scene.gridY + row * this.scene.tileSize + this.scene.tileSize / 2;

                const frame = this.getRandomFrame(row, col);

                // Создаём кристалл
                const diamond = Diamond.createDiamond(
                    this.scene,
                    x,
                    y,
                    frame,
                    row,
                    col,
                    this.scene.tileSize
                );

                this.scene.gridArray[row][col] = diamond;
            }
        }

        // Проверяем совпадения, если нужно
        if (this.scene.matchManager) {
            if (this.scene.matchManager.checkMatches()) {
                this.scene.matchManager.handleMatches();
            }
        }
    }

    /**
     * getRandomFrame - Получает случайный кадр (тип кристалла),
     * избегая немедленных совпадений по горизонтали и вертикали.
     * @param {number} row - Индекс строки
     * @param {number} col - Индекс столбца
     * @returns {number} - Номер кадра кристалла
     */
    getRandomFrame(row, col) {
        const possibleFrames = [0, 1, 2, 3, 4];

        // Проверяем горизонтальные совпадения
        if (col >= 2) {
            this.checkAndRemoveFrame(row, col - 1, row, col - 2, possibleFrames);
        }

        // Проверяем вертикальные совпадения
        if (row >= 2) {
            this.checkAndRemoveFrame(row - 1, col, row - 2, col, possibleFrames);
        }

        return Phaser.Utils.Array.GetRandom(possibleFrames);
    }

    /**
     * checkAndRemoveFrame - Удаляет кадр из possibleFrames,
     * если два тайла по соседству совпадают и могут образовать матч.
     * @param {number} row1 - Строка первого тайла
     * @param {number} col1 - Столбец первого тайла
     * @param {number} row2 - Строка второго тайла
     * @param {number} col2 - Столбец второго тайла
     * @param {number[]} possibleFrames - Массив номеров кадров
     */
    checkAndRemoveFrame(row1, col1, row2, col2, possibleFrames) {
        const tile1 = this.scene.gridArray[row1][col1];
        const tile2 = this.scene.gridArray[row2][col2];

        if (
            tile1 &&
            tile2 &&
            tile1.canMatch &&
            tile2.canMatch &&
            tile1.frame.name === tile2.frame.name
        ) {
            const frameToAvoid = tile1.frame.name;
            const index = possibleFrames.indexOf(parseInt(frameToAvoid));
            if (index > -1) {
                possibleFrames.splice(index, 1);
            }
        }
    }

    /**
     * swapTiles - Меняет местами два тайла и проверяет совпадения, если ход был игроком.
     * @param {Phaser.GameObjects.Sprite} tile1 - Первый тайл (кристалл/бомба)
     * @param {Phaser.GameObjects.Sprite} tile2 - Второй тайл
     * @param {boolean} isPlayerAction - флаг, инициировал ли ход игрок
     */
    swapTiles(tile1, tile2, isPlayerAction) {
        this.scene.isProcessing = true;

        if (!tile1.isMovable || !tile2.isMovable) {
            this.resetTilePosition(tile1);
            this.scene.isProcessing = false;
            return;
        }

        // Сохраняем исходные координаты
        const tempRow = tile1.gridPosition.row;
        const tempCol = tile1.gridPosition.col;

        // Обновляем сетку
        this.scene.gridArray[tile1.gridPosition.row][tile1.gridPosition.col] = tile2;
        this.scene.gridArray[tile2.gridPosition.row][tile2.gridPosition.col] = tile1;

        // Меняем row/col у тайлов
        tile1.gridPosition.row = tile2.gridPosition.row;
        tile1.gridPosition.col = tile2.gridPosition.col;
        tile2.gridPosition.row = tempRow;
        tile2.gridPosition.col = tempCol;

        // Анимация
        const tileSize = this.scene.tileSize;
        const gridX = this.scene.gridX;
        const gridY = this.scene.gridY;

        this.scene.tweens.add({
            targets: [tile1, tile2],
            x: (target) => target.gridPosition.col * tileSize + gridX + tileSize / 2,
            y: (target) => target.gridPosition.row * tileSize + gridY + tileSize / 2,
            duration: 200,
            onComplete: () => {
                if (isPlayerAction) {
                    // Проверяем, не бомба ли это
                    if (tile1 instanceof Bomb) {
                        tile1.explode();
                        this.scene.isProcessing = false;
                    }
                    // Иначе проверяем совпадения
                    else if (this.scene.matchManager.checkMatches()) {
                        this.scene.matchManager.handleMatches();
                    } else {
                        // Если совпадений нет, откатываем обмен
                        this.swapTiles(tile1, tile2, false);
                    }
                } else {
                    this.scene.isProcessing = false;
                }
            },
        });
    }

    /**
     * resetTilePosition - Возвращает тайл на исходную позицию,
     * если ход неудачный или откат после неудачных совпадений.
     * @param {Phaser.GameObjects.Sprite} tile - Тайл, который вернуть
     */
    resetTilePosition(tile) {
        const tileSize = this.scene.tileSize;
        const gridX = this.scene.gridX;
        const gridY = this.scene.gridY;

        this.scene.tweens.add({
            targets: tile,
            x: tile.gridPosition.col * tileSize + gridX + tileSize / 2,
            y: tile.gridPosition.row * tileSize + gridY + tileSize / 2,
            duration: 200,
        });
    }
}