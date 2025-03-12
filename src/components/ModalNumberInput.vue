<template>
    <div class="modal-overlay fixed inset-0 flex backdrop-blur-md items-center justify-center">
        <div class="modal-content bg-white p-6 rounded-md shadow-lg dark:bg-gray-800 dark:text-white"
            :style="modalRotationStyle">
            <div class="flex flex-row gap-2 mb-4 items-center justify-between">
                <WalletBoard :name="senderName" :balance="senderBalance" :walletColorClass="senderColor"
                    :expanded="expandedSender" @wallet-clicked="toggleExpandedSender" />
                <svg class="w-24 h-24 text-black dark:text-white" viewBox="0 0 100 100" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 50 L90 50 M90 50 L70 30 M90 50 L70 70" stroke="currentColor" stroke-width="8"
                        stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <WalletBoard :name="receiverName" :balance="receiverBalance" :walletColorClass="receiverColor"
                    :expanded="expandedReceiver" @wallet-clicked="toggleExpandedReceiver" />
            </div>
            <!-- <h2 class="text-lg font-bold mb-4 dark:text-gray-100">Enter Amount</h2>
                :expanded="expandedReceiver" @wallet-clicked="toggleExpandedReceiver"
            <p class="mb-2 dark:text-gray-200">Current Balance: ${{ senderBalance }}</p>
            <p class="mb-2 dark:text-gray-200">{{ transactionDescription }}</p> -->

            <div
                class="calculator-input-display bg-gray-100 p-2 rounded-md text-right font-bold mb-4 dark:bg-gray-700 dark:text-white">
                {{ formattedInputValue }}
            </div>

            <div class="calculator-grid grid grid-cols-3 gap-2">
                <button
                    class="calculator-button bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded py-2 font-bold transition-colors duration-200"
                    @click="appendValue('1')">1</button>
                <button
                    class="calculator-button bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded py-2 font-bold transition-colors duration-200"
                    @click="appendValue('2')">2</button>
                <button
                    class="calculator-button bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded py-2 font-bold transition-colors duration-200"
                    @click="appendValue('3')">3</button>
                <button
                    class="calculator-button bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded py-2 font-bold transition-colors duration-200"
                    @click="appendValue('4')">4</button>
                <button
                    class="calculator-button bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded py-2 font-bold transition-colors duration-200"
                    @click="appendValue('5')">5</button>
                <button
                    class="calculator-button bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded py-2 font-bold transition-colors duration-200"
                    @click="appendValue('6')">6</button>
                <button
                    class="calculator-button bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded py-2 font-bold transition-colors duration-200"
                    @click="appendValue('7')">7</button>
                <button
                    class="calculator-button bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded py-2 font-bold transition-colors duration-200"
                    @click="appendValue('8')">8</button>
                <button
                    class="calculator-button bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded py-2 font-bold transition-colors duration-200"
                    @click="appendValue('9')">9</button>
                <button
                    class="calculator-button bg-red-400 hover:bg-red-500 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded py-2 font-bold transition-colors duration-200"
                    @click="clearInput">C</button>
                <button
                    class="calculator-button bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded py-2 font-bold transition-colors duration-200"
                    @click="appendValue('0')">0</button>
                <button
                    class="calculator-button bg-yellow-400 hover:bg-yellow-500 dark:bg-yellow-700 dark:hover:bg-yellow-800 rounded py-2 font-bold transition-colors duration-200"
                    @click="backspaceInput">⌫</button>
            </div>

            <div class="modal-buttons flex justify-end space-x-2 mt-4">
                <button
                    class="confirm-button bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded dark:bg-green-700 dark:hover:bg-green-800"
                    @click="confirmInput">
                    Confirm
                </button>
                <button
                    class="cancel-button bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 transition-colors duration-200"
                    @click="cancelInput">
                    Cancel
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import WalletBoard from './WalletBoard.vue';

