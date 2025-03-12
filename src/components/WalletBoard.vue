<template>
    <div class="wallet-board rounded-md border-2 border-gray-300 p-4 flex flex-col items-center justify-center"
        :class="[walletColorClass, { 'expanded': expanded }]" @click.stop="$emit('wallet-clicked', name)">
        <div class="board-content" :style="contentRotationStyle"> <!-- Container for rotated content -->
            <h3 class="player-name text-md text-center text-black">{{ name }}</h3>
            <Transition name="balance-update-transition" mode="out-in"> <!-- Transition component wrapping balance -->
                <p class="balance text-2xl font-bold text-center text-black" :key="displayBalance">{{ displayBalance }}
                </p>
            </Transition>
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue';

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
});

const emit = defineEmits(['wallet-clicked', 'transaction-requested']);

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
    if (amount >= 1000) {
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
    if (props.orientation === 'down') {
        rotation = 'rotate(180deg)';
    } else if (props.orientation === 'left') {
        rotation = 'rotate(90deg)';
    } else if (props.orientation === 'right') {
        rotation = 'rotate(-90deg)';
    }
    return {
        transform: rotation, // Apply rotation using CSS transform: rotate()
    };
});

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
    /* position: fixed;
    top: 50%;
    left: 50%; */
    transform: scale(1.5);
    z-index: 101;
    /* Ensure expanded board is on top of modal overlay */
    /* width: auto; */
    /* Auto width to fit expanded content */
    /* height: auto; */
    /* Auto height to fit expanded content */
    max-width: 90vw;
    /* Max width to prevent overflow on very wide screens */
    max-height: 90vh;
    transition: transform 0.3s ease-out, box-shadow 0.3s ease-out, top 0.3s ease-out, left 0.3s ease-out;
    /* Smooth transition for expansion */
    box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.5);
    /* More prominent shadow for expanded view */
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
    height: 100%;
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
