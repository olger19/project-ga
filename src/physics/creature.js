import Matter from "matter-js";

const { Bodies, Constraint, Composite, Body } = Matter;

// ─── Arquitectura de política ─────────────────────────────────────────────────
//  OBSERVATION_SIZE subió 8 → 10 por las señales CPG.
//     Actualizar en el GA: GENE_SIZE = OBSERVATION_SIZE * ACTION_SIZE + ACTION_SIZE = 44
export const OBSERVATION_SIZE = 10;
export const ACTION_SIZE      = 4;
export const GENE_SIZE        = OBSERVATION_SIZE * ACTION_SIZE + ACTION_SIZE; // 44

// ─── Generador Central de Patrones (CPG) ─────────────────────────────────────
// Sin esta señal la política solo reacciona a su propio estado ruidoso
// y nunca converge a un patrón rítmico estable.
// Con sin/cos el gen puede aprender a sincronizar las piernas con un "reloj" externo.
const CPG_FREQ = 1.8; // frecuencia del oscilador (ajustable)

// ─── Límites angulares de cada articulación (rad, relativo al segmento padre) ─
const HIP_ANGLE_RANGE = 0.72; // cadera: ±0.72 rad (~41°)
const KNEE_ANGLE_MIN  = 0.0;  // rodilla extendida
const KNEE_ANGLE_MAX  = 1.25; // rodilla doblada (~72°) — solo dobla hacia adelante

// ─── Controlador PD — ganancias calibradas para eliminar temblores ────────────
//
//  El temblor ocurre porque con KP alto el controlador aplica una corrección
//  grande cada frame → el joint sobrepasa el target → error se invierte →
//  corrección inversa → oscilación de alta frecuencia = temblor.
//
//  Solución: KP más bajo (corrección suave) + KD alto (amortiguación fuerte).
//
const KP_HIP  = 4.5;  // era 10.0 — corrección más gradual
const KP_KNEE = 3.5;  // era  8.0
const KD      = 0.95; // era  0.6 — amortiguación más fuerte (menos rebote)

// ─── Velocidades angulares máximas ───────────────────────────────────────────
const MAX_HIP_SPEED  = 0.38;
const MAX_KNEE_SPEED = 0.52;

// ─── Suavizado temporal de targets ───────────────────────────────────────────
// Con 0.12 el target sigue al valor deseado lentamente (constante τ ≈ 8 pasos).
// Evita que cambios bruscos de la política se traduzcan en sacudidas físicas.
const ACTION_SMOOTHING = 0.12; // era 0.25

// ─── Límite de giro del torso ─────────────────────────────────────────────────
const MAX_BODY_ANGULAR_SPEED = 0.28;

const CREATURE_COLORS = {
  body:  "#ff7043",
  thigh: "#42a5f5", // Muslo
  calf:  "#26a69a", // Pierna
  joint: "#eceff1",
};

export class Creature {
  constructor(world, x, y, genes) {
    this.world  = world;
    this.genes  = genes;
    this.startX = x;
    this.startY = y;
    this.time   = 0;
    this.steps  = 0;

    this.cumulativeTilt   = 0;
    this.cumulativeYDrift = 0;
    this.cumulativeEffort = 0;
    this.cumulativeSpin   = 0;
    this.fallCount        = 0;
    this.bodyGroundContactCount = 0;
    this.bodyRollCount = 0;
    this.cumulativeJitter = 0;
    this.cumulativeKneeJitter = 0;
    this.prevRelKnee1 = 0;
    this.prevRelKnee2 = 0;

    // Targets previos suavizados — posición neutral al arrancar
    this.prevTargets = [0, 0, KNEE_ANGLE_MAX * 0.3, KNEE_ANGLE_MAX * 0.3];

    this.createBody(x, y);
  }

