import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"

import { Input } from "./input"

const meta = {
  title: "Components/Input",
  component: Input,
  args: {
    disabled: false,
    placeholder: "founder@example.com",
    type: "email",
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByPlaceholderText("founder@example.com")

    await userEvent.type(input, "team@startup.dev")
    await expect(input).toHaveValue("team@startup.dev")
  },
}

export const Disabled: Story = {
  args: { disabled: true },
}

export const Invalid: Story = {
  args: {
    "aria-invalid": true,
    defaultValue: "not-an-email",
  },
}
