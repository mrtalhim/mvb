import { ref } from 'vue';

export function useWalletExpansion() {
    const expandedWallets = ref(new Set());

    const handleWalletClicked = (walletName) => {
        console.log("Wallet clicked (composable):", walletName);
        const currentSet = expandedWallets.value;
        if (currentSet.has(walletName)) {
            currentSet.delete(walletName);
            console.log("Wallet collapsed:", walletName);
        } else {
            // Optional: Collapse others before expanding a new one
            // currentSet.clear();
            currentSet.add(walletName);
            console.log("Wallet expanded:", walletName);
        }
        // Need to trigger reactivity for the Set
        expandedWallets.value = new Set(currentSet);
    };

    const collapseAllWallets = () => {
        expandedWallets.value = new Set();
    }

    return {
        expandedWallets,
        handleWalletClicked,
        collapseAllWallets
    };
}
