import Phaser from 'phaser';
import type { Player } from '@/entities/Player';

export class CollisionSystem {
  constructor(private readonly scene: Phaser.Scene) {}

  addCollider(
    a: Phaser.GameObjects.GameObject | Phaser.GameObjects.Group | Phaser.Tilemaps.TilemapLayer,
    b: Phaser.GameObjects.GameObject | Phaser.GameObjects.Group | Phaser.Tilemaps.TilemapLayer,
    callback?: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
  ): Phaser.Physics.Arcade.Collider {
    return this.scene.physics.add.collider(a, b, callback);
  }

  addOverlap(
    a: Phaser.GameObjects.GameObject | Phaser.GameObjects.Group,
    b: Phaser.GameObjects.GameObject | Phaser.GameObjects.Group,
    callback: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
  ): Phaser.Physics.Arcade.Collider {
    return this.scene.physics.add.overlap(a, b, callback);
  }

  registerPlatformLayer(
    player: Player,
    layer: Phaser.Tilemaps.TilemapLayer,
  ): Phaser.Physics.Arcade.Collider {
    return this.scene.physics.add.collider(player, layer);
  }

  registerHazardLayer(
    player: Player,
    layer: Phaser.Tilemaps.TilemapLayer,
    onHit: () => void,
  ): Phaser.Physics.Arcade.Collider {
    return this.scene.physics.add.overlap(player, layer, onHit);
  }
}
