export const STARTERS = {
  javascript: `function twoSum(nums, target) {
  // write your solution
}

console.log(twoSum([2, 7, 11, 15], 9));
console.log(twoSum([3, 2, 4], 6));
`,
  python: `def two_sum(nums, target):
    # write your solution
    pass

print(two_sum([2, 7, 11, 15], 9))
print(two_sum([3, 2, 4], 6))
`,
  java: `import java.util.*;

public class Main {
    public static int[] twoSum(int[] nums, int target) {
        return new int[]{};
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(twoSum(new int[]{2, 7, 11, 15}, 9)));
        System.out.println(Arrays.toString(twoSum(new int[]{3, 2, 4}, 6)));
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    return {};
}

int main() {
    vector<int> a = {2, 7, 11, 15};
    auto r = twoSum(a, 9);
    for (int x : r) cout << x << " ";
    cout << endl;
    return 0;
}
`,
};

const LANGS = [
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python 3" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
];

export default function CodePad({
  language,
  code,
  output,
  stdin,
  running,
  onLanguage,
  onCode,
  onStdin,
  onRun,
  disabled,
}) {
  const lines = (code || "").split("\n").length;
  const lineLabel = Array.from({ length: Math.max(lines, 1) }, (_, i) => i + 1);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#0e1117]">
      <div className="flex h-11 shrink-0 items-center gap-3 border-b border-white/8 bg-[#161b22] px-3">
        <select
          value={language}
          disabled={disabled}
          onChange={(e) => onLanguage(e.target.value)}
          className="rounded-md border border-white/10 bg-[#0e1117] px-2 py-1 text-xs text-zinc-200 outline-none"
        >
          {LANGS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={disabled || running}
          onClick={onRun}
          className="rounded-md bg-[#238636] px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
        >
          {running ? "Running…" : "Run"}
        </button>
        <span className="ml-auto font-mono text-[11px] text-zinc-500">⌘ / Ctrl + Enter</span>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div
          aria-hidden
          className="select-none border-r border-white/5 bg-[#0e1117] py-3 pr-2 text-right font-mono text-[12px] leading-6 text-zinc-600"
        >
          {lineLabel.map((n) => (
            <div key={n} className="min-w-[2.25rem] px-2">
              {n}
            </div>
          ))}
        </div>
        <textarea
          spellCheck={false}
          disabled={disabled}
          value={code}
          onChange={(e) => onCode(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              onRun();
            }
            if (e.key === "Tab") {
              e.preventDefault();
              const el = e.currentTarget;
              const start = el.selectionStart;
              const end = el.selectionEnd;
              const next = `${code.slice(0, start)}  ${code.slice(end)}`;
              onCode(next);
              requestAnimationFrame(() => {
                el.selectionStart = el.selectionEnd = start + 2;
              });
            }
          }}
          className="min-h-0 flex-1 resize-none bg-[#0e1117] p-3 font-mono text-[13px] leading-6 text-zinc-100 outline-none"
        />
      </div>

      <div className="flex h-[28%] min-h-[140px] shrink-0 flex-col border-t border-white/8 bg-[#010409]">
        <div className="flex items-center justify-between px-3 py-1.5 text-[11px] uppercase tracking-wide text-zinc-500">
          <span>Console</span>
          <span>stdin</span>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-[1.4fr_0.8fr] gap-px bg-white/5">
          <pre className={`overflow-auto bg-[#010409] p-3 font-mono text-[12px] leading-5 whitespace-pre-wrap ${running ? "text-amber-300" : output && /error|fail|busy|killed/i.test(output) ? "text-red-300" : "text-emerald-300"}`}>
            {output || "Run your code to see stdout / stderr here."}
          </pre>
          <textarea
            disabled={disabled}
            value={stdin}
            onChange={(e) => onStdin(e.target.value)}
            placeholder="Optional stdin"
            className="resize-none bg-[#0e1117] p-3 font-mono text-[12px] text-zinc-300 outline-none"
          />
        </div>
      </div>
    </div>
  );
}
