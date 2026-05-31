import * as React from "react"

interface ShippingNotificationEmailProps {
  customerName: string
  orderNumber: string
}

export function ShippingNotificationEmail({
  customerName,
  orderNumber,
}: ShippingNotificationEmailProps) {
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
            LUMIERE
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
            Your order is on its way!
          </h2>
          <p
            style={{
              fontSize: "15px",
              lineHeight: "24px",
              color: "#a8a294",
              margin: "0 0 32px 0",
            }}
          >
            Hi {customerName}, great news — your order has been shipped and
            is heading to you.
          </p>

          {/* Order info */}
          <div
            style={{
              backgroundColor: "#1a1a16",
              borderRadius: "6px",
              padding: "20px",
              marginBottom: "32px",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                textTransform: "uppercase" as const,
                letterSpacing: "1px",
                color: "#7a7568",
                margin: "0 0 4px 0",
              }}
            >
              Order Number
            </p>
            <p
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#f5f0e8",
                margin: 0,
              }}
            >
              {orderNumber}
            </p>
          </div>

          <div
            style={{
              backgroundColor: "#1a1a16",
              borderRadius: "6px",
              padding: "20px",
              marginBottom: "32px",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                textTransform: "uppercase" as const,
                letterSpacing: "1px",
                color: "#7a7568",
                margin: "0 0 8px 0",
              }}
            >
              Estimated Delivery
            </p>
            <p
              style={{
                fontSize: "15px",
                lineHeight: "22px",
                color: "#f5f0e8",
                margin: 0,
              }}
            >
              Your order will typically arrive within 2-5 business days
              depending on your location. We will send you another
              notification once it has been delivered.
            </p>
          </div>

          <p
            style={{
              fontSize: "14px",
              lineHeight: "22px",
              color: "#a8a294",
              margin: 0,
            }}
          >
            If you have any questions about your delivery, simply reply to
            this email and our team will assist you.
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
            Lumiere Lighting &middot; Kigali, Rwanda
            <br />
            &copy; {new Date().getFullYear()} Lumiere. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
