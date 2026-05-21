# Genetic Walker (Vue + Matter.js + Genetic Algorithm)

Proyecto de simulacion de un caminante bipedo usando:
- Vue 3 + Vite para la interfaz
- Matter.js para la fisica
- Algoritmo genetico para evolucionar el control del bipedo

## Requisitos
- Node.js 18 o superior
- npm

## Instalacion
```bash
npm install
```

## Ejecucion
```bash
npm run dev
```

## Estructura principal
- `src/scenes/simulation.js`: ciclo de simulacion, evaluacion por episodios y avance de generaciones.
- `src/physics/creature.js`: definicion del bipedo, articulaciones y controlador.
- `src/physics/ground.js`: configuracion del suelo.
- `src/ia/fitness.js`: funcion de fitness (recompensas y penalizaciones).
- `src/ia/geneticAlgorithm.js`: seleccion, cruce, mutacion y elitismo.

## Integrantes
1. Olger Quispe Vilca
2. Jorge Olivera Ticona
3. Juan Quispe Luque
