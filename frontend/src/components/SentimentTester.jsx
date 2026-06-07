// Live headline tester as a stacked dialog:
//   Page 1 (input)  →  Next  →  Page 2 (result, with the input peeking behind)
import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquareText, Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  DialogStack, DialogStackContent, DialogStackItem, useDialogStack,
} from "@/components/ui/dialog-stack";
import { usePredict } from "../hooks";

const META = {
  positive: { color: "bg-emerald-500" },
  neutral: { color: "bg-zinc-500" },
  negative: { color: "bg-rose-500" },
};

function InputPage({ text, setText, predict }) {
  const { next } = useDialogStack();
  const analyze = () =>
    predict.mutate(text, {
      onSuccess: () => next(),
      onError: (e) => toast.error(e.message),
    });

  return (
    <DialogStackItem
      title="Live sentiment tester"
      description="Type a crypto/finance headline — the fine-tuned FinBERT model classifies it.">
      <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)}
                placeholder="Type a crypto/finance headline…" />
      <Button className="w-full" onClick={analyze} disabled={predict.isPending || !text.trim()}>
        {predict.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {predict.isPending ? "Analyzing…" : "Analyze sentiment"}
      </Button>
    </DialogStackItem>
  );
}

function ResultPage({ text, result }) {
  const { prev } = useDialogStack();
  if (!result) return <DialogStackItem title="Result" />;

  return (
    <DialogStackItem title="Sentiment result" description="What the model thinks of your headline.">
      <p className="rounded-md bg-secondary/60 px-3 py-2 text-sm text-muted-foreground italic">“{text}”</p>

      <Badge className={`${META[result.label].color} text-white`}>
        {result.label.toUpperCase()} ({result.sentiment >= 0 ? "+" : ""}{result.sentiment.toFixed(2)})
      </Badge>

      <div className="space-y-1.5">
        {["negative", "neutral", "positive"].map((k) => (
          <div key={k} className="grid grid-cols-[64px_1fr_40px] items-center gap-2 text-xs text-muted-foreground">
            <span>{k}</span>
            <div className="h-2 overflow-hidden rounded bg-secondary">
              <motion.div className={`h-full ${META[k].color}`}
                initial={{ width: 0 }} animate={{ width: `${result[`p_${k}`] * 100}%` }}
                transition={{ duration: 0.4 }} />
            </div>
            <span className="text-right tabular-nums">{(result[`p_${k}`] * 100).toFixed(0)}%</span>
          </div>
        ))}
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
