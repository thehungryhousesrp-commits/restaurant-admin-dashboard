
"use client";

import React, { useState } from 'react';
import Lottie from 'lottie-react';
import animationData from '../../../public/reskot.animation.json';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const LogoAnimation: React.FC = () => {
  const [animationComplete, setAnimationComplete] = useState(false);

  return (
    <div className="relative h-16 w-40">
      <AnimatePresence>
        {!animationComplete && (
          <motion.div
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Lottie
              animationData={animationData}
              loop={false}
              onComplete={() => setAnimationComplete(true)}
              style={{ width: '100%', height: '100%' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {animationComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <Image
                src="/logo.png"
                alt="Reskot Logo"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{ objectFit: 'contain' }}
                priority
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LogoAnimation;
