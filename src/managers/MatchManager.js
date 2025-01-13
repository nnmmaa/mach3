// MatchManager.js
import Diamond from '../objects/Diamond.js';
import Bomb from '../objects/Bomb.js';

export default class MatchManager {
    constructor(scene) {
        this.scene = scene; // Ссылка на сцену
        this.matches = [];  // Массив найденных совпадений
    }

    // Метод проверки наличия совпадений на поле
    checkMatches() {
        this.matches = [];

        // Проверка совпадений в обоих направлениях
        this.checkDirection('horizontal');
        this.checkDirection('vertical');

        return this.matches.length > 0;
    }

    checkDirection(direction) {
        const isHorizontal = direction === 'horizontal';
        const outerLimit = isHorizontal ? this.scene.rows : this.scene.cols;
        const innerLimit = isHorizontal ? this.scene.cols : this.scene.rows;

        for (let outer = 0; outer < outerLimit; outer++) {
            let matchLength = 1;
            let matchColor = null;
            let matchStartInner = 0;

            for (let inner = 0; inner < innerLimit; inner++) {
                let row = isHorizontal ? outer : inner;
                let col = isHorizontal ? inner : outer;

                let currentTile = this.scene.gridArray[row][col];
                let nextTile = null;
                if (inner < innerLimit - 1) {
                    let nextRow = isHorizontal ? row : inner + 1;
                    let nextCol = isHorizontal ? inner + 1 : col;
                    nextTile = this.scene.gridArray[nextRow][nextCol];
                }

                if (!currentTile || !currentTile.canMatch) {
                    matchLength = 1;
                    matchColor = null;
                    continue;
                }

                // Инициализируем начало потенциального совпадения
                if (matchLength === 1) {
                    matchStartInner = inner;
                }

                let checkMatch = false;

                if (!nextTile || !nextTile.canMatch) {
                    checkMatch = true;
                } else {
                    const currentFrame = currentTile.frame.name;
                    const nextFrame = nextTile.frame.name;
                    if (currentFrame === nextFrame) {
                        matchLength++;
                        matchColor = currentFrame;
                    } else {
                        checkMatch = true;
                    }
                }

                if (checkMatch) {
                    if (matchLength >= 3) {
                        const matchGroup = [];
                        for (let i = 0; i < matchLength; i++) {
                            let matchRow = isHorizontal ? row : matchStartInner + i;
                            let matchCol = isHorizontal ? matchStartInner + i : col;
                            const matchedTile = this.scene.gridArray[matchRow][matchCol];
                            if (matchedTile && matchedTile.canMatch && !this.matches.some(group => group.includes(matchedTile))) {
                                matchGroup.push(matchedTile);
                            }
                        }
                        if (matchGroup.length > 0) {
                            matchGroup.color = matchColor;
                            this.matches.push(matchGroup);
                        }
                    }
                    matchLength = 1;
                    matchColor = null;
                }
            }
        }
    }

    // Метод обработки найденных совпадений
    handleMatches() {
        if (this.matches.length > 0) {
            let destroyedTilesCount = 0;

            this.matches.forEach((matchGroup) => {
                destroyedTilesCount += matchGroup.length;
            });

            this.scene.score += destroyedTilesCount;
            this.scene.scoreText.setText('Счёт: ' + this.scene.score);

            if (this.scene.score >= this.scene.targetScore) {
                this.scene.levelCompleted();
                return;
            }

            this.scene.audioManager.play('match3', {volume: 0.5});

            // Создаем бомбы при совпадении 4 и более кристаллов
            this.matches.forEach(matchGroup => {
                if (matchGroup.length >= 4) {
                    const randomIndex = Phaser.Math.Between(0, matchGroup.length - 1);
                    const tile = matchGroup[randomIndex];
                    const row = tile.gridPosition.row;
                    const col = tile.gridPosition.col;
                    const x = this.scene.gridX + col * this.scene.tileSize + this.scene.tileSize / 2;
                    const y = this.scene.gridY + row * this.scene.tileSize + this.scene.tileSize / 2;

                    // Создаем бомбу
                    const bomb = new Bomb(this.scene, x, y, row, col);
                    this.scene.gridArray[row][col] = bomb;

                    // Удаляем старый кристалл, который уже посчитан в уничтоженные
                    tile.destroy();

                }
            });

            // Удаляем совпавшие кристаллы (которые не стали бомбами)
            this.matches.forEach((matchGroup) => {
                matchGroup.forEach((tile) => {
                    if (tile && tile.canMatch) {
                        const row = tile.gridPosition.row;
                        const col = tile.gridPosition.col;
                        if (!(this.scene.gridArray[row][col] instanceof Bomb)) {
                            // Убираем ссылку на кристалл из сетки
                            this.scene.gridArray[row][col] = null;

                            // Анимация исчезновения кристалла через изменение прозрачности
                            this.scene.tweens.add({
                                targets: tile,
                                alpha: 0,
                                duration: 200,
                                onComplete: () => {
                                    tile.destroy();
                                }
                            });
                        }
                    }
                });
            });

            this.matches = [];

            // Вызываем анимацию частиц через EffectsManager
            this.scene.effectsManager.playParticleEffect();

            // Заполняем пустые места после небольшой задержки
            this.scene.time.delayedCall(250, () => {
                this.fillEmptySpaces();
            });
        }
    }

