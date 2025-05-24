import { ref, onMounted, nextTick } from 'vue';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { CSSPlugin } from 'gsap/CSSPlugin';

gsap.registerPlugin(Draggable, CSSPlugin);

export function useDraggableWallets(openTransactionModalFunc, getWalletBoardRefFunc) {
    const dragSource = ref(null);
    const lastDropTargetWalletName = ref(null);

    const clearWalletBoardHover = (walletName) => {
        const walletBoardRef = getWalletBoardRefFunc(walletName);
        if (walletBoardRef?.clearDropTargetHover) {
            walletBoardRef.clearDropTargetHover();
        } else {
            // console.warn(`Could not clear hover for ${walletName}, ref or method not found.`);
        }
    };

    const setupDraggable = () => {
        nextTick(() => {
            const walletElements = document.querySelectorAll('.wallet-board-draggable');
            if (!walletElements.length) {
                console.warn("No draggable wallet elements found on mount.");
                return;
            }
            const hitPercentage = '40%';

            Draggable.create(walletElements, {
                type: "x,y", // Ensure type is set for positioning
                inertia: true,
                cursor: 'grab',
                activeCursor: 'grabbing',
                onDragStart: function () {
                    const walletName = this.target.dataset.walletName;
                    console.log(`Drag started from wallet: ${walletName}`);
                    dragSource.value = walletName;

                    const rect = this.target.getBoundingClientRect();
                    this.target.dataset.initialLeft = rect.left;
                    this.target.dataset.initialTop = rect.top;
                    this.target.dataset.originalWidth = this.target.offsetWidth;
                    this.target.dataset.originalHeight = this.target.offsetHeight;

                    gsap.to(this.target, {
                        duration: 0.1,
                        scale: 1.05,
                        width: 100, // Consider if fixed size is always desired
                        height: 100,
                        y: -5,
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
                        zIndex: 100
                    });

                    // Fade others
                    walletElements.forEach((el) => {
                        if (el !== this.target) {
                            gsap.to(el, { duration: 0.1, opacity: 0.3 });
                        } else {
                             gsap.to(el, { duration: 0.1, opacity: 1 }); // Ensure dragged is opaque
                        }
                    });
                },
                onDrag: function () {
                    const dropTargets = Array.from(walletElements).filter(el => el !== this.target); // Exclude self
                    let currentHighlightedWalletName = null;

                    // Hit testing and highlighting
                    dropTargets.forEach(target => {
                        if (this.hitTest(target, hitPercentage)) {
                            currentHighlightedWalletName = target.dataset.walletName;
                        }
                    });

                    // Update highlights based on current target
                    if (currentHighlightedWalletName) {
                        if (currentHighlightedWalletName !== lastDropTargetWalletName.value) {
                            // De-highlight previous if exists
                            if (lastDropTargetWalletName.value) {
                                const prevTarget = document.querySelector(`.wallet-board-draggable[data-wallet-name="${lastDropTargetWalletName.value}"]`);
                                if (prevTarget) gsap.to(prevTarget, { duration: 0.1, border: '', backgroundColor: '', scale: 1, boxShadow: '' });
                            }
                            // Highlight current
                            const currentTarget = document.querySelector(`.wallet-board-draggable[data-wallet-name="${currentHighlightedWalletName}"]`);
                            if (currentTarget) gsap.to(currentTarget, { duration: 0.1, border: '5px solid red', backgroundColor: 'yellow', scale: 1.1, boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' });

                            lastDropTargetWalletName.value = currentHighlightedWalletName;
                        }
                    } else {
                        // No target hit, de-highlight previous if exists
                        if (lastDropTargetWalletName.value) {
                            const prevTarget = document.querySelector(`.wallet-board-draggable[data-wallet-name="${lastDropTargetWalletName.value}"]`);
                            if (prevTarget) gsap.to(prevTarget, { duration: 0.1, border: '', backgroundColor: '', scale: 1, boxShadow: '' });
                            lastDropTargetWalletName.value = null;
                        }
                    }

                    // Proximity opacity/scale (optional, can be simplified if highlight is enough)
                    dropTargets.forEach(target => {
                         if (target.dataset.walletName !== currentHighlightedWalletName) { // Don't fade the highlighted one
                            gsap.to(target, {
                                opacity: this.hitTest(target, hitPercentage) ? 1 : 0.3, // Keep opacity high if hit, otherwise low
                                scale: this.hitTest(target, hitPercentage) ? 1.1 : 1, // Keep scale high if hit
                                duration: 0.1,
                                overwrite: 'auto'
                            });
                         }
                    });
                },
                onDragEnd: function () {
                    const targetWalletName = lastDropTargetWalletName.value; // The wallet it was dropped on
                    const sourceWalletName = dragSource.value;
                    const droppedElement = this.target;

                    // --- Reset Visuals ---
                    // Animate back to original size/position (relative to parent)
                    const originalWidth = parseFloat(droppedElement.dataset.originalWidth) || 'auto'; // Fallback
                    const originalHeight = parseFloat(droppedElement.dataset.originalHeight) || 'auto';

                    gsap.to(droppedElement, {
                        duration: 0.3,
                        x: 0, // Reset GSAP transforms
                        y: 0,
                        scale: 1,
                        width: originalWidth,
                        height: originalHeight,
                        boxShadow: '',
                        zIndex: 0, // Reset z-index
                        ease: "power2.out",
                        overwrite: true
                    });

                    // Restore opacity of all wallets
                    gsap.to(walletElements, { duration: 0.2, opacity: 1 });

                    // Clear any remaining highlight styles
                     if (targetWalletName) {
                        const finalTargetElement = document.querySelector(`.wallet-board-draggable[data-wallet-name="${targetWalletName}"]`);
                        if (finalTargetElement) {
                            gsap.to(finalTargetElement, { duration: 0.2, border: '', backgroundColor: '', scale: 1, boxShadow: '' });
                        }
                    }

                    // --- Handle Drop Logic ---
                    if (sourceWalletName && targetWalletName && sourceWalletName !== targetWalletName) {
                        console.log(`Drop detected: ${sourceWalletName} -> ${targetWalletName}`);
                        clearWalletBoardHover(sourceWalletName);
                        clearWalletBoardHover(targetWalletName);
                        openTransactionModalFunc(sourceWalletName, targetWalletName); // Trigger modal
                    } else {
                         console.log("Drop finished outside a valid target or onto self.");
                    }

                    // Reset state
                    dragSource.value = null;
                    lastDropTargetWalletName.value = null;
                },
            });
            console.log("GSAP Draggable initialized for wallet boards.");
        });
    };

    // Call setupDraggable when the composable is used and component is mounted
    onMounted(setupDraggable);

    // Return setup function if manual re-initialization is needed, otherwise not necessary
    return {
        setupDraggable // Expose if needed, e.g., after dynamic changes
    };
}
