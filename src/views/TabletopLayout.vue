<template>
    <div class="p-4 flex flex-col bg-gray-100 h-svh items-center" @dragover.prevent>
        <div class="w-full pb-4 justify-center flex flex-row">
            <button @click="toggleTransactionLogModal"
                class="bg-blue-500 hover:bg-blue-700 hover:shadow-md transition-all text-white font-bold py-2 px-4 rounded">Transaction
                Log</button>
        </div>

        <!-- Bank Wallet -->
        <div class="tabletop-layout w-full flex-1">

            <div class="bank-area mb-4">
                <WalletBoard name="Bank" :balance="bankBalance" isBank @transaction-requested="handleTransactionRequest"
                    draggable="true" @dragstart="handleDragStart($event, 'Bank')" @drop="handleDrop($event, 'Bank')"
                    @dragover.prevent @dragenter.prevent ref="bankWalletRef" />
            </div>

            <div class="layout-grid grid">
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
                            :ref="(el) => setPlayerWalletRef(el, element.playerNum)" />
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
            <Transition name="modal-fade">
                <ModalNumberInput v-if="isModalVisible" :senderBalance="selectedWalletBalance"
                    :receiverBalance="receiverWalletBalance" :senderName="senderWalletName"
                    :senderColor="senderWalletColor" :receiverName="receiverWalletName"
                    :receiverColor="receiverWalletColor" @confirm-value="handleConfirmValue" @cancel="handleCancelModal"
                    :modalOrientation="selectedWalletOrientation" />
            </Transition>

            <!-- Transaction Log Modal -->
            <Transition name="modal-fade">
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
        </div>
    </div>
</template>

<script setup>
import WalletBoard from '../components/WalletBoard.vue';
import ModalNumberInput from '../components/ModalNumberInput.vue';
import TransactionLog from '../components/TransactionLog.vue';
import { ref, computed, onMounted, nextTick } from 'vue';

const isTransactionLogModalVisible = ref(false);
const props = defineProps({
    playerCount: {  // Define playerCount as a prop
        type: Number,
        required: true, // Make it required - App.vue should always pass this prop
        default: 4
    },
    startingMoney: { // Define startingMoney as a prop
        type: Number,
        required: true, // Make it required - App.vue should always pass this prop
        default: 1500,
    },
});

const players = ref([]);
const transactionLog = ref([]);
const bankWalletRef = ref(null);
const taxWalletRef = ref(null);
const playerWalletRefs = ref({}); // ref to hold an object to store player WalletBoard refs (keyed by player name)  <- ADD THIS LINE

const initializePlayers = () => {
    const playerArray = [];
    for (let i = 1; i <= props.playerCount; i++) {
        playerArray.push({ id: i, name: `Player ${i}`, balance: props.startingMoney }); // Initialize with default balance
    }
    return playerArray;
};

