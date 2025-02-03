import { addComponent, addEntity } from 'bitecs'

import { Debug, Named, Scene } from '../components'
import type { World } from '../types'

interface CreateSceneOptions {
  initialScene: string
}

export function createScene(world: World, options: CreateSceneOptions) {
  const eid = addEntity(world)

  // Add scene components
  addComponent(world, eid, Scene, Named, Debug)

  // Set scene values - use index 0 for global state
  Scene.current[0] = options.initialScene
  Scene.isTransitioning[eid] = 0
  Scene.next[0] = ''
  Scene.transitionProgress[eid] = 0

  // Set name
  Named.name[eid] = 'Scene Manager'

  return eid
}
