<template>
  <div class="app-container">
    <GameSetupConfig v-if="!gameStarted" :initialPlayerCount="initialPlayerCount"
      :initialStartingMoney="initialStartingMoney" @game-start="onGameStart" @config-updated="updateConfig"
      ref="gameConfig" />
    <!-- Render GameSetupConfig if game not started -->
    <TabletopLayout v-else :playerCount="playerCount" :startingMoney="startingMoney" :tabletopMode="tabletopMode"
      @restart-game="onRestartGame" ref="tabletopLayout" />
  </div>
</template>

<script setup>
import TabletopLayout from './views/TabletopLayout.vue';
import GameSetupConfig from './components/GameSetupConfig.vue';
import { ref, onMounted, nextTick } from 'vue';
import { gsap } from 'gsap';

// Reactive Data for Game Setup
const gameStarted = ref(false);
const playerCount = ref(4);
const startingMoney = ref(1500);
const initialPlayerCount = ref(4);
const initialStartingMoney = ref(1500);
const tabletopMode = ref(true);

// Refs for GSAP
const gameConfig = ref(null);
const tabletopLayout = ref(null);

// Function to handle 'game-start' event from GameSetupConfig
const onGameStart = async (config) => {
  console.log("Game Start Event Received:", config);
  playerCount.value = config.playerCount;
  startingMoney.value = config.startingMoney;
  tabletopMode.value = config.tabletopMode;

  // Animate the exit of GameSetupConfig
  await animateConfigExit();

  gameStarted.value = true;

  // Animate the entrance of TabletopLayout
  await nextTick(); // Wait for TabletopLayout to be rendered
  animateTabletopEntrance();
};

const updateConfig = (config) => {
  playerCount.value = parseInt(config.playerCount, 10);
  startingMoney.value = config.startingMoney;
  tabletopMode.value = config.tabletopMode;
  console.log("Config Updated:", config);
};

// +++ NEW FUNCTION - Restart Event Handler
const onRestartGame = async () => {
  console.log("Restart Game Event Received");
  // Animate the exit of TabletopLayout
  await animateTabletopExit();

  gameStarted.value = false;

  // Animate the entrance of GameSetupConfig
  await nextTick(); // Wait for GameSetupConfig to be rendered
  animateConfigEntrance();
};

// --- Animation Functions ---

const animateConfigEntrance = () => {
  const tl = gsap.timeline();
};

const animateConfigExit = () => {
  return gsap.to(gameConfig.value.$el, {
    opacity: 0,
    y: -50,
    duration: 0.5,
    ease: 'power2.out',
  });
};

const animateTabletopEntrance = () => {
  gsap.from(tabletopLayout.value.$el, {
    opacity: 0,
    y: 50,
    duration: 0.5,
    ease: 'power2.out',
  });
};

const animateTabletopExit = () => {
  return gsap.to(tabletopLayout.value.$el, {
    opacity: 0,
    y: -50,
    duration: 0.5,
    ease: 'power2.out',
  });
};

onMounted(() => {
  // Animate the config panel entrance
  animateConfigEntrance();
});
</script>

<style scoped>
.app-container {
  position: relative;
  width: 100vw;
  height: 100vh;
}
</style>
