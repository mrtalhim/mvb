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
            <h3 class="player-name text-md text-center text-black max-w-[100px]">{{ name }}</h3>
            <p class="balance text-2xl font-bold text-center text-black" :key="displayBalance">{{
                tweened.balance.toFixed(displayBalance.value) }}
            </p>

            <TransactionLog v-if="expanded" :transactions="transactionHistory" :isPersonal="true"
                :title="`Transaction History (${name})`" />
        </div>
    </div>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted, nextTick } from 'vue';
import TransactionLog from './TransactionLog.vue';
import { gsap } from 'gsap';
import { Flip } from "gsap/Flip"; // Import Flip plugin
gsap.registerPlugin(Flip); // Register Flip plugin

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

const tweened = reactive({
    balance: props.balance
});

watch(
    () => props.balance,
    (newBalance) => {
        gsap.to(tweened, {
            duration: 0.5,
            balance: Number(newBalance) || 0,
            delay: 0.5
        });
    }
);

const transactionHistory = ref([]);
const isDropTargetHover = ref(false);
const isTouchTargetHover = ref(false);

const walletBoardRef = ref(null);
const isAnimatingExpansion = ref(false);
const collapsedHeight = ref(null); // Ref to store collapsed height

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

const displayBalance = computed(() => {
    if (props.isBank) {
        return '∞';
    } else if (props.isTax) {
        return formatCurrencyAbbreviated(props.balance);
    } else {
        return formatCurrencyAbbreviated(props.balance);
    }
});

const formatCurrencyAbbreviated = (amount) => {
    if (props.expanded) {
        return formatCurrency(amount);
    } else if (amount === Infinity) {
        return '∞';
    }
    if (amount >= 1000000) {
        return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 100000) {
        return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount}`;
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
    if (props.isTappable && !isAnimatingExpansion.value) {
        emit('wallet-clicked', props.name);
    }
}

const handleCloseClick = () => {
    if (props.isTappable && !isAnimatingExpansion.value) {
        emit('wallet-clicked', props.name)
    }
}

watch(
    () => props.expanded,
    (isExpanded) => {
        if (walletBoardRef.value) {
            isAnimatingExpansion.value = true;
            if (isExpanded) {
                // --- EXPAND ANIMATION (No changes to expand for now) ---
                const flipState = Flip.getState(walletBoardRef.value);

                gsap.set(walletBoardRef.value, {
                    position: 'fixed',
                    xPercent: -50,
                    yPercent: -50,
                    top: "50%",
                    left: "50%",
                    width: '100vw',
                    height: '100svh',
                    zIndex: 101,
                    borderRadius: 0,
                    boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
                    overflow: 'hidden'
                });

                Flip.from(flipState, {
                    duration: 0.5,
                    ease: "power2.inOut",
                    scale: true,
                    absolute: true,
                    onComplete: () => {
                        gsap.set(walletBoardRef.value, { overflow: 'auto' });
                        isAnimatingExpansion.value = false;
                        console.log("Expand Animation (Height Refine) Complete");
                    }
                });


            } else {
                // --- COLLAPSE ANIMATION - HEIGHT REFINEMENT ATTEMPT ---
                gsap.set(walletBoardRef.value, { overflow: 'hidden' });

                const flipState = Flip.getState(walletBoardRef.value);

                // Immediately set COLLAPSED styles - with clearProps: "all" FIRST and specific height
                gsap.set(walletBoardRef.value, {
                    clearProps: "all", // Wipe inline styles FIRST - NOW AT THE BEGINNING
                    position: 'relative', // Or your default
                    top: 'auto',
                    left: 'auto',
                    xPercent: 0,
                    yPercent: 0,
                    width: '100%', // Or your default
                    height: collapsedHeight.value ? collapsedHeight.value + "px" : '100%', // Use stored height or '100%' as fallback
                    zIndex: 'auto',
                    borderRadius: '0.75rem',
                    boxShadow: '0 0 0 rgba(0,0,0,0)'
                });

                Flip.from(flipState, {
                    scale: true,
                    duration: 0.7,
                    delay: 0,
                    ease: "power1.inOut",
                    absolute: true,
                    onComplete: () => {
                        isAnimatingExpansion.value = false;
                        console.log("Collapse Animation (Height Refine) Complete");
                    }
                });
            }
        }
    },
    { immediate: false }
);

onMounted(() => {
    gsap.set(walletBoardRef.value, { position: 'relative' });
    // Capture initial collapsed height on mount
    nextTick(() => {
        if (walletBoardRef.value) {
            collapsedHeight.value = walletBoardRef.value.offsetHeight;
            console.log("Captured Collapsed Height:", collapsedHeight.value);
        }
    });
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