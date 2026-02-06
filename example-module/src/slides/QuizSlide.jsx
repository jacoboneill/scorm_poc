import { Slide, Quiz, Button, useModule } from "@anthropic-jdo/scorm-framework";

export default function QuizSlide({ questions }) {
  const { next, quizResults } = useModule();
  const totalQuestions = Object.keys(questions).length;
  const answeredAll = Object.keys(quizResults).length >= totalQuestions;

  return (
    <Slide bg="./bg.png">
      <h2 class="slide-title-md">Knowledge Check</h2>
      <Quiz questions={questions} />
      {answeredAll && (
        <Button large onClick={next}>
          See Results
        </Button>
      )}
    </Slide>
  );
}
