import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { Play, Pause, RotateCcw, Wrench, Github, Linkedin, Sparkles, X } from 'lucide-react';

// --- Custom CSS for Advanced Animations & B&W Theme ---
const StyleInjector = () => (
    <style>{`
        @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            70% { transform: scale(2.5); opacity: 0; }
            100% { transform: scale(2.5); opacity: 0; }
        }
        .pulse-node {
            animation: pulse 1.2s ease-out infinite;
            stroke: none;
        }

        @keyframes travel {
            from { stroke-dashoffset: 20; }
            to { stroke-dashoffset: -20; }
        }
        .link-traversal {
            stroke-dasharray: 2 10;
            animation: travel 0.5s linear infinite;
        }
        .final-path-link {
            stroke: #ffffff;
            filter: drop-shadow(0 0 5px #ffffff);
        }
        .intermediate-node-pulse {
             animation: pulse 1.5s ease-out infinite;
             stroke: none;
             fill: #a78bfa; /* A violet color for intermediate nodes */
        }
        .graph-bg {
            background-color: #0a0a0a;
            background-image:
                linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
            background-size: 20px 20px;
        }
        textarea::-webkit-scrollbar {
            width: 8px;
        }
        textarea::-webkit-scrollbar-track {
            background: #18181b;
            border-radius: 10px;
        }
        textarea::-webkit-scrollbar-thumb {
            background: #3f3f46;
            border-radius: 10px;
        }
        textarea::-webkit-scrollbar-thumb:hover {
            background: #52525b;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .loader {
            animation: spin 1s linear infinite;
        }
    `}</style>
);

// --- Default graph structure for the text area ---
const initialAdjacencyList = `A B 4
A D 2
B C 3
B E 1
C F 2
D E 5
E F 3
F G 6`;

// --- Time Complexities ---
const timeComplexities = {
    'bfs': 'O(V + E)',
    'dfs': 'O(V + E)',
    'dijkstra': 'O(E log V)',
    'a-star': 'O(E log V)',
    'bellman-ford': 'O(V * E)',
    'floyd-warshall': 'O(V³)'
};

// --- Social Icon Component ---
const InstagramIcon = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
);

