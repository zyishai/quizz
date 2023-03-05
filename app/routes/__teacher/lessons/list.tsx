import { useEffect } from "react";
import { commitClientPrefs, useClientPrefs } from "~/utils/client-prefs";

export default function LessonsListView() {
  const clientPrefs = useClientPrefs();

  useEffect(() => {
    clientPrefs.lastLessonsView = "list";
    commitClientPrefs(clientPrefs);
  }, []);

  return null;
}
