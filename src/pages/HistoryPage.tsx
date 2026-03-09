import "../styles/simple-page.css";

export default function HistoryPage() {
  return (
    <div className="simple-page">
      <div className="simple-page-container">
        <header className="simple-page-header">
          <h1 className="simple-page-title">History</h1>
          <p className="simple-page-description">
            Review previous logs and progress across sessions.
          </p>
        </header>

        <div className="simple-page-card">
          <h2 className="simple-page-card-title">Variant history is now available</h2>
          <p className="simple-page-card-text">
            Open a routine and use “View history” on any exercise card to inspect
            all previous logs for that specific variant.
          </p>
        </div>
      </div>
    </div>
  );
}