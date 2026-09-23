"use client";

import { AppProgressBar as ProgressBar } from "next-nprogress-bar";

export function ProgressBarProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ProgressBar
        height="2.5px"
        color="#000000"
        options={{ showSpinner: false }}
        shallowRouting
      />
    </>
  );
}
