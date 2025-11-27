import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    // loading text
    this.add.text(20, 20, 'Loading...', { fontSize: '28px', fill: '#ffffff' });

    // platform and ground tiles
    this.load.image('grass_tile', 'assets/images/platforms/grass_tile.png');
    this.load.image('mud_tile', 'assets/images/platforms/mud_tile.png');
    this.load.image('platform_wood', 'assets/images/platforms/platform_wood.png');
    this.load.image('platform_wood_end', 'assets/images/platforms/platform_wood_end.png');

    //player sprite
    this.load.spritesheet('player', 'assets/images/player/player_run.png', {
      frameWidth: 32,
      frameHeight: 48
    });

    //enemy sprite

  }

  create() {

    // run
    this.anims.create({
      key: 'Running',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 5 }),
      frameRate: 10,         // 100 ms per frame
      repeat: -1
    });

    // Idle
    this.anims.create({
      key: 'Idle',
      frames: this.anims.generateFrameNumbers('player', { start: 6, end: 11 }),
      frameRate: 10,
      repeat: -1
    });

    this.scene.start("MenuScene");
  }
}
