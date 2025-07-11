<template>
    <div class="p-4 flex flex-col bg-gray-100 h-svh items-center" @dragover.prevent>
        <div class="w-full pb-4 justify-center flex flex-row gap-4">
            <button @click="toggleTransactionLogModal"
                class="bg-blue-500 hover:bg-blue-700 hover:shadow-md transition-all text-white font-bold py-2 px-4 rounded">History</button>
            <button @click="openRestartConfirmationModal" class="bg-blue-500 hover:bg-blue-700 hover:shadow-md transition-all text-white font-bold py-2 px-4
                rounded">Restart</button>
        </div>

        <div class="tabletop-layout w-full flex-1 gap-2">
            <!-- Bank Wallet -->
            <div class="bank-area mb-4">
                <WalletBoard name="Bank" :balance="bankBalance" isBank @transaction-requested="handleTransactionRequest"
                    draggable="true" @dragover.prevent @dragenter.prevent ref="bankWalletRef" />
            </div>

            <div class="layout-grid grid h-full">
                <!-- Show fallback message if layout config doesn't exist -->
                <div v-if="!layoutConfig[playerCount]" class="col-span-full">
                    <p class="text-red-500 text-center">Layout not configured for {{ playerCount }} players.</p>
                </div>

                <!-- Otherwise render player cells using the layout config -->
                <template v-else>
                    <div v-for="(element, index) in layoutConfig[playerCount]" :key="element.playerNum"
                        class="player-cell justify-center flex" :class="element.cellClass">
                        <WalletBoard :name="`Player ${element.playerNum}`"
                            :balance="players[element.playerNum - 1]?.balance || 0"
                            @transaction-requested="handleTransactionRequest" :orientation="element.orientation"
                            draggable="true" @dragover.prevent
                            @dragenter.prevent @wallet-clicked="handleWalletClicked"
                            :expanded="expandedWallets.has(`Player ${element.playerNum}`)"
                            :ref="(el) => setPlayerWalletRef(el, element.playerNum)"
                            :allowsRotation="props.tabletopMode" />
                    </div>
                </template>
            </div>

            <!-- Tax Wallet -->
            <div class="tax-area mt-4">
                <WalletBoard name="Tax" :balance="taxBalance" isTax @transaction-requested="handleTransactionRequest"
                    draggable="true" @dragover.prevent @dragenter.prevent :expanded="expandedWallets.has('Tax')"
                    @wallet-clicked="handleWalletClicked" ref="taxWalletRef" />
            </div>

            <!-- Modal Number Input (remains same) -->
            <Transition @before-enter="beforeEnterModal" @enter="enterModal" @leave="leaveModal">
                <ModalNumberInput v-if="isModalVisible" :senderBalance="selectedWalletBalance"
                    :receiverBalance="receiverWalletBalance" :senderName="senderWalletName"
                    :senderColor="senderWalletColor" :receiverName="receiverWalletName"
                    :receiverColor="receiverWalletColor" @confirm-value="handleConfirmValue" @cancel="handleCancelModal"
                    :modalOrientation="selectedWalletOrientation" />
            </Transition>

            <!-- Transaction Log Modal -->
            <Transition @before-enter="beforeEnterModal" @enter="enterModal" @leave="leaveModal">
                <div v-if="isTransactionLogModalVisible"
                    class="modal-overlay fixed inset-0 flex items-center justify-center z-50">
                    <div
                        class="modal-content bg-white p-6 rounded-md shadow-lg dark:bg-gray-800 dark:text-white w-full h-full max-w-screen-xl max-h-screen">
                        <button @click="toggleTransactionLogModal"
                            class="absolute top-4 right-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Close</button>
                        <TransactionLog :transactions="transactionLog" />
                    </div>
                </div>
            </Transition>

            <Transition @before-enter="beforeEnterModal" @enter="enterModal" @leave="leaveModal">
                <div v-if="isRestartConfirmationModalVisible"
                    class="modal-overlay fixed inset-0 flex items-center justify-center z-50">
                    <div class="modal-content bg-white p-6 rounded-md shadow-lg dark:bg-gray-800 dark:text-white">
                        <h3 class="text-lg font-bold mb-4">Confirm Restart</h3>
                        <p class="mb-4">Are you sure you want to restart the game? All progress will be lost.</p>
                        <div class="modal-buttons flex justify-end space-x-2">
                            <button
                                class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded dark:bg-green-700 dark:hover:bg-green-800"
                                @click="restartGame">
                                Yes, Restart
                            </button>
                            <button
                                class="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 transition-colors duration-200"
                                @click="closeRestartConfirmationModal">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, provide, toRef, watch, computed, nextTick } from 'vue';
