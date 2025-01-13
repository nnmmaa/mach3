import bg from '../assets/images/sky.png';
import diamonds from "../assets/images/diamonds.png";
import bomb from "../assets/images/bomb.png";
import bombJson from "../assets/images/bomb.json";
import coin from "../assets/images/coin.png";
import yellowButtonSml from "../assets/images/yellowButtonSml.png";
import explosionImage from '../assets/images/explosion.png';

import {GAME_CONFIG} from "../config.js";
import Grid from "../objects/Grid.js";
import Diamond from "../objects/Diamond.js";

import titleOGG from '../assets/audio/title/title.ogg?url';
import titleM4A from '../assets/audio/title/title.m4a?url';

import match3OGG from '../assets/audio/match3/match3.ogg?url';
import match3M4A from '../assets/audio/match3/match3.m4a?url';

import whooshOGG from '../assets/audio/whoosh/whoosh.ogg?url';
import whooshM4A from '../assets/audio/whoosh/whoosh.m4a?url';

import {AudioManager} from "../managers/AudioManager.js";
import {DebugOverlay} from "../debug/DebugOverlay.js";
import Bomb from "../objects/Bomb.js";
import MatchManager from "../managers/MatchManager.js";
import EffectsManager from "../managers/EffectsManager.js";
import BoardManager from "../managers/BoardManager.js";
import {MraidManager} from "../managers/MraidManager.js";
import BoardController from "../controllers/BoardController.js"

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
        this.isProcessing = false;
        this.gridArray = [];
        this.score = 0;

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

        // Загрузка звуковых файлов
        this.audioManager.load('match3', match3OGG, match3M4A);
        this.audioManager.load('whoosh', whooshOGG, whooshM4A);
    }

    /**
     * create - Метод для создания и инициализации всех игровых объектов и компонентов.
     */
    create() {
        // Инициализация отладочной панели
        if (process.env.NODE_ENV === 'development') {
            DebugOverlay.init(this);
        }

        // Инициализация менеджеров
        this.matchManager = new MatchManager(this, this.gridArray, this.audioManager);
        this.effectsManager = new EffectsManager(this);
        this.boardManager = new BoardManager(this);
        this.boardController = new BoardController(this);

        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        // Настройка фона игры
        const background = this.add.image(0, 0, 'bg').setOrigin(0.5, 0.5);
        const scaleX = screenWidth / background.width;
        const scaleY = screenHeight / background.height;
        const scale = Math.max(scaleX, scaleY);
        background.setScale(scale);
        background.setPosition(screenWidth / 2, screenHeight / 2);

        // Инициализация параметров сетки
        this.tileSize = GAME_CONFIG.TILE_SIZE;
        this.rows = GAME_CONFIG.ROWS;
        this.cols = GAME_CONFIG.COLS;
        this.gridX = (this.sys.game.config.width - this.cols * this.tileSize) / 2;
        this.gridY = GAME_CONFIG.START_Y;

        // Создание сетки игрового поля
        this.grid = new Grid(this, {
            tileSize: this.tileSize,
            rows: this.rows,
            cols: this.cols,
            x: this.gridX,
            y: this.gridY,
            lineColor: GAME_CONFIG.GRID_LINE_COLOR,
            lineAlpha: GAME_CONFIG.GRID_LINE_ALPHA,
        });

        // Создание начального набора тайлов
        this.boardController.createInitialTiles();

        // Создание анимации взрыва
        this.anims.create({
            key: 'explode',
            frames: this.anims.generateFrameNumbers('explosion', {start: 0, end: 22}),
            frameRate: 60,
            repeat: 0,
        });

        // Настройка обработчиков перетаскивания тайлов
        this.input.on('dragstart', this.onDragStart, this);
        this.input.on('drag', this.onDrag, this);
        this.input.on('dragend', this.onDragEnd, this);

        // Отображение текущего счёта
        this.scoreText = this.add.text(10, 10, 'Счёт: 0', {fontSize: '20px', fill: '#fff'});

        // Загрузка и подготовка фоновой музыки
        this.audioManager.load('title', titleOGG, titleM4A).then(() => {
            if (process.env.NODE_ENV === 'development') {
                console.log('Background music loaded, ready to play');
            }
        });

        // Запуск фоновой музыки при первом клике
        this.input.once('pointerdown', () => {
            this.sound.context.resume().then(() => {
                this.audioManager.play('title', {loop: true, volume: 0.3});
            });
        });
    }


    /**
     * onDragStart - Обработчик начала перетаскивания тайла.
     * @param {Phaser.Input.Pointer} pointer - Указатель мыши или касания
     * @param {Phaser.GameObjects.Sprite} gameObject - Перетаскиваемый объект
     */
    onDragStart(pointer, gameObject) {
        if (this.isProcessing) return;
        if (!gameObject.isMovable || !gameObject.input.enabled) return;

        gameObject.startX = gameObject.x;
        gameObject.startY = gameObject.y;

        gameObject.setDisplaySize(
            gameObject.originalWidth * 1.3,
            gameObject.originalHeight * 1.3
        );
    }

    /**
     * onDrag - Обработчик процесса перетаскивания тайла.
     * Ограничивает перетаскивание на одну клетку в любом направлении.
     * @param {Phaser.Input.Pointer} pointer - Указатель мыши или касания
     * @param {Phaser.GameObjects.Sprite} gameObject - Перетаскиваемый объект
     * @param {number} dragX - Текущая координата X указателя
     * @param {number} dragY - Текущая координата Y указателя
     */
    onDrag(pointer, gameObject, dragX, dragY) {
        if (this.isProcessing) return;
        if (!gameObject.isMovable) return;

        const startX = gameObject.startX;
        const startY = gameObject.startY;
        const deltaX = dragX - startX;
        const deltaY = dragY - startY;
        const maxDelta = this.tileSize;

        // Ограничиваем перетаскивание только на одну клетку
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Горизонтально
            if (deltaX > 0) {
                gameObject.x = Math.min(startX + maxDelta, dragX);
            } else {
                gameObject.x = Math.max(startX - maxDelta, dragX);
            }
            gameObject.y = startY;
        } else {
            // Вертикально
            if (deltaY > 0) {
                gameObject.y = Math.min(startY + maxDelta, dragY);
            } else {
                gameObject.y = Math.max(startY - maxDelta, dragY);
            }
            gameObject.x = startX;
        }
    }

    /**
     * onDragEnd - Обработчик окончания перетаскивания тайла.
     * Определяет направление перемещения и инициирует обмен тайлов при необходимости.
     * @param {Phaser.Input.Pointer} pointer - Указатель мыши или касания
     * @param {Phaser.GameObjects.Sprite} gameObject - Перетаскиваемый объект
     */
    onDragEnd(pointer, gameObject) {
        if (this.isProcessing) return;

        if (gameObject instanceof Diamond) {
            // Возвращаемся к исходным размерам
            gameObject.setDisplaySize(
                gameObject.originalWidth,
                gameObject.originalHeight
            );
        }

        const deltaX = gameObject.x - gameObject.startX;
        const deltaY = gameObject.y - gameObject.startY;
        let direction = null;

        // Определяем направление сдвига
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > this.tileSize / 2) {
                direction = "right";
            } else if (deltaX < -this.tileSize / 2) {
                direction = "left";
            }
        } else {
            if (deltaY > this.tileSize / 2) {
                direction = "down";
            } else if (deltaY < -this.tileSize / 2) {
                direction = "up";
            }
        }

        if (direction) {
            const fromRow = gameObject.gridPosition.row;
            const fromCol = gameObject.gridPosition.col;
            let toRow = fromRow;
            let toCol = fromCol;

            // Определение целевых координат для обмена
            switch (direction) {
                case "up":
                    toRow -= 1;
                    break;
                case "down":
                    toRow += 1;
                    break;
                case "left":
                    toCol -= 1;
                    break;
                case "right":
                    toCol += 1;
                    break;
            }

            // Проверка границ сетки и наличия целевого тайла
            if (toRow >= 0 && toRow < this.rows && toCol >= 0 && toCol < this.cols) {
                const targetTile = this.gridArray[toRow][toCol];
                if (targetTile && targetTile.isMovable) {
                    this.boardController.swapTiles(gameObject, targetTile, true);
                } else {
                    this.boardController.resetTilePosition(gameObject);
                }
            } else {
                this.boardController.resetTilePosition(gameObject);
            }
        } else {
            this.boardController.resetTilePosition(gameObject);
        }
    }

    /**
     * levelCompleted - Метод вызывается при достижении целевого счета.
     * Очищает поле, затем спавнит новые кристаллы, затем затемняет экран и показывает CTA.
     */
    levelCompleted() {
        this.gridArray.forEach(row => {
            row.forEach(tile => {
                if (tile) {
                    tile.disableInteractive();
                }
            });
        });

        this.score = 0;
        this.scoreText.setText('Счет: 0')

        this.boardManager.removeAllCrystals(() => {
            this.boardManager.spawnNewCrystals(() => {
                this.createOverlay();
                this.showCTA();
            });
        });
    }

    /**
     * createOverlay - Создает полупрозрачный оверлей поверх игры.
     */
    createOverlay() {
        const overlay = this.add.rectangle(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2,
            this.sys.game.config.width,
            this.sys.game.config.height,
            0x000000,
            0.5
        ).setDepth(10);

        this.overlay = overlay;
    }

    /**
     * showCTA - Показывает кнопку призыва к действию для установки игры.
     * Кнопка открывает ссылку через MRAID или window.open в зависимости от доступности.
     */
    showCTA() {
        const buttonX = this.sys.game.config.width / GAME_CONFIG.SHOW_CTA.BUTTON_X;
        const buttonY = this.sys.game.config.height / GAME_CONFIG.SHOW_CTA.BUTTON_Y;

        // Создаем фон кнопки
        const buttonBg = this.add.image(
            buttonX,
            buttonY,
            'yellowButtonSml'
        ).setOrigin(0.5).setDepth(11);

        buttonBg.setDisplaySize(GAME_CONFIG.SHOW_CTA.WIDTH, GAME_CONFIG.SHOW_CTA.HEIGHT);

        // Добавляем текст кнопки
        const buttonText = this.add.text(buttonX, buttonY, GAME_CONFIG.SHOW_CTA.TEXT_BTN, {
            fontSize: GAME_CONFIG.SHOW_CTA.FONT_SIZE,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(11);

        // Делаем кнопку интерактивной
        buttonBg.setInteractive();

        buttonBg.on('pointerdown', () => {
            const url = typeof mraid !== "undefined"
                ? mraid.getParameter?.("clickURL") || "https://example.com/install"
                : "https://example.com/install";

            MraidManager.handleClick(url);
        });

        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(0xcccc00);
        });

        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(0xffff00);
        });
    }

}