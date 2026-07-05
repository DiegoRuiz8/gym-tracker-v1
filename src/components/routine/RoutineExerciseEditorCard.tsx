// src/components/routine/RoutineExerciseEditorCard.tsx

import { useState } from "react";
import type { RoutineExerciseRef } from "../../types/routine";

type PrescriptionDraft = {
  sets: string;
  repMin: string;
  repMax: string;
  targetRIR: string;
  restSeconds: string;
  notes: string;
};

type Props = {
  exerciseRef: RoutineExerciseRef;
  exerciseName: string;
  draft: PrescriptionDraft;
  error?: string;
  success?: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: (exerciseRefId: string) => void;
  onMoveDown: (exerciseRefId: string) => void;
  onDraftChange: (
    exerciseRefId: string,
    field: keyof PrescriptionDraft,
    value: string,
  ) => void;
  onSave: (exerciseRefId: string) => void;
  onRemove: (exerciseRefId: string) => void;
};

export default function RoutineExerciseEditorCard({
  exerciseRef,
  exerciseName,
  draft,
  error,
  success,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onDraftChange,
  onSave,
  onRemove,
}: Props) {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showNotes, setShowNotes] = useState(Boolean(draft.notes.trim()));

  return (
    <div className="routine-form-list-item">
      <div className="routine-form-list-item-content">
        <div className="routine-form-list-item-header">
          <div className="routine-form-list-item-title-wrap">
            <h3 className="routine-form-list-item-title">{exerciseName}</h3>
          </div>

          <div className="routine-form-list-item-order-actions">
            <button
              type="button"
              className="routine-form-btn-icon routine-form-btn-icon-subtle"
              onClick={() => {
                if (canMoveUp) {
                  onMoveUp(exerciseRef.id);
                }
              }}
              aria-label={`Move ${exerciseName} up`}
              title="Move up"
            >
              ↑
            </button>

            <button
              type="button"
              className="routine-form-btn-icon routine-form-btn-icon-subtle"
              onClick={() => {
                if (canMoveDown) {
                  onMoveDown(exerciseRef.id);
                }
              }}
              aria-label={`Move ${exerciseName} down`}
              title="Move down"
            >
              ↓
            </button>
          </div>
        </div>

        {showRemoveConfirm && (
          <div className="routine-form-inline-confirm">
            <p className="routine-form-inline-confirm-title">
              Remove exercise from routine?
            </p>
            <p className="routine-form-inline-confirm-text">
              Remove <strong>{exerciseName}</strong> from this routine? Existing
              workout logs will stay.
            </p>

            <div className="routine-form-inline-confirm-actions">
              <button
                type="button"
                className="routine-form-btn routine-form-btn-danger"
                onClick={() => onRemove(exerciseRef.id)}
              >
                Confirm remove
              </button>

              <button
                type="button"
                className="routine-form-btn routine-form-btn-secondary"
                onClick={() => setShowRemoveConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="routine-form-prescription-stack">
          <div className="routine-form-prescription-field">
            <label className="routine-form-prescription-label">Sets</label>
            <input
              className="routine-form-prescription-input"
              type="number"
              min="0"
              value={draft.sets}
              onChange={(event) =>
                onDraftChange(exerciseRef.id, "sets", event.target.value)
              }
            />
          </div>

          <div className="routine-form-prescription-row">
            <div className="routine-form-prescription-field">
              <label className="routine-form-prescription-label">Min reps</label>
              <input
                className="routine-form-prescription-input"
                type="number"
                min="0"
                value={draft.repMin}
                onChange={(event) =>
                  onDraftChange(exerciseRef.id, "repMin", event.target.value)
                }
              />
            </div>

            <div className="routine-form-prescription-field">
              <label className="routine-form-prescription-label">Max reps</label>
              <input
                className="routine-form-prescription-input"
                type="number"
                min="0"
                value={draft.repMax}
                onChange={(event) =>
                  onDraftChange(exerciseRef.id, "repMax", event.target.value)
                }
              />
            </div>
          </div>

          <div className="routine-form-prescription-row">
            <div className="routine-form-prescription-field">
              <label className="routine-form-prescription-label">RIR</label>
              <input
                className="routine-form-prescription-input"
                type="number"
                min="0"
                value={draft.targetRIR}
                onChange={(event) =>
                  onDraftChange(exerciseRef.id, "targetRIR", event.target.value)
                }
              />
            </div>

            <div className="routine-form-prescription-field">
              <label className="routine-form-prescription-label">Rest (s)</label>
              <input
                className="routine-form-prescription-input"
                type="number"
                min="0"
                value={draft.restSeconds}
                onChange={(event) =>
                  onDraftChange(exerciseRef.id, "restSeconds", event.target.value)
                }
              />
            </div>
          </div>
        </div>

        <div className="routine-form-notes-toggle-row">
          <button
            type="button"
            className="routine-form-notes-toggle"
            onClick={() => setShowNotes((current) => !current)}
          >
            {showNotes ? "Hide notes" : "Add notes"}
          </button>
        </div>

        {showNotes && (
          <div className="routine-form-prescription-notes routine-form-prescription-notes-compact">
            <label className="routine-form-prescription-label">Notes</label>
            <textarea
              className="routine-form-textarea routine-form-textarea-compact"
              value={draft.notes}
              onChange={(event) =>
                onDraftChange(exerciseRef.id, "notes", event.target.value)
              }
              placeholder="Optional exercise notes..."
            />
          </div>
        )}

        {error && <p className="routine-form-prescription-error">{error}</p>}

        <div className="routine-form-list-item-footer">
          <button
            type="button"
            className="routine-form-btn routine-form-btn-primary"
            onClick={() => onSave(exerciseRef.id)}
          >
            Save target
          </button>

          <button
            type="button"
            className="routine-form-btn routine-form-btn-danger-soft"
            onClick={() => setShowRemoveConfirm(true)}
          >
            Remove
          </button>
        </div>

        {success && (
          <p className="routine-form-prescription-success routine-form-prescription-success-footer">
            Target saved
          </p>
        )}
      </div>
    </div>
  );
}