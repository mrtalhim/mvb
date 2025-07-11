<template>
    <div class="wallet-board wallet-board-draggable rounded-md border-2 border-gray-300 p-4 flex flex-col items-center justify-center"
        :class="[walletColorClass, { 'touch-target-hover': isTouchTargetHover }]" :data-wallet-name="name"
        @click.stop="handleClick" @dragleave="onDragLeave" @dragover.prevent="$emit('dragover')"
        @drop.prevent="$emit('drop')" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd"
        ref="walletBoardRef"> <!-- ADD ref="walletBoardRef" -->
        <div class="board-content" :style="contentRotationStyle" :class="{ 'pointer-events-none': !isTappable }">
            <!-- Container for rotated content -->
            <button v-if="expanded" @click.stop="handleCloseClick"
                class="absolute top-2 right-50% bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded-md shadow-md transition-all">
                Close
            </button>
            <h3 v-once class="player-name text-md text-center text-black max-w-[100px]">{{ name }}</h3>
            <p ref="balanceDisplayRef" class="balance text-2xl font-bold text-center text-black"></p>
            <!-- Text content will be set by TextPlugin -->

            <TransactionLog v-if="expanded" :transactions="transactionHistory" :isPersonal="true"
                :title="`Transaction History (${name})`" />
        </div>
    </div>
</template>

<script setup>
import { computed, ref, onMounted, toRefs } from 'vue';
import TransactionLog from './TransactionLog.vue';
// GSAP and Flip will be imported by the composables
import { useBalanceTween } from '../composables/useBalanceTween.js';
import { useWalletFlipAnimation } from '../composables/useWalletFlipAnimation.js';

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
    expanded: {
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

// Destructure props for use in composables
// Add isBankProp for useBalanceTween
const { balance: balanceProp, expanded: expandedProp, isTappable: isTappableProp, isBank: isBankProp } = toRefs(props);

const balanceDisplayRef = ref(null); // Ref for the balance display element

// Use the balance tweening composable, passing the element ref and isBank status
useBalanceTween(balanceProp, balanceDisplayRef, isBankProp, expandedProp);


const transactionHistory = ref([]);
const isDropTargetHover = ref(false);
const isTouchTargetHover = ref(false);

const walletBoardRef = ref(null);

// Use the wallet flip animation composable
const { isAnimatingExpansion, captureCollapsedState } = useWalletFlipAnimation(walletBoardRef, expandedProp, isTappableProp);

const pushTransaction = (transaction) => {
    transactionHistory.value.push(transaction);
};

const clearDropTargetHover = () => {
    isDropTargetHover.value = false;
};

defineExpose({
    transactionHistory,
    pushTransaction,
    clearDropTargetHover
});

const emit = defineEmits(['wallet-clicked', 'transaction-requested', 'drop', 'dragover']);

// displayBalanceValue and formatting functions are no longer needed here,
// as this logic is now handled within useBalanceTween.js and TextPlugin updates the element directly.

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

// formatCurrency is no longer needed here

const contentRotationStyle = computed(() => {
    let rotation = 'rotate(0deg)';
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
        transform: rotation,
    };
});

const onDragEnter = (event) => {
    console.log("Drag ENTERED Wallet:", props.name);
    isDropTargetHover.value = true;
};

const onDragLeave = (event) => {
    console.log("Drag LEFT Wallet:", props.name);
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
    // Use the isAnimatingExpansion from the composable
    if (props.isTappable && !isAnimatingExpansion.value) {
        emit('wallet-clicked', props.name);
    }
}

const handleCloseClick = () => {
    // Use the isAnimatingExpansion from the composable
    if (props.isTappable && !isAnimatingExpansion.value) {
        emit('wallet-clicked', props.name)
    }
}

import { gsap } from 'gsap'; // Import GSAP for onMounted animation

// The watch for props.expanded and its logic is now in useWalletFlipAnimation.js

onMounted(() => {
    // Ensure the DOM element is available and then capture its state.
    captureCollapsedState();

    // Initial rotation animation for board content if allowsRotation is true
    if (props.allowsRotation && walletBoardRef.value) {
        const boardContent = walletBoardRef.value.querySelector('.board-content');
        if (boardContent) {
            let targetRotation = 0;
            if (props.orientation === 'down') targetRotation = 180;
            else if (props.orientation === 'left') targetRotation = 90;
            else if (props.orientation === 'right') targetRotation = -90;

            // Animate from 0 rotation to targetRotation
            // The :style binding will still set the final state, GSAP just animates to it.
            // To make this work seamlessly, we might need to set initial rotation to 0 via GSAP
            // and then animate to the value defined by contentRotationStyle.
            // However, contentRotationStyle directly sets the transform.
            // A simpler approach: set initial state that GSAP can animate *from*.

            // Get the final rotation from the computed style (which is already set by :style)
            // And animate *from* a different state if it's not 0.
            const finalRotationStyle = contentRotationStyle.value.transform;
            const match = finalRotationStyle.match(/rotate\(([^deg)]+)deg\)/);
            const finalRotationAngle = match ? parseFloat(match[1]) : 0;

            if (finalRotationAngle !== 0) {
                 gsap.from(boardContent, {
                    rotation: 0, // Start from 0
                    duration: 0.7,
                    ease: 'power2.out',
                    delay: 0.2 // Small delay to allow other things to settle
                });
            }
            // GSAP will animate towards the 'rotation' value defined by the transform in contentRotationStyle
            // For this to work best, ensure contentRotationStyle is only applying rotation.
        }
    }
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
    /* position: relative;  <- REMOVE position:relative if you are setting it with GSAP */
    border-radius: 0.75rem;
    /* Example: default border-radius */
    /* transition: all 0.3s ease-out; <- REMOVE transition property */
    will-change: transform, top, left, width, height;
    /* Optimize for animation */
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

.wallet-board-draggable {
    will-change: transform;
    /* Add this line */
    /* ... other styles ... */
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
</style>