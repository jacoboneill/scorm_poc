import { Slide, Video, Button, useModule } from "../components";

export default function VideoSlide({ src }) {
  const { next, markMediaComplete, mediaComplete } = useModule();
  const mediaId = "video-1";
  const watched = mediaComplete[mediaId];

  return (
    <Slide bg="./bg.png">
      <h2 class="text-2xl font-bold">Watch the Training Video</h2>
      <Video src={src} onEnded={() => markMediaComplete(mediaId)} />
      <Button onClick={next} disabled={!watched}>
        {watched ? "Continue" : "Watch the video to continue"}
      </Button>
    </Slide>
  );
}
