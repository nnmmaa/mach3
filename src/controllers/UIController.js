import { MraidManager } from "../managers/MraidManager.js";
import { GAME_CONFIG } from "../config.js";

/**
 * Класс UIController отвечает за создание оверлея,
 * кнопки CTA и управление UI-элементами (например, счёт).
 */
export default class UIController {
    constructor(scene) {
        this.scene = scene;
        // Можно хранить ссылки на UI-объекты (buttonBg, buttonText, overlay) здесь
        this.overlay = null;
        this.ctaButton = null;
    }

    /**
     * createOverlay - Создаёт полупрозрачный оверлей поверх игры.
     */
    createOverlay() {
        const overlay = this.scene.add.rectangle(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height / 2,
            this.scene.sys.game.config.width,
            this.scene.sys.game.config.height,
            0x000000,
            0.5
        ).setDepth(10);

        this.overlay = overlay;
    }

    /**
     * showCTA - Показывает кнопку призыва к действию (CTA) для установки игры.
     */
    showCTA() {
        const buttonX = this.scene.sys.game.config.width / GAME_CONFIG.SHOW_CTA.BUTTON_X;
        const buttonY = this.scene.sys.game.config.height / GAME_CONFIG.SHOW_CTA.BUTTON_Y;

        // Создаем фон кнопки
        const buttonBg = this.scene.add.image(buttonX, buttonY, 'yellowButtonSml')
            .setOrigin(0.5)
            .setDepth(11);

        buttonBg.setDisplaySize(GAME_CONFIG.SHOW_CTA.WIDTH, GAME_CONFIG.SHOW_CTA.HEIGHT);

        // Добавляем текст кнопки
        const buttonText = this.scene.add.text(buttonX, buttonY, GAME_CONFIG.SHOW_CTA.TEXT_BTN, {
            fontSize: GAME_CONFIG.SHOW_CTA.FONT_SIZE,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(11);

        // Делаем кнопку интерактивной
        buttonBg.setInteractive();

        // Обработчик клика
        buttonBg.on('pointerdown', () => {
            const url = (typeof mraid !== "undefined")
                ? mraid.getParameter?.("clickURL") || "https://example.com/install"
                : "https://example.com/install";
            MraidManager.handleClick(url);
        });

        buttonBg.on('pointerover', () => {
            buttonBg.setTint(0xcccc00);
        });

        buttonBg.on('pointerout', () => {
            buttonBg.clearTint();
        });

        this.ctaButton = buttonBg;
    }
}