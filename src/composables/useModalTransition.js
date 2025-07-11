import { gsap } from "gsap";

export function useModalTransition() {
  const beforeEnterModal = (el) => {
    gsap.set(el, { opacity: 0, y: 100 }); // Initial state
  };

  const enterModal = (el, done) => {
    gsap.to(el, {
      opacity: 1,
      duration: 0.3,
      y: 0,
      ease: 'power4.out',
      onComplete: done,
    });
  };

  const leaveModal = (el, done) => {
    gsap.to(el, {
      opacity: 0,
      duration: 0.3,
      y: 100,
      ease: 'power2.in',
      onComplete: done,
    });
  };

  return {
    beforeEnterModal,
    enterModal,
    leaveModal,
  };
}
