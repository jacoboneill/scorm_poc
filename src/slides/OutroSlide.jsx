import { Slide, Score, Button, useModule } from "../components";
import moduleConfig from "../../module.config.js";

export default function OutroSlide() {
  const { getScore, finish } = useModule();
  const score = getScore();

  return (
    <Slide bg="./bg.png">
      <h2 class="slide-title-lg">Course Complete</h2>
      <Score score={score} passRate={moduleConfig.passRate} />
      <Button large onClick={finish}>
        Complete Course
      </Button>
    </Slide>
  );
}