// --- Main App Component ---
export default function App() {
    const svgRef = useRef();
    const gRef = useRef(); // Ref for the group element that will be panned and zoomed

    // --- State Management ---
    const [nodes, setNodes] = useState([]);
    const [links, setLinks] = useState([]);
    const [adjacencyListInput, setAdjacencyListInput] = useState(initialAdjacencyList);
    
    // Algorithm and Interaction State
    const [algorithm, setAlgorithm] = useState('dijkstra');
    const [startNode, setStartNode] = useState(null);
    const [endNode, setEndNode] = useState(null);
    
    // Visualization State
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [visitedNodes, setVisitedNodes] = useState(new Set());
    const [finalPath, setFinalPath] = useState(new Set());
    const [animatedLinks, setAnimatedLinks] = useState(new Set());
    const [speed, setSpeed] = useState(400);
    const [currentNode, setCurrentNode] = useState(null);
    const [intermediateNode, setIntermediateNode] = useState(null);
    const [shortestDistance, setShortestDistance] = useState(null);

    // Gemini API State
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    // --- Graph Parsing and Building ---
    const handleBuildGraph = useCallback(() => {
        const newLinks = [];
        const nodeSet = new Map();

        const lines = adjacencyListInput.split('\n').filter(line => line.trim() !== '');

        lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length !== 3) return; 

            const [sourceId, targetId, weightStr] = parts;
            const weight = parseInt(weightStr, 10);

            if (!sourceId || !targetId || isNaN(weight)) return;

            if (!nodeSet.has(sourceId)) nodeSet.set(sourceId, { id: sourceId, label: sourceId });
            if (!nodeSet.has(targetId)) nodeSet.set(targetId, { id: targetId, label: targetId });

            newLinks.push({ source: sourceId, target: targetId, weight });
        });
        
        const newNodes = Array.from(nodeSet.values());

        // Reset algorithm state
        setIsRunning(false);
        setIsPaused(false);
        setVisitedNodes(new Set());
        setFinalPath(new Set());
        setAnimatedLinks(new Set());
        setCurrentNode(null);
        setIntermediateNode(null);
        setShortestDistance(null);
        setStartNode(newNodes.length > 0 ? newNodes[0].id : null);
        setEndNode(newNodes.length > 0 ? newNodes[newNodes.length-1].id : null);
        
        const svgElement = svgRef.current;
        if (!svgElement) return;
        const width = svgElement.clientWidth;
        const height = svgElement.clientHeight;

        const simulation = d3.forceSimulation(newNodes)
            .force("link", d3.forceLink(newLinks).id(d => d.id).distance(120))
            .force("charge", d3.forceManyBody().strength(-450))
            .force("collide", d3.forceCollide(30))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .stop();

        simulation.tick(300);

        setNodes(newNodes.map(n => ({...n, x:n.x, y:n.y})));
        setLinks(newLinks);
    }, [adjacencyListInput]);

    // Initial graph build on component mount
    useEffect(() => {
        handleBuildGraph();
    }, [handleBuildGraph]);

    const resetGraph = useCallback(() => {
        setAdjacencyListInput(initialAdjacencyList);
    }, []);

    // --- D3 Effects ---
    const nodeMap = useMemo(() => new Map(nodes.map(node => [node.id, node])), [nodes]);

    // Effect for Pan and Zoom
    useEffect(() => {
        if (!svgRef.current || !gRef.current) return;
        const svg = d3.select(svgRef.current);
        const g = d3.select(gRef.current);

        const zoomHandler = d3.zoom()
            .filter(event => !event.target.closest('.node-group'))
            .on('zoom', (event) => g.attr('transform', event.transform));

        svg.call(zoomHandler).on("dblclick.zoom", null);

        return () => svg.on('.zoom', null);
    }, []);

    // Effect for Dragging Nodes
    useEffect(() => {
        if (!gRef.current || !nodes.length) return;
        const g = d3.select(gRef.current);

        const dragHandler = d3.drag()
            .on('start', function(event, d) {
                d3.select(this.parentNode).raise();
            })
            .on('drag', (event, d) => {
                setNodes(currentNodes => currentNodes.map(n => 
                    n.id === d.id ? { ...n, x: event.x, y: event.y } : n
                ));
            });
        
        g.selectAll('.node-group')
            .data(nodes, d => d ? d.id : null)
            .select('.node-circle')
            .call(dragHandler);

    }, [nodes]);

    // --- Gemini API Call ---
    const handleGenerateGraph = async () => {
        if (!aiPrompt) return;
        setIsGenerating(true);

        const fullPrompt = `Generate an adjacency list for a graph based on the following description. The format for each line must be exactly "node1 node2 weight", where weight is an integer between 1 and 20. Do not add any other text, explanations, or formatting. The graph should have between 5 and 15 nodes. Description: "${aiPrompt}"`;

        try {
            let chatHistory = [{ role: "user", parts: [{ text: fullPrompt }] }];
            const payload = { contents: chatHistory };
            const apiKey = "AIzaSyAjS4VL2mVlBPhra-F7F9eOzWy0cDmYo1U";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API call failed with status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const generatedText = result.candidates[0].content.parts[0].text;
                setAdjacencyListInput(generatedText.trim());
                setIsAiModalOpen(false);
                setAiPrompt('');
            } else {
                console.error("Unexpected API response structure:", result);
            }
        } catch (error) {
            console.error("Error calling Gemini API:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    // --- Algorithm Logic ---
    const runAlgorithm = async () => {
        if (algorithm !== 'floyd-warshall' && (startNode === null || endNode === null)) return;
        
        setIsRunning(true);
        setIsPaused(false);
        setVisitedNodes(new Set());
        setFinalPath(new Set());
        setAnimatedLinks(new Set());
        setCurrentNode(null);
        setIntermediateNode(null);
        setShortestDistance(null);

        const adj = new Map(nodes.map(n => [n.id, []]));
        links.forEach(l => {
            const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
            const targetId = typeof l.target === 'object' ? l.target.id : l.target;
            adj.get(sourceId).push({ node: targetId, weight: l.weight });
            adj.get(targetId).push({ node: sourceId, weight: l.weight });
        });

        let result = { steps: [], distance: null };
        if (algorithm === 'bfs') result = getBfsSteps(adj, startNode, endNode);
        if (algorithm === 'dfs') result = getDfsSteps(adj, startNode, endNode);
        if (algorithm === 'dijkstra') result = getDijkstraSteps(adj, startNode, endNode);
        if (algorithm === 'a-star') result = getAStarSteps(adj, startNode, endNode);
        if (algorithm === 'bellman-ford') result = getBellmanFordSteps(adj, startNode, endNode);
        if (algorithm === 'floyd-warshall') result = getFloydWarshallSteps(startNode, endNode);
        
        await animateSteps(result.steps);
        setShortestDistance(result.distance);

        setIsRunning(false);
        setCurrentNode(null);
        setIntermediateNode(null);
    };

    // --- Algorithm Step Generators ---
    const getBfsSteps = (adj, start, end) => {
        const steps = [];
        const queue = [{ node: start, path: [start] }];
        const visited = new Set([start]);
        while (queue.length > 0) {
            const { node, path } = queue.shift();
            steps.push({ type: 'visit', node });
            if (node === end) { 
                return { steps, distance: path.length - 1 };
            }
            for (const neighbor of adj.get(node) || []) {
                if (!visited.has(neighbor.node)) {
                    visited.add(neighbor.node);
                    steps.push({ type: 'traverse', from: node, to: neighbor.node });
                    queue.push({ node: neighbor.node, path: [...path, neighbor.node] });
                }
            }
        }
        return { steps, distance: Infinity };
    };
    const getDfsSteps = (adj, start, end) => {
        const steps = [];
        const stack = [{ node: start, path: [start] }];
        const visited = new Set();
        while (stack.length > 0) {
            const { node, path } = stack.pop();
            if (visited.has(node)) continue;
            visited.add(node);
            steps.push({ type: 'visit', node });
            if (node === end) { 
                return { steps, distance: path.length - 1 };
            }
            const neighbors = adj.get(node) || [];
            for (let i = neighbors.length - 1; i >= 0; i--) {
                const neighbor = neighbors[i];
                if (!visited.has(neighbor.node)) {
                    steps.push({ type: 'traverse', from: node, to: neighbor.node });
                    stack.push({ node: neighbor.node, path: [...path, neighbor.node] });
                }
            }
        }
        return { steps, distance: Infinity };
    };
    const getDijkstraSteps = (adj, start, end) => {
        const steps = [];
        const distances = new Map(nodes.map(n => [n.id, Infinity]));
        const previous = new Map();
        const pq = new D3PriorityQueue();
        distances.set(start, 0);
        nodes.forEach(n => pq.push({ id: n.id, priority: distances.get(n.id) }));
        while (!pq.isEmpty()) {
            const { id: u } = pq.pop();
            if (u === undefined || distances.get(u) === Infinity) break;
            steps.push({ type: 'visit', node: u });
            if (u === end) break;
            for (const { node: v, weight } of adj.get(u) || []) {
                const newDist = distances.get(u) + weight;
                if (newDist < distances.get(v)) {
                    distances.set(v, newDist);
                    previous.set(v, u);
                    steps.push({ type: 'traverse', from: u, to: v });
                    pq.update(v, newDist);
                }
            }
        }
        const path = [];
        let current = end;
        while(current !== undefined) { path.unshift(current); current = previous.get(current); }
        if (path.length > 0 && path[0] === start) { steps.push({ type: 'path', path }); }
        return { steps, distance: distances.get(end) };
    };
    const getAStarSteps = (adj, start, end) => {
        const steps = [];
        const endNodePos = nodes.find(n => n.id === end);
        if (!endNodePos) return { steps: [], distance: Infinity };

        const heuristic = (nodeId) => {
            const nodePos = nodes.find(n => n.id === nodeId);
            if (!nodePos || typeof nodePos.x === 'undefined') return Infinity;
            return Math.sqrt(Math.pow(nodePos.x - endNodePos.x, 2) + Math.pow(nodePos.y - endNodePos.y, 2));
        };

        const gScore = new Map(nodes.map(n => [n.id, Infinity]));
        gScore.set(start, 0);

        const fScore = new Map(nodes.map(n => [n.id, Infinity]));
        fScore.set(start, heuristic(start));
        
        const previous = new Map();
        const pq = new D3PriorityQueue();
        pq.push({ id: start, priority: fScore.get(start) });
        const openSet = new Set([start]);

        while (!pq.isEmpty()) {
            const { id: u } = pq.pop();
            openSet.delete(u);

            if (u === end) {
                const path = [];
                let current = end;
                while(current !== undefined) { path.unshift(current); current = previous.get(current); }
                steps.push({ type: 'path', path });
                return { steps, distance: gScore.get(end) };
            }
            
            steps.push({ type: 'visit', node: u });

            for (const { node: v, weight } of adj.get(u) || []) {
                const tentativeGScore = gScore.get(u) + weight;
                if (tentativeGScore < gScore.get(v)) {
                    previous.set(v, u);
                    gScore.set(v, tentativeGScore);
                    fScore.set(v, tentativeGScore + heuristic(v));
                    if (!openSet.has(v)) {
                        steps.push({ type: 'traverse', from: u, to: v });
                        pq.push({ id: v, priority: fScore.get(v) });
                        openSet.add(v);
                    }
                }
            }
        }
        return { steps, distance: Infinity };
    };
    
    const getBellmanFordSteps = (adj, start, end) => {
        const steps = [];
        const distances = new Map(nodes.map(n => [n.id, Infinity]));
        const previous = new Map();
        distances.set(start, 0);

        steps.push({ type: 'visit', node: start });

        for (let i = 0; i < nodes.length - 1; i++) {
            for (const [u, neighbors] of adj.entries()) {
                for (const { node: v, weight } of neighbors) {
                    steps.push({ type: 'traverse', from: u, to: v });
                    if (distances.get(u) !== Infinity && distances.get(u) + weight < distances.get(v)) {
                        distances.set(v, distances.get(u) + weight);
                        previous.set(v, u);
                        steps.push({ type: 'visit', node: v });
                    }
                }
            }
        }
        
        if (distances.get(end) !== Infinity) {
            const path = [];
            let current = end;
            while(current !== undefined) { path.unshift(current); current = previous.get(current); }
            if (path.length > 0 && path[0] === start) steps.push({ type: 'path', path });
        }

        return { steps, distance: distances.get(end) };
    };

    const getFloydWarshallSteps = (startNodeId, endNodeId) => {
        const steps = [];
        const nodeIds = nodes.map(n => n.id);
        const dist = new Map();
        const next = new Map();

        for (const i of nodeIds) {
            dist.set(i, new Map());
            next.set(i, new Map());
            for (const j of nodeIds) {
                dist.get(i).set(j, i === j ? 0 : Infinity);
                next.get(i).set(j, null);
            }
        }
        
        const plainLinks = links.map(l => ({
            source: typeof l.source === 'object' ? l.source.id : l.source,
            target: typeof l.target === 'object' ? l.target.id : l.target,
            weight: l.weight
        }));

        for (const link of plainLinks) {
            const u = link.source;
            const v = link.target;
            dist.get(u).set(v, link.weight);
            dist.get(v).set(u, link.weight);
            next.get(u).set(v, v);
            next.get(v).set(u, u);
        }

        for (const k of nodeIds) {
            steps.push({ type: 'intermediate', node: k });
            for (const i of nodeIds) {
                for (const j of nodeIds) {
                    steps.push({ type: 'traverse', from: i, to: j, through: k });
                    if (dist.get(i).get(k) + dist.get(k).get(j) < dist.get(i).get(j)) {
                        dist.get(i).set(j, dist.get(i).get(k) + dist.get(k).get(j));
                        next.get(i).set(j, next.get(i).get(k));
                    }
                }
            }
        }
        if(startNodeId !== null && endNodeId !== null) {
            const path = [];
            let curr = startNodeId;
            while (curr !== endNodeId && curr !== null) {
                path.push(curr);
                curr = next.get(curr)?.get(endNodeId);
                 if (path.includes(curr)) break; 
            }
            if(curr === endNodeId) path.push(endNodeId);
            if(path.length > 1 && path[0] === startNodeId) steps.push({ type: 'path', path });
        }
        return { steps, distance: dist.get(startNodeId)?.get(endNodeId) };
    };

    // --- Animation Engine ---
    const animateSteps = async (steps) => {
        for (const step of steps) {
            if (isPaused) {
                await new Promise(resolve => {
                    const checkPause = setInterval(() => {
                        if (!isPaused) { clearInterval(checkPause); resolve(); }
                    }, 100);
                });
            }
            
            setIntermediateNode(null);

            const getLinkKey = (id1, id2) => [id1, id2].sort().join('--');

            if (step.type === 'visit') {
                setCurrentNode(step.node);
                setVisitedNodes(prev => new Set(prev).add(step.node));
            } else if (step.type === 'traverse') {
                const linkId = getLinkKey(step.from, step.to);
                setAnimatedLinks(prev => new Set(prev).add(linkId));
                setTimeout(() => setAnimatedLinks(prev => {
                    const next = new Set(prev);
                    next.delete(linkId);
                    return next;
                }), speed);
            } else if (step.type === 'path') {
                const pathLinks = new Set();
                for(let i=0; i < step.path.length - 1; i++){
                    pathLinks.add(getLinkKey(step.path[i], step.path[i+1]));
                }
                setFinalPath(pathLinks);
            } else if (step.type === 'intermediate') {
                setIntermediateNode(step.node);
            }

            await new Promise(resolve => setTimeout(resolve, speed));
        }
    };
    
    // --- Render ---
    const getNodeFill = (nodeId) => {
        if (nodeId === startNode) return "#ffffff";
        if (nodeId === endNode) return "url(#stripe-pattern)";
        if (visitedNodes.has(nodeId)) return "rgba(255, 255, 255, 0.2)";
        return "#18181b"; // Darker node fill
    };

    const isAlgoRunning = isRunning || isPaused;

    return (
        <div className="h-screen bg-black text-gray-200 font-sans flex flex-col">
            <StyleInjector />
            <div className="w-full h-full p-4 sm:p-6 lg:p-8 flex flex-col">
                <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">Graph Algorithm Visualizer</h1>
                    <p className="text-md text-gray-400">An interactive playground for pathfinding algorithms.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[384px_1fr] gap-8 flex-grow min-h-0">
                    <div className="lg:col-span-1 flex flex-col space-y-6 h-full overflow-y-auto">
                        {/* Graph Definition Panel */}
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
                                disabled={isAlgoRunning}
                                className="w-full h-36 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                placeholder="A B 5&#10;B C 10&#10;A C 2"
                             />
                             <div className="grid grid-cols-2 gap-3 mt-4">
                                <button onClick={handleBuildGraph} disabled={isAlgoRunning} className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 border border-zinc-700">
                                    <Wrench size={16} /> Build Graph
                                </button>
                                <button onClick={resetGraph} disabled={isAlgoRunning} className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 border border-zinc-700">
                                    <RotateCcw size={16} /> Reset
                                </button>
                             </div>
                        </div>
                        {/* Controls Panel */}
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
                                            onChange={(e) => setStartNode(e.target.value)}
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
                                            onChange={(e) => setEndNode(e.target.value)}
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
                    </div>

                    <div className="lg:col-span-1 flex flex-col relative min-h-[400px] lg:min-h-0">
                        {/* RESULTS PANEL */}
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

                        <div className="border border-zinc-800 rounded-2xl relative h-full overflow-hidden graph-bg">
                            <svg ref={svgRef} className="w-full h-full">
                                <g ref={gRef}>
                                    <g className="links">
                                        {links.map((link) => {
                                            const sourceNode = nodeMap.get(typeof link.source === 'object' ? link.source.id : link.source);
                                            const targetNode = nodeMap.get(typeof link.target === 'object' ? link.target.id : link.target);

                                            if (!sourceNode || !targetNode) return null;

                                            const linkId = [sourceNode.id, targetNode.id].sort().join('--');
                                            const isFinalPath = finalPath.has(linkId);
                                            const isAnimated = animatedLinks.has(linkId);

                                            return (
                                                <g key={linkId} className="link-group">
                                                    <line className="link-line" x1={sourceNode.x} y1={sourceNode.y} x2={targetNode.x} y2={targetNode.y}
                                                        stroke={isFinalPath ? "#ffffff" : "#4b5563"}
                                                        strokeWidth={isFinalPath ? 3 : 1.5}
                                                    />
                                                    {isAnimated && <line x1={sourceNode.x} y1={sourceNode.y} x2={targetNode.x} y2={targetNode.y}
                                                        stroke="#a78bfa" strokeWidth="3.5" className="link-traversal pointer-events-none" />}
                                                    {(algorithm !== 'bfs' && algorithm !== 'dfs') && (
                                                        <text x={(sourceNode.x + targetNode.x) / 2} y={(sourceNode.y + targetNode.y) / 2 - 8}
                                                            fill="#8b949e" fontSize="12" textAnchor="middle" className="link-text font-mono pointer-events-none">
                                                            {link.weight}
                                                        </text>
                                                    )}
                                                </g>
                                            )
                                        })}
                                    </g>
                                    <g className="nodes">
                                        {nodes.map(node => (
                                            <g key={node.id} 
                                               className="node-group" 
                                               transform={`translate(${node.x || 0}, ${node.y || 0})`}
                                            >
                                                {intermediateNode === node.id && <circle r="18" className="intermediate-node-pulse pointer-events-none" />}
                                                {currentNode === node.id && <circle r="18" fill="#ffffff" className="pulse-node pointer-events-none" />}
                                                <circle r="18" fill={getNodeFill(node.id)}
                                                    stroke="#6b7280"
                                                    strokeWidth="2"
                                                    className="node-circle transition-all duration-300 hover:stroke-violet-400 cursor-grab"
                                                />
                                                <text y="6" fill={node.id === startNode ? "black" : "white"} fontSize="16" fontWeight="bold" textAnchor="middle" className="pointer-events-none select-none">
                                                    {node.label}
                                                </text>
                                            </g>
                                        ))}
                                    </g>
                                </g>
                            </svg>
                        </div>
                    </div>
                </div>
                <footer className="text-center py-4 mt-auto text-zinc-500 text-sm">
                    <p>Made by Anirudh</p>
                    <div className="flex items-center justify-center gap-4 mt-2">
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                            <Github size={20} />
                        </a>
                        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                            <Linkedin size={20} />
                        </a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                            <InstagramIcon className="w-5 h-5" />
                        </a>
                    </div>
                </footer>
            </div>

            {/* AI Generation Modal */}
            {isAiModalOpen && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl text-white w-full max-w-lg relative">
                        <button onClick={() => setIsAiModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                        <div className="flex items-center gap-3 mb-4">
                            <Sparkles className="text-violet-400" size={24} />
                            <h3 className="text-2xl font-bold">Generate Graph with AI</h3>
                        </div>
                        <p className="text-zinc-400 mb-6">Describe the kind of graph you want to create. For example, "a simple social network" or "a map of major Indian cities".</p>
                        <textarea
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="w-full h-28 bg-zinc-800 border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                            placeholder="e.g., A simple road network connecting a few cities..."
                            autoFocus
                        />
                        <div className="flex justify-end mt-6">
                            <button 
                                onClick={handleGenerateGraph} 
                                disabled={isGenerating || !aiPrompt}
                                className="w-40 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold text-white transition-all bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 disabled:from-zinc-700 disabled:to-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full loader"></div> : '✨ Generate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Helper: Priority Queue for Dijkstra ---
class D3PriorityQueue {
    constructor() { this._data = []; }
    push(d) { this._data.push(d); this._data.sort((a, b) => a.priority - b.priority); }
    pop() { return this._data.shift(); }
    isEmpty() { return this._data.length === 0; }
    update(id, priority) {
        for (let i = 0; i < this._data.length; i++) {
            if (this._data[i].id === id) {
                this._data[i].priority = priority;
                this._data.sort((a, b) => a.priority - b.priority);
                return;
            }
        }
    }
}