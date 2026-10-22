import { Suspense } from "react"
import { FinishSignIn } from "./finish-sign-in"

export default function SigningInPage() {
  return (
    <Suspense>
      <FinishSignIn />
    </Suspense>
  )
}
