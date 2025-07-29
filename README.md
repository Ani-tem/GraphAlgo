# ✨ Interactive Graph Algorithm Visualizer

An advanced, web-based platform for visualizing classic graph pathfinding algorithms. Built using **React**, **D3.js**, and **Tailwind CSS**, this tool offers a powerful and educational experience for understanding how different algorithms traverse and find paths in a graph.



## 🚀 Features

### 🧠 Multiple Algorithms
Visualize and compare the behavior of several algorithms:
- Breadth-First Search (BFS)
- Depth-First Search (DFS)
- Dijkstra’s Algorithm
- A* Search (Euclidean distance heuristic)
- Bellman-Ford Algorithm
- Floyd-Warshall Algorithm

### 🎨 Interactive & Dynamic UI
- **Draggable Nodes**: Rearrange graph layout interactively.
- **Pan & Zoom**: Navigate large graphs easily.
- **Real-time Results**: Instantly shows path cost and time complexity.
- **Speed Control**: Adjustable animation speed via slider.
- **Responsive Design**: Clean layout powered by Tailwind CSS.

### 🤖 AI-Powered Graph Generation
- Describe a graph in natural language (e.g., “a city map”, “a social network”).
- Uses the **Google Gemini API** to generate a valid graph structure.

### ⚙️ Custom Graph Input
- Define a graph using:
  ```
  node1 node2 weight
  ```
- Click **Build Graph** to render it.
- Reset anytime to restore the default.

---

## 🧰 Tech Stack

| Feature         | Tech Used           |
|------------------|----------------------|
| Frontend         | React                |
| Visualization    | D3.js                |
| Styling          | Tailwind CSS         |
| Icons            | Lucide React         |
| AI Integration   | Google Gemini API    |

---

## 🔧 Getting Started

### ✅ Prerequisites
- Node.js (v16+)
- npm or yarn

---

### 📦 Installation

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
npm install
# or
yarn install
```

---

### 🔐 Set Up Environment Variables

> ⚠️ Do not hardcode API keys in production!

1. Get your API key from [Google AI Studio](https://aistudio.google.com/).
2. Create a `.env.local` file in the root directory.
3. Add the following:

```env
REACT_APP_GEMINI_API_KEY=YOUR_API_KEY_HERE
```

4. In `src/App.js`, replace:

```js
const apiKey = "hardcoded-key";
```

with:

```js
const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
```

---

### ▶️ Run the App

```bash
npm start
# or
yarn start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 How to Use

1. **Define a Graph**
   - Use the text input for adjacency list.
   - Or use **"Generate with AI"** to describe it.

2. **Build the Graph**
   - Click **Build Graph** to render it.

3. **Select Algorithm**
   - Pick from BFS, DFS, Dijkstra, A*, etc.

4. **Set Nodes**
   - Input start/end node IDs.  
     *(Floyd-Warshall doesn't require this.)*

5. **Visualize**
   - Click **Visualize** to animate.
   - Pause/resume and control speed as needed.
   - Drag nodes and zoom/pan the canvas.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE.md).

---

## 📬 Contact

**Anirudh**  
🔗 [GitHub Repo](https://github.com/your-username/your-repo-name)

> ⭐ If you like the project, don't forget to star the repo!
