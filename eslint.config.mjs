/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { FlatCompat } from "@eslint/eslintrc";
import baseConfig from "@graphpolaris/ts-configs/eslint";

const compat = new FlatCompat();

export default [
  ...baseConfig,
  ...compat.extends("plugin:jest/recommended", "plugin:jest-formatting/strict")
];
