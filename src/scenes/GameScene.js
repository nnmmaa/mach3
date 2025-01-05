import bg from '../assets/images/sky.png';
import { GAME_CONFIG } from "../config.js";
import Grid from "../objects/Grid.js";

import titleOGG from '../assets/audio/title/title.ogg?url';
import titleM4A from '../assets/audio/title/title.m4a?url';
import {AudioManager} from "../managers/AudioManager.js";

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.audioManager = null;
    }

    preload() {
        this.load.image('bg', bg);

        this.audioManager = new AudioManager(this);
    }

    create() {
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

        // Отображение очков
        this.scoreText = this.add.text(10, 10, 'Счёт: 0', { fontSize: '20px', fill: '#fff' });

        this.audioManager.loadAndPlay('title', titleOGG, titleM4A, {
            loop: true,
            volume: 0.3,
        });
    }
}