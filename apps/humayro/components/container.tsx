import type { ReactNode } from "react"

const Container = ({ children }: { children: ReactNode }) => {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-5 md:px-10">
      {children}
    </div>
  )
}

export default Container
