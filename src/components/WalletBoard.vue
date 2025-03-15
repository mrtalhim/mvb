<template>
    <div class="wallet-board rounded-md border-2 border-gray-300 p-4 flex flex-col items-center justify-center transition-discrete"
        :class="[walletColorClass, { 'expanded': expanded, 'drop-target-hover': isDropTargetHover, 'touch-target-hover': isTouchTargetHover }]"
        @click.stop="handleClick" @dragleave="onDragLeave" @dragover="onDragOver" @drop="onDrop"
        @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
        <div class="board-content" :style="contentRotationStyle" @dragenter="onDragEnter"
            :class="{ 'pointer-events-none': !isTappable }">
            <!-- Container for rotated content -->
            <button v-if="expanded" @click.stop="handleCloseClick"
                class="absolute top-2 right-50% bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded-md shadow-md transition-all">
                Close
            </button>
            <h3 class="player-name text-md text-center text-black max-w-[100px]">{{ name }}</h3>
            <Transition name="balance-update-transition" mode="out-in"> <!-- Transition component wrapping balance -->
                <p class="balance text-2xl font-bold text-center text-black" :key="displayBalance">{{ displayBalance }}
                </p>
            </Transition>

            <TransactionLog v-if="expanded" :transactions="transactionHistory" :isPersonal="true"
                :title="`Transaction History (${name})`" />
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import TransactionLog from './TransactionLog.vue';

const props = defineProps({
    name: {
        type: String,
        required: true,
    },
    balance: {
        type: Number,
        required: true,
        default: 0,
    },
    orientation: {
        type: String,
        default: 'up',
    },
    isBank: {
        type: Boolean,
        default: false,
    },
    isTax: {
        type: Boolean,
        default: false,
    },
    expanded: {  // New prop: expanded - to control expanded state
        type: Boolean,
        default: false,
    },
    allowsRotation: {
        type: Boolean,
        default: false,
    },
    isTappable: {
        type: Boolean,
        default: true,
    }
});

const transactionHistory = ref([]); // Reactive array to store transaction history for each wallet
const isDropTargetHover = ref(false);
const isTouchTargetHover = ref(false);

const pushTransaction = (transaction) => {
    transactionHistory.value.push(transaction);
};

// New method to be called externally to clear the hover state
const clearDropTargetHover = () => {
    isDropTargetHover.value = false;
};

defineExpose({
    transactionHistory,
    pushTransaction,
    clearDropTargetHover
});

const emit = defineEmits(['wallet-clicked', 'transaction-requested', 'drop']);

const displayBalance = computed(() => {
    if (props.isBank) {
        return '∞';
    } else if (props.isTax) {
        return formatCurrencyAbbreviated(props.balance); // Use formatCurrencyAbbreviated for Tax
    } else {
        return formatCurrencyAbbreviated(props.balance); // Use formatCurrencyAbbreviated for Players
    }
});

const formatCurrencyAbbreviated = (amount) => {
    if (props.expanded) {
        return formatCurrency(amount);
    } else if (amount === Infinity) {
        return '∞'; // Bank balance remains infinity symbol
    }
    if (amount >= 1000000) {
        return `$${(amount / 1000000).toFixed(1)}M`; // Millions, 1 decimal place
    }
    if (amount >= 100000) {
        return `$${(amount / 1000).toFixed(1)}K`;    // Thousands, 1 decimal place
    }
    return `$${amount}`; // No abbreviation for amounts less than 1000
};

const walletColorClass = computed(() => {
    if (props.isBank) {
        return 'bg-mvb-gray';
    } else if (props.isTax) {
        return 'bg-mvb-white';
    } else {
        const playerColors = ['bg-mvb-blue', 'bg-mvb-green', 'bg-mvb-pale', 'bg-mvb-salmon', 'bg-mvb-orange', 'bg-mvb-yellow'];
        const playerIndex = parseInt(props.name.replace('Player ', '')) - 1;
        return playerColors[playerIndex % playerColors.length] || 'bg-mvb-white';
    }
});


function formatCurrency(amount) {
    return `$${amount}`;
}

const contentRotationStyle = computed(() => {
    let rotation = 'rotate(0deg)'; // Default rotation (no rotation)
    if (props.allowsRotation) {
        if (props.orientation === 'down') {
            rotation = 'rotate(180deg)';
        } else if (props.orientation === 'left') {
            rotation = 'rotate(90deg)';
        } else if (props.orientation === 'right') {
            rotation = 'rotate(-90deg)';
        }
    }
    return {
        transform: rotation, // Apply rotation using CSS transform: rotate()
    };
});

