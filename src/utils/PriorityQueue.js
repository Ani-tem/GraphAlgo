// --- Helper: Priority Queue for Dijkstra & A* ---
class D3PriorityQueue {
    constructor() {
        this._data = [];
    }
    push(d) {
        this._data.push(d);
        this._data.sort((a, b) => a.priority - b.priority);
    }
    pop() {
        return this._data.shift();
    }
    isEmpty() {
        return this._data.length === 0;
    }
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

export default D3PriorityQueue;
