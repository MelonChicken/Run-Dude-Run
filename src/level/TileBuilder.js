// src/level/TileBuilder.js

export default class TileBuilder {
  constructor(scene, tileSize = 32) {
    this.scene = scene;
    this.T = tileSize;
  }

  /**
   * Build one vertical column of ground:
   * row 0 = grass, rows 1..n = mud
   * Returns an array of created tiles.
   */
  buildGroundColumn(group, x, topY, rows = 3) {
    const tiles = [];

    for (let row = 0; row < rows; row++) {
      const key = row === 0 ? 'grass_tile' : 'mud_tile';
      const tile = group.create(
        x,
        topY + row * this.T,
        key
      );

      tile.setOrigin(0, 0);
      tiles.push(tile);
    }

    return tiles;
  }

  /**
   * Build a wood platform of `length` tiles.
   * Returns an array of created tiles.
   */
  buildWoodPlatform(group, startX, y, length = 4) {
    const tiles = [];

    // left end
    tiles.push(this._placeTile(group, startX, y, 'platform_wood_end', false));

    // mid pieces
    for (let i = 1; i < length - 1; i++) {
      tiles.push(
        this._placeTile(group, startX + i * this.T, y, 'platform_wood', false)
      );
    }

    // right end (flipped)
    tiles.push(
      this._placeTile(
        group,
        startX + (length - 1) * this.T,
        y,
        'platform_wood_end',
        true
      )
    );

    return tiles;
  }

  _placeTile(group, x, y, key, flipX = false) {
    const tile = group.create(x, y, key);
    tile.setOrigin(0, 0);
    tile.setFlipX(flipX);
    return tile;
  }
}
