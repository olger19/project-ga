import Matter from 'matter-js'

const {
  Engine,
  Render,
  Runner,
  World
} = Matter

// createWorld: Inicializa el motor de física y el renderizado
export function createWorld() {

  const engine = Engine.create()

  const canvas = document.getElementById('world')

  const render = Render.create({
    canvas,
    engine,
    options: {
      width: window.innerWidth,
      height: window.innerHeight,
      wireframes: false,
      background: '#222'
    }
  })

  Render.run(render)

  const runner = Runner.create()
  Runner.run(runner, engine)

  return {
    engine,
    world: engine.world
  }
}