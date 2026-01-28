export default function Button({ large, children, ...props }) {
  return (
    <button class={`btn ${large ? "btn-large" : ""}`} {...props}>
      {children}
    </button>
  );
}
