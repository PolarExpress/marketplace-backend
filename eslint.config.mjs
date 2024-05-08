/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { FlatCompat } from "@eslint/eslintrc";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

const rule = {
  create(context) {
    const commentText =
      "\n" +
      " * This program has been developed by students from the bachelor\n" +
      " * Computer Science at Utrecht University within the Software Project course.\n" +
      " *\n" +
      " * © Copyright Utrecht University\n" +
      " * (Department of Information and Computing Sciences)\n" +
      " ";
    return {
      Program(node) {
        const comments = context.sourceCode.getCommentsBefore(node.body[0]);
        if (
          !(
            comments.length > 0 &&
            comments[0].range[0] === 0 &&
            comments[0].value == commentText
          )
        ) {
          context.report({
            fix(fixer) {
              return fixer.insertTextBefore(
                comments[0] ?? node.body[0],
                `/*${commentText}*/\n\n`
              );
            },
            message: "Copyright comment not found at the top",
            node: comments[0] ?? node.body[0]
          });
        }
      }
    };
  },
  meta: {
    docs: {
      category: "Mandatory",
      description:
        "Ensure a specific comment exists at the top of the document",
      recommended: true
    },
    fixable: "code",
    type: "maintenance"
  }
};

const plugin = { rules: { "enforce-copyright-comment": rule } };
const compat = new FlatCompat();

export default tseslint.config(
  {
    ignores: ["**/*.config.*"],
    plugins: { custom: plugin },
    rules: {
      "custom/enforce-copyright-comment": "error",
      "unicorn/prevent-abbreviations": [
        "error",
        {
          replacements: {
            e: false,
            i: false // "e" and "i" are industry standard.
          }
        }
      ]
    }
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...compat.extends(
    "plugin:sonarjs/recommended",
    "plugin:perfectionist/recommended-natural",
    "plugin:unicorn/recommended",
    "plugin:jest/recommended",
    "plugin:jest-formatting/strict"
  ),
  {
    rules: {
      "unicorn/filename-case": [
        "error",
        {
          case: "camelCase"
        }
      ],
      "unicorn/no-array-callback-reference": "off",
      "unicorn/prefer-top-level-await": "off"
    }
  },
  {
    ignores: ["build", "data", "load_addons.js", "addons", "coverage"]
  }
);
