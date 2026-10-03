import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

export async function chooseOption(
  user: UserEvent,
  label: string,
  option: string,
) {
  await user.click(screen.getByLabelText(label));
  await user.click(await screen.findByRole("option", { name: option }));
}
