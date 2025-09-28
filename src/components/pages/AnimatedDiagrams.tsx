"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs' // adjust import paths

const primary = 'data-[state=active]:bg-blue-900/80 data-[state=active]:text-blue-200 text-gray-300'
const secondary = 'data-[state=active]:bg-teal-900/80 data-[state=active]:text-teal-200 text-gray-300'
const accent = 'data-[state=active]:bg-orange-900/80 data-[state=active]:text-orange-200 text-gray-300'

export const AnimatedDiagrams: React.FC = () => {
  const [tab, setTab] = useState<'er' | 'seq' | 'flow'>('er')

  const erControls = useAnimationControls();
  const seqControls = useAnimationControls();
  const flowControls = useAnimationControls();

  useEffect(() => {
    if (tab === 'er') erControls.start('visible');
    if (tab === 'seq') seqControls.start('visible');
    if (tab === 'flow') flowControls.start('visible');
  }, [tab, erControls, seqControls, flowControls]);

  const fadeIn = { 
    hidden: { opacity: 0 }, 
    visible: { opacity: 1, transition: { staggerChildren: 0.3, when: "beforeChildren" } } 
  }
  const drawLine = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { 
      pathLength: 1, 
      opacity: 1, 
      transition: { duration: 1, ease: 'easeInOut' } 
    }
  }

  const nodes = [
    { label: 'Users', x: 100, y: 175 },
    { label: 'Categories', x: 300, y: 100 },
    { label: 'Menu-Items', x: 500, y: 100 },
    { label: 'Orders', x: 300, y: 250 }
  ];

  const relationships = [
    { from: 1, to: 2, classes: "stroke-[#2EC4B6]" }, // Categories -> Menu-Items
    { from: 0, to: 3, classes: "stroke-[#FF6B35]" }, // Users -> Orders
    { from: 2, to: 3, classes: "stroke-gray-500" }, // Menu-Items -> Orders (as part of order)
  ];
  
  const seqParticipants = ['Customer/UI', 'React FE', 'Auth', 'Firestore DB'];
  const seqMessages = [
    { from: 0, to: 1, text: 'placeOrder(items, info)', y: 80, delay: 0.5 },
    { from: 1, to: 2, text: 'check auth.currentUser', y: 120, delay: 1 },
    { from: 2, to: 1, text: 'user UID', y: 160, delay: 1.5, dashed: true },
    { from: 1, to: 3, text: 'addDoc(orderData)', y: 200, delay: 2 },
    { from: 3, to: 1, text: 'order ID', y: 240, delay: 2.8, dashed: true },
    { from: 1, to: 0, text: 'showInvoice(order)', y: 280, delay: 3.2, dashed: true }
  ];

  const flowNodes = [
    { label: 'Start', x: 80, y: 200 },
    { label: 'Visit Site', x: 240, y: 200 },
    { label: 'Login As Admin', x: 400, y: 100 },
    { label: 'Take Order', x: 400, y: 300 },
    { label: 'Manage Menu', x: 580, y: 100 },
    { label: 'Generate Invoice', x: 580, y: 300 },
    { label: 'End', x: 720, y: 200 }
  ];

  const flowPaths = [
    { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 1, to: 3 },
    { from: 2, to: 4 }, { from: 3, to: 5 }, { from: 4, to: 2 },
    { from: 5, to: 3 }, { from: 4, to: 6}, { from: 5, to: 6}
  ];

  return (
    <Tabs value={tab} onValueChange={(val: any) => setTab(val)} className="w-full max-w-4xl mx-auto text-white">
      <TabsList className="bg-gray-900 rounded-md overflow-hidden grid grid-cols-3">
        <TabsTrigger value="er" className={`flex-1 py-2 ${primary}`}>ER Diagram</TabsTrigger>
        <TabsTrigger value="seq" className={`flex-1 py-2 ${secondary}`}>Sequence</TabsTrigger>
        <TabsTrigger value="flow" className={`flex-1 py-2 ${accent}`}>User Flow</TabsTrigger>
      </TabsList>
      
      <div className="mt-4 bg-gray-800/50 rounded-lg p-4 min-h-[450px]">
        <AnimatePresence mode="wait">
          {tab === 'er' && (
            <motion.div key="er" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.svg
                viewBox="0 0 800 400"
                className="w-full h-auto"
                variants={fadeIn}
                initial="hidden"
                animate={erControls}
              >
                {relationships.map((rel, i) => (
                  <motion.path
                    key={i}
                    d={`M ${nodes[rel.from].x + 60},${nodes[rel.from].y} C ${nodes[rel.from].x + 120},${nodes[rel.from].y} ${nodes[rel.to].x - 120},${nodes[rel.to].y} ${nodes[rel.to].x - 60},${nodes[rel.to].y}`}
                    className={`${rel.classes} stroke-2 fill-transparent`}
                    variants={drawLine}
                  />
                ))}
                {nodes.map((entity) => (
                  <motion.g
                    key={entity.label}
                    className="cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                  >
                    <rect x={entity.x - 60} y={entity.y - 30} width={120} height={60} rx={8} className="fill-gray-900 stroke-white/80 stroke-1"/>
                    <text x={entity.x} y={entity.y + 5} textAnchor="middle" className="fill-white font-semibold text-sm">{entity.label}</text>
                  </motion.g>
                ))}
              </motion.svg>
            </motion.div>
          )}

          {tab === 'seq' && (
             <motion.div key="seq" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.svg
                viewBox="0 0 800 350"
                className="w-full h-auto"
                initial="hidden"
                animate={seqControls}
                variants={fadeIn}
              >
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#FF6B35" />
                  </marker>
                   <marker id="arrow-dashed" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#2EC4B6" />
                  </marker>
                </defs>

                {seqParticipants.map((p, i) => (
                  <motion.g key={p} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
                    <line x1={120 + i * 180} y1={20} x2={120 + i * 180} y2={320} className="stroke-white/50 stroke-[1.5]"/>
                    <text x={120 + i * 180} y={40} textAnchor="middle" className="fill-white font-medium">{p}</text>
                  </motion.g>
                ))}

                {seqMessages.map((msg, i) => (
                   <motion.g key={i} initial="hidden" animate="visible" variants={{ visible: { transition: { delay: msg.delay } } }}>
                    <motion.path
                      d={`M ${120 + msg.from * 180} ${msg.y} H ${120 + msg.to * 180}`}
                      className={msg.dashed ? "stroke-[#2EC4B6] stroke-2" : "stroke-[#FF6B35] stroke-2"}
                      strokeDasharray={msg.dashed ? "5 5" : "0"}
                      markerEnd={msg.dashed ? 'url(#arrow-dashed)' : 'url(#arrow)'}
                      variants={drawLine}
                    />
                    <motion.text
                      x={(120 + msg.from * 180 + 120 + msg.to * 180) / 2}
                      y={msg.y - 5}
                      textAnchor="middle"
                      className="fill-gray-300 text-xs font-medium"
                      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delay: msg.delay + 0.5 } } }}
                    >
                      {msg.text}
                    </motion.text>
                  </motion.g>
                ))}
              </motion.svg>
              <div className="text-center mt-4">
                <button
                    className="px-4 py-2 bg-[#2EC4B6] text-[#1D2D3A] rounded-md font-semibold hover:brightness-110"
                    onClick={() => seqControls.start('hidden').then(() => seqControls.start('visible'))}
                > Replay Animation </button>
              </div>
            </motion.div>
          )}

          {tab === 'flow' && (
            <motion.div key="flow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.svg
                viewBox="0 0 800 400"
                className="w-full h-auto"
                variants={fadeIn}
                initial="hidden"
                animate={flowControls}
              >
                 <defs>
                  <marker id="flow-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#0052CC" />
                  </marker>
                </defs>

                {flowPaths.map((path, i) => {
                  const fromNode = flowNodes[path.from];
                  const toNode = flowNodes[path.to];
                  const d = `M ${fromNode.x} ${fromNode.y} C ${fromNode.x + 80},${fromNode.y} ${toNode.x - 80},${toNode.y} ${toNode.x},${toNode.y}`;
                  return <motion.path key={i} d={d} className="stroke-[#0052CC] stroke-2 fill-transparent" markerEnd='url(#flow-arrow)' variants={drawLine} />;
                })}

                {flowNodes.map((node, i) => (
                  <motion.g
                    key={node.label}
                    className="cursor-pointer"
                    whileHover={{ scale: 1.08 }}
                    variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                  >
                    <rect x={node.x - 60} y={node.y - 25} width={120} height={50} rx={25} className="fill-gray-900 stroke-[#2EC4B6] stroke-2"/>
                    <text x={node.x} y={node.y + 5} textAnchor="middle" className="fill-white text-sm font-medium">{node.label}</text>
                  </motion.g>
                ))}
              </motion.svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Tabs>
  )
}
