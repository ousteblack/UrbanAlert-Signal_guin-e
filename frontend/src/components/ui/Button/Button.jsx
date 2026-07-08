import "./Button.css";
import { FaSpinner } from "react-icons/fa";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  loading = false,
  fullWidth = false,
  iconLeft = null,
  iconRight = null,
  onClick,
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        btn
        btn-${variant}
        btn-${size}
        ${fullWidth ? "btn-full" : ""}
        ${loading ? "btn-loading" : ""}
      `}
    >
      {loading ? (
        <>
          <FaSpinner className="spinner" />
          Chargement...
        </>
      ) : (
        <>
          {iconLeft && <span className="btn-icon">{iconLeft}</span>}

          <span>{children}</span>

          {iconRight && <span className="btn-icon">{iconRight}</span>}
        </>
      )}
    </button>
  );
}
