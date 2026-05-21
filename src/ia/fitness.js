export function evaluateFitness(creature) {
  const startX = creature.startX ?? 0;
  const currentX = creature.body.position.x;
  const deltaX = currentX - startX;

  const forwardReward = Math.max(0, deltaX) * 2.5;
  const leftPenalty = deltaX < 0 ? Math.abs(deltaX) * 8 : 0;

  const steps = Math.max(1, creature.steps || 1);
  const avgTiltPenalty = ((creature.cumulativeTilt || 0) / steps) * 35;
  const avgSpinPenalty = ((creature.cumulativeSpin || 0) / steps) * 35;
  const avgYDriftPenalty = ((creature.cumulativeYDrift || 0) / steps) * 1.2;
  const effortPenalty = ((creature.cumulativeEffort || 0) / steps) * 1.5;
  const jitterPenalty = ((creature.cumulativeJitter || 0) / steps) * 18;
  const kneeJitterPenalty = ((creature.cumulativeKneeJitter || 0) / steps) * 22;
  const fallPenalty = (creature.fallCount || 0) * 10;
  const bodyGroundPenalty = ((creature.bodyGroundContactCount || 0) / steps) * 55;
  const bodyRollPenalty = ((creature.bodyRollCount || 0) / steps) * 120;

  return (
    forwardReward -
    leftPenalty -
    avgTiltPenalty -
    avgSpinPenalty -
    avgYDriftPenalty -
    effortPenalty -
    jitterPenalty -
    kneeJitterPenalty -
    fallPenalty -
    bodyGroundPenalty -
    bodyRollPenalty
  );
}
