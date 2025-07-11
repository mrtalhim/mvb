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
                    draggable="true" @dragstart="handleDragStart($event, 'Bank')" @drop="handleDrop($event, 'Bank')"
                    @dragover.prevent @dragenter.prevent ref="bankWalletRef" />
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
                            draggable="true" @dragstart="handleDragStart($event, `Player ${element.playerNum}`)"
                            @drop="handleDrop($event, `Player ${element.playerNum}`)" @dragover.prevent
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
                    draggable="true" @dragstart="handleDragStart($event, 'Tax')" @drop="handleDrop($event, 'Tax')"
                    @dragover.prevent @dragenter.prevent :expanded="expandedWallets.has('Tax')"
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
import { ref, onMounted, provide, toRef, watch } from 'vue';
import WalletBoard from '../components/WalletBoard.vue';
import ModalNumberInput from '../components/ModalNumberInput.vue';
import TransactionLog from '../components/TransactionLog.vue';
import { useModalTransition } from '../composables/useModalTransition.js';
import { ref, computed, onMounted, nextTick, provide } from 'vue';

// Import Composables
import { usePlayers } from '../composables/usePlayers';
import { useLayout } from '../composables/useLayout';
import { useTransactionLog } from '../composables/useTransactionLog';
import { useBankAndTax } from '../composables/useBankAndTax';
import { useTransactions } from '../composables/useTransactions';
import { useDraggableWallets } from '../composables/useDraggableWallets';
import { useModals } from '../composables/useModals';
import { useWalletExpansion } from '../composables/useWalletExpansion';

const emit = defineEmits(['restart-game']);
const isRestartConfirmationModalVisible = ref(false);

const isTransactionLogModalVisible = ref(false);

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

const emit = defineEmits(['restart-game']);

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

// Handle drag start - set the dragged wallet as source
const handleDragStart = (dragEvent, walletName) => {
    console.log(`Drag started from wallet: ${walletName}`);
    dragSource.value = walletName;
};


// Function to handle wallet drop (GSAP Draggable's onDragEnd) - NEW FUNCTION - Replaces original handleDrop
const handleWalletDrop = async (droppedWalletElement, draggableInstance, targetWalletNameFromHighlight) => {
    const sourceWalletName = dragSource.value;
    const targetWalletName = targetWalletNameFromHighlight;

    console.log(`Drop received on wallet: ${targetWalletName}`);

    // Clear any hover on the source wallet
    clearWalletBoardHover(sourceWalletName);

    // Clear any hover on the target wallet
    clearWalletBoardHover(targetWalletName);

    // +++ Animate wallet back to ORIGINAL ABSOLUTE position +++
    const initialLeft = parseFloat(droppedWalletElement.dataset.initialLeft); // Retrieve absolute initial left
    const initialTop = parseFloat(droppedWalletElement.dataset.initialTop);   // Retrieve absolute initial top

    console.log("handleWalletDrop - Retrieved initialLeft:", initialLeft, "initialTop:", initialTop); // Log retrieved positions

    gsap.to(droppedWalletElement, {
        x: 0,       // Animate x offset to ZERO - Reset horizontal translation
        y: 0,       // Animate y offset to ZERO - Reset vertical translation
        duration: 0.3,   // Animation duration (adjust as needed)
        ease: "elastic.out", // Easing function (adjust as needed)
        // transformOrigin: "0% 0%" // Optional: If needed, set transformOrigin to top-left
    });

    if (sourceWalletName && sourceWalletName !== targetWalletName && targetWalletName) {
        console.log(`Initiating transaction from ${sourceWalletName} to ${targetWalletName}`);

        // Set sender and receiver for transaction
        senderWalletName.value = sourceWalletName;
        receiverWalletName.value = targetWalletName;

        senderWalletColor.value = getWalletColor(sourceWalletName);
        receiverWalletColor.value = getWalletColor(targetWalletName);

        selectedWalletName.value = sourceWalletName;

        // Determine orientation for the modal
        const senderPlayerLayout = props.tabletopMode ? getWalletOrientation(sourceWalletName) : 'up';
        selectedWalletOrientation.value = senderPlayerLayout || 'up';

        // Show transaction modal
        transactionType.value = 'transfer';
        isModalVisible.value = true;
    }

    // Reset drag source
    dragSource.value = null;
};


