export default function UpgradeToProCTA() {
  return (
    <aside className="flex flex-shrink-0 border-t border-gray-200 p-4">
      <div className="group block w-full flex-shrink-0">
        <header className="mb-1.5 flex items-center justify-between">
          <span className="rounded-sm bg-yellow-200 py-0.5 px-3 text-xs font-medium text-gray-800">
            חשבון סטודנט
          </span>
          <button
            aria-label="Close"
            className="inline-flex h-6 w-6 rounded-lg bg-blue-50 p-1 text-blue-900 hover:bg-blue-200 focus:ring-2 focus:ring-blue-400"
            type="button"
          >
            <svg
              aria-hidden={true}
              className="h-4 w-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </header>
        <p className="mb-3 text-sm text-blue-900">
          שדרג את חשבונך כדי להנות מתכונות מתקדמות כגון: תשלומים באתר, התראות
          אוטומטיות והנפקת קבלות.
        </p>
        <button
          type="button"
          className="w-full rounded-md bg-amber-500 py-1.5 text-sm text-white shadow-md active:translate-y-px active:shadow-none"
        >
          אני רוצה לשדרג
        </button>
      </div>
    </aside>
  );
}
