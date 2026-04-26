"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const NativeCampModal = dynamic(
  () =>
    import("@/components/native-camp-modal").then((m) => ({
      default: m.NativeCampModal,
    })),
  { ssr: false },
);

export function DashboardAutoCheck({
  hasNativeCampToday,
}: {
  hasNativeCampToday: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (hasNativeCampToday) return;
    const today = new Date().toISOString().split("T")[0];
    const key = `nc_checked_${today}`;
    if (!localStorage.getItem(key)) {
      setOpen(true);
    }
  }, [hasNativeCampToday]);

  function handleClose() {
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem(`nc_checked_${today}`, "1");
    setOpen(false);
  }

  return <NativeCampModal open={open} onClose={handleClose} />;
}
