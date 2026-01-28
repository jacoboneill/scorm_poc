import { Slide, Button, useModule } from "../components";

export default function IntroSlide() {
  const { next } = useModule();

  return (
    <Slide bg="./bg_welcome.png">
      <img src="./logo.svg" alt="Logo" class="w-24 h-24 mb-4" />
      <h1 class="text-4xl font-black">Health and Safety Training</h1>
      <p class="text-lg text-white/80">
        Complete this course to learn essential workplace safety practices.
      </p>
      <Button large onClick={next}>
        Start Course
      </Button>
    </Slide>
  );
}
