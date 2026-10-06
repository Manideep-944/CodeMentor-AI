const mongoose = require('mongoose');

const BugItemSchema = new mongoose.Schema(
  {
    severity: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low', 'Informational'],
      default: 'Medium',
    },
    line: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    problem: {
      type: String,
      default: '',
    },
    whyItHappens: {
      type: String,
      default: '',
    },
    howToFix: {
      type: String,
      default: '',
    },
    suggestion: {
      type: String,
      default: '',
    },
    correctedSnippet: {
      type: String,
      default: '',
    },
    simpleExplanation: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const SuggestionItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
    },
  },
  { _id: false }
);

const ComplexitySchema = new mongoose.Schema(
  {
    notation: { type: String, default: 'O(1)' },
    worstCase: { type: String, default: 'O(1)' },
    bestCase: { type: String, default: 'O(1)' },
    averageCase: { type: String, default: 'O(1)' },
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

const SimpleComplexitySchema = new mongoose.Schema(
  {
    time: { type: String, default: 'O(n)' },
    space: { type: String, default: 'O(1)' },
  },
  { _id: false }
);

const TestCaseItemSchema = new mongoose.Schema(
  {
    testCaseNumber: { type: Number, default: 1 },
    input: { type: String, default: '' },
    expected: { type: String, default: '' },
    explanation: { type: String, default: '' },
    isEdgeCase: { type: Boolean, default: false },
    edgeCase: { type: String, default: 'No' },
  },
  { _id: false }
);

const AnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Code snippet is required'],
      trim: true,
    },
    language: {
      type: String,
      required: [true, 'Programming language is required'],
      enum: ['javascript', 'python', 'java', 'cpp', 'c', 'typescript'],
      lowercase: true,
    },
    isBookmarked: {
      type: Boolean,
      default: false,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    analysis: {
      summary: {
        type: String,
        default: '',
      },
      codeQuality: {
        score: { type: Number, default: 0 },
        rating: { type: String, default: 'Good' },
        strengths: { type: [String], default: [] },
        weaknesses: { type: [String], default: [] },
      },
      bugs: {
        type: [BugItemSchema],
        default: [],
      },
      timeComplexity: {
        type: ComplexitySchema,
        default: () => ({}),
      },
      spaceComplexity: {
        type: ComplexitySchema,
        default: () => ({}),
      },
      complexity: {
        type: SimpleComplexitySchema,
        default: () => ({ time: 'O(n)', space: 'O(1)' }),
      },
      suggestions: {
        type: [SuggestionItemSchema],
        default: [],
      },
      optimizedCode: {
        type: String,
        default: '',
      },
      explanation: {
        type: String,
        default: '',
      },
      testCases: {
        type: [TestCaseItemSchema],
        default: [],
      },
      documentation: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      codeExplanation: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      optimizationComparison: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      generatedAt: {
        type: String,
        default: () => new Date().toISOString(),
      },
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for personal analysis history lookups, bookmarks, and tags
AnalysisSchema.index({ userId: 1, createdAt: -1 });
AnalysisSchema.index({ userId: 1, isBookmarked: 1 });
AnalysisSchema.index({ userId: 1, tags: 1 });
AnalysisSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Analysis || mongoose.model('Analysis', AnalysisSchema);