  // ── Observación con CPG ───────────────────────────────────────────────────
  //
  //  [0-1]  velocidad lineal del torso
  //  [2-3]  ángulo e velocidad angular del torso
  //  [4-5]  ángulos de cadera izquierda/derecha RELATIVOS al torso
  //  [6-7]  ángulos de rodilla izquierda/derecha RELATIVOS al muslo
  //  [8-9]  sin/cos del tiempo → reloj rítmico para sincronizar pasos ← NUEVO
  //
  getObservation() {
    return [
      this.body.velocity.x / 10,
      this.body.velocity.y / 10,
      this.body.angle,
      this.body.angularVelocity,
      this.leg1.angle  - this.body.angle,   // cadera izq. relativa al torso
      this.leg2.angle  - this.body.angle,   // cadera der. relativa al torso
      this.calf1.angle - this.leg1.angle,   // rodilla izq. relativa al muslo
      this.calf2.angle - this.leg2.angle,   // rodilla der. relativa al muslo
      Math.sin(this.time * CPG_FREQ),       // ← oscilador A (fase 0°)
      Math.cos(this.time * CPG_FREQ),       // ← oscilador B (fase 90°)
    ];
  }

  // Política lineal con activación tanh (red de una capa)
  policyAction(observation, actionIndex) {
    const weightOffset = actionIndex * OBSERVATION_SIZE;
    const biasOffset   = OBSERVATION_SIZE * ACTION_SIZE;
    let sum = this.genes[biasOffset + actionIndex] || 0;
    for (let i = 0; i < OBSERVATION_SIZE; i++) {
      sum += (this.genes[weightOffset + i] || 0) * observation[i];
    }
    return Math.tanh(sum);
  }

  createBody(x, y) {
    this.body = Bodies.rectangle(x, y, 60, 20, {
      friction: 0.8,
      render: { fillStyle: CREATURE_COLORS.body },
    });
    this.leg1 = Bodies.rectangle(x - 20, y + 40, 10, 50, {
      friction: 1,
      render: { fillStyle: CREATURE_COLORS.thigh },
    });
    this.leg2 = Bodies.rectangle(x + 20, y + 40, 10, 50, {
      friction: 1,
      render: { fillStyle: CREATURE_COLORS.thigh },
    });
    this.calf1 = Bodies.rectangle(x - 20, y + 90, 9, 45, {
      friction: 1,
      render: { fillStyle: CREATURE_COLORS.calf },
    });
    this.calf2 = Bodies.rectangle(x + 20, y + 90, 9, 45, {
      friction: 1,
      render: { fillStyle: CREATURE_COLORS.calf },
    });

    this.joint1 = Constraint.create({
      bodyA: this.body,  bodyB: this.leg1,
      pointA: { x: -20, y: 10 }, pointB: { x: 0, y: -25 },
      stiffness: 0.9, render: { strokeStyle: CREATURE_COLORS.joint, lineWidth: 2 },
    });
    this.joint2 = Constraint.create({
      bodyA: this.body,  bodyB: this.leg2,
      pointA: { x:  20, y: 10 }, pointB: { x: 0, y: -25 },
      stiffness: 0.9, render: { strokeStyle: CREATURE_COLORS.joint, lineWidth: 2 },
    });
    this.knee1 = Constraint.create({
      bodyA: this.leg1, bodyB: this.calf1,
      pointA: { x: 0, y: 25 }, pointB: { x: 0, y: -22 },
      stiffness: 0.8, render: { strokeStyle: CREATURE_COLORS.joint, lineWidth: 2 },
    });
    this.knee2 = Constraint.create({
      bodyA: this.leg2, bodyB: this.calf2,
      pointA: { x: 0, y: 25 }, pointB: { x: 0, y: -22 },
      stiffness: 0.8, render: { strokeStyle: CREATURE_COLORS.joint, lineWidth: 2 },
    });

    Composite.add(this.world, [
      this.body, this.leg1, this.leg2, this.calf1, this.calf2,
      this.joint1, this.joint2, this.knee1, this.knee2,
    ]);
  }

