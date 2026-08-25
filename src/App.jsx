import { useState } from "react";
import stocks from "./data/stocks.json";
import "./App.css";

function App() {
  const [search, setSearch] = useState("");
  const [selectedStock, setSelectedStock] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [portfolio, setPortfolio] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const results =
    search.trim() === ""
      ? []
      : stocks
          .filter((stock) => {
            const query = search.toLowerCase();
            return (
              String(stock.name || "").toLowerCase().includes(query) ||
              String(stock.symbol || "").toLowerCase().includes(query)
            );
          })
          .slice(0, 10);

  const selectStock = (stock) => {
    setSelectedStock(stock);
    setSearch(stock.name);
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
          quantity: qty,
        },
      ]);
    }

    setQuantity("");
    setSearch("");
    setSelectedStock(null);
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
            }}
          />
        </div>

        {results.length > 0 && (
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
                <span className="exchange">NSE</span>
              </div>
            ))}
          </div>
        )}

        {search && results.length === 0 && (
          <div className="no-results">
            <span className="no-results-query">"{search}"</span>
            <span> did not match any stocks.</span>
            <span className="no-results-hint">Try a different company name or symbol.</span>
          </div>
        )}
      </div>

      {/* Selected Stock */}
      {selectedStock && (
        <div className="selected-stock">
          <h2>{selectedStock.name}</h2>
          <div className="stock-details">
            <p>
              Symbol: <strong>{selectedStock.symbol}</strong>
            </p>
            <p>
              Exchange: <strong>NSE</strong>
            </p>
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

      {/* Portfolio */}
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
          <>
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
                    ? ((stock.quantity / totalQuantity) * 100).toFixed(2)
                    : "0.00";

                return (
                  <div className="portfolio-stock" key={stock.symbol}>
                    <div className="portfolio-stock-info">
                      <h3>{stock.symbol}</h3>
                      <p>{stock.name}</p>
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

            <button
              className="analyze-button"
              onClick={analyzePortfolio}
              disabled={loading}
            >
              {loading ? "Analyzing Portfolio..." : "Analyze Portfolio"}
            </button>

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
                  let cleanAnalysis = stock.analysis || "No analysis available.";

                  cleanAnalysis = cleanAnalysis
                    .replace(/\[INST\][\s\S]*?\[\/INST\]/g, "")
                    .trim();

                  return (
                    <div className="stock-analysis" key={stock.symbol}>
                      <div className="stock-analysis-header">
                        <div>
                          <h3>{stock.symbol}</h3>
                          <p>{stock.company}</p>
                        </div>
                        <span>Quantity: {stock.quantity}</span>
                      </div>

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

                      <div className="fingpt-analysis">
                        <h4>AI Analysis</h4>
                        <div className="analysis-content">
                          {cleanAnalysis.split("\n").map((line, idx) => (
                            <p key={idx}>{line}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;