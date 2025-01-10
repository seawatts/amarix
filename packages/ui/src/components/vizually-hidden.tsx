import type { VisuallyHiddenProps } from "@radix-ui/react-visually-hidden";
import * as VisuallyHiddenRadix from "@radix-ui/react-visually-hidden";

export const VisuallyHidden = (props: VisuallyHiddenProps) => (
  <VisuallyHiddenRadix.Root {...props} />
);
