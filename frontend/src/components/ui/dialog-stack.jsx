// Stacked dialogs with a parallax depth effect + Previous/Next navigation.
// Each child of <DialogStackContent> is a "page" rendered as a card; the active
// page sits on top, previous pages peek out behind it (offset + scaled + faded).
import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { motion } from "framer-motion";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const StackCtx = React.createContext(null);
export const useDialogStack = () => React.useContext(StackCtx);

export function DialogStack({ children, open, onOpenChange }) {
  const [active, setActive] = React.useState(0);
  const [count, setCount] = React.useState(0);

  const api = React.useMemo(
    () => ({
      active,
      count,
      setCount,
      next: () => setActive((a) => Math.min(a + 1, count - 1)),
      prev: () => setActive((a) => Math.max(a - 1, 0)),
      goTo: (i) => setActive(() => Math.max(0, Math.min(i, count - 1))),
      close: () => onOpenChange?.(false),
    }),
    [active, count, onOpenChange]
  );

  const handleOpenChange = (o) => {
    if (!o) setActive(0); // reset to first page when closed
    onOpenChange?.(o);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <StackCtx.Provider value={api}>{children}</StackCtx.Provider>
    </DialogPrimitive.Root>
  );
}

export function DialogStackContent({ children, className }) {
  const items = React.Children.toArray(children);
  const { active, setCount } = useDialogStack();

  React.useEffect(() => setCount(items.length), [items.length, setCount]);

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
      <DialogPrimitive.Popup
        className={cn(
          "fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 outline-none",
          className
        )}>
        <DialogPrimitive.Title className="sr-only">Dialog</DialogPrimitive.Title>
        <DialogPrimitive.Description className="sr-only">Stacked dialog</DialogPrimitive.Description>
        <div className="relative">
          {items.map((child, i) => {
            const depth = active - i; // 0 = front, >0 = behind (already passed)
            const isActive = depth === 0;
            return (
              <motion.div
                key={i}
                className={cn(
                  "rounded-xl border border-border bg-card p-6 shadow-2xl",
                  isActive ? "relative z-30" : "absolute inset-x-0 top-0"
                )}
                initial={false}
                animate={
                  isActive
                    ? { y: 0, scale: 1, opacity: 1 }
                    : depth > 0
                      ? { y: -depth * 14, scale: 1 - depth * 0.05, opacity: depth <= 2 ? 0.5 : 0 }
                      : { y: 28, scale: 0.96, opacity: 0 }
                }
                style={{
                  zIndex: isActive ? 30 : 20 - Math.abs(depth),
                  pointerEvents: isActive ? "auto" : "none",
                }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}>
                {child}
              </motion.div>
            );
          })}
        </div>
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

// A page inside the stack: optional title/description header + close button.
export function DialogStackItem({ title, description, children, className }) {
  const { close } = useDialogStack();
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            {title && <h2 className="text-base leading-none font-semibold">{title}</h2>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          <button onClick={close}
            className="rounded-md p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground">
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}
      {children}
    </div>
  );
}

// Navigation buttons (use inside a page).
export function DialogStackNext(props) {
  const { next } = useDialogStack();
  return <button onClick={next} {...props} />;
}
export function DialogStackPrevious(props) {
  const { prev } = useDialogStack();
  return <button onClick={prev} {...props} />;
}
