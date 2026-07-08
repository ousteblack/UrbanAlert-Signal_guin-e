import { motion } from "framer-motion";

export default function Card({
  children,
  className = "",
  glass = false,
  hover = false,
  animate = false,
  delay = 0,
}) {
  const baseStyles = "rounded-2xl p-6 transition-all duration-300";
  const glassStyles = glass ? "glassmorphism" : "bg-surface shadow-md border border-gray-100";
  const hoverStyles = hover ? "hover:shadow-xl hover:-translate-y-1" : "";

  const classes = `${baseStyles} ${glassStyles} ${hoverStyles} ${className}`;

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, delay: delay }}
        className={classes}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={classes}>{children}</div>;
}