    // Метод заполнения пустых мест на поле
    fillEmptySpaces() {
        for (let col = 0; col < this.scene.cols; col++) {
            let emptySpots = 0;
            for (let row = this.scene.rows - 1; row >= 0; row--) {
                const tile = this.scene.gridArray[row][col];
                if (tile === null) {
                    emptySpots++;
                } else if (emptySpots > 0) {
                    if (tile.isMovable) { // Проверяем, может ли объект двигаться
                        this.scene.gridArray[row + emptySpots][col] = tile;
                        tile.gridPosition.row += emptySpots;
                        this.scene.gridArray[row][col] = null;

                        this.scene.tweens.add({
                            targets: tile,
                            y: tile.gridPosition.row * this.scene.tileSize + this.scene.gridY + this.scene.tileSize / 2,
                            duration: 200,
                        });
                    } else {
                        // Если объект не может двигаться, сбрасываем счетчик пустых мест
                        emptySpots = 0;
                    }
                }
            }

            // Добавляем новые кристаллы сверху
            for (let i = 0; i < emptySpots; i++) {
                const x = col * this.scene.tileSize + this.scene.gridX + this.scene.tileSize / 2;
                const y = -(i + 1) * this.scene.tileSize + this.scene.gridY + this.scene.tileSize / 2;
                const frame = this.scene.boardController.getRandomFrame(i, col);
                const newRow = emptySpots - i - 1;

                // Проверяем, что ячейка свободна
                if (!this.scene.gridArray[newRow][col]) {
                    const diamond = Diamond.createDiamond(
                        this.scene,
                        x,
                        y,
                        frame,
                        newRow,
                        col,
                        this.scene.tileSize
                    );
                    this.scene.gridArray[newRow][col] = diamond;

                    this.scene.tweens.add({
                        targets: diamond,
                        y: diamond.gridPosition.row * this.scene.tileSize + this.scene.gridY + this.scene.tileSize / 2,
                        duration: 200,
                    });
                }
            }
        }

        // После заполнения проверяем на новые совпадения
        this.scene.time.delayedCall(200, () => {
            if (this.checkMatches()) {
                this.handleMatches();
            } else {
                this.scene.isProcessing = false;
            }
        });
    }

    // Метод уничтожения соседних плиток при взрыве бомбы
    destroyAdjacentTiles(row, col) {
        const positions = [
            {row: -1, col: -1},
            {row: -1, col: 0},
            {row: -1, col: 1},
            {row: 0, col: -1},
            {row: 0, col: 1},
            {row: 1, col: -1},
            {row: 1, col: 0},
            {row: 1, col: 1},
        ];

        positions.forEach(pos => {
            const newRow = row + pos.row;
            const newCol = col + pos.col;

            if (
                newRow >= 0 && newRow < this.scene.rows &&
                newCol >= 0 && newCol < this.scene.cols
            ) {
                const tile = this.scene.gridArray[newRow][newCol];
                if (tile) {
                    if (tile instanceof Bomb && !tile.isExploded) {
                        // Взрываем ещё одну бомбу
                        tile.explode();
                    } else if (tile.isDestructible !== false) {
                        // Перед удалением тайла увеличим счет, так как он уничтожается взрывом
                        if (tile.canMatch !== false) {
                            this.scene.score += 1;
                            this.scene.scoreText.setText('Счёт: ' + this.scene.score);
                        }

                        // Удаляем плитку из сетки
                        this.scene.gridArray[newRow][newCol] = null;

                        // Вместо мгновенного удаления используем анимацию взрыва
                        this.scene.effectsManager.playBombExplosion(tile);
                    }
                }
            }
        });

        // После уничтожения соседних плиток, заполняем пустые места
        this.scene.time.delayedCall(250, () => {
            this.fillEmptySpaces();
        });
    }
}