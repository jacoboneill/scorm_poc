import { createContext } from "preact";
import { useContext, useState, useMemo } from "preact/hooks";
import scorm from "../scorm";
import moduleConfig from "../../module.config.js";

const ModuleContext = createContext(null);

export function useModule() {
  const ctx = useContext(ModuleContext);
  if (!ctx) throw new Error("useModule must be used within <Module>");
  return ctx;
}

export default function Module({ children }) {
  const slides = Array.isArray(children) ? children : [children];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState({});
  const [mediaComplete, setMediaComplete] = useState({});

  useMemo(() => {
    scorm.init();
  }, []);

  const context = {
    currentSlide,
    totalSlides: slides.length,
    quizAnswers,
    quizSubmitted,
    mediaComplete,

    next: () => {
      if (currentSlide < slides.length - 1) {
        const next = currentSlide + 1;
        setCurrentSlide(next);
        scorm.setLocation(next);
      }
    },

    prev: () => {
      if (currentSlide > 0) {
        const prev = currentSlide - 1;
        setCurrentSlide(prev);
        scorm.setLocation(prev);
      }
    },

    markMediaComplete: (id) => {
      setMediaComplete((prev) => ({ ...prev, [id]: true }));
    },

    selectAnswer: (questionId, answerIndex) => {
      if (quizSubmitted[questionId]) return;
      setQuizAnswers((prev) => ({ ...prev, [questionId]: answerIndex }));
    },

    submitAnswer: (questionId) => {
      setQuizSubmitted((prev) => ({ ...prev, [questionId]: true }));
    },

    getScore: () => {
      const submitted = Object.keys(quizSubmitted);
      if (submitted.length === 0) return 0;
      const correct = submitted.filter((qId) => {
        const correctIndex = parseInt(qId.split("-").pop(), 10);
        return quizAnswers[qId] === correctIndex;
      }).length;
      return Math.round((correct / submitted.length) * 100);
    },

    finish: () => {
      const score = context.getScore();
      scorm.complete(score, moduleConfig.passRate);
      scorm.finish();
    },
  };

  return (
    <ModuleContext.Provider value={context}>
      {slides[currentSlide]}
    </ModuleContext.Provider>
  );
}
