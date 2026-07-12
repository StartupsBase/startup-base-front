"use client"

import { useEffect, useRef } from "react"

const HOTSPOT = { x: 19, y: 19 }
const LINK_SELECTOR = "a[href], [role='link']"

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const pointerQuery = window.matchMedia("(any-pointer: fine)")

    function moveCursor(event: MouseEvent) {
      if (!pointerQuery.matches) {
        return
      }

      const cursor = cursorRef.current

      if (!cursor) {
        return
      }

      const target = document.elementFromPoint(
        event.clientX,
        event.clientY
      )
      const isLink = Boolean(target?.closest(LINK_SELECTOR))

      cursor.style.opacity = "1"
      cursor.dataset.mode = isLink ? "link" : "default"
      cursor.querySelector<HTMLSpanElement>(".humayro-custom-cursor-label")?.style.setProperty(
        "opacity",
        isLink ? "1" : "0"
      )
      cursor.style.transform = `translate3d(${event.clientX - HOTSPOT.x}px, ${event.clientY - HOTSPOT.y}px, 0)`
    }

    function hideCursor() {
      if (cursorRef.current) {
        cursorRef.current.style.opacity = "0"
      }
    }

    document.addEventListener("mousemove", moveCursor)
    window.addEventListener("blur", hideCursor)

    return () => {
      document.removeEventListener("mousemove", moveCursor)
      window.removeEventListener("blur", hideCursor)
    }
  }, []);


  return (
    <>
      <style jsx global>{`
        @media (any-pointer: fine) {
          html,
          html *,
          html *::before,
          html *::after {
            cursor: none !important;
          }

          .humayro-custom-cursor[data-mode="link"] .humayro-custom-cursor-label {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div
        ref={cursorRef}
        data-mode="default"
        aria-hidden="true"
        className="humayro-custom-cursor pointer-events-none fixed top-0 left-0.5 z-2147483647 h-[20px] w-[20px] opacity-0"
      >
        <img
          src="/brand/quill-cursor.png"
          alt=""
          draggable="false"
          className="h-full w-full select-none"
        />
      </div>
    </>
  )
}
