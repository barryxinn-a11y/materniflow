"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, HeartPulse } from "lucide-react"

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="min-h-screen flex flex-col justify-center pt-20 pb-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-cyan-50 to-white dark:from-slate-900 dark:to-slate-950">
      <div className="max-w-4xl mx-auto w-full">
        {/* Icon + Title */}
        <div
          className={`transition-all duration-700 delay-100 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"}`}
        >
          {/* Medical Icon */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-100 dark:bg-cyan-900/30">
              <HeartPulse className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
            </div>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-cyan-900 dark:text-cyan-50 leading-tight mb-4">
            Materni<span className="text-emerald-600 dark:text-emerald-400">Flow</span>
          </h1>

          <p className="font-display text-xl sm:text-2xl text-cyan-600 dark:text-cyan-400 mb-6">
            AI-Powered OB/GYN Operation Assistant
          </p>

          <div className="w-24 h-1 bg-emerald-500 rounded mb-8" />
        </div>

        {/* Description */}
        <div
          className={`transition-all duration-700 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <p className="text-lg sm:text-xl text-cyan-800 dark:text-cyan-200 mb-6 leading-relaxed">
            An AI assistant designed for OB/GYN nurses. Query real-time ward status, predict patient length-of-stay, coordinate room assignments, receive high-risk alerts, and place orders — all through natural conversation.
          </p>

          <div className="space-y-4 text-cyan-700 dark:text-cyan-300 mb-8">
            <p>
              <span className="font-semibold text-cyan-900 dark:text-cyan-100">Built with:</span>{" "}
              Strands Agents SDK + AWS Lambda + PostgreSQL + Next.js
            </p>
            <p>
              <span className="font-semibold text-cyan-900 dark:text-cyan-100">Architecture:</span>{" "}
              AI Agent has read-only database access. All write operations go through independent Lambda functions with business validation — the AI can see and speak, but actions are verified before execution.
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div
          className={`transition-all duration-700 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <Link
            href="/chat"
            className="group flex items-center justify-between w-full p-6 bg-white dark:bg-slate-800 border border-cyan-200 dark:border-cyan-700 rounded-xl hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <div>
              <h3 className="font-display text-2xl sm:text-3xl text-cyan-900 dark:text-cyan-100">
                Talk to MaterniFlow
              </h3>
              <p className="text-cyan-600 dark:text-cyan-400 text-sm sm:text-base">
                Experience the AI scheduling assistant in action
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 group-hover:bg-emerald-500 transition-colors">
              <ArrowRight className="w-6 h-6 text-emerald-600 dark:text-emerald-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  )
}
