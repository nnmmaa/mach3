import {AUTO, Game} from 'phaser'
import GameScene from "./scenes/GameScene.js";

const config = {
    type: AUTO,
    width: 720,
    height: 1280,
    backgroundColor: 'transparent',
    parent: 'game-container',
    scene: [GameScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    }
}

const game = new Game(config);