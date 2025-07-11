import { watch, toValue, nextTick } from 'vue';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

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

// Function to parse the formatted string into prefix, value, suffix
function parseFormattedBalance(formattedString) {
    if (formattedString === '∞') {
        return { prefix: '', value: '∞', suffix: '' };
    }
    const match = formattedString.match(/^(\$)?([\d,]+(?:\.\d+)?)(\s*[KM])?$/);
    if (match) {
        return {
            prefix: match[1] || '', // $ or empty
            value: match[2] || '',  // Numeric part
            suffix: match[3] || ''  // K, M or empty (includes space if present)
        };
    }
    return { prefix: '$', value: formattedString.replace('$', ''), suffix: '' }; // Fallback
}


export function useBalanceTween(
    balanceProp,
    symbolElementRef, // Ref for currency symbol span
    valueElementRef,   // Ref for value span (target for SplitText)
    suffixElementRef,  // Ref for suffix span (K, M)
    isBankProp,
    isExpandedProp
) {
  let splitInstance = null;

  watch(
    [balanceProp, isExpandedProp],
    async ([newBalance, newIsExpanded]) => {
      await nextTick(); // Ensure refs are populated

      if (!valueElementRef.value || !symbolElementRef.value || !suffixElementRef.value) {
        // console.warn("Balance tween target elements not yet available.");
        return;
      }

      const currentNumericBalance = Number(toValue(newBalance)) || 0;
      const isBank = toValue(isBankProp);
      const isExpanded = toValue(newIsExpanded);

      let fullFormattedText;
      if (isBank) {
        fullFormattedText = '∞';
      } else {
        fullFormattedText = formatCurrencyAbbreviated(currentNumericBalance, isExpanded);
      }

      const { prefix, value, suffix } = parseFormattedBalance(fullFormattedText);

      // Update prefix and suffix directly
      symbolElementRef.value.textContent = prefix;
      suffixElementRef.value.textContent = suffix.trim(); // Trim space for consistency

      // Animate the value using SplitText if it has changed
      if (valueElementRef.value.textContent !== value) {
        // Revert previous SplitText if it exists to prevent conflicts
        if (splitInstance) {
          splitInstance.revert();
        }

        valueElementRef.value.textContent = value; // Set new text content for SplitText to work on

        if (value === '∞') { // If bank, don't split '∞'
            gsap.fromTo(valueElementRef.value, { opacity: 0 }, { opacity: 1, duration: 0.3 });
            return;
        }

        // Only proceed with SplitText if value is not empty and refs are valid
        if (value && valueElementRef.value) {
            // Set the new text content first
            valueElementRef.value.textContent = value;

            splitInstance = new SplitText(valueElementRef.value, { type: "chars" });

            if (splitInstance.chars && splitInstance.chars.length > 0) {
                // Immediately set the initial state of the characters
                gsap.set(splitInstance.chars, { opacity: 0, y: -20 });
                // Then animate them to their final state
                gsap.to(splitInstance.chars, {
                    duration: 0.4,
                    opacity: 1,
                    y: 0,
                    stagger: 0.03,
                    ease: 'power2.out',
                    // onComplete: () => {
                        // Optional: revert after animation
                        // if (splitInstance) splitInstance.revert();
                    // }
                });
            }
        }
      }
    },
    { immediate: true, flush: 'post' } // flush: 'post' to ensure DOM elements are ready
  );
}
