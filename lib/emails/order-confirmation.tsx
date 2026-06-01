import * as React from "react"

interface OrderItem {
  name: string
  quantity: number
  unitPrice: number
  total: number
}

interface ShippingAddress {
  fullName: string
  line1: string
  city: string
  region: string
}

interface OrderConfirmationEmailProps {
  customerName: string
  orderNumber: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  shippingAddress: ShippingAddress
}

export function OrderConfirmationEmail({
  customerName,
  orderNumber,
  items,
  subtotal,
  deliveryFee,
  total,
  shippingAddress,
}: OrderConfirmationEmailProps) {
  const orderDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

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
            Thank you, {customerName}!
          </h2>
          <p
            style={{
              fontSize: "15px",
              lineHeight: "24px",
              color: "#a8a294",
              margin: "0 0 32px 0",
            }}
          >
            Your order has been confirmed and is being prepared.
          </p>

          {/* Order meta */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "24px",
            }}
          >
            <div>
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
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#f5f0e8",
                  margin: 0,
                }}
              >
                {orderNumber}
              </p>
            </div>
            <div style={{ textAlign: "right" as const }}>
              <p
                style={{
                  fontSize: "12px",
                  textTransform: "uppercase" as const,
                  letterSpacing: "1px",
                  color: "#7a7568",
                  margin: "0 0 4px 0",
                }}
              >
                Order Date
              </p>
              <p
                style={{
                  fontSize: "15px",
                  color: "#f5f0e8",
                  margin: 0,
                }}
              >
                {orderDate}
              </p>
            </div>
          </div>

          {/* Items table */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse" as const,
              marginBottom: "24px",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left" as const,
                    fontSize: "11px",
                    textTransform: "uppercase" as const,
                    letterSpacing: "1px",
                    color: "#7a7568",
                    padding: "8px 0",
                    borderBottom: "1px solid #2a2a24",
                  }}
                >
                  Item
                </th>
                <th
                  style={{
                    textAlign: "center" as const,
                    fontSize: "11px",
                    textTransform: "uppercase" as const,
                    letterSpacing: "1px",
                    color: "#7a7568",
                    padding: "8px 0",
                    borderBottom: "1px solid #2a2a24",
                  }}
                >
                  Qty
                </th>
                <th
                  style={{
                    textAlign: "right" as const,
                    fontSize: "11px",
                    textTransform: "uppercase" as const,
                    letterSpacing: "1px",
                    color: "#7a7568",
                    padding: "8px 0",
                    borderBottom: "1px solid #2a2a24",
                  }}
                >
                  Price
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td
                    style={{
                      fontSize: "14px",
                      color: "#f5f0e8",
                      padding: "12px 0",
                      borderBottom: "1px solid #1e1e1a",
                    }}
                  >
                    {item.name}
                  </td>
                  <td
                    style={{
                      fontSize: "14px",
                      color: "#a8a294",
                      textAlign: "center" as const,
                      padding: "12px 0",
                      borderBottom: "1px solid #1e1e1a",
                    }}
                  >
                    {item.quantity}
                  </td>
                  <td
                    style={{
                      fontSize: "14px",
                      color: "#f5f0e8",
                      textAlign: "right" as const,
                      padding: "12px 0",
                      borderBottom: "1px solid #1e1e1a",
                    }}
                  >
                    RWF {item.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ marginBottom: "32px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
              }}
            >
              <span style={{ fontSize: "14px", color: "#a8a294" }}>
                Subtotal
              </span>
              <span style={{ fontSize: "14px", color: "#f5f0e8" }}>
                RWF {subtotal.toFixed(2)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
              }}
            >
              <span style={{ fontSize: "14px", color: "#a8a294" }}>
                Delivery
              </span>
              <span style={{ fontSize: "14px", color: "#f5f0e8" }}>
                RWF {deliveryFee.toFixed(2)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 0 0 0",
                borderTop: "1px solid #2a2a24",
                marginTop: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#f5f0e8",
                }}
              >
                Total
              </span>
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#c9a96e",
                }}
              >
                RWF {total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Shipping address */}
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
              Shipping Address
            </p>
            <p
              style={{
                fontSize: "14px",
                lineHeight: "22px",
                color: "#f5f0e8",
                margin: 0,
              }}
            >
              {shippingAddress.fullName}
              <br />
              {shippingAddress.line1}
              <br />
              {shippingAddress.city}, {shippingAddress.region}
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
            We will notify you when your order ships. If you have any
            questions, reply to this email and we will be happy to help.
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
