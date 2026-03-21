import { useLocation, useNavigate } from "react-router-dom";

type Props = {
  fallbackTo: string;
  label?: string;
};

type BackLocationState = {
  returnTo?: string;
  restoreDetailScroll?: boolean;
};

export default function PageBackButton({
  fallbackTo,
  label = "Back",
}: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const state = (location.state as BackLocationState | null) ?? null;

  const returnTo = state?.returnTo ?? fallbackTo;
  const restoreDetailScroll = state?.restoreDetailScroll ?? false;

  function handleBack() {
    navigate(returnTo, {
      state: restoreDetailScroll ? { restoreDetailScroll: true } : undefined,
    });
  }

  return (
    <button
      type="button"
      className="page-back-button"
      onClick={handleBack}
      aria-label={label}
    >
      <span className="page-back-button-arrow" aria-hidden="true">
        ←
      </span>
      <span>{label}</span>
    </button>
  );
}