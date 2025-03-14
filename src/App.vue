<template>
  <GameSetupConfig v-if="!gameStarted" :initialPlayerCount="initialPlayerCount"
    :initialStartingMoney="initialStartingMoney" @game-start="onGameStart" @config-updated="updateConfig" />
  <!-- Render GameSetupConfig if game not started -->
  <TabletopLayout v-else :playerCount="playerCount" :startingMoney="startingMoney" :tabletopMode="tabletopMode"
    @restart-game="onRestartGame" />
</template>

<script setup>
import TabletopLayout from './views/TabletopLayout.vue';
import GameSetupConfig from './components/GameSetupConfig.vue'; // Import GameSetupConfig Component  <- NEW IMPORT
import { ref } from 'vue';

// Reactive Data for Game Setup
const gameStarted = ref(false); // Ref to track if game has started - Initially false
const playerCount = ref(4);     // Ref for selected player count - Default 4
const startingMoney = ref(1500); // Ref for selected starting money - Default 1500
const initialPlayerCount = ref(4); // Refs for initial values - for props to GameSetupConfig
const initialStartingMoney = ref(1500); // Refs for initial values - for props to GameSetupConfig
const tabletopMode = ref(true); // Default to true (on)

// Function to handle 'game-start' event from GameSetupConfig
const onGameStart = (config) => {
  console.log("Game Start Event Received:", config);
  playerCount.value = config.playerCount;
  startingMoney.value = config.startingMoney;
  tabletopMode.value = config.tabletopMode; // Update tabletopMode ref
  gameStarted.value = true;
};

const updateConfig = (config) => {
  playerCount.value = parseInt(config.playerCount, 10);
  startingMoney.value = config.startingMoney;
  tabletopMode.value = config.tabletopMode; // Update tabletopMode ref
  console.log("Config Updated:", config);
};

// +++ NEW FUNCTION - Restart Event Handler
const onRestartGame = () => {
  console.log("Restart Game Event Received");
  gameStarted.value = false;
};
</script>