"use client";

import { type HTMLMotionProps, motion } from "motion/react";

export default function AnimateDiv(props: HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      {...props}
    />
  );
}
