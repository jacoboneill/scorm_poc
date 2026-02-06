export default function Score({ score, passRate }) {
  const passed = score >= passRate;

  return (
    <div class="score-container">
      <div class={`score-value ${passed ? "passed" : "failed"}`}>
        {score}%
      </div>
      <div class={`score-status ${passed ? "passed" : "failed"}`}>
        {passed ? "Passed" : "Failed"}
      </div>
      <div class="score-passrate">Pass rate: {passRate}%</div>
    </div>
  );
}
