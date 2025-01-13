import Diamond from "../objects/Diamond.js";

export default class BoardManager {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Удаляет все кристаллы с поля с анимацией исчезновения.
     * @param {Function} onComplete - вызывается после удаления всех кристаллов.
     */
    removeAllCrystals(onComplete) {
        let tilesToRemove = [];
        for (let row = 0; row < this.scene.rows; row++) {
            for (let col = 0; col < this.scene.cols; col++) {
                const tile = this.scene.gridArray[row][col];
                if (tile) {
                    tilesToRemove.push(tile);
                }
            }
        }

        if (tilesToRemove.length === 0) {
            if (onComplete) onComplete();
            return;
        }

        this.scene.tweens.add({
            targets: tilesToRemove,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                tilesToRemove.forEach(tile => tile.destroy());

                for (let row = 0; row < this.scene.rows; row++) {
                    for (let col = 0; col < this.scene.cols; col++) {
                        this.scene.gridArray[row][col] = null;
                    }
                }

                if (onComplete) onComplete();
            }
        });
    }

    /**
     * Создает новые кристаллы сверху и анимирует их падение вниз.
     * @param {Function} onComplete - вызывается после появления всех кристаллов.
     */
    spawnNewCrystals(onComplete) {
        let total = this.scene.rows * this.scene.cols;
        let count = 0;

        for (let row = 0; row < this.scene.rows; row++) {
            for (let col = 0; col < this.scene.cols; col++) {
                const x = this.scene.gridX + col * this.scene.tileSize + this.scene.tileSize / 2;
                const startY = this.scene.gridY - (this.scene.tileSize * (this.scene.rows - row));
                const endY = this.scene.gridY + row * this.scene.tileSize + this.scene.tileSize / 2;

                const frame = this.scene.boardController.getRandomFrame(row, col);
                const diamond = Diamond.createDiamond(
                    this.scene,
                    x,
                    startY,
                    frame,
                    row,
                    col,
                    this.scene.tileSize
                );
                diamond.alpha = 0;
                this.scene.gridArray[row][col] = diamond;

                this.scene.tweens.add({
                    targets: diamond,
                    y: endY,
                    alpha: 1,
                    duration: 400,
                    delay: (row * 50 + col * 20),
                    onComplete: () => {
                        count++;
                        if (count === total && onComplete) {
                            onComplete();
                        }
                    }
                });
            }
        }
    }
}