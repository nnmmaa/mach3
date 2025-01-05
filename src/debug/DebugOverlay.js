export class DebugOverlay {
    static scene = null;
    static textObject = null;
    static logs = [];
    static enabled = true;

    /**
     * Инициализируем DebugOverlay (создаём текстовый объект)
     * @param {Phaser.Scene} scene
     */
    static init(scene) {
        this.scene = scene;
        if (!this.enabled) return;

        // Создаем текст на сцене
        this.textObject = scene.add
            .text(10, 10, "", {
                font: "16px Arial",
                fill: "#000",
                wordWrap: {width: scene.scale.width - 20},
            })
            .setDepth(999);

        // Если были накоплены логи до init, выведем их
        for (const msg of this.logs) {
            this._appendText(msg);
        }
    }

    /**
     * Метод для логирования
     * @param {String} message
     * @param {Boolean} isError (если true, выделим красным)
     */
    static log(message, isError = false) {
        // Храним сообщение в массиве (если textObject ещё не создан)
        const prefix = isError ? "[ERROR]" : "";
        const msg = prefix + message;

        // Если debug выключен
        if (!this.enabled) {
            return;
        }

        // Если текст ещё не инициализирован (сцена не готова), накапливаем
        if (!this.textObject) {
            this.logs.push(msg);
        } else {
            this._appendText(msg);
        }
    }

    static _appendText(msg) {
        // Добавляем новую строку
        const old = this.textObject.text;
        this.textObject.setText(old + "\n" + msg);
    }

    /**
     * Очищает текст
     */
    static clear() {
        if (this.textObject) {
            this.textObject.setText("");
        }
    }
}
