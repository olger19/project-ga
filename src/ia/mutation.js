import { POLICY_GENE_SIZE, GENE_SIZE } from "../physics/creature";

export function mutate(genes) {
  const mutationRate = 0.08
  const policyMutationStep = 0.15
  const controlMutationStep = 0.05
  const minValue = -2
  const maxValue = 2

  return genes.slice(0, GENE_SIZE).map((gene, index) => {
    const step = index < POLICY_GENE_SIZE ? policyMutationStep : controlMutationStep

    if (Math.random() < mutationRate) {
      const mutated = gene + (Math.random() * 2 - 1) * step
      return Math.max(minValue, Math.min(maxValue, mutated))
    }

    return Math.max(minValue, Math.min(maxValue, gene))
  })
}
