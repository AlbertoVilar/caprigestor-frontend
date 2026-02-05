import { formatLocalDatePtBR } from "../src/utils/localDate";

const cases = [
  { input: "2026-02-01", expected: "01/02/2026" },
  { input: "2026-01-31", expected: "31/01/2026" },
  { input: "2025-12-31", expected: "31/12/2025" }
];

let hasError = false;

cases.forEach(({ input, expected }) => {
  const result = formatLocalDatePtBR(input);
  if (result !== expected) {
    console.error(`❌ ${input} → ${result} (esperado ${expected})`);
    hasError = true;
  } else {
    console.log(`✅ ${input} → ${result}`);
  }
});

if (hasError) {
  process.exitCode = 1;
}
