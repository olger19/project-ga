import Matter from "matter-js";

const { Bodies, World } = Matter;

// Ground: Crea el suelo del juego
export function createGround(world) {
  const ground = Bodies.rectangle(1000, 700, 3000, 40, {
    isStatic: true,
    render: {
      fillStyle: "#4caf50",
    },
  });

  World.add(world, ground);
}
