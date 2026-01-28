import { useRef } from "preact/hooks";

export default function Video({ src, onEnded }) {
  const ref = useRef(null);

  return (
    <video
      ref={ref}
      src={src}
      controls
      class="w-full max-w-2xl rounded-xl shadow-2xl"
      onEnded={onEnded}
    />
  );
}
