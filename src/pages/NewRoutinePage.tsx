import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { generateId } from "../utils/ids";
import type { Routine } from "../types/routine";
import PageBackButton from "../components/navigation/PageBackButton";
import "../styles/routine-form.css";

export default function NewRoutinePage() {
  const navigate = useNavigate();
  const addRoutine = useAppStore((state) => state.addRoutine);

  const [name, setName] = useState("");
  const [dayType, setDayType] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      alert("Routine name is required.");
      return;
    }

    const now = new Date().toISOString();

    const newRoutine: Routine = {
      id: generateId(),
      name: trimmedName,
      dayType: dayType.trim() || undefined,
      description: description.trim() || undefined,
      exerciseRefs: [],
      createdAt: now,
      updatedAt: now,
    };

    addRoutine(newRoutine);
    navigate("/routines");
  }

  return (
    <div className="routine-form-page">
      <div className="routine-form-container">
        <div className="routine-form-card">
          <div className="routine-form-back-row">
            <PageBackButton fallbackTo="/routines" />
          </div>
          <h1 className="routine-form-title">New routine</h1>
          <p className="routine-form-subtitle">
            Create a routine with basic info first. You can add exercises next.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="routine-form-card">
            <h2 className="routine-form-section-title">Routine details</h2>

            <div className="routine-form-field">
              <label className="routine-form-label" htmlFor="routine-name">
                Name
              </label>
              <input
                id="routine-name"
                className="routine-form-input"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Push C"
              />
            </div>

            <div className="routine-form-field">
              <label className="routine-form-label" htmlFor="routine-day-type">
                Day type
              </label>
              <input
                id="routine-day-type"
                className="routine-form-input"
                type="text"
                value={dayType}
                onChange={(event) => setDayType(event.target.value)}
                placeholder="Push"
              />
            </div>

            <div className="routine-form-field">
              <label
                className="routine-form-label"
                htmlFor="routine-description"
              >
                Description
              </label>
              <textarea
                id="routine-description"
                className="routine-form-textarea"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Optional description..."
              />
            </div>

            <div className="routine-form-actions">
              <button
                type="submit"
                className="routine-form-btn routine-form-btn-primary"
              >
                Create routine
              </button>

              <button
                type="button"
                className="routine-form-btn routine-form-btn-secondary"
                onClick={() => navigate("/routines")}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
