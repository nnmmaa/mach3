import bg from '../assets/images/sky.png';
import diamonds from "../assets/images/diamonds.png";
import { GAME_CONFIG } from "../config.js";
import Grid from "../objects/Grid.js";
import Diamond from "../objects/Diamond.js";

import titleOGG from '../assets/audio/title/title.ogg?url';
import titleM4A from '../assets/audio/title/title.m4a?url';
import {AudioManager} from "../managers/AudioManager.js";

import {DebugOverlay} from "../debug/DebugOverlay.js";

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.audioManager = null;
    }

    preload() {
        this.load.image('bg', bg);
        this.load.spritesheet("diamonds", diamonds, {
            frameWidth: 32,
            frameHeight: 24,
        });

        this.audioManager = new AudioManager(this);
    }

    create() {
        DebugOverlay.init(this);

        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        const background = this.add.image(0, 0, 'bg').setOrigin(0.5, 0.5);

        const scaleX = screenWidth / background.width;
        const scaleY = screenHeight / background.height;
        const scale = Math.max(scaleX, scaleY);

        background.setScale(scale);
        background.setPosition(screenWidth / 2, screenHeight / 2);

        this.tileSize = GAME_CONFIG.TILE_SIZE;
        this.rows = GAME_CONFIG.ROWS;
        this.cols = GAME_CONFIG.COLS;
        this.gridX = (this.sys.game.config.width - this.cols * this.tileSize) / 2;
        this.gridY = GAME_CONFIG.START_Y;

        // Создаем сетку
        this.grid = new Grid(this, {
            tileSize: this.tileSize,
            rows: this.rows,
            cols: this.cols,
            x: this.gridX,
            y: this.gridY,
            lineColor: GAME_CONFIG.GRID_LINE_COLOR,
            lineAlpha: GAME_CONFIG.GRID_LINE_ALPHA,
        });

        this.createTiles()

        // Отображение очков
        this.scoreText = this.add.text(10, 10, 'Счёт: 0', { fontSize: '20px', fill: '#fff' });

        this.audioManager.loadAndPlay('title', titleOGG, titleM4A, {
            loop: true,
            volume: 0.3,
        });
    }

    /**
     * createTiles - Создает изначальный набор тайлов на игровом поле.
     */
    createTiles() {
        this.gridArray = [];

        for (let row = 0; row < this.rows; row++) {
            this.gridArray[row] = [];
            for (let col = 0; col < this.cols; col++) {
                const x = this.gridX + col * this.tileSize + this.tileSize / 2;
                const y = this.gridY + row * this.tileSize + this.tileSize / 2;

                const frame = this.getRandomFrame(row, col);
                const diamond = new Diamond(this, x, y, frame, row, col);
                this.gridArray[row][col] = diamond;
            }
        }
    }

    /**
     * checkAndRemoveFrame - Вспомогательный метод для удаления неподходящего кадра из списка
     * учитывая уже расположенные тайлы, чтобы не образовывать совпадение сразу.
     */
    checkAndRemoveFrame(row1, col1, row2, col2, possibleFrames) {
        const tile1 = this.gridArray[row1][col1];
        const tile2 = this.gridArray[row2][col2];

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
     * getRandomFrame - Получает случайный кадр (тип кристалла) для тайла, избегая немедленных совпадений.
     */
    getRandomFrame(row, col) {
        const possibleFrames = [0, 1, 2, 3, 4];

        if (col >= 2) {
            this.checkAndRemoveFrame(row, col - 1, row, col - 2, possibleFrames);
        }

        if (row >= 2) {
            this.checkAndRemoveFrame(row - 1, col, row - 2, col, possibleFrames);
        }

        return Phaser.Utils.Array.GetRandom(possibleFrames);
    }
}