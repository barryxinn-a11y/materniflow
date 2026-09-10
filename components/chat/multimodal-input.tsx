"use client";

import type { ChatRequestOptions, UIMessage } from "ai";
import { motion } from "framer-motion";
import type React from "react";
import {
  useRef,
  useEffect,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from "react";
import { toast } from "sonner";
import { useLocalStorage, useWindowSize } from "usehooks-ts";

import { cn, sanitizeUIMessages } from "@/lib/utils";

import { ArrowUpIcon, StopIcon } from "./icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import suggestedActionsData from "@/data/suggested-actions.json";

const suggestedActions = suggestedActionsData;

export function MultimodalInput({
  chatId,
  input,
  setInput,
  isLoading,
  stop,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
}: {
  chatId: string;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  stop: () => void;
  messages: Array<UIMessage>;
  setMessages: Dispatch<SetStateAction<Array<UIMessage>>>;
  append: (
    message: any,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  handleSubmit: (
    event?: {
      preventDefault?: () => void;
    },
    chatRequestOptions?: ChatRequestOptions,
  ) => void;
  className?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    "input",
    "",
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      const finalValue = domValue || localStorageInput || "";
      setInput(finalValue);
      adjustHeight();
    }
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const submitForm = useCallback(() => {
    handleSubmit(undefined, {});
    setLocalStorageInput("");

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [handleSubmit, setLocalStorageInput, width]);

  return (
    <div className="relative w-full flex flex-col gap-3">
      {/* Suggested Questions */}
      {messages.length === 0 && (
        <div className="flex flex-col gap-3">
          <div className="border border-cyan-200 dark:border-cyan-800 p-3 bg-white dark:bg-slate-900 rounded-lg">
            <p className="font-display text-sm text-cyan-700 dark:text-cyan-300 text-center">
              Ask me directly or click a suggestion
            </p>
          </div>

          <div className="max-h-[320px] sm:max-h-[280px] overflow-y-auto">
            <div className="grid sm:grid-cols-2 gap-2 w-full pr-1">
              {suggestedActions.map((suggestedAction, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: 0.05 * index }}
                  key={`suggested-action-${suggestedAction.title}-${index}`}
                >
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      append({
                        role: "user",
                        content: suggestedAction.action,
                      });
                    }}
                    className="group text-left border border-cyan-200 dark:border-cyan-800 bg-white dark:bg-slate-900 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 hover:border-emerald-400 dark:hover:border-emerald-500 px-4 py-3 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start transition-all cursor-pointer rounded-lg"
                  >
                    <span className="font-display text-sm text-cyan-900 dark:text-cyan-100">
                      {suggestedAction.title}
                    </span>
                    <span className="text-xs text-cyan-600 dark:text-cyan-400 group-hover:text-cyan-700 dark:group-hover:text-cyan-300 leading-snug transition-colors">
                      {suggestedAction.label}
                    </span>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User Message Input Form */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          placeholder="Enter your question..."
          value={input}
          onChange={handleInput}
          className={cn(
            "min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none !text-base",
            "bg-white dark:bg-slate-900 border border-cyan-200 dark:border-cyan-800 rounded-lg",
            "focus:border-emerald-400 focus:ring-emerald-400 focus:ring-2",
            "text-cyan-900 dark:text-cyan-100 placeholder:text-cyan-400 dark:placeholder:text-cyan-600",
            "pr-12",
            className,
          )}
          rows={3}
          autoFocus
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();

              if (isLoading) {
                toast.error("Please wait for the response to complete!");
              } else {
                submitForm();
              }
            }
          }}
        />

        {isLoading ? (
          <Button
            className="p-2 h-fit absolute bottom-2 right-2 bg-white dark:bg-slate-800 border border-cyan-200 dark:border-cyan-700 hover:bg-cyan-100 dark:hover:bg-cyan-900 text-cyan-700 dark:text-cyan-300 cursor-pointer rounded-lg"
            onClick={(event) => {
              event.preventDefault();
              stop();
              setMessages((messages) => sanitizeUIMessages(messages));
            }}
          >
            <StopIcon size={16} />
          </Button>
        ) : (
          <Button
            className="p-2 h-fit absolute bottom-2 right-2 bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer rounded-lg"
            onClick={(event) => {
              event.preventDefault();
              submitForm();
            }}
            disabled={input.length === 0}
          >
            <ArrowUpIcon size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}
