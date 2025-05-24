import { ref } from 'vue';

export function useBankAndTax(initialTax = 0) {
    const bankBalance = ref(Infinity); // Bank always infinite
    const taxBalance = ref(initialTax);

    const updateTaxBalance = (amountChange) => {
        taxBalance.value += amountChange;
        console.log(`Tax balance updated by ${amountChange}. New balance:`, taxBalance.value);
    };

    const resetTaxBalance = (amount = 0) => {
        taxBalance.value = amount;
    }

    return {
        bankBalance,
        taxBalance,
        updateTaxBalance,
        resetTaxBalance
    };
}
