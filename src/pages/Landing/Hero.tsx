import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export function Hero() {
  const navigate = useNavigate();

  const handleAnalyze = () => {
    navigate("/home");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.5,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1
        className="text-6xl font-bold mb-8 max-w-4xl mx-auto"
        variants={itemVariants}
      >
        AI-Powered Codebase Analysis
      </motion.h1>
      <motion.h2 className="text-xl mb-10" variants={itemVariants}>
        Stop searching through Git history manually. Automatically sync commits
        to ChromaDB, visualize relationships, and query your codebase through a
        custom MCP server.
      </motion.h2>
      <motion.div
        className="flex flex-row items-center justify-center gap-4 max-w-3xl mx-auto"
        variants={itemVariants}
      >
        <input
          type="text"
          placeholder="https://github.com/user/repo"
          className="flex-1 px-6 py-3 rounded-lg text-white placeholder-gray-400 bg-black/30 backdrop-blur-sm border border-gray-600 focus:outline-none focus:border-white transition-colors"
        />
        <button
          onClick={handleAnalyze}
          className="px-8 py-3 rounded-lg text-white font-semibold bg-white/10 backdrop-blur-sm border border-gray-600 hover:bg-white/20 hover:border-white transition-all duration-300"
        >
          {">"}
        </button>
      </motion.div>
    </motion.div>
  );
}
