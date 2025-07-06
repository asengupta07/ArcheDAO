"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useWallet } from "@aptos-labs/wallet-adapter-react"
import { Bot, Send, Loader2, BarChart2, Users, Target, Wallet, MessageCircle, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

interface DAOChatModalProps {
  isOpen: boolean
  onClose: () => void
  daoId: string
  daoName: string
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: number
  data?: any
}

const customColors = {
  red: {
    primary: "#ef4444",
    secondary: "rgba(239, 68, 44, 0.5)",
    light: "#fca5a5",
  },
  blue: {
    primary: "#3b82f6",
    secondary: "rgba(59, 130, 246, 0.5)",
    light: "#93c5fd",
  },
  green: {
    primary: "#22c55e",
    secondary: "rgba(34, 197, 94, 0.5)",
    light: "#86efac",
  },
  yellow: {
    primary: "#eab308",
    secondary: "rgba(234, 179, 8, 0.5)",
    light: "#fde047",
  },
  purple: {
    primary: "#a855f7",
    secondary: "rgba(168, 85, 247, 0.5)",
    light: "#c4b5fd",
  },
}

export function DAOChatModal({ isOpen, onClose, daoId, daoName }: DAOChatModalProps) {
  const { account } = useWallet()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        role: "assistant",
        content: `# Welcome to ${daoName}!

I'm your **DAO assistant** and I can help you with:

## Analytics & Insights
• DAO health and performance metrics
• Member engagement insights  
• Proposal and task analytics

## Treasury Management
• Treasury balance tracking
• Financial recommendations
• Budget analysis

## Governance Support
• Governance recommendations
• Voting pattern analysis
• \`Proposal\` status updates

> **Tip:** I support full markdown formatting including \`code\`, **bold text**, *italics*, lists, and more!

What would you like to know about your DAO?`,
        timestamp: Date.now(),
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, daoName, messages.length])

  const handleSend = async () => {
    if (!input.trim() || !account?.address) return

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/dao-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userAddress: account.address.toString(),
          daoId,
          message: input,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: data.data.response,
          timestamp: Date.now(),
          data: data.data.daoInfo,
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: error instanceof Error ? error.message : "Sorry, I encountered an error processing your request.",
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const renderMetricsCard = (data: any) => {
    if (!data?.analytics) return null

    const metrics = [
      {
        label: "Members",
        value: data.analytics.memberCount,
        icon: Users,
        color: "blue",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/20",
        textColor: "text-blue-300",
        iconColor: "text-blue-400",
      },
      {
        label: "Tasks",
        value: data.analytics.taskCount,
        icon: Target,
        color: "green",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/20",
        textColor: "text-green-300",
        iconColor: "text-green-400",
      },
      {
        label: "Proposals",
        value: data.analytics.proposalCount,
        icon: BarChart2,
        color: "purple",
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-500/20",
        textColor: "text-purple-300",
        iconColor: "text-purple-400",
      },
      {
        label: "Treasury",
        value: data.analytics.treasuryBalance,
        icon: Wallet,
        color: "yellow",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/20",
        textColor: "text-yellow-300",
        iconColor: "text-yellow-400",
      },
    ]

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="bg-white/5 border-red-400/20 backdrop-blur-xl mt-3 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                <BarChart2 className="w-4 h-4 text-red-400" />
              </div>
              <span className="text-sm font-medium text-gray-300">DAO Metrics</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {metrics.map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className={`flex items-center gap-3 p-3 rounded-lg ${metric.bgColor} ${metric.borderColor} border hover:scale-105 transition-transform duration-200`}
                >
                  <div className={`p-2 rounded-md ${metric.bgColor} ${metric.borderColor} border`}>
                    <metric.icon className={`w-4 h-4 ${metric.iconColor}`} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-medium">{metric.label}</div>
                    <div className={`text-sm font-bold ${metric.textColor}`}>{metric.value}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const messageVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.95 },
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] h-[85vh] flex flex-col bg-black/95 border-red-500/20 backdrop-blur-2xl overflow-hidden">
        <DialogHeader className="relative z-10 border-b border-red-500/20 bg-black/40 backdrop-blur-xl p-6">
          <DialogTitle className="flex items-center gap-3 text-white">
            <div className="relative">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <Bot className="w-6 h-6 text-red-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black animate-pulse"></div>
            </div>
            <div>
              <div className="text-lg font-semibold">DAO Assistant</div>
              <div className="text-sm text-gray-400 font-normal">{daoName}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10 scrollbar-thin scrollbar-thumb-red-500/20 scrollbar-track-transparent">
          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => (
              <motion.div
                key={`${message.timestamp}-${index}`}
                variants={messageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[85%] ${message.role === "user" ? "order-2" : "order-1"}`}>
                  <div
                    className={`rounded-2xl p-4 backdrop-blur-xl border transition-all duration-200 hover:scale-[1.02] ${
                      message.role === "user"
                        ? "bg-red-500/10 text-white border-red-500/20 rounded-br-md"
                        : "bg-white/5 text-gray-100 border-white/10 rounded-bl-md"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {message.role === "assistant" && (
                        <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                          <Bot className="w-4 h-4 text-red-400" />
                        </div>
                      )}
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          message.role === "user"
                            ? "border-red-500/50 text-red-300 bg-red-500/10"
                            : "border-white/20 text-gray-300 bg-white/5"
                        }`}
                      >
                        {message.role === "user" ? "You" : "DAO Assistant"}
                      </Badge>
                      <span className="text-xs text-gray-500 ml-auto">{formatTime(message.timestamp)}</span>
                    </div>
                    <div className="prose prose-invert max-w-none prose-sm">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-lg font-bold text-white mb-2 border-b border-red-500/30 pb-1">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-base font-semibold text-white mb-2 mt-3">{children}</h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-sm font-semibold text-gray-200 mb-1 mt-2">{children}</h3>
                          ),
                          p: ({ children }) => (
                            <p className="text-sm text-gray-100 mb-2 last:mb-0 leading-relaxed">{children}</p>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside text-sm text-gray-100 mb-2 space-y-1 ml-2">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-inside text-sm text-gray-100 mb-2 space-y-1 ml-2">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => <li className="text-gray-100 marker:text-red-400">{children}</li>,
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-red-500/50 pl-4 py-2 bg-red-500/5 rounded-r-lg my-2 italic text-gray-200">
                              {children}
                            </blockquote>
                          ),
                          code: ({ node, inline, className, children, ...props }: any) => {
                            const match = /language-(\w+)/.exec(className || "")
                            return !inline && match ? (
                              <div className="my-3 rounded-lg overflow-hidden border border-white/10">
                                <div className="bg-gray-800/50 px-3 py-2 text-xs text-gray-400 border-b border-white/10 flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                  <span className="ml-2">{match[1]}</span>
                                </div>
                                <SyntaxHighlighter
                                  style={oneDark}
                                  language={match[1]}
                                  PreTag="div"
                                  className="!bg-gray-900/50 !m-0 text-sm"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>
                              </div>
                            ) : (
                              <code
                                className="bg-gray-800/50 text-red-300 px-1.5 py-0.5 rounded text-xs font-mono border border-white/10"
                                {...props}
                              >
                                {children}
                              </code>
                            )
                          },
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors"
                            >
                              {children}
                            </a>
                          ),
                          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                          em: ({ children }) => <em className="italic text-gray-200">{children}</em>,
                          hr: () => <hr className="border-red-500/30 my-3" />,
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-3">
                              <table className="min-w-full border border-white/10 rounded-lg overflow-hidden">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({ children }) => (
                            <thead className="bg-red-500/10 border-b border-white/10">{children}</thead>
                          ),
                          tbody: ({ children }) => <tbody className="bg-white/5">{children}</tbody>,
                          tr: ({ children }) => <tr className="border-b border-white/5 last:border-b-0">{children}</tr>,
                          th: ({ children }) => (
                            <th className="px-3 py-2 text-left text-xs font-semibold text-white">{children}</th>
                          ),
                          td: ({ children }) => <td className="px-3 py-2 text-sm text-gray-200">{children}</td>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    {message.role === "assistant" && message.data && renderMetricsCard(message.data)}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
              <div className="max-w-[85%]">
                <div className="rounded-2xl rounded-bl-md p-4 bg-white/5 border border-white/10 backdrop-blur-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                      <Bot className="w-4 h-4 text-red-400" />
                    </div>
                    <Badge variant="outline" className="text-xs border-white/20 text-gray-300 bg-white/5">
                      DAO Assistant
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                    <span className="text-sm text-gray-400">Analyzing your DAO data...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <Separator className="bg-red-500/20" />

        <div className="relative z-10 p-4 bg-black/40 backdrop-blur-xl">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Input
                placeholder="Ask about your DAO's health, metrics, or suggestions..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                disabled={isLoading}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-red-400/50 focus:ring-red-400/20 pr-12 py-3 rounded-xl transition-all duration-200"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Sparkles className="w-4 h-4 text-gray-500" />
              </div>
            </div>
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 hover:border-red-500/50 transition-all duration-300 px-4 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-red-400" />
              ) : (
                <Send className="w-5 h-5 text-red-400 group-hover:text-red-300 transition-colors" />
              )}
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <MessageCircle className="w-3 h-3" />
            <span>Press Enter to send • Shift+Enter for new line</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
