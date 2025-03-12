<template>
    <div class="game-setup-config bg-white p-6 rounded-md shadow-lg dark:bg-gray-800 dark:text-white">
        <h2 class="text-lg font-bold mb-4 text-center dark:text-gray-100">Game Setup</h2>

        <div class="form-group mb-4">
            <label for="playerCount" class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Number of
                Players:</label>
            <select id="playerCount" v-model="localPlayerCount"
                class="shadow border rounded w-full p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="2">2 Players</option>
                <option value="3">3 Players</option>
                <option value="4">4 Players</option>
                <option value="5">5 Players</option>
                <option value="6">6 Players</option>
                <option value="7">7 Players</option>
                <option value="8">8 Players</option>
            </select>
        </div>

        <div class="form-group mb-4">
            <label for="startingMoney" class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Starting
                Money:</label>
            <input type="number" id="startingMoney" v-model.number="localStartingMoney"
                class="shadow border rounded w-full p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
        </div>

        <div class="form-buttons flex justify-end space-x-2">
            <button class="start-game-button bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                @click="startGame">
                Start Game
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
    initialPlayerCount: {
        type: Number,
        default: 4,
    },
    initialStartingMoney: {
        type: Number,
        default: 1500,
    },
});

const emit = defineEmits(['game-start', 'config-updated']);

const localPlayerCount = ref(props.initialPlayerCount);
const localStartingMoney = ref(props.initialStartingMoney);

const startGame = () => {
    emit('game-start', {
        playerCount: localPlayerCount.value,
        startingMoney: localStartingMoney.value,
    });
    emit('config-updated', { // Also emit config-updated event for immediate config update
        playerCount: localPlayerCount.value,
        startingMoney: localStartingMoney.value,
    });
};
</script>

<style scoped>
@reference "../style.css";

.game-setup-config {
    min-width: 400px;
    /* Example min width for the config modal */
}

.form-group label {
    display: block;
    /* Make labels block elements */
}

.form-group input[type="number"],
.form-group select {
    width: 100%;
    /* Make input and select full width */
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 0.375rem;
    /* rounded-md */
}

.start-game-button {
    @apply shadow-md;
    /* Example shadow for the start game button */
}
</style>