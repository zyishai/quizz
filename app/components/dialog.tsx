import { Transition, Dialog as HeadlessDialog } from "@headlessui/react";
import { Fragment, createContext, useState, useContext } from "react";
import { createPortal } from "react-dom";

const DialogBodyContext = createContext<any>(null);
const DialogFooterContext = createContext<any>(null);

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Dialog({
  open,
  onClose,
  title,
  children,
}: DialogProps) {
  const bodyRefProps = useState<HTMLDivElement | null>(null);
  const footerRefProps = useState<HTMLElement | null>(null);

  return (
    <Transition.Root show={open} as={Fragment}>
      <HeadlessDialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as="div"
              className="w-full sm:w-auto"
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <HeadlessDialog.Panel className="relative w-full transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:max-w-lg">
                {/* <div className="absolute top-0 hidden pt-4 ltr:right-0 ltr:pr-4 rtl:left-0 rtl:pl-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">סגור</span>
                    <XMarkIconSolid className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div> */}

                <div className="px-4 py-5 sm:p-6">
                  <div className="mt-3 ltr:text-left rtl:text-right sm:mt-0">
                    {title && (
                      <HeadlessDialog.Title
                        as="h3"
                        className="text-base font-semibold leading-6 text-gray-900"
                      >
                        {title}
                      </HeadlessDialog.Title>
                    )}
                    <div className="mt-2" ref={bodyRefProps[1]}>
                      {/* <p className="text-sm text-gray-500">
                        Are you sure you want to deactivate your account? All of
                        your data will be permanently removed from our servers
                        forever. This action cannot be undone.
                      </p> */}
                    </div>
                  </div>
                  {/* <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIconOutline
                      className="h-6 w-6 text-red-600"
                      aria-hidden="true"
                    />
                  </div> */}
                </div>

                <div
                  ref={footerRefProps[1]}
                  className="bg-gray-100 px-4 py-4 sm:p-6"
                >
                  {/* <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:w-auto sm:ltr:ml-3 sm:rtl:mr-3"
                    onClick={onClose}
                  >
                    Deactivate
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={onClose}
                  >
                    Cancel
                  </button> */}
                </div>
              </HeadlessDialog.Panel>

              <DialogBodyContext.Provider value={bodyRefProps}>
                <DialogFooterContext.Provider value={footerRefProps}>
                  {children}
                </DialogFooterContext.Provider>
              </DialogBodyContext.Provider>
            </Transition.Child>
          </div>
        </div>
      </HeadlessDialog>
    </Transition.Root>
  );
}

Dialog.Body = ({ children }: any) => {
  const [ref] = useContext(DialogBodyContext);

  return ref ? createPortal(children, ref) : null;
};

Dialog.Footer = ({ children }: any) => {
  const [ref] = useContext(DialogFooterContext);

  return ref ? createPortal(children, ref) : null;
};