  update() {
    this.time  += 0.05;
    this.steps += 1;

    const obs = this.getObservation();

    // ── 1. Política → ángulos objetivo (no velocidades) ──────────────────────
    //
    //  Caderas:  tanh ∈ [-1, 1]  →  target ∈ [-HIP_ANGLE_RANGE, +HIP_ANGLE_RANGE]
    //  Rodillas: tanh ∈ [-1, 1]  →  (tanh+1)/2 ∈ [0, 1]  →  target ∈ [0, KNEE_MAX]
    //            (rodilla solo dobla en un sentido — como una rodilla real)
    //
    const rawTargets = [
      this.policyAction(obs, 0) * HIP_ANGLE_RANGE,
      this.policyAction(obs, 1) * HIP_ANGLE_RANGE,
      ((this.policyAction(obs, 2) + 1) / 2) * KNEE_ANGLE_MAX,
      ((this.policyAction(obs, 3) + 1) / 2) * KNEE_ANGLE_MAX,
    ];

    // ── 2. Low-pass filter temporal sobre los targets ─────────────────────────
    //  Evita que un cambio brusco en la salida de la política se traduzca
    //  inmediatamente en un movimiento brusco de la articulación.
    const previousTargets = [...this.prevTargets];
    const targets = rawTargets.map((t, i) =>
      this.prevTargets[i] * (1 - ACTION_SMOOTHING) + t * ACTION_SMOOTHING
    );
    this.prevTargets = targets;
    this.cumulativeJitter += targets.reduce(
      (acc, target, i) => acc + Math.abs(target - previousTargets[i]),
      0
    );

    // ── 3. Controlador PD por articulación ────────────────────────────────────
    //
    //  v = tanh( Kp × (target - ángulo_actual)  −  Kd × velocidad_actual ) × MAX
    //
    //  • Kp × error:        empuja hacia el target (suavemente con Kp bajo)
    //  • Kd × velocidad:    frena si ya se mueve → evita rebote/tremblor
    //  • tanh():            limita suavemente a [-1, 1]
    //  • Cuando error ≈ 0:  v ≈ 0 → el joint se detiene solo (no gira infinito)
    //
    const relHip1  = this.leg1.angle  - this.body.angle;
    const relHip2  = this.leg2.angle  - this.body.angle;
    const relKnee1 = this.calf1.angle - this.leg1.angle;
    const relKnee2 = this.calf2.angle - this.leg2.angle;

    this.cumulativeKneeJitter +=
      Math.abs(relKnee1 - this.prevRelKnee1) +
      Math.abs(relKnee2 - this.prevRelKnee2);
    this.prevRelKnee1 = relKnee1;
    this.prevRelKnee2 = relKnee2;

    const avHip1  = Math.tanh(KP_HIP  * (targets[0] - relHip1)  - KD * this.leg1.angularVelocity)  * MAX_HIP_SPEED;
    const avHip2  = Math.tanh(KP_HIP  * (targets[1] - relHip2)  - KD * this.leg2.angularVelocity)  * MAX_HIP_SPEED;
    const avKnee1 = Math.tanh(KP_KNEE * (targets[2] - relKnee1) - KD * this.calf1.angularVelocity) * MAX_KNEE_SPEED;
    const avKnee2 = Math.tanh(KP_KNEE * (targets[3] - relKnee2) - KD * this.calf2.angularVelocity) * MAX_KNEE_SPEED;

    Body.setAngularVelocity(this.leg1,  avHip1);
    Body.setAngularVelocity(this.leg2,  avHip2);
    Body.setAngularVelocity(this.calf1, avKnee1);
    Body.setAngularVelocity(this.calf2, avKnee2);

    // ── 4. Hard clamp de articulaciones (segunda línea de defensa) ─────────────
    //  Si Matter.js acumula error numérico y el ángulo sale del rango físico,
    //  lo fuerza de vuelta Y ajusta velocidad para movimiento fluido en el límite.
    this._clampJoint(this.leg1,  this.body,  -HIP_ANGLE_RANGE,  HIP_ANGLE_RANGE);
    this._clampJoint(this.leg2,  this.body,  -HIP_ANGLE_RANGE,  HIP_ANGLE_RANGE);
    this._clampJoint(this.calf1, this.leg1,   KNEE_ANGLE_MIN,   KNEE_ANGLE_MAX);
    this._clampJoint(this.calf2, this.leg2,   KNEE_ANGLE_MIN,   KNEE_ANGLE_MAX);

    // ── 5. Limitar giro del torso ──────────────────────────────────────────────
    if (Math.abs(this.body.angularVelocity) > MAX_BODY_ANGULAR_SPEED) {
      Body.setAngularVelocity(
        this.body,
        Math.sign(this.body.angularVelocity) * MAX_BODY_ANGULAR_SPEED
      );
    }

    // ── 6. Métricas acumuladas ────────────────────────────────────────────────
    this.cumulativeTilt   += Math.abs(this.body.angle);
    this.cumulativeYDrift += Math.abs(this.body.position.y - this.startY);
    this.cumulativeSpin   += Math.abs(this.body.angularVelocity);
    this.cumulativeEffort +=
      Math.abs(avHip1) + Math.abs(avHip2) + Math.abs(avKnee1) + Math.abs(avKnee2);

    if (Math.abs(this.body.angle) > 1.1 || this.body.position.y > this.startY + 45) {
      this.fallCount += 1;
    }

    // Torso muy bajo: está arrastrando/chocando con el suelo.
    if (this.body.position.y > this.startY + 35) {
      this.bodyGroundContactCount += 1;
    }

    // Torso rodando: inclinación grande y giro alto al mismo tiempo.
    if (Math.abs(this.body.angle) > 0.95 && Math.abs(this.body.angularVelocity) > 0.18) {
      this.bodyRollCount += 1;
    }
  }

