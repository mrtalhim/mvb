<template>
    <div class="transaction-log-component w-full">
        <h2 class="text-lg font-bold mb-2 text-center">{{ title }}</h2>
        <ul class="border rounded-md p-2 bg-white dark:bg-gray-800 dark:text-white">
            <div v-for="(transaction, index) in transactions" :key="index"
                class="flex flex-row gap-2 mb-4 items-center justify-between">
                <WalletBoard :name="transaction.senderName" :balance="getWalletBalance(transaction.senderName)"
                    :walletColorClass="getWalletColor(transaction.senderName)" :expanded="expandedSender"
                    @wallet-clicked="toggleExpandedSender" :isTappable="false" />
                <div class="flex flex-col items-center justify-center">
                    <svg class="w-24 h-24 text-black dark:text-white" viewBox="0 0 100 100" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 50 L90 50 M90 50 L70 30 M90 50 L70 70" stroke="currentColor" stroke-width="8"
                            stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <p>{{ formatCurrencyAbbreviated(transaction.amount) }}</p>
                </div>
                <WalletBoard :name="transaction.receiverName" :balance="getWalletBalance(transaction.receiverName)"
                    :walletColorClass="getWalletColor(transaction.receiverName)" :expanded="expandedReceiver"
                    @wallet-clicked="toggleExpandedReceiver" :isTappable="false" />
            </div>
            <!-- <li v-for="(transaction, index) in transactions" :key="index"
                class="py-1 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                {{ transaction.timestamp }} - {{ transaction.senderName }} ➡️ {{ transaction.receiverName }}:
                ${{ transaction.amount }}
            </li> -->
            <li v-if="transactions.length === 0" class="text-gray-500 py-1 text-center dark:text-gray-400">
                No transactions yet.
            </li>
        </ul>
    </div>
</template>

<script setup>
import WalletBoard from './WalletBoard.vue';
import { computed, ref, inject } from 'vue';

const props = defineProps({
    title: {
        type: String,
        default: 'Transaction History',
    },
    transactions: {
        // Prop to receive the centralized transaction log array
        type: Array,
        required: true,
        default: () => [], // Default to empty array if no transactions prop is passed
    },
    isExpanded: {
        type: Boolean,
        default: false,
    },
    isPersonal: {
        type: Boolean,
        default: false,
    },
});

// Access the player and bank/tax data injected from the parent component
const players = inject('players');
const bankBalance = inject('bankBalance');
const taxBalance = inject('taxBalance');

const getWalletBalance = (walletName) => {
    if (walletName === 'Bank') {
        return bankBalance.value;
    } else if (walletName === 'Tax') {
        return taxBalance.value;
    } else {
        const player = players.value.find(p => p.name === walletName);
        return player ? player.balance : 0;
    }
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

const formatCurrencyAbbreviated = (amount) => {
    if (amount >= 1000000) {
        return `$${(amount / 1000000).toFixed(1)}M`; // Millions, 1 decimal place
    }
    if (amount >= 1000) {
        return `$${(amount / 1000).toFixed(1)}K`;    // Thousands, 1 decimal place
    }
    return `$${amount}`; // No abbreviation for amounts less than 1000
};

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

.transaction-log-component {
    font-family: sans-serif;
    /* Add any other base styles for the component here */
}

.transaction-log-component ul {
    max-height: 300px;
    /* Adjust as needed */
    /* Example max height for the log list - adjust as needed */
    overflow-y: auto;
    /* Enable vertical scrolling if log is long */
}
</style>