const generateLayoutConfig = (playerCount) => {
    const config = {};

    if (playerCount === 2) {
        config["2"] = [
            { playerNum: 1, cellClass: 'player-1-cell player-count-2', orientation: 'down' },     // Player 1 - Top - Upwards
            { playerNum: 2, cellClass: 'player-2-cell player-count-2', orientation: 'up' },   // Player 2 - Bottom - Downwards
        ];
    } else if (playerCount === 3) {
        config["3"] = [
            { playerNum: 1, cellClass: 'player-1-cell player-count-3', orientation: 'down' },     // Player 1 - Top - Upwards
            { playerNum: 2, cellClass: 'player-2-cell player-count-3', orientation: 'up' },   // Player 2 - Bottom - Downwards
            { playerNum: 3, cellClass: 'player-3-cell player-count-3', orientation: 'right' },  // Player 3 - Right - Rightwards (Middle Vertical)
        ];
    } else if (playerCount === 4) {
        config["4"] = [ // 4-Player Layout - CORRECTED PLAYER ORDER (Clockwise Ascending) and Orientations
            { playerNum: 1, cellClass: 'player-1-cell player-count-4', orientation: 'down' },       // Player 1 - Top - Upwards
            { playerNum: 2, cellClass: 'player-2-cell player-count-4', orientation: 'right' },     // Player 2 - Bottom - Downwards
            { playerNum: 3, cellClass: 'player-3-cell player-count-4', orientation: 'up' },    // Player 3 - Right - Rightwards (Middle Right Vertical)
            { playerNum: 4, cellClass: 'player-4-cell player-count-4', orientation: 'left' },     // Player 4 - Left - Leftwards (Middle Left Vertical)
        ];
    } else if (playerCount === 5) {
        config["5"] = [ // 5-Player Layout - CORRECTED PLAYER ORDER (Clockwise Ascending) and Orientations
            { playerNum: 1, cellClass: 'player-1-cell player-count-5', orientation: 'down' },       // Player 1 - Top - Upwards
            { playerNum: 2, cellClass: 'player-2-cell player-count-5', orientation: 'right' },     // Player 2 - Bottom Right - Downwards
            { playerNum: 3, cellClass: 'player-3-cell player-count-5', orientation: 'up' },    // Player 3 - Right - Rightwards (Middle Right Vertical)
            { playerNum: 4, cellClass: 'player-4-cell player-count-5', orientation: 'up' },     // Player 4 - Left - Leftwards (Middle Left Vertical)
            { playerNum: 5, cellClass: 'player-5-cell player-count-5', orientation: 'left' },     // Player 5 - Bottom Left - Downwards
        ];
    } else if (playerCount === 6) {
        config["6"] = [ // 6-Player Layout - CORRECTED PLAYER ORDER (Clockwise Ascending) and Orientations
            { playerNum: 1, cellClass: 'player-1-cell player-count-6', orientation: 'down' },       // Player 1 - Top Left - Upwards
            { playerNum: 2, cellClass: 'player-2-cell player-count-6', orientation: 'down' },     // Player 2 - Bottom Right - Downwards
            { playerNum: 3, cellClass: 'player-3-cell player-count-6', orientation: 'right' },    // Player 3 - Right - Rightwards (Middle Right Vertical)
            { playerNum: 4, cellClass: 'player-4-cell player-count-6', orientation: 'up' },     // Player 4 - Left - Leftwards (Middle Left Vertical)
            { playerNum: 5, cellClass: 'player-5-cell player-count-6', orientation: 'up' },     // Player 5 - Bottom Left - Downwards
            { playerNum: 6, cellClass: 'player-6-cell player-count-6', orientation: 'left' },       // Player 6 - Top Right - Upwards
        ];
    } else if (playerCount === 7) {
        config["7"] = [ // 7-Player Layout - CORRECTED PLAYER ORDER (Clockwise Ascending) and Orientations
            { playerNum: 1, cellClass: 'player-1-cell player-count-7', orientation: 'down' },       // Player 1 - Top Center - Upwards
            { playerNum: 2, cellClass: 'player-2-cell player-count-7', orientation: 'right' },     // Player 2 - Bottom Right - Downwards
            { playerNum: 3, cellClass: 'player-3-cell player-count-7', orientation: 'right' },    // Player 3 - Right - Rightwards (Middle Top Vertical)
            { playerNum: 4, cellClass: 'player-4-cell player-count-7', orientation: 'up' },     // Player 4 - Left - Leftwards (Middle Top Vertical)
            { playerNum: 5, cellClass: 'player-5-cell player-count-7', orientation: 'up' },     // Player 5 - Left - Leftwards (Middle Bottom Vertical)
            { playerNum: 6, cellClass: 'player-6-cell player-count-7', orientation: 'left' },     // Player 6 - Bottom Center - Downwards
            { playerNum: 7, cellClass: 'player-7-cell player-count-7', orientation: 'left' },     // Player 7 - Bottom Left - Downwards
        ];
    } else if (playerCount === 8) {
        config["8"] = [ // 8-Player Layout - CORRECTED PLAYER ORDER (Clockwise Ascending) and Orientations
            { playerNum: 1, cellClass: 'player-1-cell player-count-8', orientation: 'down' },       // Player 1 - Top Left - Upwards
            { playerNum: 2, cellClass: 'player-2-cell player-count-8', orientation: 'down' },     // Player 2 - Bottom Right - Downwards
            { playerNum: 3, cellClass: 'player-3-cell player-count-8', orientation: 'right' },    // Player 3 - Right Top - Rightwards (Middle Top Vertical)
            { playerNum: 4, cellClass: 'player-4-cell player-count-8', orientation: 'right' },     // Player 4 - Left Top - Leftwards (Middle Top Vertical)
            { playerNum: 5, cellClass: 'player-5-cell player-count-8', orientation: 'up' },     // Player 5 - Left Bottom - Leftwards (Middle Bottom Vertical)
            { playerNum: 6, cellClass: 'player-6-cell player-count-8', orientation: 'up' },     // Player 6 - Bottom Left - Downwards
            { playerNum: 7, cellClass: 'player-7-cell player-count-8', orientation: 'left' },     // Player 7 - Bottom Right - Downwards
            { playerNum: 8, cellClass: 'player-8-cell player-count-8', orientation: 'left' },       // Player 8 - Top Right - Upwards
        ];
    }

    console.log("Layout Config (Before Template - Player Count):", playerCount.value);
    console.log("Layout Config (Before Template - Config Object):", config);

    return config;
};

