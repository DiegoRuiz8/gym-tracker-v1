import { useLocation, useNavigate } from "react-router-dom";

type Props = {
  fallbackTo: string;
  label?: string;
};

export default function PageBackButton({
  fallbackTo,
  label = "Back",
}: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const returnTo =
    (location.state as { returnTo?: string } | null)?.returnTo ?? fallbackTo;

  function handleBack() {
    navigate(returnTo);
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