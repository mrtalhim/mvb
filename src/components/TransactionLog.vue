<template>
    <div class="transaction-log-component mt-8 w-1/12">
        <h2 class="text-lg font-bold mb-2 text-center">Transaction History (All Players)</h2>
        <ul class="border rounded-md p-2 bg-white dark:bg-gray-800 dark:text-white">
            <li v-for="(transaction, index) in transactions" :key="index"
                class="py-1 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                {{ transaction.timestamp }} - {{ transaction.senderName }} ➡️ {{ transaction.receiverName }}: ${{
                    transaction.amount }}
            </li>
            <li v-if="transactions.length === 0" class="text-gray-500 py-1 text-center dark:text-gray-400">No
                transactions yet.</li>
        </ul>
    </div>
</template>

<script setup>
const props = defineProps({
    transactions: { // Prop to receive the centralized transaction log array
        type: Array,
        required: true,
        default: () => [] // Default to empty array if no transactions prop is passed
    }
});
</script>

<style scoped>
@reference "../style.css";

.transaction-log-component {
    font-family: sans-serif;
}

.transaction-log-component ul {
    max-height: 300px;
    /* Example max height for the log list - adjust as needed */
    overflow-y: auto;
    /* Enable vertical scrolling if log is long */
}
</style>