const getWalletColor = (walletName) => {
    if (walletName === 'Bank') {
        return 'bg-mvb-gray';
    } else if (walletName === 'Tax') {
        return 'bg-mvb-white';
    } else {
        const playerIndex = parseInt(walletName.replace('Player ', '')) - 1;
        const playerColors = ['bg-mvb-blue', 'bg-mvb-green', 'bg-mvb-pale', 'bg-mvb-salmon', 'bg-mvb-orange', 'bg-mvb-yellow'];
        return playerColors[playerIndex % playerColors.length] || 'bg-mvb-white';
    }
};

// Helper function to get wallet orientation
const getWalletOrientation = (walletName) => {
    if (!props.tabletopMode) { // Check if tabletopMode is false
        return 'up';
    }
    if (walletName === 'Bank' || walletName === 'Tax') {
        return 'up';
    }

    const playerNumber = parseInt(walletName.replace('Player ', ''));
    const playerLayout = layoutConfig.value[props.playerCount]?.find(
        layout => layout.playerNum === playerNumber
    );

    return playerLayout ? playerLayout.orientation : 'up';
};

const handleTransactionRequest = (eventPayload) => {
    senderWalletName.value = eventPayload.senderName;
    senderWalletColor.value = getWalletColor(eventPayload.senderName);
    receiverWalletColor.value = getWalletColor(eventPayload.receiverName);

    receiverWalletName.value = eventPayload.receiverName;
    selectedWalletName.value = eventPayload.senderName;

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

// Function to handle value confirmation from ModalNumberInput
const handleConfirmValue = async (eventPayload) => {
    if (eventPayload) {
        const amount = eventPayload.amount;
        const senderName = eventPayload.senderName;
        const receiverName = eventPayload.receiverName;

        console.log(`Transaction Confirmed: ${senderName} -> ${receiverName}, Amount: $${amount}`);

        // Update sender's balance (subtract amount)
        if (senderName === 'Bank') {
            // Bank balance is infinite, no subtraction needed
        } else if (senderName === 'Tax') {
            taxBalance.value -= amount;
        } else {
            const senderPlayerIndex = players.value.findIndex(p => p.name === senderName);
            if (senderPlayerIndex !== -1) {
                // Array Replacement for Reactivity - Sender Balance Update
                const updatedPlayers = [...players.value]; // Create a COPY of the players array
                updatedPlayers[senderPlayerIndex].balance -= amount; // Update balance in the COPIED array
                players.value = updatedPlayers; // Replace ORIGINAL players array with the UPDATED COPY - Force Reactivity
                console.log(`Player (Sender - ${senderName}) - Balance after:`, players.value[senderPlayerIndex].balance);
            }
        }

        // Update receiver's balance (add amount)
        if (receiverName === 'Bank') {
            bankBalance.value = Infinity;
        } else if (receiverName === 'Tax') {
            taxBalance.value += amount;
        } else {
            const receiverPlayerIndex = players.value.findIndex(p => p.name === receiverName);
            if (receiverPlayerIndex !== -1) {
                // Array Replacement for Reactivity - Receiver Balance Update
                const updatedPlayers = [...players.value]; // Create a COPY of the players array
                updatedPlayers[receiverPlayerIndex].balance += amount; // Update balance in the COPIED array
                players.value = updatedPlayers; // Replace ORIGINAL players array with the UPDATED COPY - Force Reactivity
                console.log(`Player (Receiver - ${receiverName}) - Balance after:`, players.value[receiverPlayerIndex].balance);
            }
        }

        const transactionEntry = { // CORRECTED - Implement transactionEntry object creation here
            timestamp: new Date().toLocaleString(), // Get current timestamp
            senderName: senderName,
            receiverName: receiverName,
            amount: amount,
            transactionType: 'transfer', // For drag and drop transactions - You can make this dynamic if needed later
        };

        // Push transaction entry to CENTRALIZED transactionLog in TabletopLayout.vue (Remains same)
        transactionLog.value.push(transactionEntry); // Push transaction entry to CENTRALIZED transactionLog
        console.log(`Transaction logged to CENTRALIZED transaction log.`);

        await nextTick();

        const senderWalletBoardRef = getWalletBoardRef(senderName);
        const receiverWalletBoardRef = getWalletBoardRef(receiverName);

        // Push transaction entry to sender's transactionHistory
        if (senderWalletBoardRef && typeof senderWalletBoardRef.pushTransaction === 'function') {
            senderWalletBoardRef.pushTransaction(transactionEntry);
            console.log(`Transaction logged to sender wallet (${senderName}) history.`);
        } else {
            console.log("Sender WalletBoard ref or pushTransaction not available for:", senderName);
        }

        // Push transaction entry to receiver's transactionHistory
        if (receiverWalletBoardRef && typeof receiverWalletBoardRef.pushTransaction === 'function') {
            receiverWalletBoardRef.pushTransaction(transactionEntry);
            console.log(`Transaction logged to receiver wallet (${receiverName}) history.`);
        } else {
            console.log("Receiver WalletBoard ref or pushTransaction not available for:", receiverName);
        }

        // Visual feedback for transaction
        const senderEl = senderWalletBoardRef?.$el || senderWalletBoardRef;
        const receiverEl = receiverWalletBoardRef?.$el || receiverWalletBoardRef;

        if (senderEl) {
            gsap.fromTo(senderEl,
                { outline: "4px solid yellow" },
                { outline: "4px solid transparent", duration: 0.7, ease: "power1.out" }
            );
        }
        if (receiverEl) {
            gsap.fromTo(receiverEl,
                { outline: "4px solid green" },
                { outline: "4px solid transparent", duration: 0.7, ease: "power1.out", delay: 0.1 }
            );
        }

        isModalVisible.value = false;
        selectedWalletName.value = null;
        transactionType.value = null;
        inputValue.value = 0;
        senderWalletName.value = null;
        receiverWalletName.value = null;
    }
};

// Function to handle modal cancellation
const handleCancelModal = () => {
    isModalVisible.value = false;
    selectedWalletName.value = null;
    transactionType.value = null;
    inputValue.value = 0;
    senderWalletName.value = null;
    receiverWalletName.value = null;
};

const getWalletBoardRef = (walletName) => {
    if (walletName === 'Bank') {
        return bankWalletRef.value;
    } else if (walletName === 'Tax') {
        return taxWalletRef.value;
    } else {
        const componentRef = playerWalletRefs.value[walletName]; // Access player WalletBoard ref from playerWalletRefs object using walletName as key
        return componentRef ? componentRef : null;
    }
};

const setPlayerWalletRef = (el, playerNum) => {
    playerWalletRefs.value[`Player ${playerNum}`] = el;
}

const expandedWallets = ref(new Set()); // Use a Set to store names of expanded wallets - Initialize as empty Set

// Function to handle wallet-clicked event from WalletBoard
const handleWalletClicked = (walletName) => {
    console.log("Wallet clicked:", walletName);

    // Toggle expanded state of the clicked wallet in the expandedWallets Set
    if (expandedWallets.value.has(walletName)) {
        expandedWallets.value.delete(walletName); // Collapse if already expanded
        console.log("Wallet collapsed:", walletName);
    } else {
        expandedWallets.value.add(walletName);    // Expand if collapsed
        console.log("Wallet expanded:", walletName);
    }
};

const toggleTransactionLogModal = () => {
    isTransactionLogModalVisible.value = !isTransactionLogModalVisible.value;
};

const openRestartConfirmationModal = () => {
    isRestartConfirmationModalVisible.value = true;
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
