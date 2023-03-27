import { Transition } from "@headlessui/react";
import clsx from "clsx";
import React, { useEffect } from "react";
import { createContext, useContext, useState } from "react";
import { createPortal } from "react-dom";

const SlidingStepsContext = createContext<any>([null]);

type SlidingStepsProps = {
  className?: string;
  children?: any;
};
export default function SlidingSteps({
  className,
  children,
}: SlidingStepsProps) {
  const stepsContainer = useState<HTMLDivElement | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentStep((step) => (step + 1) % 5);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      <div
        className={clsx(["flex overflow-x-hidden", className])}
        ref={stepsContainer[1]}
      ></div>
      <div className="hidden">
        <SlidingStepsContext.Provider value={stepsContainer}>
          {React.Children.map(
            children,
            (child, index) =>
              child &&
              React.cloneElement(child, { show: currentStep === index })
          )}
        </SlidingStepsContext.Provider>
      </div>
    </>
  );
}

type SlidingStepsStepProps = {
  show?: boolean;
  children?: React.ReactNode;
};
SlidingSteps.Step = ({ show, children }: SlidingStepsStepProps) => {
  const [containerRef] = useContext(SlidingStepsContext);

  return createPortal(
    <Transition
      show={show}
      enter="ease-linear duration-[10000ms] transform transition-transform"
      // enterFrom="translate-x-0"
      // enterTo="translate-x-0"
      leave="ease-linear duration-[10000ms] transform transition-transform"
      leaveFrom="translate-x-0"
      leaveTo="translate-x-full"
      className="flex-shrink-0 basis-full"
    >
      {children}
    </Transition>,
    containerRef || document.body
  );
};
