import { Module } from "@anthropic-jdo/scorm-framework";
import IntroSlide from "./slides/IntroSlide";
import VideoSlide from "./slides/VideoSlide";
import QuizSlide from "./slides/QuizSlide";
import OutroSlide from "./slides/OutroSlide";
import moduleConfig from "../module.config.js";

const questions = {
  "What is the first step when you discover a fire?": {
    options: [
      "Run outside immediately",
      "Activate the nearest fire alarm",
      "Try to extinguish it yourself",
      "Call a colleague",
    ],
    correct: 1,
  },
  "Which item is required PPE in a construction zone?": {
    options: ["Sunglasses", "Hard hat", "Running shoes", "Wristwatch"],
    correct: 1,
  },
  "What does a wet floor sign indicate?": {
    options: [
      "The floor has been recently painted",
      "A slip hazard is present",
      "The area is closed",
      "Cleaning is scheduled for later",
    ],
    correct: 1,
  },
};

export default function App() {
  return (
    <Module passRate={moduleConfig.passRate}>
      <IntroSlide />
      <VideoSlide src="./video.mp4" />
      <QuizSlide questions={questions} />
      <OutroSlide />
    </Module>
  );
}
