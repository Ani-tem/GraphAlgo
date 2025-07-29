import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';

const AiModal = ({ isAiModalOpen, setIsAiModalOpen, setAdjacencyListInput }) => {
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

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

    if (!isAiModalOpen) return null;

    return (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl text-white w-full max-w-lg relative">
                <button onClick={() => setIsAiModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
                    <X size={24} />
                </button>
                <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="text-violet-400" size={24} />
                    <h3 className="text-2xl font-bold">Generate Graph with AI</h3>
                </div>
                <p className="text-zinc-400 mb-6">Describe the kind of graph you want to create. For example, "a simple social network" or "a map of major US cities".</p>
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
    );
};

export default AiModal;
