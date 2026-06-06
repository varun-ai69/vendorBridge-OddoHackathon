"use client";

import { motion } from "framer-motion";

export default function LoadingSpinner({ size = "md", className = "" }) {
  const sizes = { sm: "h-5 w-5", md: "h-8 w-8", lg: "h-12 w-12" };
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={`${sizes[size]} rounded-full border-2 border-accent/20 border-t-accent`}
      />
    </div>
  );
}
