import { Slide, Quiz, Button, useModule } from "../components";

export default function QuizSlide({ questions, graded, passRate }) {
  const { next, quizSubmitted } = useModule();
  const totalQuestions = Object.keys(questions).length;
  const answeredAll = Object.keys(quizSubmitted).length >= totalQuestions;

  return (
    <Slide bg="./bg.png">
      <h2 class="slide-title-md">Knowledge Check</h2>
      <Quiz questions={questions} graded={graded} passRate={passRate} />
      {answeredAll && (
        <Button large onClick={next}>
          See Results
        </Button>
      )}
    </Slide>
  );
}
