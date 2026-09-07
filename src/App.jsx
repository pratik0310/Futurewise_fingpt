import { useState, useEffect, useRef } from "react";
import stocks from "./data/stocks.json";
import "./App.css";

function App() {
  const [search, setSearch] = useState("");
  const [selectedStock, setSelectedStock] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [portfolio, setPortfolio] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debug: Check stocks
  useEffect(() => {
    console.log("📊 Total stocks loaded:", stocks?.length || 0);
    const nseCount = stocks?.filter(s => s.exchange === "NSE").length || 0;
    const usCount = stocks?.filter(s => s.exchange === "US").length || 0;
    console.log(`   🇮🇳 NSE: ${nseCount}, 🇺🇸 US: ${usCount}`);
    if (stocks && stocks.length > 0) {
      console.log("📌 First 3 stocks:", stocks.slice(0, 3));
    }
  }, []);

  // Search results
  const results = search.trim() === "" ? [] : stocks
    .filter((stock) => {
      const query = search.toLowerCase();
      const name = String(stock.name || "").toLowerCase();
      const symbol = String(stock.symbol || "").toLowerCase();
      return name.includes(query) || symbol.includes(query);
    })
    .slice(0, 15);

  const selectStock = (stock) => {
    setSelectedStock(stock);
    setSearch(stock.name);
    setShowResults(false);
  };

  const addToPortfolio = () => {
    if (!selectedStock) {
      alert("Please select a stock.");
      return;
    }

    const qty = Number(quantity);

    if (!qty || qty <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    const existingStock = portfolio.find(
      (item) => item.symbol === selectedStock.symbol
    );

    if (existingStock) {
      setPortfolio(
        portfolio.map((item) =>
          item.symbol === selectedStock.symbol
            ? { ...item, quantity: item.quantity + qty }
            : item
        )
      );
    } else {
      setPortfolio([
        ...portfolio,
        {
          symbol: selectedStock.symbol,
          name: selectedStock.name,
          exchange: selectedStock.exchange || "NSE",
          quantity: qty,
        },
      ]);
    }

    setQuantity("");
    setSearch("");
    setSelectedStock(null);
    setShowResults(false);
  };

  const removeStock = (symbol) => {
    setPortfolio(portfolio.filter((stock) => stock.symbol !== symbol));
  };

  const totalQuantity = portfolio.reduce(
    (total, stock) => total + stock.quantity,
    0
  );

  const analyzePortfolio = async () => {
    if (portfolio.length === 0) {
      alert("Add at least one stock to your portfolio.");
      return;
    }

    setLoading(true);
    setAnalysis(null);
    
    try {
      const response = await fetch(
        "https://unfunded-proven-caretaker.ngrok-free.dev/analyze-portfolio",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            portfolio: portfolio,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      console.log("FinGPT API response:");
      console.log(data);

      if (!data.success) {
        throw new Error(data.error || "Portfolio analysis failed.");
      }

      setAnalysis(data.results);
    } catch (error) {
      console.error("Portfolio analysis error:", error);
      alert(
        "Could not connect to the FinGPT server. Make sure Colab and ngrok are running."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // PIE CHART COMPONENT (Canvas-based)
  // ============================================================
  const PieChart = ({ data, size = 250 }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !data || data.length === 0) return;

      const ctx = canvas.getContext("2d");
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 10;

      const colors = [
        "#6c63ff",
        "#10b981",
        "#f59e0b",
        "#ef4444",
        "#8b5cf6",
        "#06b6d4",
        "#f472b6",
        "#34d399",
        "#fbbf24",
        "#60a5fa",
      ];

      const total = data.reduce((sum, item) => sum + item.value, 0);

      if (total === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#5a6278";
        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("No data", centerX, centerY + 6);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let startAngle = -Math.PI / 2;

      data.forEach((item, index) => {
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        const color = colors[index % colors.length];

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "#1a1d27";
        ctx.lineWidth = 2;
        ctx.stroke();

        if (sliceAngle > 0.1) {
          const midAngle = startAngle + sliceAngle / 2;
          const labelRadius = radius * 0.65;
          const labelX = centerX + Math.cos(midAngle) * labelRadius;
          const labelY = centerY + Math.sin(midAngle) * labelRadius;

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 11px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          const percentage = ((item.value / total) * 100).toFixed(1);
          const label = `${item.label} (${percentage}%)`;

          ctx.shadowColor = "rgba(0,0,0,0.5)";
          ctx.shadowBlur = 4;
          ctx.fillText(label, labelX, labelY);
          ctx.shadowBlur = 0;
        }

        startAngle += sliceAngle;
      });

      // Donut hole
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.35, 0, 2 * Math.PI);
      ctx.fillStyle = "#1a1d27";
      ctx.fill();
      ctx.strokeStyle = "#2a2d3a";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#e8edf5";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(total, centerX, centerY - 4);
      ctx.fillStyle = "#6a7288";
      ctx.font = "10px sans-serif";
      ctx.fillText("Total", centerX, centerY + 14);
    }, [data, size]);

    return (
      <div className="pie-chart-container">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="pie-chart-canvas"
        />
        <div className="pie-legend">
          {data.map((item, index) => {
            const colors = [
              "#6c63ff",
              "#10b981",
              "#f59e0b",
              "#ef4444",
              "#8b5cf6",
              "#06b6d4",
              "#f472b6",
              "#34d399",
              "#fbbf24",
              "#60a5fa",
            ];
            const total = data.reduce((sum, i) => sum + i.value, 0);
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
            return (
              <div className="legend-item" key={index}>
                <span
                  className="legend-color"
                  style={{ background: colors[index % colors.length] }}
                />
                <span className="legend-label">{item.label}</span>
                <span className="legend-value">
                  {item.value} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const pieData = portfolio.map((stock) => ({
    label: stock.symbol,
    value: stock.quantity,
  }));

  // Helper to parse analysis and separate sections
  const parseAnalysis = (text) => {
    if (!text) return null;

    let cleanText = text.replace(/\[INST\][\s\S]*?\[\/INST\]/g, "").trim();

    const sections = {
      overall: "",
      positive: [],
      concerns: [],
      impact: "",
    };

    const lines = cleanText.split("\n").filter((line) => line.trim());

    let currentSection = "overall";

    for (const line of lines) {
      const lower = line.toLowerCase();

      if (lower.includes("positive") || lower.includes("green") || lower.includes("upside")) {
        currentSection = "positive";
        continue;
      } else if (lower.includes("concern") || lower.includes("red") || lower.includes("risk") || lower.includes("flag")) {
        currentSection = "concerns";
        continue;
      } else if (lower.includes("impact") || lower.includes("verdict") || lower.includes("overall")) {
        currentSection = "impact";
        continue;
      }

      const cleanLine = line.replace(/^\d\.\s*/, "").trim();
      if (cleanLine) {
        if (currentSection === "positive") {
          sections.positive.push(cleanLine);
        } else if (currentSection === "concerns") {
          sections.concerns.push(cleanLine);
        } else if (currentSection === "impact") {
          sections.impact += (sections.impact ? " " : "") + cleanLine;
        } else {
          sections.overall += (sections.overall ? " " : "") + cleanLine;
        }
      }
    }

    return sections;
  };

  // Determine overall sentiment color and label
  const getSentiment = (analysis) => {
    if (!analysis) return { label: "Neutral", color: "#6c63ff", icon: "●" };
    const text = analysis.toLowerCase();
    if (text.includes("bullish") || text.includes("positive")) {
      return { label: "Bullish", color: "#10b981", icon: "▲" };
    } else if (text.includes("bearish") || text.includes("negative")) {
      return { label: "Bearish", color: "#ef4444", icon: "▼" };
    } else {
      return { label: "Neutral", color: "#f59e0b", icon: "●" };
    }
  };

  // Get exchange badge color
  const getExchangeColor = (exchange) => {
    if (exchange === "NSE") return "#6c63ff";
    if (exchange === "US") return "#10b981";
    return "#6c63ff";
  };

  return (
    <div className="app">
      {/* Search Section */}
      <div className="search-container">
        <div className="search-box">
          <span className="search-label">Search Stocks</span>
          <input
            type="text"
            placeholder="Type company name or symbol..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedStock(null);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
          />
        </div>

        {showResults && search && results.length > 0 && (
          <div className="results">
            {results.map((stock) => (
              <div
                className="stock-item"
                key={stock.symbol}
                onClick={() => selectStock(stock)}
              >
                <div className="stock-info">
                  <div className="stock-name">{stock.name}</div>
                  <div className="stock-symbol">{stock.symbol}</div>
                </div>
                <span 
                  className="exchange"
                  style={{
                    background: getExchangeColor(stock.exchange),
                    color: "#fff",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: "bold"
                  }}
                >
                  {stock.exchange || "NSE"}
                </span>
              </div>
            ))}
          </div>
        )}

        {showResults && search && results.length === 0 && (
          <div className="no-results">
            <span className="no-results-query">"{search}"</span>
            <span> did not match any stocks.</span>
            <span className="no-results-hint">
              Try a different company name or symbol.
            </span>
          </div>
        )}
      </div>

      {/* Selected Stock */}
      {selectedStock && (
        <div className="selected-stock">
          <div className="selected-stock-left">
            <h2>{selectedStock.name}</h2>
            <div className="stock-details">
              <p>
                Symbol: <strong>{selectedStock.symbol}</strong>
              </p>
              <p>
                Exchange: <strong>{selectedStock.exchange || "NSE"}</strong>
              </p>
            </div>
          </div>
          <div className="quantity-section">
            <input
              type="number"
              min="1"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <button onClick={addToPortfolio}>Add to Portfolio</button>
          </div>
        </div>
      )}

      {/* Portfolio Section */}
      <div className="portfolio">
        <div className="portfolio-header">
          <div>
            <h1>My Portfolio</h1>
            <p>Manage your stock holdings</p>
          </div>
          <span>{portfolio.length} Stocks</span>
        </div>

        {portfolio.length === 0 ? (
          <div className="empty-portfolio">
            <h3>Your portfolio is empty</h3>
            <p>Search for a stock above and add it to your portfolio.</p>
          </div>
        ) : (
          <div className="portfolio-layout">
            <div className="portfolio-chart">
              <h4>Portfolio Allocation</h4>
              <PieChart data={pieData} size={250} />
            </div>

            <div className="portfolio-list-section">
              <div className="portfolio-summary">
                <div className="summary-card">
                  <span>Total Holdings</span>
                  <strong>{portfolio.length}</strong>
                </div>
                <div className="summary-card">
                  <span>Total Quantity</span>
                  <strong>{totalQuantity}</strong>
                </div>
              </div>

              <div className="portfolio-list">
                {portfolio.map((stock) => {
                  const allocation =
                    totalQuantity > 0
                      ? ((stock.quantity / totalQuantity) * 100).toFixed(1)
                      : "0.0";

                  return (
                    <div className="portfolio-stock" key={stock.symbol}>
                      <div className="portfolio-stock-info">
                        <h3>{stock.symbol}</h3>
                        <p>{stock.name}</p>
                        <span 
                          style={{
                            fontSize: "11px",
                            color: getExchangeColor(stock.exchange),
                            fontWeight: "bold"
                          }}
                        >
                          {stock.exchange || "NSE"}
                        </span>
                      </div>
                      <div className="holding">
                        <span>Quantity</span>
                        <strong>{stock.quantity}</strong>
                      </div>
                      <div className="allocation">
                        <span>Allocation</span>
                        <strong>{allocation}%</strong>
                      </div>
                      <button
                        className="remove"
                        onClick={() => removeStock(stock.symbol)}
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Analyze Button */}
        {portfolio.length > 0 && (
          <button
            className="analyze-button"
            onClick={analyzePortfolio}
            disabled={loading}
          >
            {loading ? "Analyzing Portfolio..." : "Analyze Portfolio"}
          </button>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            <p>Fetching news and analyzing sentiment...</p>
          </div>
        )}

        {/* Analysis Result */}
        {analysis && (
          <div className="analysis-card">
            <div className="analysis-header">
              <div>
                <h2>Portfolio Analysis</h2>
                <p>Recent market news and AI-driven insights</p>
              </div>
              <span>FinGPT</span>
            </div>

            {analysis.map((stock) => {
              const parsed = parseAnalysis(stock.analysis);
              const sentiment = getSentiment(stock.analysis);

              return (
                <div className="stock-analysis" key={stock.symbol}>
                  {/* Header */}
                  <div className="stock-analysis-header">
                    <div>
                      <h3>{stock.symbol}</h3>
                      <p>{stock.company}</p>
                    </div>
                    <div className="analysis-badges">
                      <span className="analysis-quantity">
                        Quantity: {stock.quantity}
                      </span>
                      <span
                        className="sentiment-badge"
                        style={{
                          background: `${sentiment.color}22`,
                          color: sentiment.color,
                          borderColor: sentiment.color,
                        }}
                      >
                        {sentiment.icon} {sentiment.label}
                      </span>
                    </div>
                  </div>

                  {/* News Section */}
                  <div className="news-section">
                    <h4>Recent News</h4>
                    {stock.news && stock.news.length > 0 ? (
                      stock.news.map((article, index) => (
                        <div className="news-item" key={index}>
                          <strong>{article.title}</strong>
                          <small>
                            {article.source} | {article.posted}
                          </small>
                        </div>
                      ))
                    ) : (
                      <p className="no-news">No recent news found.</p>
                    )}
                  </div>

                  {/* Separated Analysis Sections */}
                  <div className="analysis-sections">
                    {/* Positive Developments */}
                    {parsed && parsed.positive.length > 0 && (
                      <div className="analysis-section positive-section">
                        <h4 className="section-title positive-title">
                          Positive Developments
                        </h4>
                        <ul className="section-list">
                          {parsed.positive.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Concerns / Red Flags */}
                    {parsed && parsed.concerns.length > 0 && (
                      <div className="analysis-section concerns-section">
                        <h4 className="section-title concerns-title">
                          Potential Concerns
                        </h4>
                        <ul className="section-list">
                          {parsed.concerns.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Overall Impact */}
                    {parsed && parsed.impact && (
                      <div className="analysis-section impact-section">
                        <h4 className="section-title impact-title">
                          Overall Impact
                        </h4>
                        <p className="impact-text">{parsed.impact}</p>
                      </div>
                    )}

                    {/* Fallback if parsing fails */}
                    {(!parsed || (!parsed.positive.length && !parsed.concerns.length && !parsed.impact)) && (
                      <div className="analysis-section">
                        <div className="analysis-content">
                          {stock.analysis
                            .replace(/\[INST\][\s\S]*?\[\/INST\]/g, "")
                            .trim()
                            .split("\n")
                            .map((line, idx) => (
                              <p key={idx}>{line}</p>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;