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
  className = "",
}) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-primary hover:bg-primary-dark text-white shadow-md hover:shadow-lg focus:ring-primary-light",
    secondary:
      "bg-surface text-primary border border-gray-200 hover:border-primary hover:bg-gray-50 focus:ring-primary-light shadow-sm",
    accent:
      "bg-accent hover:bg-accent-hover text-white shadow-md hover:shadow-lg focus:ring-accent",
    danger:
      "bg-danger hover:bg-red-600 text-white shadow-md hover:shadow-lg focus:ring-red-400",
    ghost: "bg-transparent hover:bg-gray-100 text-text-main",
  };

  const sizes = {
    sm: "py-1.5 px-3 text-sm",
    md: "py-2.5 px-5 text-base",
    lg: "py-3 px-6 text-lg",
  };

  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${
    fullWidth ? "w-full" : ""
  } ${className}`;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={classes}
    >
      {loading ? (
        <>
          <FaSpinner className="animate-spin mr-2" />
          Chargement...
        </>
      ) : (
        <>
          {iconLeft && <span className="mr-2">{iconLeft}</span>}
          <span>{children}</span>
          {iconRight && <span className="ml-2">{iconRight}</span>}
        </>
      )}
    </button>
  );
}
