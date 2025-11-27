// src/level/ScrollingWorld.js
import TileBuilder from './TileBuilder.js';

export default class ScrollingWorld {
  constructor(scene, tileSize = 32, scrollSpeed = 150) {
    this.scene = scene;
    this.T = tileSize;
    this.scrollSpeed = scrollSpeed;

    this.tileBuilder = new TileBuilder(scene, tileSize);

    // Solid ground group
    this.ground = scene.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    // Platform group
    this.platforms = scene.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    // Pickup group
    this.pickups = scene.add.group();

    // Enemy group
    this.enemies = scene.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    this.groundRows = 3;

    // --- NEW: initial ground generation ---
    this._initGround();
  }

  
  // Fill the screen with ground columns, built by TileBuilder.
  _initGround() {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    // how many vertical columns do we need to cover the screen + a bit extra
    this.numColumns = Math.ceil(width / this.T) + 2;
    this.groundColumns = [];

    // top Y of the ground (3 rows high by default)
    this.groundTopY = height - this.groundRows * this.T;

    for (let col = 0; col < this.numColumns; col++) {
      const x = col * this.T;

      // use TileBuilder to create this column
      const columnTiles = this.tileBuilder.buildGroundColumn(
        this.ground,
        x,
        this.groundTopY,
        this.groundRows
      );

      // give every tile a scrolling velocity to the left
      columnTiles.forEach(tile => {
        tile.body.setVelocityX(-this.scrollSpeed);
        tile.body.allowGravity = false;
        tile.body.immovable = true;
      });

      this.groundColumns.push(columnTiles);
    }
  }

  // ----- UPDATE / RECYCLING -----
  update() {
    const totalWidth = this.numColumns * this.T;

    this.groundColumns.forEach((columnTiles, index) => {
      const leftTile = columnTiles[0];

      // when the whole column has gone off the left side
      if (leftTile.x + this.T < 0) {
        // X position where the new column should appear (far right)
        const newX = leftTile.x + totalWidth;

        // destroy the old tiles
        columnTiles.forEach(tile => tile.destroy());

        // build a fresh ground column using TileBuilder
        const newColumn = this.tileBuilder.buildGroundColumn(
          this.ground,
          newX,
          this.groundTopY,
          this.groundRows
        );

        // give them scrolling velocity again
        newColumn.forEach(tile => {
          tile.body.setVelocityX(-this.scrollSpeed);
          tile.body.allowGravity = false;
          tile.body.immovable = true;
        });

        // replace the entry in the array
        this.groundColumns[index] = newColumn;
      }
    });
  }
}
