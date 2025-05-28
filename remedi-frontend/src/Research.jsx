import React, { useState, useEffect } from 'react';
import { useResearch } from './context/ResearchContext';
import { useNavigate } from 'react-router-dom';

// Header Component
const ResearchHeader = ({ researchName }) => (
  <header className="header">
    <div className="container">
      <div className="nav-brand">
        <span className="logo">reMedi</span>
        {researchName && <span className="research-title">| {researchName}</span>}
      </div>
    </div>
  </header>
);

// Research Query Component
const ResearchQuery = () => {
  const { researchName, researchMode, setResearchMode } = useResearch();
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [rawResult, setRawResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conversation, setConversation] = useState([]);
  const [processingAnalysis, setProcessingAnalysis] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const addToConversation = (query, response, raw) => {
    setConversation(prev => [...prev, {
      id: Date.now(),
      query,
      response,
      raw,
      timestamp: new Date().toISOString()
    }]);
  };

  const processWithPerplexity = async (data, endpoint) => {
    try {
      setProcessingAnalysis(true);
      console.log('🔍 Processing results with Perplexity...');
      
      let systemPrompt = '';
      let userPrompt = '';

      switch (endpoint) {
        case 'predict-binding-affinity':
          const [smilesRaw, sequenceRaw] = input.split(',').map(s => s.trim());
          if (!smilesRaw || !sequenceRaw) {
            throw new Error('Please enter SMILES and sequence separated by comma');
          }
          
          // Remove ALL brackets from the input strings
          const smiles = smilesRaw.replace(/[\[\]']/g, '');  // Remove all brackets and single quotes
          const sequence = sequenceRaw.replace(/[\[\]']/g, '');  // Remove all brackets and single quotes
          
          systemPrompt = 'You are an expert in molecular binding affinity analysis. Focus on highlighting positive insights and potential opportunities in the results.';
          userPrompt = `Analyze these binding affinity prediction results for SMILES: ${smiles} and protein sequence: ${sequence}. 
                       Explain what they mean for drug discovery, focusing on the positive aspects and potential opportunities. 
                       Include interpretation of the scores and their implications: ${JSON.stringify(data, null, 2)}`;
          break;

        case 'generate-compounds':
          systemPrompt = 'You are an expert in drug discovery and compound generation. Focus on highlighting interesting properties and potential applications of the generated compounds.';
          userPrompt = `Analyze these generated compounds for PDB ID: ${input}. 
                       Explain their potential relevance for drug discovery, highlighting interesting chemical properties and patterns: ${JSON.stringify(data, null, 2)}`;
          break;

        case 'pdb-sequence':
          systemPrompt = 'You are an expert in protein sequence analysis. Focus on highlighting interesting patterns and potential functional implications.';
          userPrompt = `Analyze this protein sequence for PDB ID: ${input}. 
                       Provide insights about its structure and potential function, highlighting notable sequence patterns or motifs: ${JSON.stringify(data, null, 2)}`;
          break;

        case 'natural-to-aql':
          systemPrompt = 'You are an expert in biomedical knowledge graphs. Focus on explaining the discovered relationships in a clear and insightful way.';
          userPrompt = `For the query: "${input}", analyze these knowledge graph relationships. 
                       Explain the connections found and their scientific significance: ${JSON.stringify(data, null, 2)}`;
          break;

        default:
          systemPrompt = 'Analyze these scientific results and explain their significance in clear terms, focusing on positive insights and opportunities.';
          userPrompt = `Analyze these results: ${JSON.stringify(data, null, 2)}`;
      }

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer perplexity-token'
        },
        body: JSON.stringify({
          model: "sonar-pro",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: userPrompt
            }
          ]
        })
      });

      const result = await response.json();
      return result.choices[0].message.content;
    } catch (err) {
      console.error('Analysis processing error:', err);
      return 'Failed to process analysis. Raw data is shown below.';
    } finally {
      setProcessingAnalysis(false);
    }
  };

  const generateReport = async () => {
    try {
      setGeneratingReport(true);
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer perplexity-token'
        },
        body: JSON.stringify({
          model: "sonar-deep-research",
          messages: [
            {
              role: "system",
              content: `Generate a detailed scientific report based on the following research conversation. Research name: ${researchName}`
            },
            {
              role: "user",
              content: JSON.stringify(conversation)
            }
          ]
        })
      });

      const result = await response.json();
      const report = result.choices[0].message.content;
      
      const blob = new Blob([report], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${researchName.replace(/\s+/g, '_')}_report.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Report generation error:', err);
      setError('Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleDeepResearch = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer perplexity-token'
        },
        body: JSON.stringify({
          model: "sonar-deep-research",
          messages: [
            {
              role: "system",
              content: "You are an expert biomedical research assistant. Provide detailed scientific analysis."
            },
            {
              role: "user",
              content: input
            }
          ]
        })
      });

      const result = await response.json();
      const analysis = result.choices[0].message.content;
      setResult(analysis);
      setRawResult(result);
      addToConversation(input, analysis, result);
    } catch (err) {
      console.error('Deep research error:', err);
      setError('Failed to process deep research query');
    } finally {
      setLoading(false);
    }
  };

  const handleKnowledgeQuery = async (endpoint) => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError('');

    try {
      let requestData = {};
      let response;
      
      switch (endpoint) {
        case 'predict-binding-affinity':
          const [smilesRaw, sequenceRaw] = input.split(',').map(s => s.trim());
          if (!smilesRaw || !sequenceRaw) {
            throw new Error('Please enter SMILES and sequence separated by comma');
          }
          
          // Remove ALL brackets from the input strings and send as single strings
          const smiles = smilesRaw.replace(/[\[\]']/g, '');  // Remove all brackets and single quotes
          const sequence = sequenceRaw.replace(/[\[\]']/g, '');  // Remove all brackets and single quotes
          
          requestData = { 
            "smile": smiles,
            "target_sequence": sequence
          };
          response = await fetch(`http://35.193.196.5:5000/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
          });
          break;

        case 'generate-compounds':
          const pdbIdForCompounds = input.trim();
          if (!/^[a-zA-Z0-9]{4}$/.test(pdbIdForCompounds)) {
            throw new Error('Please enter a valid 4-character PDB ID');
          }
          requestData = { "pdb_id": String(pdbIdForCompounds) };
          response = await fetch(`http://35.193.196.5:5000/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
          });
          break;

        case 'pdb-sequence':
          const pdbIdForSequence = input.trim();
          if (!/^[a-zA-Z0-9]{4}$/.test(pdbIdForSequence)) {
            throw new Error('Please enter a valid 4-character PDB ID');
          }
          response = await fetch(`http://35.193.196.5:5000/${endpoint}?pdb_id=${pdbIdForSequence}`);
          break;

        case 'natural-to-aql':
          requestData = { "query": String(input) };
          response = await fetch(`http://35.193.196.5:5000/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
          });
          break;

        default:
          throw new Error('Invalid endpoint');
      }

      const responseData = await response.json();
      
      // Handle specific error case for generate-compounds
      if (endpoint === 'generate-compounds' && 
          responseData.error && 
          responseData.error.includes('Dataset not found')) {
        throw new Error('This protein does not have appropriate ligands or is missing from the RCSB PDB database.');
      }
      
      setRawResult(responseData);
      const analysis = await processWithPerplexity(responseData, endpoint);
      setResult(analysis);
      
      addToConversation(input, analysis, responseData);
    } catch (err) {
      console.error('Knowledge query error:', err);
      setError(err.message || 'Failed to process query');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="research-container" data-mode={researchMode}>
      <ResearchHeader researchName={researchName} />
      
      <main className="content">
        <div className="mode-selector">
          <div className="mode-buttons">
            <button 
              className={`mode-btn ${researchMode === 'knowledge' ? 'active' : ''}`}
              onClick={() => setResearchMode('knowledge')}
            >
              Knowledge Graph
            </button>
            <button 
              className={`mode-btn ${researchMode === 'deep' ? 'active' : ''}`}
              onClick={() => setResearchMode('deep')}
            >
              Deep Research
            </button>
            {conversation.length > 0 && (
              <button 
                className={`mode-btn report-btn ${generatingReport ? 'loading' : ''}`}
                onClick={generateReport}
                disabled={generatingReport}
              >
                {generatingReport ? (
                  <>
                    <div className="loading-spinner" />
                    <span>Generating...</span>
                  </>
                ) : (
                  'Generate Report'
                )}
              </button>
            )}
          </div>
        </div>

        <div className="query-section">
          <div className="query-box" data-mode={researchMode}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={researchMode === 'knowledge' 
                ? getPlaceholderText()
                : "Ask any research question..."}
              disabled={loading}
              className="query-input"
            />
            {loading && (
              <div className="loading-overlay">
                <div className="loading-spinner" />
              </div>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          {researchMode === 'knowledge' ? (
            <div className="action-buttons">
              <button 
                className="action-btn compounds-btn"
                onClick={() => handleKnowledgeQuery('generate-compounds')}
                disabled={loading || !input.trim()}
              >
                Generate Compounds
                <div className="btn-description">Enter PDB ID</div>
              </button>
              <button 
                className="action-btn relation-btn"
                onClick={() => handleKnowledgeQuery('natural-to-aql')}
                disabled={loading || !input.trim()}
              >
                Find Relation
                <div className="btn-description">Enter your query</div>
              </button>
              <button 
                className="action-btn sequence-btn"
                onClick={() => handleKnowledgeQuery('pdb-sequence')}
                disabled={loading || !input.trim()}
              >
                Get Sequence
                <div className="btn-description">Enter PDB ID</div>
              </button>
              <button 
                className="action-btn affinity-btn"
                onClick={() => handleKnowledgeQuery('predict-binding-affinity')}
                disabled={loading || !input.trim()}
              >
                Affinity Prediction
                <div className="btn-description">Enter SMILES, sequence</div>
              </button>
            </div>
          ) : (
            <button 
              className="submit-btn"
              onClick={handleDeepResearch}
              disabled={loading || !input.trim()}
            >
              {loading ? 'Processing...' : 'Research'}
            </button>
          )}

          {(result || processingAnalysis) && (
            <div className="results-section">
              <div className="results-box">
                <div className="results-content">
                  <h3>Analysis</h3>
                  {processingAnalysis ? (
                    <div className="processing-analysis">
                      <div className="loading-spinner" />
                      <p>Processing analysis...</p>
                    </div>
                  ) : (
                    <div className="analysis-text">
                      {result}
                    </div>
                  )}
                  {rawResult && (
                    <div className="raw-output">
                      <h3>Raw Output</h3>
                      <pre>{JSON.stringify(rawResult, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        .research-container {
          min-height: 100vh;
          background: #0a0a0a;
          color: white;
          position: relative;
          overflow: hidden;
          transition: --gradient-color-1 1.2s ease,
                      --gradient-color-2 1.2s ease,
                      --gradient-color-3 1.2s ease;
        }

        .research-container::before {
          content: '';
          position: fixed;
          top: -150%;
          left: -150%;
          right: -150%;
          bottom: -150%;
          background: radial-gradient(ellipse at center, 
            var(--gradient-color-1) 0%, 
            transparent 70%);
          opacity: 0.15;
          transition: all 1.2s ease;
          pointer-events: none;
        }

        .research-container::after {
          content: '';
          position: fixed;
          top: -150%;
          left: -150%;
          right: -150%;
          bottom: -150%;
          background: conic-gradient(from 0deg,
            var(--gradient-color-1),
            var(--gradient-color-2),
            var(--gradient-color-3),
            var(--gradient-color-1));
          opacity: 0.1;
          animation: rotate 60s linear infinite;
          z-index: 1;
          transition: all 1.2s ease;
          pointer-events: none;
        }

        .research-container[data-mode="knowledge"] {
          --gradient-color-1: #8B5CF6;
          --gradient-color-2: #06B6D4;
          --gradient-color-3: #10B981;
        }

        .research-container[data-mode="deep"] {
          --gradient-color-1: #F59E0B;
          --gradient-color-2: #10B981;
          --gradient-color-3: #F97316;
        }

        .mode-selector {
          margin-top: 100px;
          margin-bottom: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          position: relative;
          z-index: 2;
        }

        .mode-buttons {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 20px;
        }

        .mode-btn {
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.3s ease;
          border-radius: 8px;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .mode-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-1px);
        }

        .mode-btn.active {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }

        .report-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          min-width: 150px;
        }

        .report-btn.loading {
          background: rgba(255, 255, 255, 0.1);
          cursor: not-allowed;
        }

        .report-btn .loading-spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .action-buttons {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-top: 1rem;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }

        .action-btn {
          position: relative;
          padding: 1rem;
          border: none;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-description {
          font-size: 0.8rem;
          opacity: 0.8;
          font-style: italic;
        }

        .compounds-btn {
          background: linear-gradient(135deg, #8B5CF6, #06B6D4);
        }

        .relation-btn {
          background: linear-gradient(135deg, #06B6D4, #10B981);
        }

        .sequence-btn {
          background: linear-gradient(135deg, #10B981, #8B5CF6);
        }

        .affinity-btn {
          background: linear-gradient(135deg, #F59E0B, #10B981);
        }

        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .query-section {
          max-width: 800px;
          margin: 0 auto;
          margin-top: 20px;
        }

        .query-box {
          position: relative;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          margin-bottom: 1rem;
          margin-top: 20px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .query-box[data-mode="knowledge"] {
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.2),
                     0 0 30px rgba(46, 204, 113, 0.1),
                     0 0 40px rgba(230, 126, 34, 0.05),
                     0 0 50px rgba(231, 76, 60, 0.05);
          border-color: rgba(46, 204, 113, 0.3);
        }

        .query-box[data-mode="deep"] {
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.2),
                     0 0 30px rgba(52, 152, 219, 0.1),
                     0 0 40px rgba(155, 89, 182, 0.05),
                     0 0 50px rgba(230, 126, 34, 0.05);
          border-color: rgba(52, 152, 219, 0.3);
        }

        .query-input {
          width: 100%;
          min-height: 150px;
          padding: 1.5rem;
          background: transparent;
          border: none;
          color: white;
          font-size: 1.25rem;
          resize: none;
          font-family: 'Lexend', sans-serif;
        }

        .query-input:focus {
          outline: none;
        }

        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(10, 10, 10, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-spinner {
          width: 2rem;
          height: 2rem;
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-top-color: #06B6D4;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .error-message {
          padding: 0.75rem;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }

        .submit-btn {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(90deg, #8B5CF6, #06B6D4);
          border: none;
          border-radius: 0.5rem;
          color: white;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .results-section {
          margin-top: 2rem;
          opacity: 1;
          transform: translateY(0);
          transition: all 0.5s ease;
        }

        .results-box {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .results-content {
          padding: 1.5rem;
        }

        .processing-analysis {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 2rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .analysis-text {
          font-size: 1.1rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.9);
          white-space: pre-wrap;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          margin-bottom: 2rem;
        }

        .raw-output {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .raw-output pre {
          font-size: 0.9rem;
          background: rgba(0, 0, 0, 0.2);
          padding: 1rem;
          border-radius: 8px;
          overflow-x: auto;
          color: rgba(255, 255, 255, 0.7);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const getPlaceholderText = () => {
  return `Choose an action and enter:
- PDB ID (4 characters) for Generate Compounds or Get Sequence
- Your query for Find Relation
- SMILES string, protein sequence (comma-separated) for Affinity Prediction`;
};

// Main Research Component
const Research = () => {
  const { researchStep } = useResearch();

  return (
    <>
      {researchStep === 'name' && <ResearchNameInput />}
      {researchStep === 'query' && <ResearchQuery />}
    </>
  );
};

// Research Name Input Component
const ResearchNameInput = () => {
  const { setResearchName, setResearchStep } = useResearch();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim().length < 3) {
      setError('Research name must be at least 3 characters long');
      return;
    }
    setResearchName(name);
    setResearchStep('query');
  };

  return (
    <div className="name-input-container">
      <div className="name-input-container::before" />
      <div className="name-input-card">
        <h2>Name Your Research</h2>
        <p>Give your research a meaningful name to track its progress</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="Enter research name..."
            className="name-input"
          />
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="submit-btn">Continue</button>
        </form>
      </div>

      <style jsx>{`
        .name-input-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          padding: 2rem;
          position: relative;
          overflow: hidden;
          padding-top: 100px;
        }

        .name-input-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at var(--x, 50%) var(--y, 30%),
            rgba(92, 39, 255, 0.15),
            rgba(0, 0, 0, 0.95));
          animation: moveGradient 15s ease-in-out infinite;
          z-index: 1;
        }

        .name-input-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1rem;
          padding: 2rem;
          width: 100%;
          max-width: 500px;
          text-align: center;
          color: white;
          position: relative;
          z-index: 2;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .name-input-card h2 {
          font-size: 2rem;
          margin-bottom: 1rem;
          background: linear-gradient(90deg, #8B5CF6, #06B6D4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .name-input-card p {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 2rem;
        }

        .name-input {
          width: 100%;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          color: white;
          font-size: 1rem;
          margin-bottom: 1rem;
        }

        .error-message {
          color: #ef4444;
          margin-bottom: 1rem;
        }

        .submit-btn {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(90deg, #8B5CF6, #06B6D4);
          border: none;
          border-radius: 0.5rem;
          color: white;
          font-size: 1rem;
          cursor: pointer;
          transition: transform 0.3s ease;
        }

        .submit-btn:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

export default Research;
