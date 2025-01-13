export default class DragController {
    /**
     * @param {Phaser.Scene} scene - Сцена, в которой обрабатывается перетаскивание
     * @param {BoardController} boardController - Ссылка на ваш BoardController (для swapTiles и resetTilePosition)
     */
    constructor(scene, boardController) {
        this.scene = scene;
        this.boardController = boardController;
    }

    /**
     * setupDragEvents - Регистрирует обработчики событий перетаскивания в Phaser.
     */
    setupDragEvents() {
        this.scene.input.on('dragstart', this.onDragStart, this);
        this.scene.input.on('drag', this.onDrag, this);
        this.scene.input.on('dragend', this.onDragEnd, this);
    }

    /**
     * onDragStart - Обработчик начала перетаскивания тайла.
     */
    onDragStart(pointer, gameObject) {
        if (this.scene.isProcessing) return;
        if (!gameObject.isMovable || !gameObject.input.enabled) return;

        gameObject.startX = gameObject.x;
        gameObject.startY = gameObject.y;

        // Увеличиваем тайл
        gameObject.setDisplaySize(
            gameObject.originalWidth * 1.3,
            gameObject.originalHeight * 1.3
        );
    }

    /**
     * onDrag - Обработчик процесса перетаскивания тайла.
     * Ограничивает перетаскивание на одну клетку в любом направлении.
     */
    onDrag(pointer, gameObject, dragX, dragY) {
        if (this.scene.isProcessing) return;
        if (!gameObject.isMovable) return;

        const startX = gameObject.startX;
        const startY = gameObject.startY;
        const deltaX = dragX - startX;
        const deltaY = dragY - startY;
        const maxDelta = this.scene.tileSize;

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
     * Определяет направление перемещения и вызывает методы BoardController для обмена или сброса.
     */
    onDragEnd(pointer, gameObject) {
        if (this.scene.isProcessing) return;

        // Возвращаем тайл к исходным размерам
        if (gameObject.originalWidth && gameObject.originalHeight) {
            gameObject.setDisplaySize(
                gameObject.originalWidth,
                gameObject.originalHeight
            );
        }

        const deltaX = gameObject.x - gameObject.startX;
        const deltaY = gameObject.y - gameObject.startY;
        let direction = null;

        // Определяем направление
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > this.scene.tileSize / 2) {
                direction = "right";
            } else if (deltaX < -this.scene.tileSize / 2) {
                direction = "left";
            }
        } else {
            if (deltaY > this.scene.tileSize / 2) {
                direction = "down";
            } else if (deltaY < -this.scene.tileSize / 2) {
                direction = "up";
            }
        }

        if (direction) {
            const fromRow = gameObject.gridPosition.row;
            const fromCol = gameObject.gridPosition.col;
            let toRow = fromRow;
            let toCol = fromCol;

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

            if (
                toRow >= 0 && toRow < this.scene.rows &&
                toCol >= 0 && toCol < this.scene.cols
            ) {
                const targetTile = this.scene.gridArray[toRow][toCol];
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
}