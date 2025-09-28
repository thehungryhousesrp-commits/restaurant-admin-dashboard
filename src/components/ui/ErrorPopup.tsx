
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ErrorPopupProps {
  visible: boolean;
  message: string;
  onClose: () => void;
}

const popupVariants = {
  hidden: { opacity: 0, scale: 0.8, y: -20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -20,
    transition: { duration: 0.3 },
  },
};

export const ErrorPopup: React.FC<ErrorPopupProps> = ({ visible, message, onClose }) => {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [visible, onClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-destructive text-destructive-foreground px-6 py-4 rounded-lg shadow-lg max-w-sm w-full text-center font-semibold select-none"
          role="alert"
          aria-live="assertive"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={popupVariants}
          tabIndex={-1}
        >
          <div className="flex items-center justify-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