const props = defineProps({
    senderBalance: {
        type: Number,
        required: true,
    },
    receiverBalance: {
        type: Number,
        required: true,
    },
    transactionDescription: {
        type: String,
        required: true,
        default: '',
    },
    senderName: {      // New prop: senderName
        type: String,
        required: true,
    },
    receiverName: {    // New prop: receiverName
        type: String,
        required: true,
    },
    senderColor: {     // New prop: senderColor
        type: String,
        required: true,
    },
    receiverColor: {   // New prop: receiverColor
        type: String,
        required: true,
    },
    modalOrientation: {  // New prop: modalOrientation
        type: String,
        default: 'up',
        required: true,
    },
});

const emit = defineEmits(['confirm-value', 'cancel']);

const inputValue = ref('');

const formattedInputValue = computed(() => {
    const value = inputValue.value;
    if (!value) {
        return '0'; // Display '0' if input is empty
    }

    const number = parseInt(value, 10);
    if (isNaN(number)) {
        return '0'; // Return '0' if parsing fails (shouldn't happen with input masking, but for safety)
    }

    return number.toLocaleString('id'); // Use toLocaleString() to add thousand separators
});


const appendValue = (digit) => {
    if (inputValue.value === '0' && digit === '0') return;
    if (inputValue.value === '0' && digit !== '0') inputValue.value = digit;
    else inputValue.value += digit;
};

const clearInput = () => {
    inputValue.value = '';
};

const backspaceInput = () => {
    inputValue.value = inputValue.value.slice(0, -1);
    if (inputValue.value === '') inputValue.value = '';
};


const confirmInput = () => {
    const numericValue = parseInt(inputValue.value, 10);
    if (!isNaN(numericValue)) {
        // Emit confirm-value event AND pass senderName and receiverName in the payload
        emit('confirm-value', { amount: numericValue, senderName: props.senderName, receiverName: props.receiverName });
    } else {
        cancelInput();
    }
};

const cancelInput = () => {
    emit('cancel');
};

const modalRotationStyle = computed(() => { // NEW - modalContentRotationStyle computed property
    let rotation = 'rotate(0deg)';
    if (props.modalOrientation === 'down') {
        rotation = 'rotate(180deg)';
    } else if (props.modalOrientation === 'right') {
        rotation = 'rotate(-90deg)';
    } else if (props.modalOrientation === 'left') {
        rotation = 'rotate(90deg)';
    }
    return {
        transform: rotation,
    };
});

const expandedSender = ref(false);
const expandedReceiver = ref(false);

const toggleExpandedSender = () => {
    expandedSender.value = !expandedSender.value;
    expandedReceiver.value = false; // Collapse the other wallet
};

const toggleExpandedReceiver = () => {
    expandedReceiver.value = !expandedReceiver.value;
    expandedSender.value = false; // Collapse the other wallet
};

</script>

<style scoped>
@reference "../style.css";

.modal-overlay {
    z-index: 50;
    /* Dark mode background opacity and color are now in template using dark:bg-opacity-* and dark:bg-gray-* */
}

.modal-content {
    min-width: 300px;
    /* Dark mode background and text color are now in template using dark:bg-gray-* and dark:text-white */
}

/* We can remove background color from .modal-content in <style> as it's now in template with dark: variant */
.modal-content {
    /* No background color here anymore - defined in template with dark:bg-* */
    @apply p-6 rounded-md shadow-lg;
    /* Keep padding, rounded, shadow */
}

/* Input field dark mode styles are now in template using dark:bg-gray-*, dark:border-gray-*, dark:text-white */
.modal-content input[type="number"] {
    border: 1px solid #ccc;
    /* Light mode border fallback */
    padding: 0.5rem;
    border-radius: 0.375rem;
    /* rounded-md */
    width: 100%;
    margin-bottom: 1rem;
}


/* Button dark mode styles are now in template using dark:bg-*, dark:hover:bg-*, dark:text-* */
.confirm-button {
    /* Light mode button styles - background, hover, text are now in template and dark: variants */
    font-weight: bold;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    transition: background-color 0.2s ease;
    /* rounded */
}

.cancel-button {
    /* Light mode button styles - background, hover, text are now in template and dark: variants */
    font-weight: bold;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    transition: background-color 0.2s ease;
    /* rounded */
}

/* Add more modal styling as needed */
</style>
