import re
with open('src/components/ActivityHistory.tsx', 'r') as f:
    content = f.read()

# Add AnimatePresence and Chevron to imports
content = content.replace("import { motion } from 'motion/react';", "import { motion, AnimatePresence } from 'motion/react';")
content = content.replace("import { Activity } from 'lucide-react';", "import { Activity, ChevronDown, ChevronUp } from 'lucide-react';")

# Add state for collapsible
state_addition = """  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);"""
content = re.sub(r"  const \[activities, setActivities\].*\n  const \[loading, setLoading\].*", state_addition, content)

# Update return statement
return_updated = """  return (
    <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-2xl mt-6">
      <div 
         className="flex justify-between items-center mb-6 cursor-pointer hover:bg-zinc-800/30 p-2 -m-2 rounded-lg transition-colors"
         onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-amber-500" />
          <h3 className="text-lg font-serif font-bold text-white">
            {isAdmin ? 'Global Activity Logs' : 'Your Activity History'}
          </h3>
        </div>
        <button className="text-zinc-400 hover:text-white p-1">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>
      
      {activities.length === 0 ? (
        <p className="text-zinc-500 text-sm p-2">No activity found.</p>
      ) : (
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {(isExpanded ? activities : activities.slice(0, 3)).map((log) => (
              <motion.div 
                key={log.id} 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-black/50 border border-zinc-800 rounded-xl p-4 overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-medium">{log.activityType}</p>
                    <p className="text-zinc-400 text-sm">{log.details}</p>
                    {isAdmin && <p className="text-zinc-500 text-xs mt-1">User ID: {log.userId}</p>}
                  </div>
                  {log.timestamp && (
                    <p className="text-zinc-500 text-xs whitespace-nowrap">
                      {log.timestamp.toDate().toLocaleString()}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {!isExpanded && activities.length > 3 && (
            <div 
               className="text-center pt-2 cursor-pointer text-amber-500 hover:text-amber-400 text-sm font-medium"
               onClick={() => setIsExpanded(true)}
            >
              View {activities.length - 3} more logs
            </div>
          )}
        </div>
      )}
    </div>
  );"""

content = re.sub(r"  return \([\s\S]*?\);\n\}", return_updated + "\n}", content)

with open('src/components/ActivityHistory.tsx', 'w') as f:
    f.write(content)
