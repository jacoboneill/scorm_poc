import { useRef } from "preact/hooks";

export default function Video({ src, onEnded }) {
  const ref = useRef(null);

  return (
    <video
      ref={ref}
      src={src}
      controls
      class="video-player"
      onEnded={onEnded}
    />
  );
}
