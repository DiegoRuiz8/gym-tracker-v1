import { useState } from "react";
import PageBackButton from "../components/navigation/PageBackButton";
import { useAppStore } from "../store/useAppStore";
import {
  downloadAppDataAsJson,
  downloadImportTemplateJson,
  parseAppImportPayload,
} from "../utils/importExport";
import "../styles/import-export.css";

export default function ImportExportPage() {
  const exercises = useAppStore((state) => state.exercises);
  const exerciseVariants = useAppStore((state) => state.exerciseVariants);
  const routines = useAppStore((state) => state.routines);
  const workoutLogs = useAppStore((state) => state.workoutLogs);
  const preferredWeightUnit = useAppStore((state) => state.preferredWeightUnit);
  const replaceAppData = useAppStore((state) => state.replaceAppData);

  const [importMessage, setImportMessage] = useState<string>("");
  const [generalMessage, setGeneralMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);

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
    setIsImporting(true);

    try {
      const raw = await file.text();
      const payload = parseAppImportPayload(raw);

      replaceAppData({
        ...payload.data,
        workoutSessions: [],
        activeWorkoutSession: null,
        preferredWeightUnit: payload.data.preferredWeightUnit ?? "kg",
      });

      setImportMessage(
        `Import successful: ${payload.data.routines.length} routines, ${payload.data.exercises.length} exercises, ${payload.data.exerciseVariants.length} variants, ${payload.data.workoutLogs.length} logs.`,
      );
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

  function handleExport(): void {
    setImportMessage("");
    setGeneralMessage("");
    setError("");

    downloadAppDataAsJson({
      version: 2,
      data: {
        exercises,
        exerciseVariants,
        routines,
        workoutLogs,
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
        <h1>Import / Export</h1>
        <p>Import a full app JSON or export your current data.</p>
      </header>

      <section className="import-export-card">
        <h2>Import data</h2>
        <p>
          This replaces your current local data on this device with the selected
          file.
        </p>

        <label className="import-export-file-label">
          <span>{isImporting ? "Importing..." : "Choose JSON file"}</span>
          <input
            type="file"
            accept="application/json"
            onChange={handleImportFile}
            disabled={isImporting}
          />
        </label>

        {importMessage ? (
          <p className="import-export-message success import-export-message-inline">
            {importMessage}
          </p>
        ) : null}

        {error ? (
          <p className="import-export-message error import-export-message-inline">
            {error}
          </p>
        ) : null}
      </section>

      <section className="import-export-card">
        <h2>Export data</h2>
        <p>Download your current app data as a JSON file.</p>

        <button
          type="button"
          className="import-export-button"
          onClick={handleExport}
        >
          Export JSON
        </button>
      </section>

      <section className="import-export-card">
        <h2>JSON template</h2>
        <p>
          Download the exact JSON shape this app expects. You can give this
          template to ChatGPT and ask it to fill it with your routines,
          exercises, variants, and logs.
        </p>

        <button
          type="button"
          className="import-export-button import-export-button-secondary"
          onClick={handleDownloadTemplate}
        >
          Download template
        </button>

        <div className="import-export-help">
          <p className="import-export-help-title">What the import expects</p>
          <ul className="import-export-help-list">
            <li>Store all weights in kg.</li>
            <li>
              Linked ids must match existing exercises, variants, and routines.
            </li>
            <li>
              `preferredWeightUnit` is optional. If omitted, the app uses kg.
            </li>
          </ul>
        </div>
      </section>

      {generalMessage ? (
        <p className="import-export-message success">{generalMessage}</p>
      ) : null}
    </div>
  );
}
