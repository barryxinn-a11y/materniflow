import { motion } from "framer-motion";
import { HeartPulse } from "lucide-react";
import { METADATA } from "@/lib/constants";

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ delay: 0.3 }}
    >
      <div className="border border-cyan-200 dark:border-cyan-800 bg-white dark:bg-slate-900 rounded-xl shadow-sm">
        <div className="py-12 px-8 flex flex-col items-center text-center">
          {/* Medical Icon */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-100 dark:bg-cyan-900/30">
              <HeartPulse className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
            </div>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl text-cyan-900 dark:text-cyan-50 mb-2">
            Hi! I'm <span className="text-emerald-600 dark:text-emerald-400">{METADATA.AI_ASSISTANT_NAME}</span>
          </h2>

          <p className="font-display text-lg text-cyan-600 dark:text-cyan-400 mb-4">
            Your OB/GYN Scheduling Assistant
          </p>

          <p className="text-cyan-700 dark:text-cyan-300 max-w-md leading-relaxed">
            I can help you check ward status, predict patient discharge times, coordinate room assignments, flag high-risk cases, and assist with placing orders. Just ask!
          </p>
        </div>
      </div>
    </motion.div>
  );
};
