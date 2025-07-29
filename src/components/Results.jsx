import React from 'react';

const timeComplexities = {
    'bfs': 'O(V + E)',
    'dfs': 'O(V + E)',
    'dijkstra': 'O(E log V)',
    'a-star': 'O(E log V)',
    'bellman-ford': 'O(V * E)',
    'floyd-warshall': 'O(V³)'
};

const Results = ({ algorithm, shortestDistance }) => {
    return (
        <div className="absolute top-6 left-6 z-10 w-72 bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-white mb-4">Results</h3>
            <div className="space-y-4">
                <div className="text-sm">
                    <p className="text-zinc-400">Time Complexity:</p>
                    <p className="text-violet-400 font-mono text-base">{timeComplexities[algorithm]}</p>
                    <p className="text-xs text-zinc-500 mt-1">(V = Vertices, E = Edges)</p>
                </div>
                <div className="text-sm pt-4 border-t border-zinc-800">
                    <p className="text-zinc-400">Shortest Distance:</p>
                    {shortestDistance !== null ? (
                        <p className="text-white font-mono text-2xl font-bold">
                            {shortestDistance === Infinity ? 'No Path' : shortestDistance}
                        </p>
                    ) : (
                        <p className="text-zinc-500">Run an algorithm to see the result.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Results;
