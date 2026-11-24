"use client";

import dynamic from "next/dynamic";
import { Loader } from "./Loader";
import { Chrome } from "./Chrome";
import { Markers } from "./Markers";

const Experience = dynamic(() => import("@/components/experience/Experience"), { ssr: false });

/** Couches persistantes : elles survivent aux navigations entre pages. */
export function Stage() {
  return (
    <>
      <Experience />
      <Markers />
      <Chrome />
      <Loader />
    </>
  );
}