import WalletBoard from '../components/WalletBoard.vue';
import ModalNumberInput from '../components/ModalNumberInput.vue';
import TransactionLog from '../components/TransactionLog.vue';
import { useModalTransition } from '../composables/useModalTransition.js';

// Import Composables
import { usePlayers } from '../composables/usePlayers';
import { useLayout } from '../composables/useLayout';

const emit = defineEmits(['restart-game']);
import { useTransactionLog } from '../composables/useTransactionLog';
import { useBankAndTax } from '../composables/useBankAndTax';
import { useTransactions } from '../composables/useTransactions';
import { useDraggableWallets } from '../composables/useDraggableWallets';
import { useModals } from '../composables/useModals';
import { useWalletExpansion } from '../composables/useWalletExpansion';

const { beforeEnterModal, enterModal, leaveModal } = useModalTransition();

const props = defineProps({
    playerCount: {
        type: Number,
        required: true,
        default: 4
    },
    startingMoney: {
        type: Number,
        required: true,
        default: 1500,
    },
    tabletopMode: {
        type: Boolean,
        required: true,
        default: true,
    },
});

// --- Use Composables ---

// Props need to be reactive refs when passed to composables
const playerCountRef = toRef(props, 'playerCount');
const startingMoneyRef = toRef(props, 'startingMoney');
const tabletopModeRef = toRef(props, 'tabletopMode');

// Core State Management
const { players, updatePlayerBalance, initializePlayers } = usePlayers(playerCountRef, startingMoneyRef);
const { layoutConfig, getWalletOrientation, getWalletColor } = useLayout(playerCountRef, tabletopModeRef);
const { transactionLog, logTransaction, clearLog } = useTransactionLog();
const { bankBalance, taxBalance, updateTaxBalance, resetTaxBalance } = useBankAndTax(0); // Start tax at 0
const { expandedWallets, handleWalletClicked, collapseAllWallets } = useWalletExpansion();
const transactionType = ref(null); // Define transactionType locally
const {
    isTransactionLogModalVisible,
    toggleTransactionLogModal,
    isRestartConfirmationModalVisible,
    openRestartConfirmationModal,
    closeRestartConfirmationModal
} = useModals();

// Refs for WalletBoard components (needed for direct interaction like pushTransaction)
const bankWalletRef = ref(null);
const taxWalletRef = ref(null);
const playerWalletRefs = ref({}); // Keyed by player name `Player X`

// Helper to get component refs
const getWalletBoardRef = (walletName) => {
    if (walletName === 'Bank') return bankWalletRef.value;
    if (walletName === 'Tax') return taxWalletRef.value;
    return playerWalletRefs.value[walletName] ?? null;
};

// Function to set player refs in the template loop
const setPlayerWalletRef = (el, playerNum) => {
    if (el) {
        playerWalletRefs.value[`Player ${playerNum}`] = el;
    } else {
        // Handle potential unmounting/cleanup if needed
        delete playerWalletRefs.value[`Player ${playerNum}`];
    }
};

// Transaction Handling (depends on other composables/refs)
const {
    isModalVisible,
    senderWalletName,
    senderWalletColor,
    receiverWalletName,
    receiverWalletColor,
    selectedWalletOrientation,
    selectedWalletBalance,
    receiverWalletBalance,
    openTransactionModal,
    handleConfirmValue,
    handleCancelModal,
} = useTransactions(
    players, // Pass the reactive ref
    bankBalance, // Pass the reactive ref
    taxBalance, // Pass the reactive ref
    logTransaction, // Pass the function
    getWalletBoardRef, // Pass the helper function
    getWalletOrientation, // Pass function from useLayout
    getWalletColor, // Pass function from useLayout
    updatePlayerBalance, // Pass function from usePlayers
    updateTaxBalance // Pass function from useBankAndTax
);

// Drag and Drop (depends on transaction modal logic and refs)
// Note: useDraggableWallets calls its own onMounted internally
useDraggableWallets(
    openTransactionModal, // Pass the function from useTransactions
    getWalletBoardRef // Pass the helper function
);

// --- Provide/Inject (if needed by deep children, otherwise props are better) ---
provide('bankBalance', bankBalance);
provide('taxBalance', taxBalance);
provide('players', players); // Provide the reactive players ref