const onDragEnter = (event) => {
    console.log("Drag ENTERED Wallet:", props.name); // Log dragenter eventisDropTargetHover prop
    isDropTargetHover.value = true;
};

const onDragLeave = (event) => {
    console.log("Drag LEFT Wallet:", props.name);  // Log dragleave eventisDropTargetHover prop
    isDropTargetHover.value = false;
};

const onDragOver = (event) => {
    const isTouch = event.type.includes('touch');
    if (isTouch) {
        isTouchTargetHover.value = true;
    } else {
        isDropTargetHover.value = true;
    }
};

const onDrop = () => {
    console.log('Drop detected inside walletboard');
    emit('drop');
};

const onTouchStart = (event) => {
    console.log('touch start detected')
};

const onTouchMove = (event) => {
    console.log('touch move detected')
    event.preventDefault();
};

const onTouchEnd = (event) => {
    console.log('touch end detected')
    isTouchTargetHover.value = false;
};

const handleClick = () => {
    if (props.isTappable) {
        emit('wallet-clicked', props.name);
    }
}

const handleCloseClick = () => {
    if (props.isTappable) {
        emit('wallet-clicked', props.name)
    }
}
</script>

<style scoped>
@reference "../style.css";

.wallet-board {
    @apply touch-none;
    user-select: none;
    width: 100%;
    height: 100%;
    /* min-height: 150px; */
    display: flex;
    flex-direction: column;
    pointer-events: auto;
    /* Explicitly set pointer-events to auto */
}

.wallet-board>* {
    /* Target direct children of .wallet-board */
    flex-grow: 1;
    /* Allow content to grow and fill space */
    display: flex;
    /* Make children also flex containers for alignment */
    flex-direction: column;
    /* Stack content vertically within wallet board */
    justify-content: center;
    /* Center content vertically */
    align-items: center;
    /* Center content horizontally */
    text-align: center;
    /* Center text within content areas */
}

.wallet-board.expanded {
    @apply text-2xl;
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100svh;
    transform: scale(1);
    z-index: 101;
    transition: transform 0.3s ease-out, box-shadow 0.3s ease-out;
    /* Smooth transition for expansion */
    box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.5);
    /* More prominent shadow for expanded view */
}

.wallet-board.drop-target-hover {
    /* Targeting .wallet-board elements that ALSO have .drop-target-hover class */
    background-color: rgba(255, 255, 255, 0.9);
    /* Example: Slightly darker white background - Adjust color/opacity as needed */
    transform: scale(1.03);
    /* Example: Scale up slightly on hover - Adjust scale value as needed */
    transition: background-color 0.2s ease-out, transform 0.2s ease-out;
    /* Smooth transition for hover effect */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    /* Example: Add subtle shadow on hover - Adjust shadow as needed */
    border-color: blue;
    /* Example: Blue border - to visually highlight */
    border-width: 2px;
    /* Example: Thicker border - to visually highlight */
}

.wallet-board.touch-target-hover {
    background-color: rgba(255, 255, 255, 0.9);
    transform: scale(1.03);
    transition: background-color 0.2s ease-out, transform 0.2s ease-out;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    border-color: red;
    border-width: 10px;
}

.board-content {
    /* Container for Content Rotation - UPDATED - Rotation Applied via :style binding */
    display: flex;
    /* Use flexbox for content centering */
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    /* Ensure content fills board width */
    pointer-events: none;
    /* Ensure content fills board height */
    /* Rotation is now applied DYNAMICALLY using :style binding in template - NO CSS rotation here */
}


.player-name {
    /* Player name styles - adjust if needed */
    margin-bottom: 0.5rem;
    /* Reduced margin */
    flex-grow: 0;
    /* Prevent player name from growing too much */
}

.balance {
    /* Balance styles - adjust if needed */
    font-size: 1.5rem;
    /* Slightly smaller font size */
    flex-grow: 0;
    /* Prevent balance from growing too much */
}

.balance-update-transition-enter-from {
    /* Initial state BEFORE transition starts */
    opacity: 0;
    /* Start with 0 opacity (fade-in effect) */
    font-size: 1.3rem;
    /* Start with slightly smaller font-size (scale-up effect) */
}

.balance-update-transition-enter-active {
    /* Active state DURING transition - Define transition properties */
    transition: all 0.3s ease-out;
    /* Apply transition to all properties (opacity, font-size), duration 0.3s, ease-out timing */
}

.balance-update-transition-enter-to {
    /* Final state AFTER transition completes */
    opacity: 1;
    /* End with full opacity */
    font-size: 1.5rem;
    /* End with normal font-size */
}
</style>
