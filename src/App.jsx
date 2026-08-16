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

  /*
   * Search stocks
   */
  const results =
    search.trim() === ""
      ? []
      : stocks
          .filter((stock) => {
            const query = search.toLowerCase();

            return (
              String(stock.name || "")
                .toLowerCase()
                .includes(query) ||
              String(stock.symbol || "")
                .toLowerCase()
                .includes(query)
            );
          })
          .slice(0, 10);

  /*
   * Select stock
   */
  const selectStock = (stock) => {
    setSelectedStock(stock);
    setSearch(stock.name);
  };

  /*
   * Add stock to portfolio
   */
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
          quantity: qty,
        },
      ]);
    }

    setQuantity("");
    setSearch("");
    setSelectedStock(null);
  };

  /*
   * Remove stock
   */
  const removeStock = (symbol) => {
    setPortfolio(
      portfolio.filter(
        (stock) => stock.symbol !== symbol
      )
    );
  };

  /*
   * Total quantity
   *
   * NOTE:
   * This is only a temporary allocation calculation.
   *
   * Later we should calculate allocation using
   * actual stock market value:
   *
   * quantity × current price
   */
  const totalQuantity = portfolio.reduce(
    (total, stock) => total + stock.quantity,
    0
  );

  /*
   * Analyze portfolio using FinGPT backend
   *
   * IMPORTANT:
   * Replace the URL below with your current
   * ngrok URL.
   */
  const analyzePortfolio = async () => {
    if (portfolio.length === 0) {
      alert("Add at least one stock to your portfolio.");
      return;
    }

    setLoading(true);
    setAnalysis(null);

    try {
      const response = await fetch(
        "https://unfunded-proven-caretaker.ngrok-free.dev/analyze-portfolio ",
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
        throw new Error(
          `API request failed: ${response.status}`
        );
      }

      const data = await response.json();

      console.log("FinGPT API response:");
      console.log(data);

      if (!data.success) {
        throw new Error(
          data.error || "Portfolio analysis failed."
        );
      }

      setAnalysis(data.results);

    } catch (error) {
      console.error(
        "Portfolio analysis error:",
        error
      );

      alert(
        "Could not connect to the FinGPT server. Make sure Colab and ngrok are running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">

      {/* =========================
          SEARCH
      ========================== */}

      <div className="search-container">

        <div className="search-box">

          <span className="search-label">
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
                onClick={() =>
                  selectStock(stock)
                }
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


        {search &&
          results.length === 0 && (

            <div className="no-results">
              No stocks found
            </div>

          )}

      </div>


      {/* =========================
          SELECTED STOCK
      ========================== */}

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

            <button
              onClick={addToPortfolio}
            >
              Add to Portfolio
            </button>

          </div>

        </div>

      )}


      {/* =========================
          PORTFOLIO
      ========================== */}

      <div className="portfolio">

        <div className="portfolio-header">

          <div>

            <h1>
              My Portfolio
            </h1>

            <p>
              Manage your stock holdings
            </p>

          </div>

          <span>
            {portfolio.length} Stocks
          </span>

        </div>


        {/* Empty portfolio */}

        {portfolio.length === 0 ? (

          <div className="empty-portfolio">

            <h3>
              Your portfolio is empty
            </h3>

            <p>
              Search for a stock above and add
              it to your portfolio.
            </p>

          </div>

        ) : (

          <>

            {/* Portfolio summary */}

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


            {/* Portfolio stocks */}

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
                        removeStock(
                          stock.symbol
                        )
                      }
                    >
                      Remove
                    </button>

                  </div>

                );
              })}

            </div>


            {/* =========================
                ANALYZE PORTFOLIO
            ========================== */}

            <button
              className="analyze-button"
              onClick={analyzePortfolio}
              disabled={loading}
            >

              {loading
                ? "Analyzing Portfolio..."
                : "Analyze Portfolio"}

            </button>


            {/* =========================
                ANALYSIS RESULT
            ========================== */}

            {analysis && (

              <div className="analysis-card">

                <div className="analysis-header">

                  <div>

                    <h2>
                      Portfolio Analysis
                    </h2>

                    <p>
                      Recent market news and
                      FinGPT analysis
                    </p>

                  </div>

                  <span>
                    FinGPT
                  </span>

                </div>


                {analysis.map((stock) => (

                  <div
                    className="stock-analysis"
                    key={stock.symbol}
                  >

                    {/* Stock header */}

                    <div className="stock-analysis-header">

                      <div>

                        <h3>
                          {stock.symbol}
                        </h3>

                        <p>
                          {stock.company}
                        </p>

                      </div>

                      <span>
                        Quantity: {stock.quantity}
                      </span>

                    </div>


                    {/* News */}

                    <div className="news-section">

                      <h4>
                        Recent News
                      </h4>


                      {stock.news &&
                      stock.news.length > 0 ? (

                        stock.news.map(
                          (article, index) => (

                            <div
                              className="news-item"
                              key={index}
                            >

                              <strong>
                                {article.title}
                              </strong>

                              <small>
                                {article.source}
                                {" | "}
                                {article.posted}
                              </small>

                            </div>

                          )
                        )

                      ) : (

                        <p className="no-news">
                          No recent news found.
                        </p>

                      )}

                    </div>


                    {/* FinGPT */}

                    <div className="fingpt-analysis">

                      <h4>
                        FinGPT Analysis
                      </h4>

                      <pre>
                        {stock.analysis}
                      </pre>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </>

        )}

      </div>

    </div>
  );
}

export default App;