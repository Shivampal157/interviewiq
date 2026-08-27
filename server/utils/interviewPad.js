export const DEFAULT_PROMPT = `Two Sum

Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input has exactly one solution, and you may not use the same element twice. You can return the answer in any order.

Example 1
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

Example 2
Input: nums = [3,2,4], target = 6
Output: [1,2]

Constraints
• 2 <= nums.length <= 10^4
• -10^9 <= nums[i], target <= 10^9
• Only one valid answer exists.

Follow-up
Can you come up with an algorithm that is less than O(n^2) time complexity?

Discuss approach, edge cases, and complexity with your interviewer before coding.`;

export const HR_PROMPT = `Behavioral interview

The interviewer will ask STAR-format questions (Situation, Task, Action, Result).

Use the shared pad to outline your stories:
• A time you disagreed with a teammate
• A production incident you owned
• A project you led end-to-end
• A time you had to learn something quickly

Keep answers specific: numbers, trade-offs, and what you personally did.`;

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

export const padForMode = (mode) => ({
  prompt: mode === "HR" ? HR_PROMPT : DEFAULT_PROMPT,
  language: "javascript",
  code: STARTERS.javascript,
  output: "",
});
