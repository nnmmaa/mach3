import Tile from './Tile.js';

/**
 * Класс Diamond представляет собой кристалл на игровом поле.
 * Наследуется от класса Tile и добавляет специфическую функциональность для кристаллов.
 */
export default class Diamond extends Tile {
    /**
     * Конструктор класса Diamond.
     *
     * @param {Phaser.Scene} scene - Сцена, к которой принадлежит кристалл.
     * @param {number} x - Координата X позиции кристалла.
     * @param {number} y - Координата Y позиции кристалла.
     * @param {string|number} frame - Кадр из текстуры "diamonds" для кристалла.
     * @param {number} row - Строка сетки, в которой находится кристалл.
     * @param {number} col - Столбец сетки, в котором находится кристалл.
     */
    constructor(scene, x, y, frame, row, col) {
        super(scene, x, y, 'diamonds', frame, row, col);
        
        this.isBlocking = false;

        this.isMovable = true;

        this.canMatch = true;

        this.setInteractive({ draggable: true });
    }

    /**
     * Статический метод для создания нового кристалла (Diamond).
     * Устанавливает размеры кристалла и сохраняет его оригинальные размеры.
     *
     * @param {Phaser.Scene} scene - Сцена, к которой будет добавлен кристалл.
     * @param {number} x - Координата X позиции кристалла.
     * @param {number} y - Координата Y позиции кристалла.
     * @param {string|number} frame - Кадр из текстуры "diamonds" для кристалла.
     * @param {number} row - Строка сетки, в которой будет расположен кристалл.
     * @param {number} col - Столбец сетки, в котором будет расположен кристалл.
     * @param {number} tileSize - Размер тайла для настройки отображения кристалла.
     * @returns {Diamond} Новый экземпляр кристалла.
     */
    static createDiamond(scene, x, y, frame, row, col, tileSize) {
        // Создание нового экземпляра Diamond
        const diamond = new Diamond(scene, x, y, frame, row, col);

        // Установка размеров кристалла относительно tileSize
        diamond.setDisplaySize(tileSize, tileSize * 0.7);

        // Сохранение оригинальных размеров для возможного масштабирования при взаимодействии
        diamond.originalWidth = diamond.displayWidth;
        diamond.originalHeight = diamond.displayHeight;

        return diamond;
    }
}