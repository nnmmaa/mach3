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
        this.isProcessing = false;
        this.gridArray = [];
        this.grid = null;
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
        this.createTiles();

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
     * createTiles - Создаёт изначальный набор тайлов на игровом поле.
     */
    createTiles() {
        this.gridArray = [];


        for (let row = 0; row < this.rows; row++) {
            this.gridArray[row] = [];

            for (let col = 0; col < this.cols; col++) {
                const x = this.gridX + col * this.tileSize + this.tileSize / 2;
                const y = this.gridY + row * this.tileSize + this.tileSize / 2;

                const frame = this.getRandomFrame(row, col);

                const diamond = Diamond.createDiamond(this, x, y, frame, row, col, this.tileSize);
                this.gridArray[row][col] = diamond;

            }
        }

        // Инициализация MatchManager для обработки совпадений
        this.matchManager = new MatchManager(this, this.gridArray);
        if (this.matchManager.checkMatches()) {
            this.matchManager.handleMatches();
        }
    }

    /**
     * checkAndRemoveFrame - Вспомогательный метод для удаления неподходящего кадра из списка
     * с учётом уже расположенных тайлов, чтобы не образовывать совпадение сразу.
     * @param {number} row1 - Первая строка
     * @param {number} col1 - Первый столбец
     * @param {number} row2 - Вторая строка
     * @param {number} col2 - Второй столбец
     * @param {number[]} possibleFrames - Возможные кадры для тайла
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
     * @param {number} row - Строка тайла
     * @param {number} col - Столбец тайла
     * @returns {number} - Случайный кадр
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
                    this.swapTiles(gameObject, targetTile, true);
                } else {
                    this.resetTilePosition(gameObject);
                }
            } else {
                this.resetTilePosition(gameObject);
            }
        } else {
            this.resetTilePosition(gameObject);
        }
    }

    /**
     * swapTiles - Меняет местами два тайла и проверяет совпадения, если ход был игроком.
     * @param {Phaser.GameObjects.Sprite} tile1 - Первый тайл
     * @param {Phaser.GameObjects.Sprite} tile2 - Второй тайл
     * @param {boolean} isPlayerAction - Флаг, указывающий, был ли ход инициирован игроком
     */
    swapTiles(tile1, tile2, isPlayerAction) {
        this.isProcessing = true;

        if (!tile1.isMovable || !tile2.isMovable) {
            this.resetTilePosition(tile1);
            this.isProcessing = false;
            return;
        }

        const tempRow = tile1.gridPosition.row;
        const tempCol = tile1.gridPosition.col;

        this.gridArray[tile1.gridPosition.row][tile1.gridPosition.col] = tile2;
        this.gridArray[tile2.gridPosition.row][tile2.gridPosition.col] = tile1;

        tile1.gridPosition.row = tile2.gridPosition.row;
        tile1.gridPosition.col = tile2.gridPosition.col;
        tile2.gridPosition.row = tempRow;
        tile2.gridPosition.col = tempCol;

        const tileSize = this.tileSize;
        const gridX = this.gridX;
        const gridY = this.gridY;

        this.tweens.add({
            targets: [tile1, tile2],
            x: (target) => target.gridPosition.col * tileSize + gridX + tileSize / 2,
            y: (target) => target.gridPosition.row * tileSize + gridY + tileSize / 2,
            duration: 200,
            onComplete: () => {
                if (isPlayerAction) {
                    if (tile1 instanceof Bomb) {
                        tile1.explode();
                        this.isProcessing = false;
                    } else if (this.matchManager.checkMatches()) {
                        this.matchManager.handleMatches();
                    } else {
                        this.swapTiles(tile1, tile2, false);
                    }
                } else {
                    this.isProcessing = false;
                }
            },
        });
    }

    /**
     * resetTilePosition - Возвращает тайл на исходную позицию, если ход не был успешным.
     * @param {Phaser.GameObjects.Sprite} tile - Тайл, который нужно вернуть
     */
    resetTilePosition(tile) {
        this.tweens.add({
            targets: tile,
            x: tile.gridPosition.col * this.tileSize + this.gridX + this.tileSize / 2,
            y: tile.gridPosition.row * this.tileSize + this.gridY + this.tileSize / 2,
            duration: 200,
        });
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