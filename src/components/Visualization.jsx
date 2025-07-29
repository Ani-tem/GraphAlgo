import React, { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';

const StyleInjector = () => (
    <style>{`
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 70% { transform: scale(2.5); opacity: 0; } 100% { transform: scale(2.5); opacity: 0; } }
        .pulse-node { animation: pulse 1.2s ease-out infinite; stroke: none; }
        @keyframes travel { from { stroke-dashoffset: 20; } to { stroke-dashoffset: -20; } }
        .link-traversal { stroke-dasharray: 2 10; animation: travel 0.5s linear infinite; }
        .final-path-link { stroke: #ffffff; filter: drop-shadow(0 0 5px #ffffff); }
        .intermediate-node-pulse { animation: pulse 1.5s ease-out infinite; stroke: none; fill: #a78bfa; }
        .graph-bg {
            background-color: #0a0a0a;
            background-image:
                linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
            background-size: 20px 20px;
        }
    `}</style>
);

const Visualization = ({
    nodes, links, finalPath, animatedLinks, intermediateNode, currentNode,
    startNode, endNode, visitedNodes, setNodes, handleBuildGraph
}) => {
    const svgRef = useRef();
    const gRef = useRef();
    const nodeMap = useMemo(() => new Map(nodes.map(node => [node.id, node])), [nodes]);

    useEffect(() => {
        handleBuildGraph(svgRef);
    }, []);

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

    useEffect(() => {
        if (!gRef.current || !nodes.length) return;
        const g = d3.select(gRef.current);
        const dragHandler = d3.drag()
            .on('start', function(event, d) { d3.select(this.parentNode).raise(); })
            .on('drag', (event, d) => {
                setNodes(currentNodes => currentNodes.map(n => 
                    n.id === d.id ? { ...n, x: event.x, y: event.y } : n
                ));
            });
        
        g.selectAll('.node-group')
            .data(nodes, d => d ? d.id : null)
            .select('.node-circle')
            .call(dragHandler);
    }, [nodes, setNodes]);

    const getNodeFill = (nodeId) => {
        if (nodeId === startNode) return "#ffffff";
        if (nodeId === endNode) return "url(#stripe-pattern)";
        if (visitedNodes.has(nodeId)) return "rgba(255, 255, 255, 0.2)";
        return "#18181b";
    };

    return (
        <div className="border border-zinc-800 rounded-2xl relative h-full overflow-hidden graph-bg">
            <StyleInjector />
            <svg ref={svgRef} className="w-full h-full">
                <defs>
                    <pattern id="stripe-pattern" patternUnits="userSpaceOnUse" width="8" height="8">
                        <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" stroke="white" strokeWidth="1.5" />
                    </pattern>
                </defs>
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
                                        stroke={isFinalPath ? "#ffffff" : "#4b5563"} strokeWidth={isFinalPath ? 3 : 1.5} />
                                    {isAnimated && <line x1={sourceNode.x} y1={sourceNode.y} x2={targetNode.x} y2={targetNode.y}
                                        stroke="#a78bfa" strokeWidth="3.5" className="link-traversal pointer-events-none" />}
                                    {(link.weight) && (
                                        <text x={(sourceNode.x + targetNode.x) / 2} y={(sourceNode.y + targetNode.y) / 2 - 8}
                                            fill="#8b949e" fontSize="12" textAnchor="middle" className="link-text font-mono pointer-events-none">
                                            {link.weight}
                                        </text>
                                    )}
                                </g>
                            );
                        })}
                    </g>
                    <g className="nodes">
                        {nodes.map(node => (
                            <g key={node.id} className="node-group" transform={`translate(${node.x || 0}, ${node.y || 0})`}>
                                {intermediateNode === node.id && <circle r="18" className="intermediate-node-pulse pointer-events-none" />}
                                {currentNode === node.id && <circle r="18" fill="#ffffff" className="pulse-node pointer-events-none" />}
                                <circle r="18" fill={getNodeFill(node.id)} stroke="#6b7280" strokeWidth="2"
                                    className="node-circle transition-all duration-300 hover:stroke-violet-400 cursor-grab" />
                                <text y="6" fill={node.id === startNode ? "black" : "white"} fontSize="16" fontWeight="bold" textAnchor="middle" className="pointer-events-none select-none">
                                    {node.label}
                                </text>
                            </g>
                        ))}
                    </g>
                </g>
            </svg>
        </div>
    );
};

export default Visualization;
