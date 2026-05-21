import Matter from "matter-js";

const { Bodies, World } = Matter;

// Ground: Crea el suelo del juego
export function createGround(world) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const groundHeight = 40;
  const marginBottom = Math.round(height * 0.1);
  const centerY = height - marginBottom - groundHeight / 2;
  const groundTop = centerY - groundHeight / 2;

  const ground = Bodies.rectangle(width / 2, centerY, width * 3, groundHeight, {
    isStatic: true,
    render: {
      fillStyle: "#4caf50",
    },
  });

  World.add(world, ground);

  return {
    ground,
    groundTop,
    groundHeight,
  };
}
