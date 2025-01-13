/**
 * Класс EffectsManager отвечает за визуальные эффекты в игре, такие как анимация взрыва и частицы.
 */
export default class EffectsManager {
    /**
     * Создает экземпляр менеджера эффектов.
     * @param {Phaser.Scene} scene - Сцена, к которой привязан EffectsManager.
     */
    constructor(scene) {
        /**
         * @property {Phaser.Scene} scene - Ссылка на текущую сцену игры.
         */
        this.scene = scene;
    }

    createAnimations() {
        this.scene.anims.create({
            key: 'explode',
            frames: this.scene.anims.generateFrameNumbers('explosion', { start: 0, end: 22 }),
            frameRate: 60,
            repeat: 0,
        })
    }

    /**
     * Воспроизводит анимацию взрыва бомбы и удаляет бомбу после завершения анимации.
     * @param {Bomb} bomb - Объект бомбы, которая взрывается.
     */
    playBombExplosion(bomb) {
        // Проигрываем звуковой эффект взрыва
        this.scene.audioManager.play('whoosh', { volume: 0.5 });

        // Создаем спрайт взрыва на позиции бомбы
        const explosionSprite = this.scene.add.sprite(bomb.x, bomb.y, 'explosion');

        // Масштабируем взрыв относительно tileSize
        const scaleFactor = this.scene.tileSize / 48;
        explosionSprite.setScale(scaleFactor);

        // Запускаем анимацию взрыва (ключ 'explode' должен быть создан в сцене)
        explosionSprite.play('explode');

        // После завершения анимации уничтожаем спрайт взрыва и бомбу
        explosionSprite.on('animationcomplete', () => {
            explosionSprite.destroy();
            bomb.destroy();
        }, this);
    }

    /**
     * Воспроизводит эффект частиц, имитирующих движение от начала поля к счёту.
     * Используется, например, для показа "монет", летящих в сторону счёта.
     */
    playParticleEffect() {
        // Начальные координаты (центр нижней части поля)
        const startX = this.scene.gridX + (this.scene.cols * this.scene.tileSize) / 2;
        const startY = this.scene.gridY;

        // Конечные координаты (область возле текста счёта)
        const scoreText = this.scene.uiController.scoreText;
        const targetX = scoreText.x + scoreText.width / 2;
        const targetY = scoreText.y + scoreText.height / 2;

        // Создаем эмиттер частиц
        const emitter = this.scene.add.particles(0, 0, 'coin', {
            x: { start: startX, end: targetX, ease: 'Power1' },
            y: { start: startY, end: targetY },
            lifespan: 400,        // Время жизни частицы (мс)
            frequency: 200,       // Интервал между спаунами (мс)
            quantity: 1,          // Количество частиц за интервал
            emitting: true,       // Включает эмиссию
            stopAfter: 6,         // Количество частиц, после которых эмиссия останавливается
            scale: { start: 0.2, end: 0.1 }, // Размер частиц
        }).setDepth(1);

        // После окончания эмиссии уничтожаем эмиттер
        emitter.once('emittercomplete', () => {
            emitter.destroy();
        });
    }


}