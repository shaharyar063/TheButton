import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  label?: string;
}

function AnimatedDigit({ digit }: { digit: string }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={digit}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="inline-block"
      >
        {digit}
      </motion.span>
    </AnimatePresence>
  );
}

export function AnimatedCounter({ value, label = "Total Clicks" }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (value !== displayValue) {
      const duration = 500;
      const steps = 20;
      const increment = (value - displayValue) / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayValue(value);
          clearInterval(interval);
        } else {
          setDisplayValue(Math.round(displayValue + increment * currentStep));
        }
      }, duration / steps);

      return () => clearInterval(interval);
    }
  }, [value, displayValue]);

  const formattedValue = displayValue.toLocaleString();
  const digits = formattedValue.split('');

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-sm sm:text-base font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
      <div className="flex items-center gap-1 text-4xl sm:text-5xl font-bold tracking-tight" data-testid="text-total-clicks">
        {digits.map((char, index) => (
          <AnimatedDigit key={`${index}-${char}`} digit={char} />
        ))}
      </div>
    </div>
  );
}
