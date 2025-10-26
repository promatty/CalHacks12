import { motion, AnimatePresence } from "framer-motion";

export default function HoverText({
  children,
  classes,
  textClasses,
}: {
  children: React.ReactNode;
  classes?: string;
  textClasses?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${classes}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={String(children)} // Add unique key based on content
          initial={{ y: "100%", opacity: 1 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{
            y: "-100%",
            opacity: 1,
          }}
          transition={{ type: "keyframes", stiffness: 100, duration: 0.45 }}
          className={`w-fit flex ${textClasses}`}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
