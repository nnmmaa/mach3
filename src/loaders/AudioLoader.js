export class AudioLoader {
    constructor(scene) {
        this.scene = scene;
    }

    async loadAudio(key, audioUrl) {
        return new Promise(async (resolve, reject) => {
            try {
                // Проверяем, является ли это data URL
                if (audioUrl.startsWith('data:')) {
                    // Обработка data URL (для production)
                    const base64 = audioUrl.split(',')[1];
                    const binaryString = window.atob(base64);
                    const bytes = new Uint8Array(binaryString.length);

                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }

                    const audioContext = this.scene.sound.context;
                    const arrayBuffer = bytes.buffer;

                    audioContext.decodeAudioData(arrayBuffer,
                        (audioBuffer) => {
                            this.scene.cache.audio.add(key, audioBuffer);
                            resolve();
                        },
                        (error) => {
                            reject(error);
                        }
                    );
                } else {
                    // Обработка обычного URL (для development)
                    const response = await fetch(audioUrl);
                    const arrayBuffer = await response.arrayBuffer();
                    const audioContext = this.scene.sound.context;

                    audioContext.decodeAudioData(arrayBuffer,
                        (audioBuffer) => {
                            this.scene.cache.audio.add(key, audioBuffer);
                            resolve();
                        },
                        (error) => {
                            reject(error);
                        }
                    );
                }
            } catch (error) {
                reject(error);
            }
        });
    }
}