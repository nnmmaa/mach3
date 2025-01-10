import Tile from './Tile.js';

/**
 * Класс Bomb представляет собой взрывоопасный тайл на игровом поле.
 * Наследуется от класса Tile и добавляет функциональность взрыва при взаимодействии.
 */
export default class Bomb extends Tile {
    /**
     * Конструктор класса Bomb.
     *
     * @param {Phaser.Scene} scene - Сцена, к которой принадлежит бомба.
     * @param {number} x - Координата X позиции бомбы.
     * @param {number} y - Координата Y позиции бомбы.
     * @param {number} row - Строка сетки, в которой находится бомба.
     * @param {number} col - Столбец сетки, в котором находится бомба.
     */
    constructor(scene, x, y, row, col) {
        super(scene, x, y, 'bomb', 'bomb', row, col);

        // Настройка свойств бомбы
        this.isMovable = true;      // Бомба может перемещаться
        this.canMatch = false;     // Бомба не участвует в матчах
        this.isDestructible = false; // Бомба неразрушима стандартными средствами

        // Делает бомбу интерактивной и позволяет её перетаскивать
        this.setInteractive({ draggable: true });

        // Задаём размеры бомбы относительно tileSize
        const bombWidth = scene.tileSize;
        const bombHeight = scene.tileSize * 0.75;

        this.setDisplaySize(bombWidth, bombHeight);

        // Сохраняем оригинальные размеры для последующего масштабирования
        this.originalWidth = bombWidth;
        this.originalHeight = bombHeight;

        // Добавляем обработчик события клика на бомбу
        this.on('pointerdown', this.onPointerDown, this);

        // Флаг, указывающий, что бомба уже взорвалась
        this.isExploded = false;

        // Воспроизводим эффект появления бомбы
        this.playSpawnEffect();
    }

    /**
     * playSpawnEffect - Воспроизводит анимацию появления бомбы.
     * Увеличивает бомбу на 20% и возвращает её обратно для визуального эффекта.
     */
    playSpawnEffect() {
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 150,
            yoyo: true,
            ease: 'Power1',
        });
    }

    /**
     * onPointerDown - Обработчик события клика на бомбу.
     * Инициирует процесс взрыва бомбы.
     */
    onPointerDown() {
        // Опционально: Можно добавить увеличение бомбы при клике
        // this.setDisplaySize(this.originalWidth * 1.3, this.originalHeight * 1.3);
        this.explode();
    }

    /**
     * explode - Метод, отвечающий за взрыв бомбы.
     * Выполняет анимацию взрыва, удаляет бомбу из сетки и уничтожает соседние тайлы.
     */
    explode() {
        // Проверяем, что бомба ещё не взорвалась
        if (this.isExploded) return;
        this.isExploded = true;

        // Воспроизводим анимацию взрыва через менеджер эффектов
        this.scene.effectsManager.playBombExplosion(this);

        // Удаляем бомбу из сетки
        this.scene.gridArray[this.gridPosition.row][this.gridPosition.col] = null;

        // Уничтожаем соседние тайлы (например, сверху, снизу, слева, справа)
        this.scene.matchManager.destroyAdjacentTiles(this.gridPosition.row, this.gridPosition.col);

        // Добавляем обработчик завершения анимации взрыва для уничтожения объекта бомбы
        this.on('animationcomplete', () => {
            this.destroy();
        }, this);
    }
}