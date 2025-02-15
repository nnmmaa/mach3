import { GAME_CONFIG } from '../config.js';

/**
 * Класс, представляющий сетку в сцене.
 * Этот класс создает сетку с заданным количеством строк, столбцов и размером ячеек,
 * что позволяет визуализировать и взаимодействовать с ней в определенной сцене.
 */
export default class Grid {

    constructor(scene, options) {
        this.scene = scene;

        // Параметры приоритетно берутся из options, если их нет - берем из конфига
        this.tileSize = options.tileSize || GAME_CONFIG.TILE_SIZE;
        this.rows = options.rows || GAME_CONFIG.ROWS;
        this.cols = options.cols || GAME_CONFIG.COLS;
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.lineColor = options.lineColor || GAME_CONFIG.GRID_LINE_COLOR;
        this.lineAlpha = options.lineAlpha || GAME_CONFIG.GRID_LINE_ALPHA;

        this.createGrid();
    }

    /**
     * Создает сетку линий на основе количества столбцов и строк,
     * размера каждой ячейки и начальной позиции.
     * Сетка рисуется с использованием указанного цвета и прозрачности линий.
     *
     * @return {void} Этот метод не возвращает значения.
     */
    createGrid() {
        const gridWidth = this.cols * this.tileSize;
        const gridHeight = this.rows * this.tileSize;

        const graphics = this.scene.add.graphics();
        graphics.lineStyle(1, this.lineColor, this.lineAlpha);

        for (let i = 0; i <= this.cols; i++) {
            const x = this.x + i * this.tileSize;
            graphics.moveTo(x, this.y);
            graphics.lineTo(x, this.y + gridHeight);
        }

        for (let j = 0; j <= this.rows; j++) {
            const y = this.y + j * this.tileSize;
            graphics.moveTo(this.x, y);
            graphics.lineTo(this.x + gridWidth, y);
        }

        graphics.strokePath();
    }
}