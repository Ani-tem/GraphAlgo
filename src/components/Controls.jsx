import React from 'react';
import { Play, Pause } from 'lucide-react';

const Controls = ({
    algorithm,
    setAlgorithm,
    startNode,
    setStartNode,
    endNode,
    setEndNode,
    speed,
    setSpeed,
    runAlgorithm,
    isPaused,
    setIsPaused,
    isRunning
}) => {
    const isAlgoRunning = isRunning || isPaused;

    return (
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-white mb-4">Controls</h3>
            <div className="space-y-5">
                <div>
                    <label htmlFor="algo-select" className="block text-sm font-medium text-zinc-400 mb-2">Algorithm</label>
                    <select id="algo-select" value={algorithm} onChange={(e) => setAlgorithm(e.target.value)} disabled={isAlgoRunning} className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                        <option value="bfs">Breadth-First Search</option>
                        <option value="dfs">Depth-First Search</option>
                        <option value="dijkstra">Dijkstra's Algorithm</option>
                        <option value="a-star">A* Search</option>
                        <option value="bellman-ford">Bellman-Ford</option>
                        <option value="floyd-warshall">Floyd-Warshall</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="startNodeInput" className="block text-sm font-medium text-zinc-400 mb-2">Start Node</label>
                        <input
                            id="startNodeInput"
                            type="text"
                            value={startNode || ''}
                            onChange={(e) => setStartNode(e.target.value.toUpperCase())}
                            disabled={isAlgoRunning || algorithm === 'floyd-warshall'}
                            className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder="e.g., A"
                        />
                    </div>
                    <div>
                        <label htmlFor="endNodeInput" className="block text-sm font-medium text-zinc-400 mb-2">End Node</label>
                        <input
                            id="endNodeInput"
                            type="text"
                            value={endNode || ''}
                            onChange={(e) => setEndNode(e.target.value.toUpperCase())}
                            disabled={isAlgoRunning || algorithm === 'floyd-warshall'}
                            className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder="e.g., G"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Animation Speed: {speed}ms</label>
                    <input type="range" min="50" max="1000" step="50" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} disabled={isAlgoRunning} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-500"/>
                </div>
                <button onClick={() => isAlgoRunning ? setIsPaused(!isPaused) : runAlgorithm()} disabled={(startNode === null && algorithm !== 'floyd-warshall') || (isRunning && !isPaused)} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold text-white transition-all bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 disabled:from-zinc-700 disabled:to-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed">
                    {isAlgoRunning && !isPaused ? <Pause size={18} /> : <Play size={18} />}
                    {isAlgoRunning ? (isPaused ? 'Resume' : 'Pause') : 'Visualize'}
                </button>
            </div>
        </div>
    );
};

export default Controls;
