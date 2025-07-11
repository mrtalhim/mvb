import { watch, toValue } from 'vue';
import { gsap } from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';

gsap.registerPlugin(TextPlugin);

// EXPORTED Helper formatting functions
export function formatCurrency(amount) {
    if (amount === Infinity) return '∞';
    return `$${amount.toLocaleString()}`; // Use toLocaleString for commas
}

export function formatCurrencyAbbreviated(amount, isExpanded) {
    if (isExpanded) {
        return formatCurrency(amount);
    }
    if (amount === Infinity) return '∞';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return formatCurrency(amount);
}

export function useBalanceTween(balanceProp, targetElementRef, isBankProp, isExpandedProp) {
  watch(
    [balanceProp, isExpandedProp], // Watch both balance and expanded state for re-formatting
    ([newBalance, newIsExpanded]) => {
      if (targetElementRef.value) {
        const currentNumericBalance = Number(toValue(newBalance)) || 0;
        const isBank = toValue(isBankProp);
        const isExpanded = toValue(newIsExpanded); // Get current expanded state

        let targetText;
        if (isBank) {
          targetText = '∞';
        } else {
          // Use the correct formatting based on whether the wallet is expanded
          targetText = formatCurrencyAbbreviated(currentNumericBalance, isExpanded);
        }

        // Check current text content to prevent unnecessary animations to the same value
        if (targetElementRef.value.textContent !== targetText) {
          gsap.to(targetElementRef.value, {
            duration: 0.7,
            text: {
              value: targetText,
              delimiter: " ", // Optional: helps with smoother animation of changing number lengths
            },
            ease: 'power2.out',
            delay: 0.1, // Keep a small delay
          });
        }
      }
    },
    { immediate: true } // Run on initial load to set initial text
  );

  // No return value needed as it directly manipulates the DOM element
}
