import Phaser from 'phaser';

export default class Tile extends Phaser.GameObjects.Sprite {
    /**
     * Создает новый экземпляр Tile.
     *
     * @param {Phaser.Scene} scene - Сцена, в которую будет добавлена плитка.
     * @param {number} x - Координата x положения плитки.
     * @param {number} y - Координата y положения плитки.
     * @param {string} texture - Текстура для плитки.
     * @param {string|number} [frame] - Кадр из текстуры для плитки.
     * @param {number} row - Индекс строки, в которой расположена плитка в сетке.
     * @param {number} col - Индекс столбца, в котором расположена плитка в сетке.
     */
    constructor(scene, x, y, texture, frame, row, col) {
        super(scene, x, y, texture, frame);
        this.scene = scene;
        this.gridPosition = { row, col }; // Позиция плитки в сетке (строка, столбец)
        this.isBlocking = false; // Не блокирует перемещение
        this.isMovable = true; // Можно двигать
        this.canMatch = false; // Не участвует в совпадениях
        this.isDestructible = true; // Можно разрушать

        this.scene.add.existing(this);
    }
}
