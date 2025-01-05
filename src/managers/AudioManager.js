import {AudioLoader} from "../loaders/AudioLoader.js";

/**
 * Загрузить конкретное аудио (огг + м4а).
 * @param {string} key - Ключ, под которым аудио будет доступно в Phaser
 * @param {string} oggUrl - Путь/URL к OGG
 * @param {string} m4aUrl - Путь/URL к M4A
 * @param {object} options - Опции для sound.add(key, options)
 */
export class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.audioLoader = new AudioLoader(scene);
    }

    async loadAndPlay(key, oggUrl, m4aUrl, options = {}) {
        try {
            await this.audioLoader.loadAudio(key, oggUrl);
            const sound = this.scene.sound.add(key, options);
            sound.play();
        } catch (errorOGG) {
            try {
                await this.audioLoader.loadAudio(key, m4aUrl);
                const sound = this.scene.sound.add(key, options);
                sound.play();
            } catch (errorM4A) {
                console.error(`Failed to load audio for ${key}`, { errorOGG, errorM4A });
            }
        }
    }
}