// src/pages/ImportExportPage.tsx

import { useState } from "react";
import PageBackButton from "../components/navigation/PageBackButton";
import { useAppStore } from "../store/useAppStore";
import {
  downloadAppDataAsJson,
  downloadImportTemplateJson,
  parseAppImportPayload,
  type AppImportPayload,
} from "../utils/importExport";
import "../styles/import-export.css";

export default function ImportExportPage() {
  const exercises = useAppStore((state) => state.exercises);
  const routines = useAppStore((state) => state.routines);
  const workoutLogs = useAppStore((state) => state.workoutLogs);
  const preferredWeightUnit = useAppStore((state) => state.preferredWeightUnit);
  const replaceAppData = useAppStore((state) => state.replaceAppData);
  const workoutSessions = useAppStore((state) => state.workoutSessions);
  const activeWorkoutSession = useAppStore(
    (state) => state.activeWorkoutSession,
  );

  const [importMessage, setImportMessage] = useState<string>("");
  const [generalMessage, setGeneralMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);
  const [pendingImport, setPendingImport] = useState<AppImportPayload["data"] | null>(null);

  async function handleImportFile(
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setImportMessage("");
    setGeneralMessage("");
    setError("");
    setPendingImport(null);
    setIsImporting(true);

    try {
      const raw = await file.text();
      const payload = parseAppImportPayload(raw);

      setImportMessage(
        `Ready to restore: ${payload.data.routines.length} routines, ${payload.data.exercises.length} exercises, ${payload.data.workoutSessions.length} sessions.`,
      );
      setPendingImport(payload.data);
    } catch (importError) {
      const nextError =
        importError instanceof Error
          ? importError.message
          : "Failed to import file.";

      setError(nextError);
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  }

  function handleConfirmImport(): void {
    if (!pendingImport) {
      return;
    }

    replaceAppData({
      ...pendingImport,
      preferredWeightUnit: pendingImport.preferredWeightUnit ?? "kg",
    });

    setGeneralMessage(
      `Import successful: ${pendingImport.routines.length} routines, ${pendingImport.exercises.length} exercises, ${pendingImport.workoutSessions.length} sessions restored.`,
    );
    setImportMessage("");
    setPendingImport(null);
  }

  function handleCancelImport(): void {
    setPendingImport(null);
    setImportMessage("");
  }

  function handleExport(): void {
    setImportMessage("");
    setGeneralMessage("");
    setError("");

    downloadAppDataAsJson({
      version: 4,
      data: {
        exercises,
        routines,
        workoutLogs,
        workoutSessions,
        activeWorkoutSession,
        preferredWeightUnit,
      },
    });

    setGeneralMessage("Export created successfully.");
  }

  function handleDownloadTemplate(): void {
    setImportMessage("");
    setGeneralMessage("");
    setError("");

    downloadImportTemplateJson();
    setGeneralMessage("Import template downloaded.");
  }

  return (
    <div className="import-export-page">
      <PageBackButton fallbackTo="/" />

      <header className="import-export-page-header">
        <p className="import-export-eyebrow">Data settings</p>
        <h1>Data &amp; backup</h1>
        <p>Keep a backup of your training data or restore a saved setup.</p>
      </header>

      <section className="import-export-overview" aria-label="Current data">
        <div><strong>{routines.length}</strong><span>Routines</span></div>
        <div><strong>{exercises.length}</strong><span>Exercises</span></div>
        <div><strong>{workoutSessions.length}</strong><span>Sessions</span></div>
      </section>

      <section className="import-export-card">
        <p className="import-export-card-eyebrow">Backup</p>
        <h2>Create a backup</h2>
        <p>Download all routines, exercises, and workout history as a JSON file.</p>

        <button
          type="button"
          className="import-export-button"
          onClick={handleExport}
        >
          Export JSON
        </button>
      </section>

      <section className="import-export-card">
        <p className="import-export-card-eyebrow">Restore</p>
        <h2>Restore from a backup</h2>
        <p>This replaces the local data on this device. You will review the file before anything changes.</p>

        <label className="import-export-file-label">
          <span>{isImporting ? "Checking file..." : "Choose JSON file"}</span>
          <input
            type="file"
            accept="application/json"
            onChange={handleImportFile}
            disabled={isImporting}
          />
        </label>

        {importMessage ? (
          <p className="import-export-message success import-export-message-inline" role="status">
            {importMessage}
          </p>
        ) : null}

        {pendingImport ? (
          <div className="import-export-import-preview" role="alert">
            <p className="import-export-import-preview-title">Ready to replace your local data</p>
            <dl>
              <div><dt>Routines</dt><dd>{pendingImport.routines.length}</dd></div>
              <div><dt>Exercises</dt><dd>{pendingImport.exercises.length}</dd></div>
              <div><dt>Sessions</dt><dd>{pendingImport.workoutSessions.length}</dd></div>
            </dl>
            <div className="import-export-import-preview-actions">
              <button type="button" className="import-export-button import-export-button-secondary" onClick={handleCancelImport}>Cancel</button>
              <button type="button" className="import-export-button import-export-button-danger" onClick={handleConfirmImport}>Replace local data</button>
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="import-export-message error import-export-message-inline" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      <section className="import-export-card">
        <p className="import-export-card-eyebrow">Template</p>
        <h2>JSON template &amp; help</h2>
        <p>
          Download the exact JSON shape this app expects. You can give this
          template to ChatGPT and ask it to fill it with your routines,
          exercises, and logs.
        </p>

        <button
          type="button"
          className="import-export-button import-export-button-template"
          onClick={handleDownloadTemplate}
        >
          Download template
        </button>

        <div className="import-export-help">
          <p className="import-export-help-title">What the import expects</p>
          <ul className="import-export-help-list">
            <li>
              You can leave history fields empty if you only want to import your
              setup.
            </li>
            <li>Store all weights in kg.</li>
            <li>
              PreferredWeightUnit is optional. If omitted, the app uses kg.
            </li>
            <li>
              Each exercise uses primaryMuscle (single value, e.g. "chest") and
              an optional secondaryMuscleGroups list.
            </li>
            <li>Linked ids must match existing exercises and routines.</li>
          </ul>
        </div>
      </section>

      {generalMessage ? (
        <p className="import-export-message success" role="status">{generalMessage}</p>
      ) : null}
    </div>
  );
}