  // ── Hard clamp suavizado ─────────────────────────────────────────────────
  //  Cuando el joint llega al límite, iguala su velocidad a la del padre.
  //  Esto evita el "golpe" brusco que ocurre si simplemente se pone velocidad=0.
  _clampJoint(childBody, parentBody, minAngle, maxAngle) {
    const relAngle = childBody.angle - parentBody.angle;
    if (relAngle < minAngle) {
      Body.setAngle(childBody, parentBody.angle + minAngle);
      if (childBody.angularVelocity < parentBody.angularVelocity) {
        Body.setAngularVelocity(childBody, parentBody.angularVelocity);
      }
    } else if (relAngle > maxAngle) {
      Body.setAngle(childBody, parentBody.angle + maxAngle);
      if (childBody.angularVelocity > parentBody.angularVelocity) {
        Body.setAngularVelocity(childBody, parentBody.angularVelocity);
      }
    }
  }

  // ── Fitness ───────────────────────────────────────────────────────────────
  //  Distancia recorrida menos penalización por caídas y postura inclinada.
  //  Recomendado sobre solo position.x — incentiva mantenerse erguido.
  getFitness() {
    const distance    = this.body.position.x - this.startX;
    const fallPenalty = this.fallCount * 2.5;
    const tiltPenalty = (this.cumulativeTilt / this.steps) * 0.6;
    return Math.max(0, distance - fallPenalty - tiltPenalty);
  }

  remove() {
    Composite.remove(this.world, this.body);
    Composite.remove(this.world, this.leg1);
    Composite.remove(this.world, this.leg2);
    Composite.remove(this.world, this.calf1);
    Composite.remove(this.world, this.calf2);
    Composite.remove(this.world, this.joint1);
    Composite.remove(this.world, this.joint2);
    Composite.remove(this.world, this.knee1);
    Composite.remove(this.world, this.knee2);
  }
}
