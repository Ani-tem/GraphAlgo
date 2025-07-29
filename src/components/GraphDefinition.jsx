import React from 'react';
import { Wrench, RotateCcw, Sparkles } from 'lucide-react';

const GraphDefinition = ({
    adjacencyListInput,
    setAdjacencyListInput,
    handleBuildGraph,
    resetGraph,
    setIsAiModalOpen,
    isRunning
}) => {
    return (
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Graph Definition</h3>
                <button onClick={() => setIsAiModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-violet-600/20 text-violet-300 rounded-lg hover:bg-violet-600/40 transition-colors">
                    <Sparkles size={14} /> Generate with AI
                </button>
            </div>
            <p className="text-sm text-zinc-400 mb-3">Define edges below, one per line: <code className="text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded">node1 node2 weight</code>.</p>
            <textarea
                value={adjacencyListInput}
                onChange={(e) => setAdjacencyListInput(e.target.value)}
                disabled={isRunning}
                className="w-full h-36 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="A B 5&#10;B C 10&#10;A C 2"
            />
            <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={handleBuildGraph} disabled={isRunning} className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 border border-zinc-700">
                    <Wrench size={16} /> Build Graph
                </button>
                <button onClick={resetGraph} disabled={isRunning} className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 border border-zinc-700">
                    <RotateCcw size={16} /> Reset
                </button>
            </div>
        </div>
    );
};

export default GraphDefinition;
