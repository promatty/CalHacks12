import { useNavigate } from 'react-router-dom';

export function Hero() {
  const navigate = useNavigate();

  const handleAnalyze = () => {
    navigate('/home');
  };

  return (
    <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10">
      <h1 className="text-6xl font-bold mb-8 max-w-4xl mx-auto">
        AI-Powered Codebase Analysis
      </h1>
      <h2 className="text-xl mb-10">
        Transform any GitHub repository into a searchable, always-up-to-date
        knowledge base using Chroma and AI
      </h2>
      <div className="flex flex-row items-center justify-center gap-4 max-w-3xl mx-auto">
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
      </div>
    </div>
  );
}