// --- Game Restart Logic ---
const restartGame = () => {
    console.log("Restarting Game...");
    // 1. Reset Balances
    initializePlayers(); // Re-run player initialization
    resetTaxBalance(0); // Reset tax
    // Bank is already Infinity

    // 2. Clear Logs
    clearLog(); // Clear central log
    // Clear individual wallet logs
    Object.values(playerWalletRefs.value).forEach(ref => ref?.transactionHistory?.value?.splice(0));
    bankWalletRef.value?.transactionHistory?.value?.splice(0);
    taxWalletRef.value?.transactionHistory?.value?.splice(0);


    // 3. Collapse any expanded wallets
    collapseAllWallets();

    // 4. Close Modals
    handleCancelModal(); // Close transaction modal if open
    closeRestartConfirmationModal(); // Close restart modal
    if (isTransactionLogModalVisible.value) toggleTransactionLogModal(); // Close log modal

    // 5. Emit event to parent (App.vue) if needed for higher-level resets
    emit('restart-game');
    console.log("Game Reset Complete.");
};

// --- Watchers (Example: Log when layout changes) ---
watch(layoutConfig, (newConfig) => {
    console.log("Layout Config Updated in Component:", newConfig);
}, { deep: true });

// --- Lifecycle Hooks ---
onMounted(() => {
    console.log("TabletopLayout component mounted.");
    // GSAP Draggable setup is handled within its composable's onMounted
});

const handleTransactionRequest = (eventPayload) => {
    senderWalletName.value = eventPayload.senderName;
    senderWalletColor.value = getWalletColor(eventPayload.senderName);
    receiverWalletColor.value = getWalletColor(eventPayload.receiverName);

    receiverWalletName.value = eventPayload.receiverName;
    // selectedWalletName.value = eventPayload.senderName; // selectedWalletName is not defined

    // Determine orientation of the sender wallet and set selectedWalletOrientation
    if (!props.tabletopMode) {
        selectedWalletOrientation.value = 'up';
    } else {
        if (eventPayload.senderName === 'Bank' || eventPayload.senderName === 'Tax') {
            console.log(eventPayload.senderName);
            const receiverPlayerLayout = layoutConfig.value[props.playerCount]?.find(layout => layout.playerNum === parseInt(eventPayload.receiverName.replace('Player ', '')));
            selectedWalletOrientation.value = receiverPlayerLayout?.orientation || 'up';
        } else if (eventPayload.senderName.startsWith('Player')) {
            const senderPlayerLayout = layoutConfig.value[props.playerCount]?.find(layout => layout.playerNum === parseInt(eventPayload.senderName.replace('Player ', '')));
            selectedWalletOrientation.value = senderPlayerLayout?.orientation || 'up';

        } else {
            selectedWalletOrientation.value = 'up';
        }
    }

    transactionType.value = 'transfer';
    isModalVisible.value = true;
};

</script>


<style scoped>
@reference "../style.css";

.tabletop-layout {
    font-family: sans-serif;
    display: flex;
    flex-direction: column;
    align-items: stretch;
}

/* Bank and Tax Area Styling */
.bank-area,
.tax-area {
    display: flex;
    justify-content: center;
    /* Keep content centered horizontally */
    width: 100%;
    max-width: 800px;
    /* Default max-width - for portrait perhaps */
    height: auto;
}

/* Layout Grid Styling */
.layout-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(8, auto);
    gap: 8px;
    height: 100%;
    @apply flex-1;
}

/* Player Cell Positioning CSS */
/* 2-Player Layout CSS */
.player-1-cell.player-count-2 {
    grid-column: 1 / -1;
    grid-row: 1 / 5;
}

.player-2-cell.player-count-2 {
    grid-column: 1 / -1;
    grid-row: 5 / -1;
}

/* 3-Player Layout CSS */
.player-1-cell.player-count-3 {
    grid-column: 1 / -1;
    grid-row: 1 / 3;
}

.player-2-cell.player-count-3 {
    grid-column: 1 / -1;
    grid-row: 7 / -1;
}

.player-3-cell.player-count-3 {
    grid-column: 1 / -1;
    grid-row: 3 / 7;
}

/* 4-Player Layout CSS */
.player-1-cell.player-count-4 {
    grid-column: 1 / -1;
    grid-row: 1 / 3;
}

.player-4-cell.player-count-4 {
    grid-column: 1 / 3;
    grid-row: 3 / 7;
}

.player-2-cell.player-count-4 {
    grid-column: 3 / -1;
    grid-row: 3 / 7;
}

.player-3-cell.player-count-4 {
    grid-column: 1 / -1;
    grid-row: 7 / 9;
}

/* 5-Player Layout CSS */
.player-1-cell.player-count-5 {
    grid-column: 1 / -1;
    grid-row: 1 / 3;
}

.player-5-cell.player-count-5 {
    grid-column: 1 / 3;
    grid-row: 3 / 7;
}

