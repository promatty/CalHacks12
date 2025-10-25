export function Hero() {
  return (
    <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10">
      <h1 className="text-6xl font-bold mb-8 max-w-4xl mx-auto">
        AI-Powered GitHub Repository Analysis
      </h1>
      <h2 className="text-xl mb-10">
        Transform any GitHub repository into a searchable, always-up-to-date
        knowledge base using ChromaDB and AI
      </h2>
      <div className="flex flex-col items-center gap-4">
        <input
          type="text"
          placeholder="https://github.com/user/repo"
          className="w-full max-w-md px-4 py-3 rounded-md text-white placeholder-gray-400 bg-transparent border-[0.5px] border-gray-300 focus:outline-none"
        />
      </div>
    </div>
  );
}
