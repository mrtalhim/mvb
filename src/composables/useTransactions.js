import { ref, computed, nextTick } from 'vue';

// Pass necessary reactive refs and functions from the main component
export function useTransactions(
    playersRef, // The ref containing the players array from usePlayers
    bankBalanceRef, // The ref for bank balance from useBankAndTax
    taxBalanceRef, // The ref for tax balance from useBankAndTax
    logTransactionFunc, // The logTransaction function from useTransactionLog
    getWalletBoardRefFunc, // Function to get WalletBoard component instance ref
    getWalletOrientationFunc, // Function from useLayout
    getWalletColorFunc, // Function from useLayout
    updatePlayerBalanceFunc, // Function from usePlayers
    updateTaxBalanceFunc // Function from useBankAndTax
) {
    const isModalVisible = ref(false);
    const senderWalletName = ref(null);
    const senderWalletColor = ref(null);
    const receiverWalletName = ref(null);
    const receiverWalletColor = ref(null);
    const selectedWalletOrientation = ref('up'); // For modal orientation

    // Computed property for sender balance (reads from the passed refs)
    const selectedWalletBalance = computed(() => {
        if (!senderWalletName.value) return 0;
        if (senderWalletName.value === 'Bank') return bankBalanceRef.value;
        if (senderWalletName.value === 'Tax') return taxBalanceRef.value;
        const player = playersRef.value.find(p => p.name === senderWalletName.value);
        return player ? player.balance : 0;
    });

    // Computed property for receiver balance (reads from the passed refs)
    const receiverWalletBalance = computed(() => {
        if (!receiverWalletName.value) return 0;
        if (receiverWalletName.value === 'Bank') return bankBalanceRef.value;
        if (receiverWalletName.value === 'Tax') return taxBalanceRef.value;
        const player = playersRef.value.find(p => p.name === receiverWalletName.value);
        return player ? player.balance : 0;
    });

    const openTransactionModal = (sender, receiver) => {
        console.log(`Opening transaction modal for: ${sender} -> ${receiver}`);
        senderWalletName.value = sender;
        receiverWalletName.value = receiver;
        senderWalletColor.value = getWalletColorFunc(sender);
        receiverWalletColor.value = getWalletColorFunc(receiver);
        selectedWalletOrientation.value = getWalletOrientationFunc(sender) || 'up';
        isModalVisible.value = true;
    };

    const handleConfirmValue = async (eventPayload) => {
        if (!eventPayload) {
            handleCancelModal();
            return;
        }

        const { amount, senderName, receiverName } = eventPayload;
        console.log(`Transaction Confirmed: ${senderName} -> ${receiverName}, Amount: $${amount}`);

        let senderSuccess = true;
        let receiverSuccess = true;

        // Update sender's balance
        if (senderName !== 'Bank') { // No change for Bank
            if (senderName === 'Tax') {
                updateTaxBalanceFunc(-amount); // Use the function from useBankAndTax
            } else {
                senderSuccess = updatePlayerBalanceFunc(senderName, -amount); // Use the function from usePlayers
            }
        }

        // Update receiver's balance
        if (receiverName !== 'Bank') { // No change needed for Bank (it's infinite)
             if (receiverName === 'Tax') {
                updateTaxBalanceFunc(amount); // Use the function from useBankAndTax
            } else {
                receiverSuccess = updatePlayerBalanceFunc(receiverName, amount); // Use the function from usePlayers
            }
        }

        if (!senderSuccess || !receiverSuccess) {
            console.error("Balance update failed for sender or receiver. Transaction aborted.");
            // TODO: Potentially add rollback logic or user feedback here
            handleCancelModal();
            return;
        }

        // Log the transaction
        const transactionEntry = {
            timestamp: new Date().toLocaleString(),
            senderName: senderName,
            receiverName: receiverName,
            amount: amount,
            transactionType: 'transfer',
        };
        logTransactionFunc(transactionEntry); // Use the function from useTransactionLog

        // Push transaction to individual wallet histories (requires component refs)
        await nextTick(); // Ensure DOM is updated if refs depend on it
        const senderWalletBoardRef = getWalletBoardRefFunc(senderName);
        const receiverWalletBoardRef = getWalletBoardRefFunc(receiverName);

        if (senderWalletBoardRef?.pushTransaction) {
            senderWalletBoardRef.pushTransaction(transactionEntry);
            console.log(`Transaction logged to sender wallet (${senderName}) history.`);
        } else {
             console.warn(`Sender WalletBoard ref (${senderName}) or pushTransaction not available.`);
        }

        if (receiverWalletBoardRef?.pushTransaction) {
            receiverWalletBoardRef.pushTransaction(transactionEntry);
            console.log(`Transaction logged to receiver wallet (${receiverName}) history.`);
        } else {
             console.warn(`Receiver WalletBoard ref (${receiverName}) or pushTransaction not available.`);
        }

        handleCancelModal(); // Close modal and reset state
    };

    const handleCancelModal = () => {
        isModalVisible.value = false;
        senderWalletName.value = null;
        receiverWalletName.value = null;
        senderWalletColor.value = null;
        receiverWalletColor.value = null;
        // Don't reset orientation here, let openTransactionModal set it
    };

    return {
        isModalVisible,
        senderWalletName,
        senderWalletColor,
        receiverWalletName,
        receiverWalletColor,
        selectedWalletOrientation,
        selectedWalletBalance, // Expose computed balance
        receiverWalletBalance, // Expose computed balance
        openTransactionModal,
        handleConfirmValue,
        handleCancelModal,
    };
}
