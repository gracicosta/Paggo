export const sidebarVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.03,
      delayChildren: 0.03,
    },
  },
};

export const itemVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.28 },
  },
};

export const smoothSpring = {
  type: "spring" as const,
  damping: 30,
  stiffness: 200,
};