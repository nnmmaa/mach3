import bg from '../assets/images/sky.png';
import diamonds from "../assets/images/diamonds.png";
import bomb from "../assets/images/bomb.png";
import bombJson from "../assets/images/bomb.json";
import coin from "../assets/images/coin.png";
import yellowButtonSml from "../assets/images/yellowButtonSml.png";
import explosionImage from '../assets/images/explosion.png';

import { GAME_CONFIG } from "../config.js";
import Grid from "../objects/Grid.js";

import titleOGG from '../assets/audio/title/title.ogg?url';
import titleM4A from '../assets/audio/title/title.m4a?url';

import match3OGG from '../assets/audio/match3/match3.ogg?url';
import match3M4A from '../assets/audio/match3/match3.m4a?url';

import whooshOGG from '../assets/audio/whoosh/whoosh.ogg?url';
import whooshM4A from '../assets/audio/whoosh/whoosh.m4a?url';

import { AudioManager } from "../managers/AudioManager.js";
import { DebugOverlay } from "../debug/DebugOverlay.js";
import MatchManager from "../managers/MatchManager.js";
import EffectsManager from "../managers/EffectsManager.js";
import BoardManager from "../managers/BoardManager.js";
import BoardController from "../controllers/BoardController.js";
import DragController from "../controllers/DragController.js";
import UIController from "../controllers/UIController.js";

/**
 * Класс GameScene отвечает за основную игровую логику сцены.
 */
export default class GameScene extends Phaser.Scene {
    /**
     * Конструктор сцены GameScene.
     */
    constructor() {
        super('GameScene');
        this.matchManager = null;
        this.audioManager = null;
        this.boardController = null;
        this.dragController = null;
        this.uiController = null;
        this.isProcessing = false;
        this.gridArray = [];
        this.score = 0;

        // Целевое значение счёта для завершения уровня
        this.targetScore = GAME_CONFIG.TARGET_SCORE;
    }

    /**
     * preload - Метод для предварительной загрузки всех необходимых ресурсов.
     */
    preload() {
        // Загрузка изображений
        this.load.image('bg', bg);
        this.load.image('coin', coin);
        this.load.image('yellowButtonSml', yellowButtonSml);
        this.load.spritesheet("diamonds", diamonds, {
            frameWidth: 32,
            frameHeight: 24,
        });
        this.load.spritesheet('explosion', explosionImage, {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.atlas('bomb', bomb, bombJson);

        // Инициализация менеджера звуков
        this.audioManager = new AudioManager(this);

        // Загрузка звуков
        this.audioManager.load('match3', match3OGG, match3M4A);
        this.audioManager.load('whoosh', whooshOGG, whooshM4A);
    }

    /**
     * create - Метод для создания и инициализации всех игровых объектов и компонентов.
     */
    create() {
        // Инициализация отладочной панели в dev-режиме
        if (process.env.NODE_ENV === 'development') {
            DebugOverlay.init(this);
        }

        // Создаем менеджеры
        this.matchManager = new MatchManager(this, this.gridArray, this.audioManager);
        this.effectsManager = new EffectsManager(this);

        this.effectsManager.createAnimations();

        this.boardManager = new BoardManager(this);

        // Контроллеры
        this.boardController = new BoardController(this);
        this.dragController = new DragController(this, this.boardController);
        this.uiController = new UIController(this);

        // Создаём начальные тайлы игрового поля
        this.boardController.createInitialTiles();

        // Настраиваем события перетаскивания
        this.dragController.setupDragEvents();

        // Создаём текст счёта (через UIController)
        this.uiController.createScoreText();

        // Настройка фона
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        const background = this.add.image(0, 0, 'bg').setOrigin(0.5, 0.5);
        const scaleX = screenWidth / background.width;
        const scaleY = screenHeight / background.height;
        const scale = Math.max(scaleX, scaleY);
        background.setScale(scale);
        background.setPosition(screenWidth / 2, screenHeight / 2);

        // Параметры сетки
        this.tileSize = GAME_CONFIG.TILE_SIZE;
        this.rows = GAME_CONFIG.ROWS;
        this.cols = GAME_CONFIG.COLS;
        this.gridX = (this.sys.game.config.width - this.cols * this.tileSize) / 2;
        this.gridY = GAME_CONFIG.START_Y;

        // Создание сетки (для отрисовки линий)
        this.grid = new Grid(this, {
            tileSize: this.tileSize,
            rows: this.rows,
            cols: this.cols,
            x: this.gridX,
            y: this.gridY,
            lineColor: GAME_CONFIG.GRID_LINE_COLOR,
            lineAlpha: GAME_CONFIG.GRID_LINE_ALPHA,
        });

        // Повторная инициализация тайлов, если нужно
        this.boardController.createInitialTiles();

        // Загрузка и подготовка фоновой музыки
        this.audioManager.load('title', titleOGG, titleM4A).then(() => {
            if (process.env.NODE_ENV === 'development') {
                console.log('Background music loaded, ready to play');
            }
        });

        // Запуск фоновой музыки при первом клике
        this.input.once('pointerdown', () => {
            this.sound.context.resume().then(() => {
                this.audioManager.play('title', { loop: true, volume: GAME_CONFIG.VOLUME.BACKGROUND_MUSIC });
            });
        });
    }

    /**
     * levelCompleted - Вызывается при достижении целевого счёта.
     * Очищает поле, затем создаёт новые тайлы, а также показывает оверлей и CTA.
     * Обнуляет счёт (score) и обновляет UI через UIController.
     */
    levelCompleted() {
        // Отключаем интерактивность всех тайлов
        this.gridArray.forEach(row => {
            row.forEach(tile => {
                if (tile) {
                    tile.disableInteractive();
                }
            });
        });

        // Сбрасываем счёт
        this.score = 0;
        // Обновляем отображение счёта
        this.uiController.updateScore(this.score);

        // Удаляем все кристаллы
        this.boardManager.removeAllCrystals(() => {
            // Спавним новые кристаллы
            this.boardManager.spawnNewCrystals(() => {
                // Показываем оверлей и кнопку CTA
                this.uiController.createOverlay();
                this.uiController.showCTA();
            });
        });
    }
}