const layoutConfig = ref({}); // Initialize as empty ref

onMounted(() => {
    layoutConfig.value = generateLayoutConfig(props.playerCount);
    console.log("Initial Player Count (onMounted):", props.playerCount);
    players.value = initializePlayers();
    console.log("Initial Layout Config (onMounted):", layoutConfig.value);
});

// Sample Bank and Tax Balances
const bankBalance = ref(Infinity);
const taxBalance = ref(500);

// Modal State
const isModalVisible = ref(false);
const selectedWalletName = ref(null);
const transactionType = ref(null);
const inputValue = ref(0);
const senderWalletName = ref(null);
const senderWalletColor = ref(null);
const receiverWalletName = ref(null);
const receiverWalletColor = ref(null);
const selectedWalletOrientation = ref('up');

// Variables for drag and drop
const dragSource = ref(null);

const clearWalletBoardHover = (walletName) => {
    const walletBoardRef = getWalletBoardRef(walletName);
    if (walletBoardRef && walletBoardRef.clearDropTargetHover) {
        walletBoardRef.clearDropTargetHover();
    }
};

// Computed property to get balance of selected wallet
const selectedWalletBalance = computed(() => {
    if (selectedWalletName.value === 'Bank') return Infinity;
    if (selectedWalletName.value === 'Tax') return taxBalance.value;
    const player = players.value.find(p => p.name === selectedWalletName.value);
    return player ? player.balance : 0;
});

// Computed property to get balance of receiver wallet
const receiverWalletBalance = computed(() => {
    if (receiverWalletName.value === 'Bank') return Infinity;
    if (receiverWalletName.value === 'Tax') return taxBalance.value;
    const player = players.value.find(p => p.name === receiverWalletName.value);
    return player ? player.balance : 0;
});
// Handle drag start - set the dragged wallet as source
const handleDragStart = (event, walletName) => {
    console.log(`Drag started from wallet: ${walletName}`);
    dragSource.value = walletName;

    // Set data in dataTransfer to identify the dragged item
    if (event.type !== 'touchstart') { //Only set data if event is not touchstart
        event.dataTransfer.setData('text/plain', walletName);
    }

    // Set drag effect
    if (event.type !== 'touchstart') {
        event.dataTransfer.effectAllowed = 'move';
    }

    // Add a visual effect during drag (optional)
    const wallet = event.currentTarget;
    setTimeout(() => {
        wallet.classList.add('dragging');
    }, 0);
};

// Handle drop - initiate transaction between source and target wallets
const handleDrop = async (event, targetWalletName) => {
    console.log(`Drop received on wallet: ${targetWalletName}`);
    // event.preventDefault();

    // Remove visual effects
    document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));

    // Get source wallet name from dataTransfer
    const sourceWalletName = dragSource.value;

    // Clear any hover on the source wallet
    clearWalletBoardHover(sourceWalletName);

    // Clear any hover on the target wallet
    clearWalletBoardHover(targetWalletName);

    if (sourceWalletName && sourceWalletName !== targetWalletName) {
        console.log(`Initiating transaction from ${sourceWalletName} to ${targetWalletName}`);

        // Set sender and receiver for transaction
        senderWalletName.value = sourceWalletName;
        receiverWalletName.value = targetWalletName;

        // Calculate senderColor and receiverColor similar to how senderName is calculated
        if (sourceWalletName === 'Bank') {
            senderWalletColor.value = 'bg-mvb-gray';
        } else if (sourceWalletName === 'Tax') {
            senderWalletColor.value = 'bg-mvb-white';
        } else {
            const playerIndex = parseInt(sourceWalletName.replace('Player ', '')) - 1;
            const playerColors = ['bg-mvb-blue', 'bg-mvb-green', 'bg-mvb-pale', 'bg-mvb-salmon', 'bg-mvb-orange', 'bg-mvb-yellow'];
            senderWalletColor.value = playerColors[playerIndex % playerColors.length] || 'bg-mvb-white';
        }

        receiverWalletColor.value = getWalletColor(targetWalletName);

        selectedWalletName.value = sourceWalletName;

        // Determine orientation for the modal
        const senderPlayerLayout = getWalletOrientation(sourceWalletName);
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
    const senderPlayerLayout = layoutConfig.value[props.playerCount]?.find(layout => layout.playerNum === parseInt(eventPayload.senderName.replace('Player ', '')));
    if (senderPlayerLayout) {
        selectedWalletOrientation.value = senderPlayerLayout.orientation || 'up';
    } else if (eventPayload.senderName === 'Bank' || eventPayload.senderName === 'Tax') {
        selectedWalletOrientation.value = 'up';
    } else {
        selectedWalletOrientation.value = 'up';
    }

    transactionType.value = 'transfer';
    isModalVisible.value = true;
};

