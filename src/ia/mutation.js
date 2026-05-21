export function mutate(genes) {
  const mutationRate = 0.08
  const mutationStep = 0.15
  const minValue = -2
  const maxValue = 2

  return genes.map(gene => {
    if (Math.random() < mutationRate) {
      const mutated = gene + (Math.random() * 2 - 1) * mutationStep
      return Math.max(minValue, Math.min(maxValue, mutated))
    }

    return Math.max(minValue, Math.min(maxValue, gene))
  })
}
