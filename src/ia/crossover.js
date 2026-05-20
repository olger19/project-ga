export function crossover(parentA, parentB) {
  const point = Math.floor(Math.random() * parentA.length);

  const child = [...parentA.slice(0, point), ...parentB.slice(point)];

  return child;
}
