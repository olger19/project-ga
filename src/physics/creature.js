import Matter from 'matter-js'

const {
  Bodies,
  Constraint,
  Composite,
  Body
} = Matter

export class Creature {

  constructor(world, x, y, genes) {

    this.world = world
    this.genes = genes

    this.time = 0

    this.createBody(x, y)
  }

  createBody(x, y) {

    // Cuerpo principal
    this.body = Bodies.rectangle(x, y, 60, 20, {
      friction: 0.8,
      render: {
        fillStyle: '#ff9800'
      }
    })
    // Pierna1
    this.leg1 = Bodies.rectangle(x - 20, y + 40, 10, 50, {
      friction: 1
    })
    // Pierna1
    this.leg2 = Bodies.rectangle(x + 20, y + 40, 10, 50, {
      friction: 1
    })

    this.joint1 = Constraint.create({
      bodyA: this.body,
      bodyB: this.leg1,
      pointA: { x: -20, y: 10 },
      pointB: { x: 0, y: -25 },
      stiffness: 0.9
    })

    this.joint2 = Constraint.create({
      bodyA: this.body,
      bodyB: this.leg2,
      pointA: { x: 20, y: 10 },
      pointB: { x: 0, y: -25 },
      stiffness: 0.9
    })

    Composite.add(this.world, [
      this.body,
      this.leg1,
      this.leg2,
      this.joint1,
      this.joint2
    ])
  }

  update() {

    this.time += 0.05

    const amplitude = this.genes[0]
    const frequency = this.genes[1]
    const force = this.genes[2]

    const angle1 =
      amplitude *
      Math.sin(frequency * this.time)

    const angle2 =
      amplitude *
      Math.sin(
        frequency * this.time + Math.PI
      )

    Body.setAngularVelocity(
      this.leg1,
      angle1 * force
    )

    Body.setAngularVelocity(
      this.leg2,
      angle2 * force
    )
  }

  getFitness() {
    return this.body.position.x
  }

  remove() {
    Composite.remove(this.world, this.body)
    Composite.remove(this.world, this.leg1)
    Composite.remove(this.world, this.leg2)
    Composite.remove(this.world, this.joint1)
    Composite.remove(this.world, this.joint2)
  }
}