import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export const Reveal = ({ children, delay = 0 }: { children: ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      duration: 0.5,
      delay,
      ease: [0.215, 0.61, 0.355, 1],
    }}
  >
    {children}
  </motion.div>
);
