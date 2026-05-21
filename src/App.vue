<template>
  <div class="scene-ui">
    <h1 class="title">Genetic Walker</h1>

    <div class="stats">
      <p>Generation: {{ generation }}</p>
      <p>Best Fitness: {{ bestFitness.toFixed(2) }}</p>
      <p>Current Individual: {{ currentIndividual }} / {{ populationSize }}</p>
      <p>Episode Time: {{ episodeTime.toFixed(2) }}s</p>
      <p>Current Fitness: {{ currentFitness.toFixed(2) }}</p>
      <p>Generation Avg Fitness: {{ generationAvgFitness.toFixed(2) }}</p>
    </div>

    <canvas id="world"></canvas>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { startSimulation } from "./scenes/simulation";

const generation = ref(0);
const bestFitness = ref(0);
const currentIndividual = ref(1);
const populationSize = ref(0);
const episodeTime = ref(0);
const currentFitness = ref(0);
const generationAvgFitness = ref(0);

// onMounted: Inicia la simulación cuando el componente se monta
onMounted(() => {
  startSimulation(generation, bestFitness, {
    currentIndividualRef: currentIndividual,
    populationSizeRef: populationSize,
    episodeTimeRef: episodeTime,
    currentFitnessRef: currentFitness,
    generationAvgFitnessRef: generationAvgFitness,
  });
});
</script>

<style>
body {
  margin: 0;
  overflow: hidden;
  background: #111;
  color: white;
  font-family: Arial;
}

.scene-ui {
  position: relative;
}

#app {
  width: 100% !important;
  max-width: none !important;
  margin: 0 !important;
  border: none !important;
  min-height: 100vh;
}

.title {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  margin: 0;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.35);
  color: #ffffff;
  font-size: 22px;
  letter-spacing: 0.2px;
}

.stats {
  position: absolute;
  top: 58px;
  left: 10px;
  z-index: 10;
  max-width: min(92vw, 360px);
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(34, 110, 255, 0.78);
  box-sizing: border-box;
}

.stats p {
  margin: 0 0 4px 0;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.stats p:last-child {
  margin-bottom: 0;
}

@media (max-width: 640px) {
  .title {
    top: 8px;
    right: 8px;
    font-size: 16px;
    padding: 6px 9px;
  }

  .stats {
    top: 42px;
    left: 8px;
    right: 8px;
    max-width: none;
    padding: 8px 10px;
    font-size: 13px;
  }
}
</style>
