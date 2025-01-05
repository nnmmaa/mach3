import {DebugOverlay} from "../debug/DebugOverlay.js";

if (process.env.NODE_ENV === "development") {
    import("../mraid-stub.js");
}

/**
 * Класс для инициализации и управления MRAID-логикой в Playable Ad
 */
export class MraidManager {
    /**
     * Инициализация MRAID
     * @param {Function} startGameCallback
     * @param {Function} destroyGameCallback
     */
    static initialize(startGameCallback, destroyGameCallback) {
        if (typeof mraid !== "undefined") {
            DebugOverlay.log(
                "[MraidManager] MRAID найден, текущее состояние: " + mraid.getState()
            );

            if (mraid.getState() === "loading") {
                DebugOverlay.log('[MraidManager] Ожидаем "ready"...');
                mraid.addEventListener("ready", () =>
                    this.onMraidReady(startGameCallback, destroyGameCallback)
                );
            } else {
                DebugOverlay.log("[MraidManager] MRAID уже готово...");
                this.onMraidReady(startGameCallback, destroyGameCallback);
            }
        } else {
            DebugOverlay.log(
                "[MraidManager] MRAID не найден, работаем в тестовом режиме (браузер)."
            );
            startGameCallback();
        }
    }

    /**
     * Вызывается, когда MRAID перешёл в состояние 'ready'
     */
    static onMraidReady(startGameCallback, destroyGameCallback) {
        DebugOverlay.log("[MraidManager] onMraidReady вызван");

        if (mraid.setOrientationProperties) {
            try {
                mraid.setOrientationProperties({
                    allowOrientationChange: false,
                    forceOrientation: "portrait",
                });
                DebugOverlay.log(
                    "[MraidManager] Ориентация зафиксирована на портретную"
                );
            } catch (err) {
                DebugOverlay.log(
                    "[MraidManager] Ошибка при установке ориентации: " + err,
                    true
                );
            }
        }

        // Подписка на событие видимости (viewableChange)
        mraid.addEventListener("viewableChange", (viewable) => {
            DebugOverlay.log(`[MraidManager] viewableChange: ${viewable}`);
            if (viewable) {
                startGameCallback();
            } else {
                destroyGameCallback();
            }
        });

        // Подписка на изменение состояния (stateChange)
        mraid.addEventListener("stateChange", (state) => {
            DebugOverlay.log(`[MraidManager] stateChange: ${state}`);
            if (state === "hidden") {
                // Если объявление скрыто, можно остановить игру
                destroyGameCallback();
            }
        });

        // Подписка на sizeChange
        mraid.addEventListener("sizeChange", (width, height) => {
            DebugOverlay.log(`[MraidManager] sizeChange: ${width}x${height}`);
        });

        // Подписка на ошибки
        mraid.addEventListener("error", (message, action) => {
            DebugOverlay.log(
                `[MraidManager] Ошибка MRAID: ${message} (action: ${action})`,
                true
            );
        });

        // Если сейчас уже viewable, запускаем игру
        if (mraid.isViewable()) {
            DebugOverlay.log(
                "[MraidManager] Реклама уже видима, startGameCallback()"
            );
            startGameCallback();
        }
    }

    /**
     * Обработчик клика
     */
    static handleClick() {
        if (typeof mraid !== "undefined") {
            const url = mraid.getParameter?.("clickURL") || "https://yourgame.com";
            DebugOverlay.log("[MraidManager] Открываем URL: " + url);
            try {
                mraid.open(url);
            } catch (err) {
                DebugOverlay.log("[MraidManager] Ошибка mraid.open: " + err, true);
            }
        } else {
            // Если MRAID нет
            DebugOverlay.log("[MraidManager] Открываем URL через window.open", true);
            window.open("https://yourgame.com", "_blank");
        }
    }
}
