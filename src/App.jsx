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

  // Search stocks
  const results =
    search.trim() === ""
      ? []
      : stocks
          .filter((stock) => {
            const query = search.toLowerCase();

            return (
              stock.name.toLowerCase().includes(query) ||
              stock.symbol.toLowerCase().includes(query)
            );
          })
          .slice(0, 10);

  // Select stock from search results
  const selectStock = (stock) => {
    setSelectedStock(stock);
    setSearch(stock.name);
  };

  // Add stock to portfolio
  const addToPortfolio = () => {
    if (!selectedStock) {
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
            ? {
                ...item,
                quantity: item.quantity + qty,
              }
            : item
        )
      );
    } else {
      setPortfolio([
        ...portfolio,
        {
          symbol: selectedStock.symbol,
          name: selectedStock.name,
          exchange: selectedStock.exchange,
          yahooSymbol: selectedStock.yahooSymbol,
          quantity: qty,
        },
      ]);
    }

    setQuantity("");
    setSearch("");
    setSelectedStock(null);
  };

  // Remove stock
  const removeStock = (symbol) => {
    setPortfolio(
      portfolio.filter((stock) => stock.symbol !== symbol)
    );
  };

  // Total quantity
  const totalQuantity = portfolio.reduce(
    (total, stock) => total + stock.quantity,
    0
  );

  /*
    FINGPT ANALYSIS

    Replace this URL with your actual ngrok URL.

    Example:

    https://abc123.ngrok-free.app/analyze
  */

  const analyzePortfolio = async () => {
    if (portfolio.length === 0) {
      alert("Add at least one stock to your portfolio.");
      return;
    }

    setLoading(true);
    setAnalysis(null);

    try {
      /*
        Temporary test news.

        We are using this only to test:
        React -> ngrok -> Flask -> FinGPT

        Later we will replace this with your
        real news-fetching code.
      */

      const stock = portfolio[0];

      const news = `
        ${stock.name} reported strong quarterly results.
        Revenue increased compared with the previous year.
        The company announced new business contracts
        and highlighted strong demand for artificial
        intelligence and cloud services.
      `;

      const response = await fetch(
        "https://unfunded-proven-caretaker.ngrok-free.dev/analyze",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            company: stock.name,
            news: news,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status}`
        );
      }

      const data = await response.json();

      console.log("FinGPT response:", data);

      setAnalysis(data.analysis);
    } catch (error) {
      console.error("FinGPT error:", error);

      alert(
        "Could not connect to the FinGPT server. Make sure your Colab server and ngrok tunnel are running."
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

          <span className="search-icon">
            Search
          </span>

          <input
            type="text"
            placeholder="Search stocks..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedStock(null);
            }}
          />

        </div>

        {/* Search Results */}

        {results.length > 0 && (

          <div className="results">

            {results.map((stock) => (

              <div
                className="stock-item"
                key={stock.symbol}
                onClick={() => selectStock(stock)}
              >

                <div className="stock-info">

                  <div className="stock-name">
                    {stock.name}
                  </div>

                  <div className="stock-symbol">
                    {stock.symbol}
                  </div>

                </div>

                <span className="exchange">
                  NSE
                </span>

              </div>

            ))}

          </div>

        )}

        {search && results.length === 0 && (

          <div className="no-results">
            No stocks found
          </div>

        )}

      </div>


      {/* Selected Stock */}

      {selectedStock && (

        <div className="selected-stock">

          <h2>
            {selectedStock.name}
          </h2>

          <div className="stock-details">

            <p>
              Symbol:
              <strong>
                {selectedStock.symbol}
              </strong>
            </p>

            <p>
              Exchange:
              <strong>
                NSE
              </strong>
            </p>

          </div>

          <div className="quantity-section">

            <input
              type="number"
              min="1"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) =>
                setQuantity(e.target.value)
              }
            />

            <button onClick={addToPortfolio}>
              Add to Portfolio
            </button>

          </div>

        </div>

      )}


      {/* Portfolio */}

      <div className="portfolio">

        <div className="portfolio-header">

          <div>
            <h1>My Portfolio</h1>

            <p>
              Manage your stock holdings
            </p>
          </div>

          <span>
            {portfolio.length} Stocks
          </span>

        </div>


        {portfolio.length === 0 ? (

          <div className="empty-portfolio">

            <h3>
              Your portfolio is empty
            </h3>

            <p>
              Search for a stock above and add it
              to your portfolio.
            </p>

          </div>

        ) : (

          <>

            {/* Portfolio Summary */}

            <div className="portfolio-summary">

              <div className="summary-card">

                <span>
                  Total Holdings
                </span>

                <strong>
                  {portfolio.length}
                </strong>

              </div>

              <div className="summary-card">

                <span>
                  Total Quantity
                </span>

                <strong>
                  {totalQuantity}
                </strong>

              </div>

            </div>


            {/* Portfolio Stocks */}

            <div className="portfolio-list">

              {portfolio.map((stock) => {

                const allocation =
                  totalQuantity > 0
                    ? (
                        (stock.quantity /
                          totalQuantity) *
                        100
                      ).toFixed(2)
                    : "0.00";

                return (

                  <div
                    className="portfolio-stock"
                    key={stock.symbol}
                  >

                    <div className="portfolio-stock-info">

                      <h3>
                        {stock.symbol}
                      </h3>

                      <p>
                        {stock.name}
                      </p>

                    </div>

                    <div className="holding">

                      <span>
                        Quantity
                      </span>

                      <strong>
                        {stock.quantity}
                      </strong>

                    </div>

                    <div className="allocation">

                      <span>
                        Allocation
                      </span>

                      <strong>
                        {allocation}%
                      </strong>

                    </div>

                    <button
                      className="remove"
                      onClick={() =>
                        removeStock(stock.symbol)
                      }
                    >
                      Remove
                    </button>

                  </div>

                );

              })}

            </div>


            {/* Analyze Portfolio */}

            <button
              className="analyze-button"
              onClick={analyzePortfolio}
              disabled={loading}
            >
              {loading
                ? "Analyzing Portfolio..."
                : "Analyze Portfolio"}
            </button>


            {/* FinGPT Result */}

            {analysis && (

              <div className="analysis-card">

                <div className="analysis-header">

                  <h2>
                    Portfolio Analysis
                  </h2>

                  <span>
                    FinGPT
                  </span>

                </div>

                <div className="analysis-content">

                  <pre>
                    {analysis}
                  </pre>

                </div>

              </div>

            )}

          </>

        )}

      </div>

    </div>
  );
}

export default App;