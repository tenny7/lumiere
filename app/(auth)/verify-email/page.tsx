import Link from "next/link"

export default function VerifyEmailPage() {
  return (
    <div className="text-center">
      <h1 className="font-serif text-2xl font-light mb-2">
        Check your email
      </h1>
      <p className="text-sm text-[#8a8478] mb-8 leading-relaxed">
        We sent you a verification link. Click it to activate your account and
        start shopping for beautiful lights.
      </p>
      <Link
        href="/login"
        className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
      >
        &larr; Back to sign in
      </Link>
    </div>
  )
}
