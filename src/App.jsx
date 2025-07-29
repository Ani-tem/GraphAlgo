import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import {
    getBfsSteps, getDfsSteps, getDijkstraSteps, getAStarSteps,
    getBellmanFordSteps, getFloydWarshallSteps
} from './utils/algorithms';

import GraphDefinition from './components/GraphDefinition';
import Controls from './components/Controls';
import Visualization from './components/Visualization';
import Results from './components/Results';
import AiModal from './components/AiModal';
import Footer from './components/Footer';

// --- Default graph structure for the text area ---
const initialAdjacencyList = `A B 4
A D 2
B C 3
B E 1
C F 2
D E 5
E F 3
F G 6`;

// --- Main App Component ---
export default function App() {
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

    // --- Graph Parsing and Building ---
    const handleBuildGraph = useCallback((svgRef) => {
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
        setEndNode(newNodes.length > 0 ? newNodes[newNodes.length - 1].id : null);
        
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

        setNodes(newNodes.map(n => ({...n, x: n.x, y: n.y})));
        setLinks(newLinks);
    }, [adjacencyListInput]);

    const resetGraph = useCallback(() => {
        setAdjacencyListInput(initialAdjacencyList);
    }, []);

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
        const algoArgs = { adj, startNode, endNode, nodes, links };

        if (algorithm === 'bfs') result = getBfsSteps(algoArgs);
        if (algorithm === 'dfs') result = getDfsSteps(algoArgs);
        if (algorithm === 'dijkstra') result = getDijkstraSteps(algoArgs);
        if (algorithm === 'a-star') result = getAStarSteps(algoArgs);
        if (algorithm === 'bellman-ford') result = getBellmanFordSteps(algoArgs);
        if (algorithm === 'floyd-warshall') result = getFloydWarshallSteps(algoArgs);
        
        await animateSteps(result.steps);
        setShortestDistance(result.distance);

        setIsRunning(false);
        setCurrentNode(null);
        setIntermediateNode(null);
    };

    return (
        <div className="h-screen bg-black text-gray-200 font-sans flex flex-col">
            <div className="w-full h-full p-4 sm:p-6 lg:p-8 flex flex-col">
                <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">Graph Algorithm Visualizer</h1>
                    <p className="text-md text-gray-400">An interactive playground for pathfinding algorithms.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[384px_1fr] gap-8 flex-grow min-h-0">
                    <div className="lg:col-span-1 flex flex-col space-y-6 h-full overflow-y-auto">
                        <GraphDefinition 
                            adjacencyListInput={adjacencyListInput}
                            setAdjacencyListInput={setAdjacencyListInput}
                            handleBuildGraph={handleBuildGraph}
                            resetGraph={resetGraph}
                            setIsAiModalOpen={setIsAiModalOpen}
                            isRunning={isRunning || isPaused}
                        />
                        <Controls 
                            algorithm={algorithm}
                            setAlgorithm={setAlgorithm}
                            startNode={startNode}
                            setStartNode={setStartNode}
                            endNode={endNode}
                            setEndNode={setEndNode}
                            speed={speed}
                            setSpeed={setSpeed}
                            runAlgorithm={runAlgorithm}
                            isPaused={isPaused}
                            setIsPaused={setIsPaused}
                            isRunning={isRunning}
                        />
                    </div>

                    <div className="lg:col-span-1 flex flex-col relative min-h-[400px] lg:min-h-0">
                        <Results 
                            algorithm={algorithm}
                            shortestDistance={shortestDistance}
                        />
                        <Visualization 
                            nodes={nodes}
                            links={links}
                            finalPath={finalPath}
                            animatedLinks={animatedLinks}
                            intermediateNode={intermediateNode}
                            currentNode={currentNode}
                            startNode={startNode}
                            endNode={endNode}
                            visitedNodes={visitedNodes}
                            setNodes={setNodes}
                            handleBuildGraph={handleBuildGraph}
                        />
                    </div>
                </div>
                <Footer />
            </div>

            <AiModal 
                isAiModalOpen={isAiModalOpen}
                setIsAiModalOpen={setIsAiModalOpen}
                setAdjacencyListInput={setAdjacencyListInput}
            />
        </div>
    );
}