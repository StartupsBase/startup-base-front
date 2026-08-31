/// <reference types="vite/client" />

import React from "react"
import type { Preview } from "@storybook/react-vite"
import { MINIMAL_VIEWPORTS } from "storybook/viewport"

import "../src/styles/globals.css"

const preview: Preview = {
  decorators: [
    (Story, context) => {
      const isDark = context.globals.theme === "dark"

      document.documentElement.classList.toggle("dark", isDark)

      return React.createElement(
        "div",
        { className: "min-h-screen bg-background p-6 text-foreground" },
        React.createElement(Story)
      )
    },
  ],
  globalTypes: {
    theme: {
      description: "Global color theme",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  parameters: {
    a11y: {
      test: "todo",
    },
    backgrounds: { disable: true },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
    options: {
      storySort: {
        order: ["Foundations", "Components", "Patterns"],
      },
    },
    viewport: {
      options: MINIMAL_VIEWPORTS,
    },
  },
  tags: ["autodocs"],
}

export default preview
