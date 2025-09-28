"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs' 

const primary = 'data-[state=active]:bg-blue-900/80 data-[state=active]:text-blue-200 text-gray-300'
const secondary = 'data-[state=active]:bg-teal-900/80 data-[state=active]:text-teal-200 text-gray-300'
const accent = 'data-[state=active]:bg-orange-900/80 data-[state=active]:text-orange-200 text-gray-300'

const accentColor = '#FF6B35'
const primaryColor = '#0052CC'
const secondaryColor = '#2EC4B6'
const bgColor = '#1D2D3A'


interface StepProps {
  from: 'Customer/UI' | 'React FE' | 'Firebase Auth' | 'Firestore DB';
  to: 'Customer/UI' | 'React FE' | 'Firebase Auth' | 'Firestore DB';
  text: string;
  delay: number;
}

const MessageArrow: React.FC<StepProps> = ({ from, to, text, delay }) => {
    // Example: columns positions (x) in px:
    const positions = { 'Customer/UI': 100, 'React FE': 280, 'Firebase Auth': 460, 'Firestore DB': 640 }
    const yStart = 80 + delay * 40
    const xStart = positions[from]
    const xEnd = positions[to]
  
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay * 0.8 + 0.5 }}>
            <motion.path
                d={`M${xStart},${yStart} L${xEnd},${yStart}`}
                stroke={accentColor}
                strokeWidth={2}
                fill="none"
                markerEnd="url(#arrowhead)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
            />
            <motion.text
                x={(xStart + xEnd) / 2}
                y={yStart - 10}
                fill={accentColor}
                style={{ fontSize: '0.85rem', fontWeight: 600 }}
                textAnchor="middle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                {text}
            </motion.text>
      </motion.g>
    )
}


