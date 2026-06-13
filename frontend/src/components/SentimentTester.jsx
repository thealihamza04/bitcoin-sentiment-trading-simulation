// Live headline tester as a stacked dialog:
//   Page 1 (input)  →  Next  →  Page 2 (result, with the input peeking behind)
import { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquareText, Sparkles, Loader2, ArrowLeft, Lightbulb,
  TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DialogStack, DialogStackContent, DialogStackItem, useDialogStack,
} from "@/components/ui/dialog-stack";
import { usePredict } from "../hooks";

const META = {
  positive: { icon: TrendingUp, text: "text-emerald-500", soft: "bg-emerald-500/15", bar: "bg-emerald-500" },
  neutral:  { icon: Minus,        text: "text-zinc-400",    soft: "bg-zinc-500/15",    bar: "bg-zinc-500" },
  negative: { icon: TrendingDown, text: "text-rose-500",    soft: "bg-rose-500/15",    bar: "bg-rose-500" },
};

// Default long/flat threshold used on the dashboard — for the strategy note.
const THRESHOLD = 0.10;

const EXAMPLES = [
  "Bitcoin surges to a new all-time high on heavy institutional buying.",
  "Ethereum crashes 20% as investors flee risk assets in a market selloff.",
  "Regulators announce a sweeping crackdown on crypto exchanges.",
  "Solana network sees record trading volume amid renewed retail interest.",
  "The central bank held interest rates steady, as analysts expected.",
  "SEC delays decision on the spot Bitcoin ETF application again.",
];

function InputPage({ text, setText, predict }) {
  const { next } = useDialogStack();
  const canAnalyze = !predict.isPending && !!text.trim();
  const analyze = () =>
    canAnalyze &&
    predict.mutate(text, {
      onSuccess: () => next(),
      onError: (e) => toast.error(e.message),
    });

  return (
    <DialogStackItem
      title="Live sentiment tester"
      description="Type a crypto/finance headline — the fine-tuned FinBERT model classifies it.">
      <div className="space-y-1">
        <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") analyze(); }}
                  placeholder="Type a crypto/finance headline…" />
        <p className="text-right text-[10px] text-muted-foreground">
          <kbd className="rounded border border-border/60 bg-secondary px-1 font-mono">Ctrl</kbd>
          {" + "}
          <kbd className="rounded border border-border/60 bg-secondary px-1 font-mono">↵</kbd>
          {" "}to analyze
        </p>
      </div>

      <div className="space-y-1.5">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lightbulb className="h-3 w-3 text-[#f7931a]" /> Or try an example:
        </p>
        <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
          {EXAMPLES.map((ex) => {
            const selected = text === ex;
            return (
              <button key={ex} type="button" onClick={() => setText(ex)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-xs leading-snug transition ${
                  selected
                    ? "border-[#f7931a]/50 bg-[#f7931a]/10 text-foreground"
                    : "border-border/60 bg-secondary/40 text-muted-foreground hover:border-border hover:bg-secondary hover:text-foreground"}`}>
                {ex}
              </button>
            );
          })}
        </div>
      </div>

      <Button className="w-full" onClick={analyze} disabled={!canAnalyze}>
        {predict.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {predict.isPending ? "Analyzing…" : "Analyze sentiment"}
      </Button>
    </DialogStackItem>
  );
}

// What a day of headlines like this would do on the dashboard's default rule.
function strategyNote(score) {
  if (score > THRESHOLD)
    return { icon: TrendingUp, cls: "border-emerald-500/30 bg-emerald-500/5 text-emerald-500",
             text: `Above the default +${THRESHOLD.toFixed(2)} threshold — a day of headlines like this pushes the strategy long (hold BTC).` };
  if (score < -THRESHOLD)
    return { icon: TrendingDown, cls: "border-rose-500/30 bg-rose-500/5 text-rose-500",
             text: `Below the default −${THRESHOLD.toFixed(2)} threshold — a day like this pushes the strategy out of the market (or short).` };
  return { icon: Minus, cls: "border-border/60 bg-secondary/40 text-muted-foreground",
           text: "Inside the neutral band — the strategy would simply hold its previous position." };
}

function ResultPage({ text, result }) {
  const { prev } = useDialogStack();
  if (!result) return <DialogStackItem title="Result" />;

  const meta = META[result.label];
  const Icon = meta.icon;
  const confidence = Math.max(result.p_negative, result.p_neutral, result.p_positive);
  const note = strategyNote(result.sentiment);
  const NoteIcon = note.icon;

  return (
    <DialogStackItem title="Sentiment result" description="What the model thinks of your headline.">
      <p className="line-clamp-2 rounded-md bg-secondary/60 px-3 py-2 text-sm text-muted-foreground italic">
        “{text}”
      </p>

      {/* verdict hero */}
      <div className="flex flex-col items-center gap-1.5 py-1 text-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18 }}
                    className={`grid h-12 w-12 place-items-center rounded-full ${meta.soft}`}>
          <Icon className={`h-6 w-6 ${meta.text}`} />
        </motion.div>
        <div className={`text-lg font-semibold capitalize ${meta.text}`}>{result.label}</div>
        <div className="font-mono text-xs tabular-nums text-muted-foreground">
          score {result.sentiment >= 0 ? "+" : ""}{result.sentiment.toFixed(2)} · {(confidence * 100).toFixed(0)}% confident
        </div>
      </div>

      {/* −1 … +1 score meter */}
      <div className="space-y-1">
        <div className="relative h-2 rounded-full bg-gradient-to-r from-rose-500 via-zinc-500 to-emerald-500 opacity-90">
          <motion.div
            className="absolute -top-1 h-4 w-1 -translate-x-1/2 rounded-full bg-foreground shadow"
            initial={{ left: "50%" }}
            animate={{ left: `${((result.sentiment + 1) / 2) * 100}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>−1 bearish</span><span>0</span><span>+1 bullish</span>
        </div>
      </div>

      {/* class probabilities */}
      <div className="space-y-1.5">
        {["negative", "neutral", "positive"].map((k) => (
          <div key={k} className="grid grid-cols-[72px_1fr_44px] items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${META[k].bar}`} /> {k}
            </span>
            <div className="h-2 overflow-hidden rounded bg-secondary">
              <motion.div className={`h-full ${META[k].bar}`}
                initial={{ width: 0 }} animate={{ width: `${result[`p_${k}`] * 100}%` }}
                transition={{ duration: 0.4 }} />
            </div>
            <span className="text-right font-mono tabular-nums">{(result[`p_${k}`] * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>

      {/* what it means for the trading strategy */}
      <div className={`flex items-start gap-2 rounded-lg border p-2.5 text-xs ${note.cls}`}>
        <NoteIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span className="text-muted-foreground">{note.text}</span>
      </div>

      <Button variant="outline" className="w-full" onClick={prev}>
        <ArrowLeft className="h-4 w-4" /> Analyze another
      </Button>
    </DialogStackItem>
  );
}

export default function SentimentTester() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(
    "Bitcoin surges to a new all-time high on heavy institutional buying."
  );
  const predict = usePredict();

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <MessageSquareText className="h-4 w-4" />
        <span className="hidden sm:inline">Sentiment tester</span>
      </Button>

      <DialogStack open={open} onOpenChange={setOpen}>
        <DialogStackContent>
          <InputPage text={text} setText={setText} predict={predict} />
          <ResultPage text={text} result={predict.data} />
        </DialogStackContent>
      </DialogStack>
    </>
  );
}