.player-2-cell.player-count-5 {
    grid-column: 3 / -1;
    grid-row: 3 / 7;
}

.player-4-cell.player-count-5 {
    grid-column: 1 / 3;
    grid-row: 7 / 9;
}

.player-3-cell.player-count-5 {
    grid-column: 3 / -1;
    grid-row: 7 / 9;
}

/* 6-Player Layout CSS */
.player-1-cell.player-count-6 {
    grid-column: 1 / 3;
    grid-row: 1 / 3;
}

.player-6-cell.player-count-6 {
    grid-column: 1 / 3;
    grid-row: 3 / 7;
}

.player-5-cell.player-count-6 {
    grid-column: 1 / 3;
    grid-row: 7 / 9;
}

.player-4-cell.player-count-6 {
    grid-column: 3 / -1;
    grid-row: 7 / 9;
}

.player-3-cell.player-count-6 {
    grid-column: 3 / -1;
    grid-row: 3 / 7;
}

.player-2-cell.player-count-6 {
    grid-column: 3 / -1;
    grid-row: 1 / 3;
}

/* 7-Player Layout CSS */
.player-1-cell.player-count-7 {
    grid-column: 1 / -1;
    grid-row: 1 / 3;
}

.player-7-cell.player-count-7 {
    grid-column: 1 / 3;
    grid-row: 3 / 5;
}

.player-2-cell.player-count-7 {
    grid-column: 3 / -1;
    grid-row: 3 / 5;
}

.player-6-cell.player-count-7 {
    grid-column: 1 / 3;
    grid-row: 5 / 7;
}

.player-3-cell.player-count-7 {
    grid-column: 3 / -1;
    grid-row: 5 / 7;
}

.player-5-cell.player-count-7 {
    grid-column: 1 / 3;
    grid-row: 7 / -1;
}

.player-4-cell.player-count-7 {
    grid-column: 3 / -1;
    grid-row: 7 / -1;
}

/* 8-Player Layout CSS */
.player-1-cell.player-count-8 {
    grid-column: 1 / 3;
    grid-row: 1 / 3;
}

.player-8-cell.player-count-8 {
    grid-column: 1 / 3;
    grid-row: 3 / 5;
}

.player-7-cell.player-count-8 {
    grid-column: 1 / 3;
    grid-row: 5 / 7;
}

.player-6-cell.player-count-8 {
    grid-column: 1 / 3;
    grid-row: 7 / -1;
}

.player-5-cell.player-count-8 {
    grid-column: 3 / -1;
    grid-row: 7 / -1;
}

.player-4-cell.player-count-8 {
    grid-column: 3 / -1;
    grid-row: 5 / 7;
}

.player-3-cell.player-count-8 {
    grid-column: 3 / -1;
    grid-row: 3 / 5;
}

.player-2-cell.player-count-8 {
    grid-column: 3 / -1;
    grid-row: 1 / 3;
}

.player-cell {
    /* General styling for player cells */
}

@media (orientation: landscape) {
    .tabletop-layout {
        flex-direction: row;
        @apply flex-1;
        height: 100%;
        align-items: stretch;
        justify-content: space-between;
    }

    .bank-area {
        width: auto;
        /* Keep width auto */
        max-width: none;
        /* Keep max-width none */
        margin-bottom: 0;
        margin-right: 2rem;
        justify-content: flex-start;
        /* Keep justify-content: flex-start */
        flex-basis: 20%;
        /* ADD flex-basis: 20% - initial width */
        flex-grow: 0;
        /* ADD flex-grow: 0 - don't grow excessively */
    }

    .tax-area {
        width: auto;
        /* Keep width auto */
        max-width: none;
        /* Keep max-width none */
        margin-top: 0;
        margin-left: 2rem;
        justify-content: flex-end;
        /* Keep justify-content: flex-end */
        flex-basis: 20%;
        /* ADD flex-basis: 20% - initial width */
        flex-grow: 0;
        /* ADD flex-grow: 0 - don't grow excessively */
    }

    /* .wallet-board { */
    /* height: auto !important; */
    /* Try auto height in landscape - important for override */
    /* min-height: none !important; */
    /* Remove min-height override in landscape */
    /* max-height: none !important; */
    /* Remove max-height override in landscape */
    /* width: 100%;  Keep width 100% or adjust if needed in landscape */
    /* Add other landscape specific styles here if needed */
    /* } */

    .layout-grid {
        max-width: none;
        margin: 0;
        @apply flex-1;
        /* Keep @apply flex-1 for layout-grid */
    }
}
</style>
