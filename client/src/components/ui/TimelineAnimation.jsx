import React from 'react';
import { motion } from 'framer-motion';

/**
 * A simplified version of TimelineContent for scroll-triggered animations.
 */
export const TimelineContent = ({ 
  as = 'div', 
  animationNum, 
  timelineRef, 
  customVariants, 
  className, 
  children,
  ...props 
}) => {
  const Component = motion[as] || motion.div;

  return (
    <Component
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={customVariants}
      custom={animationNum}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
};
