<template>
  <GameSetupConfig v-if="!gameStarted" :initialPlayerCount="initialPlayerCount"
    :initialStartingMoney="initialStartingMoney" @game-start="onGameStart" @config-updated="updateConfig" />
  <!-- Render GameSetupConfig if game not started -->
  <TabletopLayout v-else :playerCount="playerCount" :startingMoney="startingMoney" />
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


// Function to handle 'game-start' event from GameSetupConfig
const onGameStart = (config) => {
  console.log("Game Start Event Received:", config); // Log game start config
  playerCount.value = config.playerCount;       // Update playerCount ref with selected value
  startingMoney.value = config.startingMoney;   // Update startingMoney ref with selected value
  gameStarted.value = true;                    // Set gameStarted to true to switch to TabletopLayout
};

const updateConfig = (config) => {
  // For immediate config update - in Version 1.5, we primarily use game-start for initial setup
  playerCount.value = parseInt(config.playerCount, 10);
  startingMoney.value = config.startingMoney;
  console.log("Config Updated:", config); // Log config update (optional)
};
</script>