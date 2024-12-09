import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Target } from 'lucide-react';
import { use_game } from '../../contexts/GameContext';

export default function battle_stats() {
 const { state } = use_game();
 const { battle_stats } = state;

 if (!battle_stats) return null;

 const winRate = battle_stats.total_battles > 0 
   ? ((battle_stats.wins / battle_stats.total_battles) * 100).toFixed(1)
   : '0';

 return (
   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
     <motion.div 
       className="card bg-white dark:bg-gray-700 p-4 rounded-lg shadow"
       whileHover={{ scale: 1.02 }}
     >
       <div className="flex items-center space-x-3">
         <Trophy className="text-yellow-500 h-8 w-8" />
         <div>
           <h3 className="font-semibold text-lg">Battle Record</h3>
           <p className="text-2xl font-bold">
             {battle_stats.wins}W - {battle_stats.losses}L
           </p>
           <p className="text-sm text-gray-600 dark:text-gray-400">
             {winRate}% Win Rate
           </p>
         </div>
       </div>
     </motion.div>

     <motion.div
       className="card bg-white dark:bg-gray-700 p-4 rounded-lg shadow"
       whileHover={{ scale: 1.02 }}
     >
       <div className="flex items-center space-x-3">
         <Star className="text-orange-500 h-8 w-8" />
         <div>
           <h3 className="font-semibold text-lg">Win Streak</h3>
           <p className="text-2xl font-bold text-orange-500">
             {battle_stats.win_streak}
           </p>
           <p className="text-sm text-gray-600 dark:text-gray-400">
             Best: {battle_stats.highest_streak}
           </p>
         </div>
       </div>
     </motion.div>

     <motion.div
       className="card bg-white dark:bg-gray-700 p-4 rounded-lg shadow"
       whileHover={{ scale: 1.02 }}  
     >
       <div className="flex items-center space-x-3">
         <Target className="text-indigo-500 h-8 w-8" />
         <div>
           <h3 className="font-semibold text-lg">Average Score</h3>
           <p className="text-2xl font-bold text-indigo-500">
             {battle_stats.averageScore}%
           </p>
           <p className="text-sm text-gray-600 dark:text-gray-400">
             {battle_stats.total_battles} Total Battles
           </p>
         </div>
       </div>
     </motion.div>
   </div>
 );
}