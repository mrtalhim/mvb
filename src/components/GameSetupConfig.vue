<template>
    <div class="game-setup-config bg-white p-6 rounded-md shadow-lg dark:bg-gray-800 dark:text-white">
        <h2 class="text-lg font-bold mb-4 text-center dark:text-gray-100">Game Setup</h2>

        <div class="form-group mb-4">
            <label for="playerCount" class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Number of
                Players:</label>
            <Slider id="playerCount" v-model="localPlayerCount" :min="2" :max="8" :step="1" label="Players"
                class="shadow border rounded w-full p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                :initialValue="props.initialPlayerCount" />

        </div>

        <div class="form-group mb-4">
            <label for="startingMoney" class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Starting
                Money:</label>
            <SliderTwo id="startingMoney" v-model="localStartingMoney" :min="1000" :max="5000" :step="100"
                label="Starting Money" />
        </div>

        <div class="form-group mb-4">
            <div class="flex items-center">
                <input type="checkbox" id="tabletopMode" v-model="localTabletopMode"
                    class="mr-2 form-checkbox h-5 w-5 text-blue-600 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                <label for="tabletopMode" class="text-gray-700 dark:text-gray-300 text-sm font-bold">Tabletop
                    Mode</label>
            </div>
        </div>


        <div class="form-buttons flex justify-end space-x-2">
            <button
                class="start-game-button bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-all"
                @click="startGame">
                Start Game
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import Slider from './Slider.vue';
import SliderTwo from './SliderTwo.vue';

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
const localTabletopMode = ref(true); // Default to true (on)

watch(localPlayerCount, (newCount) => console.log('Player count updated:', newCount));
watch(localStartingMoney, (newMoney) => console.log('Starting money updated:', newMoney));
watch(localTabletopMode, (newMode) => console.log('Tabletop mode updated:', newMode));

const startGame = () => {
    emit('game-start', {
        playerCount: localPlayerCount.value,
        startingMoney: localStartingMoney.value,
        tabletopMode: localTabletopMode.value, // Pass the tabletopMode value
    });
    emit('config-updated', {
        playerCount: localPlayerCount.value,
        startingMoney: localStartingMoney.value,
        tabletopMode: localTabletopMode.value,
    });
};
</script>

<style scoped>
@reference "../style.css";

.game-setup-config {
    @apply absolute z-50 max-w-[800px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center;
    /* Example min width for the config modal */
}

.form-group label {
    display: block;
    /* Make labels block elements */
}

.form-group input[type="number"],
.form-group .slider-container {
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
