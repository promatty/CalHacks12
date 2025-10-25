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
      <button className="bg-white text-black font-bold py-3 px-6 rounded-md hover:bg-gray-200 transition duration-300">
        Analyze Repository
      </button>
    </div>
  );
}
