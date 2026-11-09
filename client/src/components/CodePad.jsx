import React, { useState } from "react";

export const STARTERS = {
  javascript: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (map.has(need)) return [map.get(need), i];
    map.set(nums[i], i);
  }
  return [];
}

console.log(JSON.stringify(twoSum([2, 7, 11, 15], 9)));
`,
  python: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        need = target - num
        if need in seen:
            return [seen[need], i]
        seen[num] = i
    return []

print(two_sum([2, 7, 11, 15], 9))
`,
  java: `import java.util.*;

public class Main {
    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];
            if (map.containsKey(need)) return new int[]{map.get(need), i};
            map.put(nums[i], i);
        }
        return new int[]{};
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(twoSum(new int[]{2, 7, 11, 15}, 9)));
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> mp;
    for (int i = 0; i < (int)nums.size(); i++) {
        int need = target - nums[i];
        if (mp.count(need)) return {mp[need], i};
        mp[nums[i]] = i;
    }
    return {};
}

int main() {
    vector<int> a = {2, 7, 11, 15};
    auto r = twoSum(a, 9);
    cout << "[" << r[0] << "," << r[1] << "]" << endl;
    return 0;
}
`,
};

export const FAANG_PROBLEMS = [
  {
    id: "two-sum",
    title: "1. Two Sum",
    difficulty: "Easy",
    company: "Google · Amazon · Meta",
    prompt: `Problem: Two Sum (Easy) — Google / Amazon

Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.
You may assume that each input would have exactly one solution, and you may not use the same element twice.

Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]

Example 2:
Input: nums = [3,2,4], target = 6
Output: [1,2]

Example 3:
Input: nums = [3,3], target = 6
Output: [0,1]

Constraints:
• 2 <= nums.length <= 10^4
• Expected Time Complexity: O(N)
• Expected Space Complexity: O(N)`,
    starters: STARTERS,
    testCases: [
      {
        name: "Case 1 (Standard)",
        input: "nums = [2,7,11,15], target = 9",
        expected: "[0,1]",
        harness: {
          javascript: `console.log(JSON.stringify(twoSum([2, 7, 11, 15], 9)));`,
          python: `print(str(two_sum([2, 7, 11, 15], 9)).replace(" ", ""))`,
        },
      },
      {
        name: "Case 2 (Middle Pair)",
        input: "nums = [3,2,4], target = 6",
        expected: "[1,2]",
        harness: {
          javascript: `console.log(JSON.stringify(twoSum([3, 2, 4], 6)));`,
          python: `print(str(two_sum([3, 2, 4], 6)).replace(" ", ""))`,
        },
      },
      {
        name: "Case 3 (Duplicates)",
        input: "nums = [3,3], target = 6",
        expected: "[0,1]",
        harness: {
          javascript: `console.log(JSON.stringify(twoSum([3, 3], 6)));`,
          python: `print(str(two_sum([3, 3], 6)).replace(" ", ""))`,
        },
      },
      {
        name: "Case 4 (Negative Values - Hidden)",
        input: "nums = [-3,4,3,90], target = 0",
        expected: "[0,2]",
        harness: {
          javascript: `console.log(JSON.stringify(twoSum([-3, 4, 3, 90], 0)));`,
          python: `print(str(two_sum([-3, 4, 3, 90], 0)).replace(" ", ""))`,
        },
      },
    ],
  },
  {
    id: "max-subarray",
    title: "2. Maximum Subarray (Kadane's)",
    difficulty: "Medium",
    company: "Amazon · Microsoft · Apple",
    prompt: `Problem: Maximum Subarray (Medium) — Amazon / Microsoft

Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.

Example 1:
Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: The subarray [4,-1,2,1] has the largest sum 6.

Example 2:
Input: nums = [1]
Output: 1

Example 3:
Input: nums = [5,4,-1,7,8]
Output: 23

Constraints:
• 1 <= nums.length <= 10^5
• Expected Time Complexity: O(N)
• Expected Space Complexity: O(1)`,
    starters: {
      javascript: `function maxSubArray(nums) {
  let maxSoFar = nums[0];
  let curr = nums[0];
  for (let i = 1; i < nums.length; i++) {
    curr = Math.max(nums[i], curr + nums[i]);
    maxSoFar = Math.max(maxSoFar, curr);
  }
  return maxSoFar;
}

console.log(maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4]));
`,
      python: `def max_sub_array(nums):
    best = curr = nums[0]
    for x in nums[1:]:
        curr = max(x, curr + x)
        best = max(best, curr)
    return best

print(max_sub_array([-2, 1, -3, 4, -1, 2, 1, -5, 4]))
`,
      java: STARTERS.java,
      cpp: STARTERS.cpp,
    },
    testCases: [
      {
        name: "Case 1 (Mixed Array)",
        input: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
        expected: "6",
        harness: {
          javascript: `console.log(maxSubArray([-2,1,-3,4,-1,2,1,-5,4]));`,
          python: `print(max_sub_array([-2,1,-3,4,-1,2,1,-5,4]))`,
        },
      },
      {
        name: "Case 2 (Single Element)",
        input: "nums = [1]",
        expected: "1",
        harness: {
          javascript: `console.log(maxSubArray([1]));`,
          python: `print(max_sub_array([1]))`,
        },
      },
      {
        name: "Case 3 (Mostly Positive)",
        input: "nums = [5,4,-1,7,8]",
        expected: "23",
        harness: {
          javascript: `console.log(maxSubArray([5,4,-1,7,8]));`,
          python: `print(max_sub_array([5,4,-1,7,8]))`,
        },
      },
      {
        name: "Case 4 (All Negative - Hidden)",
        input: "nums = [-8,-3,-6,-2,-5,-4]",
        expected: "-2",
        harness: {
          javascript: `console.log(maxSubArray([-8,-3,-6,-2,-5,-4]));`,
          python: `print(max_sub_array([-8,-3,-6,-2,-5,-4]))`,
        },
      },
    ],
  },
  {
    id: "valid-parentheses",
    title: "3. Valid Parentheses",
    difficulty: "Easy",
    company: "Meta · Bloomberg · Uber",
    prompt: `Problem: Valid Parentheses (Easy) — Meta / Bloomberg

Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.
An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.

Example 1:
Input: s = "()" -> Output: true
Example 2:
Input: s = "()[]{}" -> Output: true
Example 3:
Input: s = "(]" -> Output: false`,
    starters: {
      javascript: `function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (const ch of s) {
    if (ch in map) {
      if (stack.pop() !== map[ch]) return false;
    } else {
      stack.push(ch);
    }
  }
  return stack.length === 0;
}

console.log(isValid("()[]{}"));
`,
      python: `def is_valid(s):
    stack = []
    mp = {')': '(', '}': '{', ']': '['}
    for ch in s:
        if ch in mp:
            if not stack or stack.pop() != mp[ch]:
                return False
        else:
            stack.append(ch)
    return len(stack) == 0

print(str(is_valid("()[]{}")).lower())
`,
      java: STARTERS.java,
      cpp: STARTERS.cpp,
    },
    testCases: [
      {
        name: "Case 1 (Simple Pair)",
        input: `s = "()"`,
        expected: "true",
        harness: {
          javascript: `console.log(String(isValid("()")));`,
          python: `print(str(is_valid("()")).lower())`,
        },
      },
      {
        name: "Case 2 (Multiple Brackets)",
        input: `s = "()[]{}"`,
        expected: "true",
        harness: {
          javascript: `console.log(String(isValid("()[]{}")));`,
          python: `print(str(is_valid("()[]{}")).lower())`,
        },
      },
      {
        name: "Case 3 (Mismatched)",
        input: `s = "(]"`,
        expected: "false",
        harness: {
          javascript: `console.log(String(isValid("(]")));`,
          python: `print(str(is_valid("(]")).lower())`,
        },
      },
      {
        name: "Case 4 (Nested Valid - Hidden)",
        input: `s = "{[]}"`,
        expected: "true",
        harness: {
          javascript: `console.log(String(isValid("{[]}")));`,
          python: `print(str(is_valid("{[]}")).lower())`,
        },
      },
    ],
  },
];

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
  judging,
  analyzing,
  judgeResult,
  aiAnalysis,
  selectedProblemId,
  onSelectProblem,
  onLanguage,
  onCode,
  onStdin,
  onRun,
  onJudge,
  onAnalyze,
  disabled,
}) {
  const [bottomTab, setBottomTab] = useState("console");
  const lines = (code || "").split("\n").length;
  const lineLabel = Array.from({ length: Math.max(lines, 1) }, (_, i) => i + 1);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#0e1117]">
      {/* Top Toolbar */}
      <div className="flex flex-wrap min-h-11 shrink-0 items-center gap-2 border-b border-white/10 bg-[#161b22] px-3 py-1.5">
        {onSelectProblem && (
          <select
            value={selectedProblemId || "two-sum"}
            disabled={disabled}
            onChange={(e) => onSelectProblem(e.target.value)}
            className="rounded-md border border-emerald-500/30 bg-[#0e1117] px-2.5 py-1 text-xs font-medium text-emerald-300 outline-none"
          >
            {FAANG_PROBLEMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.difficulty})
              </option>
            ))}
          </select>
        )}

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
          onClick={() => {
            setBottomTab("console");
            onRun();
          }}
          className="rounded-md bg-white/10 hover:bg-white/15 px-3 py-1 text-xs font-medium text-white disabled:opacity-50 cursor-pointer"
        >
          {running ? "Running…" : "▶ Run Code"}
        </button>

        {onJudge && (
          <button
            type="button"
            disabled={disabled || judging}
            onClick={() => {
              setBottomTab("testcases");
              onJudge();
            }}
            className="rounded-md bg-[#238636] hover:bg-[#2ea043] px-3 py-1 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer"
          >
            {judging ? "Judging Cases…" : "✓ Submit & Run Test Cases"}
          </button>
        )}

        {onAnalyze && (
          <button
            type="button"
            disabled={analyzing}
            onClick={() => {
              setBottomTab("aireview");
              onAnalyze();
            }}
            className="rounded-md border border-purple-500/40 bg-purple-500/15 hover:bg-purple-500/25 px-3 py-1 text-xs font-medium text-purple-200 disabled:opacity-50 cursor-pointer"
          >
            {analyzing ? "Analyzing…" : "✨ AI Complexity Check"}
          </button>
        )}

        <span className="ml-auto hidden lg:inline font-mono text-[11px] text-zinc-500">
          ⌘ / Ctrl + Enter
        </span>
      </div>

      {/* Code Editor Canvas */}
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

      {/* Bottom Multi-Tab Drawer: Console | Automated Test Cases | AI Code Review */}
      <div className="flex h-[32%] min-h-[165px] shrink-0 flex-col border-t border-white/10 bg-[#010409]">
        <div className="flex items-center gap-4 border-b border-white/10 bg-[#161b22] px-3 py-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => setBottomTab("console")}
            className={`font-semibold uppercase tracking-wide cursor-pointer ${
              bottomTab === "console"
                ? "text-emerald-400 border-b border-emerald-400 pb-0.5"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Console / Stdin
          </button>
          <button
            type="button"
            onClick={() => setBottomTab("testcases")}
            className={`font-semibold uppercase tracking-wide cursor-pointer flex items-center gap-1.5 ${
              bottomTab === "testcases"
                ? "text-emerald-400 border-b border-emerald-400 pb-0.5"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <span>Test Cases Judge</span>
            {judgeResult && (
              <span
                className={`rounded px-1.5 py-0.2 text-[10px] ${
                  judgeResult.verdict === "Accepted"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-red-500/20 text-red-300"
                }`}
              >
                {judgeResult.passedCount}/{judgeResult.totalCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setBottomTab("aireview")}
            className={`font-semibold uppercase tracking-wide cursor-pointer ${
              bottomTab === "aireview"
                ? "text-purple-300 border-b border-purple-400 pb-0.5"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            ✨ AI Code Review
          </button>
        </div>

        {bottomTab === "console" && (
          <div className="grid min-h-0 flex-1 grid-cols-[1.4fr_0.8fr] gap-px bg-white/5">
            <pre
              className={`overflow-auto bg-[#010409] p-3 font-mono text-[12px] leading-5 whitespace-pre-wrap ${
                running
                  ? "text-amber-300"
                  : output && /error|fail|busy|killed/i.test(output)
                  ? "text-red-300"
                  : "text-emerald-300"
              }`}
            >
              {output || "Run your code to see stdout / stderr here."}
            </pre>
            <textarea
              disabled={disabled}
              value={stdin}
              onChange={(e) => onStdin(e.target.value)}
              placeholder="Optional custom stdin input..."
              className="resize-none bg-[#0e1117] p-3 font-mono text-[12px] text-zinc-300 outline-none"
            />
          </div>
        )}

        {bottomTab === "testcases" && (
          <div className="min-h-0 flex-1 overflow-y-auto p-3 text-xs">
            {judging ? (
              <p className="font-mono text-amber-300">
                Running parallel test cases in sandbox worker pool…
              </p>
            ) : !judgeResult ? (
              <p className="text-zinc-400">
                Click <strong>"✓ Submit & Run Test Cases"</strong> above to run your solution against all sample and hidden test cases in parallel.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span
                    className={`font-bold text-sm ${
                      judgeResult.verdict === "Accepted"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {judgeResult.verdict === "Accepted" ? "✅ Accepted" : "❌ Wrong Answer"}{" "}
                    ({judgeResult.passedCount}/{judgeResult.totalCount} test cases passed)
                  </span>
                  <span className="font-mono text-zinc-400">
                    Total Parallel Time: {judgeResult.totalTimeMs} ms
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(judgeResult.results || []).map((r) => (
                    <div
                      key={r.index}
                      className={`rounded-lg border p-2.5 font-mono text-[11px] ${
                        r.passed
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-red-500/30 bg-red-500/5"
                      }`}
                    >
                      <div className="flex justify-between font-semibold mb-1">
                        <span className={r.passed ? "text-emerald-300" : "text-red-300"}>
                          {r.passed ? "✓ PASS" : "✗ FAIL"} · {r.name}
                        </span>
                        <span className="text-zinc-500">{r.runtimeMs} ms</span>
                      </div>
                      <div className="text-zinc-400 truncate">Input: {r.input}</div>
                      <div className="text-zinc-300">
                        Expected: <span className="text-emerald-300">{r.expected}</span> · Actual:{" "}
                        <span className={r.passed ? "text-emerald-300" : "text-red-300"}>
                          {r.actual || "(empty)"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {bottomTab === "aireview" && (
          <div className="min-h-0 flex-1 overflow-y-auto p-3 text-xs">
            {analyzing ? (
              <p className="font-mono text-purple-300">
                AI Interview Copilot is analyzing time/space complexity & edge cases…
              </p>
            ) : !aiAnalysis ? (
              <p className="text-zinc-400">
                Click <strong>"✨ AI Complexity Check"</strong> to evaluate Big-O Time & Space complexity, code quality score, and get smart follow-up questions.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-md bg-purple-500/20 px-2.5 py-1 font-mono font-bold text-purple-200">
                    Time: {aiAnalysis.timeComplexity}
                  </span>
                  <span className="rounded-md bg-blue-500/20 px-2.5 py-1 font-mono font-bold text-blue-200">
                    Space: {aiAnalysis.spaceComplexity}
                  </span>
                  <span className="rounded-md bg-emerald-500/20 px-2.5 py-1 font-mono font-bold text-emerald-300">
                    Quality Score: {aiAnalysis.score}/10
                  </span>
                </div>
                <p className="text-zinc-200 leading-relaxed">{aiAnalysis.summary}</p>
                {aiAnalysis.followUpQuestions?.length > 0 && (
                  <div className="rounded-lg bg-white/5 p-2 border border-white/10">
                    <span className="font-semibold text-amber-300 block mb-1">
                      Suggested Interviewer Follow-up Questions:
                    </span>
                    <ul className="list-disc list-inside text-zinc-300 space-y-0.5">
                      {aiAnalysis.followUpQuestions.map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
