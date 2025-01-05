import Tile from './Tile.js';

export default class Diamond extends Tile {
    /**
     * Создает новый экземпляр кристалла (Diamond).
     *
     * @param {Phaser.Scene} scene - Сцена, к которой будет добавлен кристалл.
     * @param {number} x - Координата x положения кристалла.
     * @param {number} y - Координата y положения кристалла.
     * @param {string|number} frame - Кадр из текстуры "diamonds" для кристалла.
     * @param {number} row - Индекс строки, в которой расположен кристалл.
     * @param {number} col - Индекс столбца, в котором расположен кристалл.
     */
    constructor(scene, x, y, frame, row, col){
        super(scene, x, y, 'diamonds', frame, row, col);
        
        this.isBlocking = false;
        this.isMovable = true;
        this.canMatch = true;

        this.setInteractive({ draggable: true });
    }
}