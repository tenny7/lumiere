import * as React from "react"

interface WelcomeEmailProps {
  customerName: string
  appUrl: string
}

export function WelcomeEmail({ customerName, appUrl }: WelcomeEmailProps) {
  return (
    <div
      style={{
        fontFamily:
          "'Helvetica Neue', Helvetica, Arial, sans-serif",
        backgroundColor: "#0a0a08",
        color: "#f5f0e8",
        padding: "40px 20px",
        margin: 0,
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          backgroundColor: "#141410",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "32px 40px",
            borderBottom: "1px solid #2a2a24",
            textAlign: "center" as const,
          }}
        >
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 300,
              letterSpacing: "6px",
              color: "#c9a96e",
              margin: 0,
            }}
          >
            AJABU LIGHTING
          </h1>
        </div>

        {/* Body */}
        <div style={{ padding: "40px" }}>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: 400,
              color: "#f5f0e8",
              margin: "0 0 8px 0",
            }}
          >
            Welcome, {customerName}!
          </h2>
          <p
            style={{
              fontSize: "15px",
              lineHeight: "24px",
              color: "#a8a294",
              margin: "0 0 24px 0",
            }}
          >
            Thank you for joining Ajabu Lighting. We curate premium lighting
            fixtures that transform spaces — from elegant chandeliers to
            modern pendants, every piece is selected for quality and design.
          </p>
          <p
            style={{
              fontSize: "15px",
              lineHeight: "24px",
              color: "#a8a294",
              margin: "0 0 32px 0",
            }}
          >
            Browse our collection and find the perfect lighting for your
            home or project.
          </p>

          {/* CTA Button */}
          <div style={{ textAlign: "center" as const, marginBottom: "32px" }}>
            <a
              href={appUrl}
              style={{
                display: "inline-block",
                backgroundColor: "#c9a96e",
                color: "#0a0a08",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
                padding: "14px 32px",
                borderRadius: "6px",
                letterSpacing: "0.5px",
              }}
            >
              Start Shopping
            </a>
          </div>

          <p
            style={{
              fontSize: "14px",
              lineHeight: "22px",
              color: "#a8a294",
              margin: 0,
            }}
          >
            If you have any questions, simply reply to this email — we are
            always happy to help.
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "24px 40px",
            borderTop: "1px solid #2a2a24",
            textAlign: "center" as const,
          }}
        >
          <p
            style={{
              fontSize: "12px",
              color: "#5a5548",
              margin: 0,
              lineHeight: "20px",
            }}
          >
            Ajabu Lighting &middot; Kigali, Rwanda
            <br />
            &copy; {new Date().getFullYear()} Ajabu Lighting. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
