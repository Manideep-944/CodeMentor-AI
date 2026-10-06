export const SUPPORTED_LANGUAGES = [
  {
    id: 'javascript',
    name: 'JavaScript',
    monacoLang: 'javascript',
    extension: '.js',
    icon: '⚡',
    defaultCode: `// CodeMentor AI — JavaScript Workspace
// Problem: Find two numbers that sum up to target

function twoSum(nums, target) {
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  
  return [];
}

// Test case
const numbers = [2, 7, 11, 15];
const targetVal = 9;
console.log("Indices:", twoSum(numbers, targetVal));
`,
  },
  {
    id: 'python',
    name: 'Python',
    monacoLang: 'python',
    extension: '.py',
    icon: '🐍',
    defaultCode: `# CodeMentor AI — Python Workspace
# Problem: Binary Search Algorithm

def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
            
    return -1

# Test case
sorted_data = [1, 3, 5, 7, 9, 11, 13]
target_value = 7
result = binary_search(sorted_data, target_value)
print(f"Target found at index: {result}")
`,
  },
  {
    id: 'java',
    name: 'Java',
    monacoLang: 'java',
    extension: '.java',
    icon: '☕',
    defaultCode: `// CodeMentor AI — Java Workspace
// Problem: Maximum Subarray Sum (Kadane's Algorithm)

public class Main {
    public static int maxSubArray(int[] nums) {
        int maxSoFar = nums[0];
        int currentMax = nums[0];

        for (int i = 1; i < nums.length; i++) {
            currentMax = Math.max(nums[i], currentMax + nums[i]);
            maxSoFar = Math.max(maxSoFar, currentMax);
        }

        return maxSoFar;
    }

    public static void main(String[] args) {
        int[] data = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
        System.out.println("Maximum contiguous sum: " + maxSubArray(data));
    }
}
`,
  },
  {
    id: 'cpp',
    name: 'C++',
    monacoLang: 'cpp',
    extension: '.cpp',
    icon: '🚀',
    defaultCode: `// CodeMentor AI — C++ Workspace
// Problem: Check for valid parenthesis sequence

#include <iostream>
#include <stack>
#include <string>

using namespace std;

bool isValidParentheses(const string& s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '{' || c == '[') {
            st.push(c);
        } else {
            if (st.empty()) return false;
            char top = st.top();
            if ((c == ')' && top == '(') ||
                (c == '}' && top == '{') ||
                (c == ']' && top == '[')) {
                st.pop();
            } else {
                return false;
            }
        }
    }
    return st.empty();
}

int main() {
    string sample = "{[()]}";
    cout << "Is valid: " << (isValidParentheses(sample) ? "true" : "false") << endl;
    return 0;
}
`,
  },
  {
    id: 'c',
    name: 'C',
    monacoLang: 'c',
    extension: '.c',
    icon: '⚙️',
    defaultCode: `// CodeMentor AI — C Workspace
// Problem: Reverse an array in-place

#include <stdio.h>

void reverseArray(int arr[], int size) {
    int start = 0;
    int end = size - 1;
    while (start < end) {
        int temp = arr[start];
        arr[start] = arr[end];
        arr[end] = temp;
        start++;
        end--;
    }
}

int main() {
    int numbers[] = {1, 2, 3, 4, 5};
    int n = sizeof(numbers) / sizeof(numbers[0]);

    printf("Original array: ");
    for (int i = 0; i < n; i++) printf("%d ", numbers[i]);
    printf("\\n");

    reverseArray(numbers, n);

    printf("Reversed array: ");
    for (int i = 0; i < n; i++) printf("%d ", numbers[i]);
    printf("\\n");

    return 0;
}
`,
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    monacoLang: 'typescript',
    extension: '.ts',
    icon: '🔷',
    defaultCode: `// CodeMentor AI — TypeScript Workspace
// Problem: Find two numbers that sum up to target

interface TwoSumResult {
  indices: [number, number] | [];
  target: number;
}

function twoSum(nums: number[], target: number): TwoSumResult {
  const map = new Map<number, number>();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return { indices: [map.get(complement)!, i], target };
    }
    map.set(nums[i], i);
  }
  
  return { indices: [], target };
}

// Test case
const numbers: number[] = [2, 7, 11, 15];
const targetVal: number = 9;
const result = twoSum(numbers, targetVal);
console.log("Indices:", result.indices);
`,
  },
];

export const getLanguageById = (id) => {
  return SUPPORTED_LANGUAGES.find((lang) => lang.id === id) || SUPPORTED_LANGUAGES[0];
};