export const AnimatedDiagrams: React.FC = () => {
  const [tab, setTab] = useState<'er' | 'seq' | 'flow'>('er')
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  const fadeIn = { 
    hidden: { opacity: 0, y: 10 }, 
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.3, when: "beforeChildren" } } 
  }
  const drawLine = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (custom: number = 0) => ({ 
      pathLength: 1, 
      opacity: 1, 
      transition: { duration: 1, ease: 'easeInOut', delay: custom * 0.4 } 
    })
  }
  
  const nodeVariant = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };


  const erNodes = [
    { label: 'Users', x: 150, y: 200 },
    { label: 'Categories', x: 350, y: 100 },
    { label: 'Menu-Items', x: 550, y: 200 },
    { label: 'Orders', x: 350, y: 300 }
  ];

  const erRelationships = [
    { from: 1, to: 2, classes: "stroke-secondary", d: `M ${erNodes[1].x + 60},${erNodes[1].y} C ${erNodes[1].x + 120},${erNodes[1].y} ${erNodes[2].x - 120},${erNodes[2].y} ${erNodes[2].x - 60},${erNodes[2].y}` },
    { from: 0, to: 3, classes: "stroke-accent", d: `M ${erNodes[0].x},${erNodes[0].y+30} L ${erNodes[3].x},${erNodes[3].y-30}` },
    { from: 2, to: 3, classes: "stroke-gray-500", d: `M ${erNodes[2].x-30},${erNodes[2].y+30} L ${erNodes[3].x+30},${erNodes[3].y-30}` },
  ];
  
  const userFlowNodes = [
    { id: 'start', label: 'Start', x: 100, y: 200 },
    { id: 'visit_site', label: 'Visit Site', x: 250, y: 200 },
    { id: 'login_admin', label: 'Login Admin', x: 400, y: 100 },
    { id: 'take_order', label: 'Take Order', x: 400, y: 300 },
    { id: 'manage_menu', label: 'Manage Menu', x: 550, y: 100 },
    { id: 'generate_invoice', label: 'Gen. Invoice', x: 550, y: 300 },
    { id: 'end', label: 'End', x: 700, y: 200 }
  ];

  const userFlowEdges = [
    { from: 'start', to: 'visit_site' },
    { from: 'visit_site', to: 'login_admin' },
    { from: 'visit_site', to: 'take_order' },
    { from: 'login_admin', to: 'manage_menu' },
    { from: 'take_order', to: 'generate_invoice' },
    { from: 'manage_menu', to: 'login_admin', isReturn: true },
    { from: 'generate_invoice', to: 'take_order', isReturn: true },
    { from: 'manage_menu', to: 'end' },
    { from: 'generate_invoice', to: 'end' }
  ];
  
  const isEdgeActive = (edge: { from: string; to: string }) => {
    if (!hoveredNode) return true // show all if none hovered
    return edge.from === hoveredNode
  }

  return (
    <Tabs value={tab} onValueChange={(val) => setTab(val as 'er' | 'seq' | 'flow')} className="w-full max-w-4xl mx-auto text-white">
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
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                >
                  {erRelationships.map((rel, i) => (
                    <motion.path
                      key={i}
                      d={rel.d}
                      className={`${rel.classes} stroke-2 fill-transparent`}
                      variants={drawLine}
                      custom={i}
                    />
                  ))}
                  {erNodes.map((entity) => (
                    <motion.g
                      key={entity.label}
                      className="cursor-pointer"
                      whileHover={{ scale: 1.05 }}
                      variants={nodeVariant}
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
                 <section aria-label="Sequence Diagram: Place Order Process">
                     <svg
                         viewBox="0 0 800 300"
                         className="w-full h-auto"
                         aria-hidden="true"
                     >
                         <defs>
                             <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto" fill={accentColor}>
                             <polygon points="0 0, 10 3.5, 0 7" />
                             </marker>
                         </defs>
  
                         {['Customer/UI', 'React FE', 'Firebase Auth', 'Firestore DB'].map((p, i) => (
                             <motion.g key={p} initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: i * 0.2}}>
                                 <line
                                     x1={100 + i * 180} y1={40} x2={100 + i * 180} y2={260}
                                     stroke={primaryColor} strokeWidth={2} strokeDasharray="6 4"
                                 />
                                 <text
                                     x={100 + i * 180} y={30} fill={primaryColor} fontWeight={700}
                                     textAnchor="middle" fontSize={16}
                                 >
                                     {p}
                                 </text>
                             </motion.g>
                         ))}
                         <motion.g initial="hidden" animate="visible" variants={fadeIn}>
                             <MessageArrow from="Customer/UI" to="React FE" text="placeOrder()" delay={0} />
                             <MessageArrow from="React FE" to="Firestore DB" text="addDoc(order)" delay={1} />
                             <MessageArrow from="Firestore DB" to="React FE" text="return orderId" delay={2} />
                             <MessageArrow from="React FE" to="Customer/UI" text="Show Invoice" delay={3} />
                         </motion.g>
                     </svg>
                 </section>
               </motion.div>
            )}

            {tab === 'flow' && (
               <motion.div key="flow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                 <section aria-label="User Flow Diagram: Main Application Journey">
                     <svg viewBox="0 0 800 400" className="w-full h-auto" aria-hidden="true">
                         {userFlowEdges.map((edge, idx) => {
                             const fromNode = userFlowNodes.find(n => n.id === edge.from)!
                             const toNode = userFlowNodes.find(n => n.id === edge.to)!
                             const isActive = isEdgeActive(edge);
                             
                             const d = edge.isReturn 
                                 ? `M ${fromNode.x} ${fromNode.y - 30} C ${fromNode.x - 50},${fromNode.y - 80} ${toNode.x + 50},${toNode.y - 80} ${toNode.x},${toNode.y - 30}`
                                 : `M ${fromNode.x + 40} ${fromNode.y} L ${toNode.x - 40} ${toNode.y}`;
  
                             return (
                             <motion.path
                                 key={`${edge.from}-${edge.to}`}
                                 d={d}
                                 stroke={accentColor}
                                 strokeWidth={isActive ? 3 : 1.5}
                                 strokeLinecap="round"
                                 fill="none"
                                 initial={{ pathLength: 0, opacity: 0 }}
                                 animate={{ pathLength: 1, opacity: isActive ? 1 : 0.3 }}
                                 transition={{ duration: 1.5, delay: idx * 0.2, ease: 'easeInOut' }}
                                 style={{
                                     filter: isActive ? `drop-shadow(0 0 4px ${accentColor})` : 'none',
                                 }}
                             />
                             )
                         })}
  
                         {userFlowNodes.map(node => (
                             <g
                                 key={node.id}
                                 className="cursor-pointer"
                                 onMouseEnter={() => setHoveredNode(node.id)}
                                 onMouseLeave={() => setHoveredNode(null)}
                             >
                                 <motion.rect
                                     x={node.x - 40} y={node.y - 30} width={80} height={60}
                                     rx={12} ry={12}
                                     fill={bgColor}
                                     stroke={node.id === hoveredNode ? accentColor : secondaryColor}
                                     strokeWidth={node.id === hoveredNode ? 3 : 2}
                                     initial={{ opacity: 0 }}
                                     animate={{ opacity: 1 }}
                                     transition={{ delay: 0.5 }}
                                 />
                                 <motion.text
                                     x={node.x} y={node.y + 5}
                                     fill={node.id === hoveredNode ? accentColor : '#fff'}
                                     fontWeight={600} fontSize={14}
                                     textAnchor="middle"
                                     pointerEvents="none"
                                     initial={{ opacity: 0 }}
                                     animate={{ opacity: 1 }}
                                     transition={{ delay: 0.7 }}
                                 >
                                     {node.label}
                                 </motion.text>
                             </g>
                         ))}
                     </svg>
                 </section>
               </motion.div>
            )}
        </AnimatePresence>
      </div>
    </Tabs>
  )
}
