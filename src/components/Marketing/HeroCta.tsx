"use client";

import { buttonClassName } from "@/src/components/ui/button";
import { AuthAwareCta } from "@/src/components/Marketing/AuthAwareCta";

export function HeroCta() {
  return (
    <>
      <AuthAwareCta
        size="lg"
        showSecondary={false}
        signedInExtras={
          <a
            href="#example-queries"
            className={buttonClassName({
              variant: "ghost",
              size: "lg",
              className:
                "border border-white/40 text-white hover:text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
            })}
          >
            See example usage
          </a>
        }
        signedOutExtras={
          <a
            href="#example-queries"
            className={buttonClassName({
              variant: "ghost",
              size: "lg",
              className:
                "border border-white/40 text-white hover:text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
            })}
          >
            See example usage
          </a>
        }
      />
    </>
  );
}
