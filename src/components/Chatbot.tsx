import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-80 md:w-96 bg-background rounded-2xl shadow-2xl border border-border overflow-hidden"
          >
            <div className="bg-secondary p-4 text-secondary-foreground flex justify-between items-center">
              <div>
                <h4 className="font-heading font-bold text-sm">AQUA</h4>
                <p className="text-[10px] opacity-80">
                  Your Ocean Intelligence Assistant
                </p>
              </div>
              <button onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-80 p-4 bg-card overflow-y-auto flex flex-col gap-3">
              <div className="bg-background p-3 rounded-lg rounded-tl-none shadow-sm max-w-[80%] text-sm text-foreground">
                Hello! I'm AQUA. How can I help you with ocean data today?
              </div>
            </div>

            <div className="p-4 border-t border-border flex gap-2 bg-background">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about risk levels..."
                className="flex-1 text-sm focus:outline-none bg-transparent text-foreground placeholder:text-muted-foreground"
              />
              <button className="text-secondary hover:text-primary transition-colors">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shadow-lg shadow-secondary/40 hover:bg-secondary/90 transition-colors"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>
    </div>
  );
}
