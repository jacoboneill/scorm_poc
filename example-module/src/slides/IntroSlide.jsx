import { Slide, Button, useModule } from "@anthropic-jdo/scorm-framework";

export default function IntroSlide() {
  const { next } = useModule();

  return (
    <Slide bg="./bg_welcome.png">
      <img src="./logo.svg" alt="Logo" class="slide-logo" />
      <h1 class="slide-title">Health and Safety Training</h1>
      <p class="slide-subtitle">
        Complete this course to learn essential workplace safety practices.
      </p>
      <Button large onClick={next}>
        Start Course
      </Button>
    </Slide>
  );
}
