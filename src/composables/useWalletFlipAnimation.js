import { watch, ref, nextTick } from 'vue';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

export function useWalletFlipAnimation(walletBoardRef, expandedProp, isTappable) {
  const isAnimatingExpansion = ref(false);
  let glowAnimation = null; // To store the glow animation instance

  const collapsedState = ref({
    width: '100%',
    height: '100%', // Default, will be captured
    position: 'relative',
    top: 'auto',
    left: 'auto',
    xPercent: 0,
    yPercent: 0,
    zIndex: 'auto',
    borderRadius: '0.75rem', // Assuming default from your CSS
    boxShadow: '0 0 0 rgba(0,0,0,0)' // Assuming default from your CSS
  });

  // Capture initial collapsed state including dimensions
  const captureCollapsedState = async () => {
    await nextTick(); // Ensure DOM is updated
    if (walletBoardRef.value) {
      const rect = walletBoardRef.value.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(walletBoardRef.value);

      collapsedState.value = {
        width: rect.width + 'px',
        height: rect.height + 'px',
        position: 'relative', // Or read from computedStyle if dynamic
        top: 'auto',
        left: 'auto',
        xPercent: 0,
        yPercent: 0,
        zIndex: 'auto', // Or read from computedStyle
        borderRadius: computedStyle.borderRadius,
        boxShadow: computedStyle.boxShadow,
        // Potentially capture other styles you want to revert to
      };
      // console.log("Captured Collapsed State:", collapsedState.value);
    }
  };

  watch(expandedProp, (isExpanded) => {
    if (!walletBoardRef.value || !isTappable.value) return;

    isAnimatingExpansion.value = true;
    const el = walletBoardRef.value;

    if (isExpanded) {
      const flipState = Flip.getState(el);
      gsap.set(el, {
        position: 'fixed',
        xPercent: -50,
        yPercent: -50,
        top: "50%",
        left: "50%",
        width: '100vw',
        height: '100svh', // Use svh for mobile viewport height
        zIndex: 101, // Ensure it's above other elements
        borderRadius: 0,
        boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
        overflow: 'hidden' // Hide overflow during animation
      });

      Flip.from(flipState, {
        duration: 0.5,
        ease: "power2.inOut",
        scale: true, // Enable scaling for a smoother visual effect
        absolute: true, // Important for fixed positioning transitions
        onComplete: () => {
          gsap.set(el, { overflow: 'auto' }); // Allow scrolling after expansion
          isAnimatingExpansion.value = false;
          // console.log("Expand Animation Complete");

          // Start glow animation
          if (glowAnimation) glowAnimation.kill(); // Kill previous if any
          glowAnimation = gsap.to(el, {
            boxShadow: `0 0 15px 5px rgba(var(--glow-color, 0, 255, 0), 0.7), 0 0 25px 10px rgba(var(--glow-color, 0, 255, 0), 0.5)`,
            duration: 1.5,
            ease: "power1.inOut",
            repeat: -1,
            yoyo: true,
          });
          // Set a default glow color (e.g., white) or make it dynamic via CSS var
          el.style.setProperty('--glow-color', '255, 255, 255');


        }
      });
    } else { // Collapsing
      if (glowAnimation) {
        glowAnimation.kill();
        glowAnimation = null;
        // Reset box-shadow to its collapsed state or a default non-glow state
        gsap.to(el, { boxShadow: collapsedState.value.boxShadow || '0 0 0 rgba(0,0,0,0)', duration: 0.3 });
      }
      gsap.set(el, { overflow: 'hidden' }); // Hide overflow during collapse

      const flipState = Flip.getState(el, { props: "position,top,left,width,height,xPercent,yPercent,zIndex,borderRadius,boxShadow,overflow" }); // Specify props for Flip to track

      // Set to final collapsed state using captured values
      gsap.set(el, {
        ...collapsedState.value,
        // Ensure any transform-related properties are reset if not part of collapsedState
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        clearProps: "transform" // Good practice to clear transform if not explicitly set
      });


      Flip.from(flipState, {
        scale: true,
        duration: 0.7,
        delay: 0, // No delay needed usually
        ease: "power1.inOut",
        absolute: true, // Important for transitioning from fixed
        onComplete: () => {
          // Ensure all inline styles set during expansion are cleared or reset
          // gsap.set(el, { clearProps: "all" }); // This might be too aggressive
          // Instead, explicitly reset to captured collapsed state
          gsap.set(el, collapsedState.value);
          isAnimatingExpansion.value = false;
          // console.log("Collapse Animation Complete");
        }
      });
    }
  });

  return {
    isAnimatingExpansion,
    captureCollapsedState // Expose this to be called onMounted
  };
}
