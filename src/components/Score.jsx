export default function Score({ score, passRate }) {
  const passed = score >= passRate;

  return (
    <div class="flex flex-col items-center gap-4">
      <div
        class={`text-6xl font-black ${passed ? "text-green-400" : "text-red-400"}`}
      >
        {score}%
      </div>
      <div
        class={`text-xl font-semibold ${passed ? "text-green-300" : "text-red-300"}`}
      >
        {passed ? "Passed" : "Failed"}
      </div>
      <div class="text-white/60 text-sm">Pass rate: {passRate}%</div>
    </div>
  );
}
