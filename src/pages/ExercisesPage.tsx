import "../styles/simple-page.css";

export default function ExercisesPage() {
  return (
    <div className="simple-page">
      <div className="simple-page-container">
        <header className="simple-page-header">
          <h1 className="simple-page-title">Exercises</h1>
          <p className="simple-page-description">
            Browse your exercise library and variants.
          </p>
        </header>

        <div className="simple-page-card">
          <h2 className="simple-page-card-title">Exercise library coming next</h2>
          <p className="simple-page-card-text">
            This page will show your base exercises, machine variants, and the
            relationships between them so you can manage your training setup
            more easily.
          </p>
        </div>
      </div>
    </div>
  );
}