import { addComponent, addEntity, createWorld } from 'bitecs'
import { describe, expect, it } from 'vitest'

import {
  BattleAction,
  BattleState,
  Health,
  HostileNPC,
  InBattle,
  Movement,
  NPC,
  Player,
  Transform,
  ValidActions,
} from '../../components'
import type { WorldProps } from '../../types'
import { createBattleSystem } from '../battle'

const CELL_SIZE = 50

describe.skip('Battle System', () => {
  it('should initiate battle when player meets hostile NPC', () => {
    const world = createWorld<WorldProps>()
    const playerEid = addEntity(world)
    const npcEid = addEntity(world)

    // Set up player
    addComponent(world, playerEid, Player)
    addComponent(world, playerEid, Transform)
    addComponent(world, playerEid, Movement)
    Transform.x[playerEid] = 100
    Transform.y[playerEid] = 100

    // Set up hostile NPC at same position
    addComponent(world, npcEid, NPC)
    addComponent(world, npcEid, HostileNPC)
    addComponent(world, npcEid, Transform)
    Transform.x[npcEid] = 100
    Transform.y[npcEid] = 100

    const battleSystem = createBattleSystem()
    battleSystem(world)

    // Battle should be initiated
    expect(InBattle.eid[playerEid]).toBeDefined()
    expect(InBattle.eid[npcEid]).toBeDefined()
    expect(BattleState.isActive[playerEid]).toBe(1)
    expect(BattleState.turn[playerEid]).toBe(0) // Player's turn first

    // Health should be initialized
    expect(Health.current[playerEid]).toBe(100)
    expect(Health.max[playerEid]).toBe(100)
    expect(Health.current[npcEid]).toBe(100)
    expect(Health.max[npcEid]).toBe(100)

    // Entities should be positioned on battle grid
    expect(BattleState.playerPosition.x[playerEid]).toBe(5 * CELL_SIZE) // Center
    expect(BattleState.playerPosition.y[playerEid]).toBe(9 * CELL_SIZE) // Bottom
    expect(BattleState.enemyPosition.x[playerEid]).toBe(5 * CELL_SIZE) // Center
    expect(BattleState.enemyPosition.y[playerEid]).toBe(0) // Top
  })

  it('should handle player movement action', () => {
    const world = createWorld<WorldProps>()
    const playerEid = addEntity(world)
    const npcEid = addEntity(world)

    // Set up battle state
    addComponent(world, playerEid, Player)
    addComponent(world, playerEid, Transform)
    addComponent(world, playerEid, InBattle)
    addComponent(world, playerEid, BattleAction)
    addComponent(world, playerEid, ValidActions)
    addComponent(world, npcEid, NPC)
    addComponent(world, npcEid, HostileNPC)
    addComponent(world, npcEid, InBattle)

    BattleState.isActive[playerEid] = 1
    BattleState.turn[playerEid] = 0 // Player's turn
    BattleState.playerPosition.x[playerEid] = 5 * CELL_SIZE
    BattleState.playerPosition.y[playerEid] = 9 * CELL_SIZE

    // Set up player move action
    BattleAction.type[playerEid] = 'move'
    BattleAction.targetX[playerEid] = 6 * CELL_SIZE // Move right
    BattleAction.targetY[playerEid] = 9 * CELL_SIZE

    // Set up valid moves
    ValidActions.cells[playerEid] = [
      { x: 6 * CELL_SIZE, y: 9 * CELL_SIZE }, // Right
      { x: 4 * CELL_SIZE, y: 9 * CELL_SIZE }, // Left
      { x: 5 * CELL_SIZE, y: 8 * CELL_SIZE }, // Up
    ]

    const battleSystem = createBattleSystem()
    battleSystem(world)

    // Player should move to target position
    expect(BattleState.playerPosition.x[playerEid]).toBe(6 * CELL_SIZE)
    expect(BattleState.playerPosition.y[playerEid]).toBe(9 * CELL_SIZE)
    expect(BattleState.turn[playerEid]).toBe(1) // Enemy's turn
    expect(BattleAction.type[playerEid]).toBe('') // Action should be cleared
  })

  it('should handle player attack action', () => {
    const world = createWorld<WorldProps>()
    const playerEid = addEntity(world)
    const npcEid = addEntity(world)

    // Set up battle state
    addComponent(world, playerEid, Player)
    addComponent(world, playerEid, Transform)
    addComponent(world, playerEid, InBattle)
    addComponent(world, playerEid, BattleAction)
    addComponent(world, playerEid, ValidActions)
    addComponent(world, npcEid, NPC)
    addComponent(world, npcEid, HostileNPC)
    addComponent(world, npcEid, InBattle)
    addComponent(world, npcEid, Health)

    BattleState.isActive[playerEid] = 1
    BattleState.turn[playerEid] = 0 // Player's turn
    BattleState.playerPosition.x[playerEid] = 5 * CELL_SIZE
    BattleState.playerPosition.y[playerEid] = 8 * CELL_SIZE
    BattleState.enemyPosition.x[playerEid] = 5 * CELL_SIZE
    BattleState.enemyPosition.y[playerEid] = 9 * CELL_SIZE // Adjacent to player

    Health.current[npcEid] = 100
    Health.max[npcEid] = 100

    // Set up player attack action
    BattleAction.type[playerEid] = 'attack'
    BattleAction.targetX[playerEid] = 5 * CELL_SIZE
    BattleAction.targetY[playerEid] = 9 * CELL_SIZE

    // Set up valid moves including attack position
    ValidActions.cells[playerEid] = [
      { x: 5 * CELL_SIZE, y: 9 * CELL_SIZE }, // Attack position
      { x: 4 * CELL_SIZE, y: 8 * CELL_SIZE }, // Left
      { x: 6 * CELL_SIZE, y: 8 * CELL_SIZE }, // Right
      { x: 5 * CELL_SIZE, y: 7 * CELL_SIZE }, // Up
    ]

    const battleSystem = createBattleSystem()
    battleSystem(world)

    // Enemy should take damage
    expect(Health.current[npcEid]).toBe(80) // 100 - 20 (ATTACK_DAMAGE)
    expect(BattleState.turn[playerEid]).toBe(1) // Enemy's turn
    expect(BattleAction.type[playerEid]).toBe('') // Action should be cleared
  })

  it('should handle enemy turn', () => {
    const world = createWorld<WorldProps>()
    const playerEid = addEntity(world)
    const npcEid = addEntity(world)

    // Set up battle state
    addComponent(world, playerEid, Player)
    addComponent(world, playerEid, Transform)
    addComponent(world, playerEid, InBattle)
    addComponent(world, playerEid, Health)
    addComponent(world, npcEid, NPC)
    addComponent(world, npcEid, HostileNPC)
    addComponent(world, npcEid, InBattle)

    BattleState.isActive[playerEid] = 1
    BattleState.turn[playerEid] = 1 // Enemy's turn
    BattleState.playerPosition.x[playerEid] = 5 * CELL_SIZE
    BattleState.playerPosition.y[playerEid] = 9 * CELL_SIZE
    BattleState.enemyPosition.x[playerEid] = 5 * CELL_SIZE
    BattleState.enemyPosition.y[playerEid] = 8 * CELL_SIZE // Adjacent to player

    Health.current[playerEid] = 100
    Health.max[playerEid] = 100

    const battleSystem = createBattleSystem()
    battleSystem(world)

    // Player should take damage when adjacent
    expect(Health.current[playerEid]).toBe(80) // 100 - 20 (ATTACK_DAMAGE)
    expect(BattleState.turn[playerEid]).toBe(0) // Back to player's turn
  })

  it('should end battle when player or enemy dies', () => {
    const world = createWorld<WorldProps>()
    const playerEid = addEntity(world)
    const npcEid = addEntity(world)

    // Set up battle state
    addComponent(world, playerEid, Player)
    addComponent(world, playerEid, Transform)
    addComponent(world, playerEid, InBattle)
    addComponent(world, playerEid, Health)
    addComponent(world, npcEid, NPC)
    addComponent(world, npcEid, HostileNPC)
    addComponent(world, npcEid, InBattle)
    addComponent(world, npcEid, Health)

    BattleState.isActive[playerEid] = 1
    Health.current[npcEid] = 0 // Enemy dies

    const battleSystem = createBattleSystem()
    battleSystem(world)

    // Battle should end
    expect(InBattle.eid[playerEid]).toBeUndefined()
    expect(InBattle.eid[npcEid]).toBeUndefined()
    expect(BattleState.isActive[playerEid]).toBe(0)

    // Enemy should be removed
    expect(HostileNPC.eid[npcEid]).toBeUndefined()
    expect(NPC.eid[npcEid]).toBeUndefined()
  })

  it('should calculate valid moves for player', () => {
    const world = createWorld<WorldProps>()
    const playerEid = addEntity(world)
    const npcEid = addEntity(world)

    // Set up battle state
    addComponent(world, playerEid, Player)
    addComponent(world, playerEid, Transform)
    addComponent(world, playerEid, InBattle)
    addComponent(world, playerEid, ValidActions)
    addComponent(world, npcEid, NPC)
    addComponent(world, npcEid, HostileNPC)
    addComponent(world, npcEid, InBattle)

    BattleState.isActive[playerEid] = 1
    BattleState.turn[playerEid] = 0 // Player's turn
    BattleState.playerPosition.x[playerEid] = 5 * CELL_SIZE
    BattleState.playerPosition.y[playerEid] = 5 * CELL_SIZE // Middle of grid
    BattleState.enemyPosition.x[playerEid] = 5 * CELL_SIZE
    BattleState.enemyPosition.y[playerEid] = 6 * CELL_SIZE // Adjacent above

    const battleSystem = createBattleSystem()
    battleSystem(world)

    // Should have valid moves in all directions plus attack option
    const validMoves = ValidActions.cells[playerEid]
    expect(validMoves).toHaveLength(5) // 4 movement directions + 1 attack position
    expect(validMoves).toContainEqual({ x: 5 * CELL_SIZE, y: 6 * CELL_SIZE }) // Attack position
  })
})
