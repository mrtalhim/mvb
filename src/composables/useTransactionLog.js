import { ref } from 'vue';

export function useTransactionLog() {
    const transactionLog = ref([]);

    const logTransaction = (transactionEntry) => {
        transactionLog.value.push(transactionEntry);
        console.log(`Transaction logged to CENTRALIZED log:`, transactionEntry);
    };

    const clearLog = () => {
        transactionLog.value = [];
    }

    return {
        transactionLog,
        logTransaction,
        clearLog
    };
}
