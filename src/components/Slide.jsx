export default function Slide({ bg, children }) {
  const style = bg ? { backgroundImage: `url(${bg})` } : {};

  return (
    <div class="slide" style={style}>
      {bg && <div class="slide-overlay" />}
      <div class="slide-content">{children}</div>
    </div>
  );
}
