import { useState } from "preact/hooks";
import { useModule } from "./Module";
import Button from "./Button";

export default function Quiz({ questions, graded, passRate }) {
  const { selectAnswer, submitAnswer, quizAnswers, quizSubmitted } =
    useModule();
  const [currentQ, setCurrentQ] = useState(0);

  const entries = Object.entries(questions);
  const total = entries.length;
  const [questionText, questionData] = entries[currentQ];
  const questionId = `q-${currentQ}-${questionData.correct}`;
  const selected = quizAnswers[questionId];
  const submitted = quizSubmitted[questionId];

  const handleNext = () => {
    if (currentQ < total - 1) {
      setCurrentQ(currentQ + 1);
    }
  };

  const getAnswerClass = (idx) => {
    const classes = ["quiz-answer"];
    if (submitted) {
      if (idx === questionData.correct) classes.push("correct");
      else if (idx === selected) classes.push("incorrect");
      else classes.push("disabled");
    } else if (idx === selected) {
      classes.push("selected");
    }
    return classes.join(" ");
  };

  return (
    <div class="quiz-container">
      <div class="quiz-progress">
        Question {currentQ + 1} of {total}
      </div>
      <h2 class="quiz-question">{questionText}</h2>
      <div class="quiz-options">
        {questionData.options.map((option, idx) => (
          <button
            key={idx}
            class={getAnswerClass(idx)}
            onClick={() => selectAnswer(questionId, idx)}
            disabled={submitted}
          >
            <span class="quiz-answer-letter">
              {String.fromCharCode(65 + idx)}
            </span>
            <span>{option}</span>
          </button>
        ))}
      </div>
      <div class="quiz-actions">
        {!submitted && selected !== undefined && (
          <Button onClick={() => submitAnswer(questionId)}>Submit</Button>
        )}
        {submitted && currentQ < total - 1 && (
          <Button onClick={handleNext}>Next Question</Button>
        )}
      </div>
    </div>
  );
}
