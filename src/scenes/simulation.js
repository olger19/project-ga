import { createWorld } from '../physics/world.js'
import { createGround } from '../physics/ground'
import { Creature } from '../physics/creature'

import { GeneticAlgorithm }  from '../ia/geneticAlgorithm.js'

const POPULATION_SIZE = 20
const SIMULATION_TIME = 1000

export function startSimulation(
  generationRef,
  bestFitnessRef
) {

  const { world } = createWorld()

  createGround(world)

  const ga = new GeneticAlgorithm()

  let creatures = []
  let generation = 0

  function randomGenes() {

    return [
      Math.random() * 0.1,
      Math.random() * 2,
      Math.random() * 0.05
    ]
  }

  function createPopulation(genesArray = null) {

    creatures = []

    for (let i = 0; i < POPULATION_SIZE; i++) {

      const genes =
        genesArray
          ? genesArray[i]
          : randomGenes()

      const creature =
        new Creature(
          world,
          200,
          500,
          genes
        )

      creatures.push(creature)
    }
  }

  createPopulation()

  let ticks = 0

  setInterval(() => {

    creatures.forEach(creature => {
      creature.update()
    })

    ticks++

    if (ticks > SIMULATION_TIME) {

      const evaluated =
        creatures.map(creature => ({
          genes: creature.genes,
          fitness: creature.getFitness()
        }))

      evaluated.sort(
        (a, b) => b.fitness - a.fitness
      )

      bestFitnessRef.value =
        evaluated[0].fitness

      generation++

      generationRef.value = generation

      const nextGenes =
        ga.nextGeneration(evaluated)

      creatures.forEach(c => c.remove())

      createPopulation(nextGenes)

      ticks = 0
    }

  }, 16)
}