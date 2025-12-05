import Phaser from 'phaser';
import Player from '../entities/Player.js';

import HealthPickup from '../pickups/HealthPickup.js';
import SpeedPickup from '../pickups/SpeedPickup.js';
import JumpPickup from '../pickups/JumpPickup.js';

import ScrollingWorld from '../level/ScrollingWorld.js';

import { submitGameSession, registerPlayer } from "../api/leaderboard.js";
import { getPlayerId } from "../utils/storage.js";
import {calculateScore} from "../utils/scoring";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.world = new ScrollingWorld(this, 32, 150);
    this.player = new Player(this, 100, 250);

    this.add.image(0, 0, 'bg')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-10);
    // for temperary escape key to terminate game and see statistics
    this.escapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    // for count how many pickups occured
    this.pickupCount = 0;
    // counting how manytime the player hit enemy
    this.hitCount = 0;
    this.startTime = Date.now();

      // Collisions
    this.physics.add.collider(
      this.player,
      this.world.ground
    );

    this.physics.add.collider(
      this.player,
      this.world.platforms,
      null,
      this.platformCollisionCheck,
      this
    );

    // Pickups
    this.physics.add.overlap(
      this.player,
      this.world.pickups,
      this.handlePickup,
      null,
      this
    );

    // Enemies (empty for now)
    this.physics.add.collider(
      this.player,
      this.world.enemies,
      this.handleEnemyCollision,
      null,
      this
    );

    // Stats display
    this.statsText = this.add.text(16, 16, '', {
      fontSize: '18px',
      fill: '#ffffff'
    });

    this.updateStatsText();
  }

update() {
  this.player.update();
  this.world.update();

  if (Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
    this.endGame();
  }
}

  handlePickup(player, pickup) {
    if (pickup instanceof HealthPickup) {
      player.heal(pickup.healAmount || 25);
    } else if (pickup instanceof SpeedPickup) {
      player.addSpeed(pickup.speedBoost || 75);
    } else if (pickup instanceof JumpPickup) {
      player.grantExtraJump();
    }
    this.pickupCount++;
    pickup.destroy();

    this.updateStatsText();
  }

  handleEnemyCollision(player, enemy) {


      const isAbove = player.body.bottom <= enemy.body.top;

      if(isAbove){
        console.log('Killed enemy!');
        this.hitCount++;
        enemy.disableBody(true, true);
    } else {
        console.log('Bumped into the enemy!');
        this.player.stats.health -= 50;
    }
    this.updateStatsText();
  }

  platformCollisionCheck(player, platform) {
    if (player.dropThrough) return false;
    return (
      player.body.velocity.y >= 0 &&
      player.y + player.height / 2 <= platform.y + 5
    );
  }

  updateStatsText() {
    this.statsText.setText(
      `Health: ${this.player.stats.health}/${this.player.stats.maxHealth}` +
      `\nSpeed: ${this.player.stats.moveSpeed}` +
      `\nJump Power: ${-this.player.stats.jumpVelocity}` +
      `\nMax Jumps: ${this.player.maxJumps}`
    );
  }
    // Temperal Escape to end game and see statistics
    endGame() {
        const playTime = Math.floor((Date.now() - this.startTime) / 1000);
        const score = calculateScore(
            playTime,
            this.hitCount,
            this.pickupCount,
            this.player.stats.moveSpeed,
            this.player.maxJumps,
            this.player.stats.health
        );
        const sessionData = {
            player_id: getPlayerId(),
            play_time: playTime,
            score: score ?? 0,
            hits: this.hitCount,
            pickups: this.pickupCount,
            max_speed: this.player.stats.moveSpeed,
            max_jump_power: this.player.maxJumps,
            health_left: this.player.stats.health
        };
        console.log(sessionData);
        submitGameSession(sessionData);

        this.scene.start("MenuScene");
    }

}
