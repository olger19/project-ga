import { tournamentSelection } from "./selection";
import { crossover } from "./crossover";
import { mutate } from "./mutation";
import { POLICY_GENE_SIZE } from "../physics/creature";

export class GeneticAlgorithm {
  constructor() {
    this.hcEliteRatio = 0.15;
    this.hcNeighborsPerElite = 2;
    this.hcStepSize = 0.08;
  }

  hillClimbNeighbors(genes) {
    const neighbors = [];

    for (let i = 0; i < this.hcNeighborsPerElite; i++) {
      const index = Math.floor(Math.random() * genes.length);
      const direction = Math.random() < 0.5 ? -1 : 1;
      const stepScale = index < POLICY_GENE_SIZE ? 1 : 0.4;
      const step = direction * this.hcStepSize * stepScale * (0.5 + Math.random());

      const neighbor = [...genes];
      neighbor[index] = neighbor[index] + step;
      neighbors.push(neighbor);
    }

    return neighbors;
  }

  nextGeneration(population) {
    population.sort((a, b) => b.fitness - a.fitness);

    const newPopulation = [];

    // Elitismo
    newPopulation.push(population[0].genes);

    while (newPopulation.length < population.length) {
      const parentA = tournamentSelection(population);

      const parentB = tournamentSelection(population);

      let child = crossover(parentA.genes, parentB.genes);

      child = mutate(child);

      newPopulation.push(child);
    }

    const eliteCount = Math.max(
      1,
      Math.floor(population.length * this.hcEliteRatio),
    );

    for (let i = 0; i < eliteCount; i++) {
      const eliteGenes = population[i].genes;
      const hcCandidates = this.hillClimbNeighbors(eliteGenes);

      for (const candidate of hcCandidates) {
        if (newPopulation.length >= population.length) break;
        newPopulation.push(candidate);
      }
    }

    // Mantener tamano fijo de la poblacion.
    newPopulation.length = population.length;

    return newPopulation;
  }
}
