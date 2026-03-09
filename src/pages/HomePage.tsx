import "../styles/simple-page.css";

export default function HomePage() {
  return (
    <div className="simple-page">
      <div className="simple-page-container">
        <header className="simple-page-header">
          <h1 className="simple-page-title">Gym Tracker</h1>
          <p className="simple-page-description">
            Track routines, sets, reps, and progress in one place.
          </p>
        </header>

        <div className="simple-page-card">
          <h2 className="simple-page-card-title">Welcome back</h2>
          <p className="simple-page-card-text">
            Start from your routines to record sets, compare your latest
            performance, and review progress over time.
          </p>
        </div>
      </div>
    </div>
  );
}