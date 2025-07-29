import D3PriorityQueue from './PriorityQueue';

export const getBfsSteps = ({ adj, startNode, endNode }) => {
    const steps = [];
    const queue = [{ node: startNode, path: [startNode] }];
    const visited = new Set([startNode]);
    while (queue.length > 0) {
        const { node, path } = queue.shift();
        steps.push({ type: 'visit', node });
        if (node === endNode) {
            steps.push({ type: 'path', path });
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

export const getDfsSteps = ({ adj, startNode, endNode }) => {
    const steps = [];
    const stack = [{ node: startNode, path: [startNode] }];
    const visited = new Set();
    while (stack.length > 0) {
        const { node, path } = stack.pop();
        if (visited.has(node)) continue;
        visited.add(node);
        steps.push({ type: 'visit', node });
        if (node === endNode) {
            steps.push({ type: 'path', path });
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

export const getDijkstraSteps = ({ adj, startNode, endNode, nodes }) => {
    const steps = [];
    const distances = new Map(nodes.map(n => [n.id, Infinity]));
    const previous = new Map();
    const pq = new D3PriorityQueue();
    distances.set(startNode, 0);
    nodes.forEach(n => pq.push({ id: n.id, priority: distances.get(n.id) }));
    while (!pq.isEmpty()) {
        const { id: u } = pq.pop();
        if (u === undefined || distances.get(u) === Infinity) break;
        steps.push({ type: 'visit', node: u });
        if (u === endNode) break;
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
    let current = endNode;
    while (current !== undefined) {
        path.unshift(current);
        current = previous.get(current);
    }
    if (path.length > 0 && path[0] === startNode) {
        steps.push({ type: 'path', path });
    }
    return { steps, distance: distances.get(endNode) };
};

export const getAStarSteps = ({ adj, startNode, endNode, nodes }) => {
    const steps = [];
    const endNodePos = nodes.find(n => n.id === endNode);
    if (!endNodePos) return { steps: [], distance: Infinity };

    const heuristic = (nodeId) => {
        const nodePos = nodes.find(n => n.id === nodeId);
        if (!nodePos || typeof nodePos.x === 'undefined') return Infinity;
        return Math.sqrt(Math.pow(nodePos.x - endNodePos.x, 2) + Math.pow(nodePos.y - endNodePos.y, 2));
    };

    const gScore = new Map(nodes.map(n => [n.id, Infinity]));
    gScore.set(startNode, 0);

    const fScore = new Map(nodes.map(n => [n.id, Infinity]));
    fScore.set(startNode, heuristic(startNode));

    const previous = new Map();
    const pq = new D3PriorityQueue();
    pq.push({ id: startNode, priority: fScore.get(startNode) });
    const openSet = new Set([startNode]);

    while (!pq.isEmpty()) {
        const { id: u } = pq.pop();
        openSet.delete(u);

        if (u === endNode) {
            const path = [];
            let current = endNode;
            while (current !== undefined) {
                path.unshift(current);
                current = previous.get(current);
            }
            steps.push({ type: 'path', path });
            return { steps, distance: gScore.get(endNode) };
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

export const getBellmanFordSteps = ({ adj, startNode, endNode, nodes }) => {
    const steps = [];
    const distances = new Map(nodes.map(n => [n.id, Infinity]));
    const previous = new Map();
    distances.set(startNode, 0);

    steps.push({ type: 'visit', node: startNode });

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

    if (distances.get(endNode) !== Infinity) {
        const path = [];
        let current = endNode;
        while (current !== undefined) {
            path.unshift(current);
            current = previous.get(current);
        }
        if (path.length > 0 && path[0] === startNode) {
            steps.push({ type: 'path', path });
        }
    }

    return { steps, distance: distances.get(endNode) };
};

export const getFloydWarshallSteps = ({ startNode, endNode, nodes, links }) => {
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
    if (startNode !== null && endNode !== null) {
        const path = [];
        let curr = startNode;
        while (curr !== endNode && curr !== null) {
            path.push(curr);
            curr = next.get(curr)?.get(endNode);
            if (path.includes(curr)) break;
        }
        if (curr === endNode) path.push(endNode);
        if (path.length > 1 && path[0] === startNode) steps.push({ type: 'path', path });
    }
    return { steps, distance: dist.get(startNode)?.get(endNode) };
};
