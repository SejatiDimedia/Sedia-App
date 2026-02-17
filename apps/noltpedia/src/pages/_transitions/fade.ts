export default {
  name: 'fade',
  enter(element) {
    element.animate(
      [
        { opacity: 0, transform: 'translateY(10px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      {
        duration: 300,
        easing: 'ease-out',
      }
    );
  },
  leave(element) {
    element.animate(
      [
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: 'translateY(-10px)' },
      ],
      {
        duration: 200,
        easing: 'ease-in',
      }
    );
  },
};