// Function to handle money request from WalletBoard
const handleMoneyRequest = (walletName, type) => {
    selectedWalletName.value = walletName;
    senderWalletName.value = walletName;
    senderWalletColor.value = getWalletColor(walletName);
    transactionType.value = type;

    // Determine orientation of the selected wallet and set selectedWalletOrientation
    const selectedPlayerLayout = layoutConfig.value[props.playerCount]?.find(layout => layout.playerNum === parseInt(walletName.replace('Player ', '')));
    if (selectedPlayerLayout) {
        selectedWalletOrientation.value = selectedPlayerLayout.orientation || 'up';
    } else if (walletName === 'Bank' || walletName === 'Tax') {
        selectedWalletOrientation.value = 'up';
    } else {
        selectedWalletOrientation.value = 'up';
    }

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

        // Push transaction entry to sender's transactionHistory - Re-implemented - Now pushing to INDIVIDUAL WalletBoard ref
        if (senderWalletBoardRef) {
            senderWalletBoardRef.pushTransaction(transactionEntry); // Push to INDIVIDUAL sender WalletBoard's transactionHistory - RE-IMPLEMENTED
            console.log(`Transaction logged to sender wallet (${senderName}) history.`); // Log sender history update
        } else {
            console.log("Sender WalletBoard ref or transactionHistory ref NOT VALID for logging to sender history."); // ADDED CONSOLE LOG - ELSE BLOCK - Sender
        }

        // Push transaction entry to receiver's transactionHistory - Re-implemented - Now pushing to INDIVIDUAL WalletBoard ref
        if (receiverWalletBoardRef) {
            receiverWalletBoardRef.pushTransaction(transactionEntry); // Push to INDIVIDUAL receiver WalletBoard's transactionHistory - RE-IMPLEMENTED
            console.log(`Transaction logged to receiver wallet (${receiverName}) history.`);
        } else {
            console.log("Receiver WalletBoard ref or transactionHistory ref NOT VALID for logging to receiver history."); // ADDED CONSOLE LOG - ELSE BLOCK - Receiver
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
    width: 100%;
    max-width: 800px;
    height: auto;
}

/* Layout Grid Styling */
.layout-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(8, auto);
    gap: 8px;
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

/* Drag and drop styling */
[draggable=true] {
    cursor: grab;
    transition: all 0.2s;
}

[draggable=true]:active {
    cursor: grabbing;
    opacity: 0;
    transform: all 0.2s;
}

.dragging {
    /* UPDATED .dragging CLASS - "Lifting" Effect */
    /* opacity: 0; */
    /* Slightly transparent - Remains, but can adjust */
    /* transform: scale(1.05) translateY(-5px); */
    opacity: 0;
    /* UPDATED - Scale up slightly and move up for "lifting" effect */
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
    /* UPDATED - More pronounced shadow for "lifting" effect */
    transition: transform all 0.3s ease-out;
    /* UPDATED - Include transform and box-shadow in transition */
}

.modal-overlay {
    background-color: rgba(0, 0, 0, 0.5);
}

/* Modal fade transitions */
.modal-fade-enter-from,
.modal-fade-leave-to {
    @apply scale-95 opacity-0;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: all 0.3s ease-out;
}

.modal-fade-enter-to,
.modal-fade-leave-from {
    @apply scale-100 opacity-100;
}

@media (orientation: landscape) {
    .tabletop-layout {
        flex-direction: row;
        @apply flex-1;
        align-items: stretch;
        justify-content: space-between;
    }

    .bank-area {
        width: auto;
        max-width: none;
        margin-bottom: 0;
        margin-right: 2rem;
    }

    .tax-area {
        width: auto;
        max-width: none;
        margin-top: 0;
        margin-left: 2rem;
    }

    .layout-grid {
        max-width: none;
        margin: 0;
    }
}
</style>
