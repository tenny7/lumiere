"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils/format"

export type ReceiptData = {
  storeName: string
  storeEmail: string
  storePhone: string
  storeAddress: string
  /** "receipt" only once payment was received; otherwise "invoice". */
  docType: "receipt" | "invoice"
  /** e.g. "Paid", "Payment pending", "Cancelled". */
  statusLabel: string
  paidOn: string | null
  paidVia: string
  /** "Total paid" / "Amount due" / "Total". */
  totalLabel: string
  orderNumber: string
  createdAt: string
  currency: string
  billToName: string
  billToEmail: string
  billToAddress: string
  billToPhone: string
  items: {
    name: string
    sku: string | null
    quantity: number
    unitPrice: number
    totalPrice: number
  }[]
  subtotal: number
  discount: number
  deliveryFee: number
  tax: number
  total: number
}

const AMBER: [number, number, number] = [245, 158, 11]
const INK: [number, number, number] = [26, 26, 26]
const GREY: [number, number, number] = [120, 120, 120]
const LINE: [number, number, number] = [220, 220, 220]
const PAID: [number, number, number] = [4, 120, 87]
const PENDING: [number, number, number] = [180, 83, 9]

export function ReceiptPdfButton({ data }: { data: ReceiptData }) {
  const [busy, setBusy] = useState(false)

  async function download() {
    setBusy(true)
    try {
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF({ unit: "mm", format: "a4" })
      const L = 18 // left margin
      const R = 192 // right edge
      const cur = data.currency
      let y = 22

      // Brand
      doc.setFont("helvetica", "bold")
      doc.setFontSize(18)
      doc.setTextColor(...INK)
      doc.text(data.storeName, L, y)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(...GREY)
      let sy = y + 6
      for (const line of [data.storeAddress, data.storeEmail, data.storePhone]) {
        if (line) {
          doc.text(line, L, sy)
          sy += 4.5
        }
      }

      // Receipt meta (right)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      const isReceipt = data.docType === "receipt"
      doc.setTextColor(...AMBER)
      doc.text(isReceipt ? "RECEIPT" : "INVOICE", R, y - 4, { align: "right" })
      doc.setTextColor(...INK)
      doc.setFontSize(12)
      doc.text(data.orderNumber, R, y + 1, { align: "right" })
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(...GREY)
      doc.text(formatDate(data.createdAt), R, y + 6, { align: "right" })
      doc.setFont("helvetica", "bold")
      doc.setTextColor(...(isReceipt ? PAID : PENDING))
      doc.text(data.statusLabel.toUpperCase(), R, y + 10.5, { align: "right" })
      doc.setFont("helvetica", "normal")

      y = Math.max(sy, y + 14) + 6

      // Bill to
      doc.setFont("helvetica", "bold")
      doc.setFontSize(8)
      doc.setTextColor(...GREY)
      doc.text("BILL TO", L, y)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.setTextColor(...INK)
      y += 5
      doc.text(data.billToName || "Customer", L, y)
      doc.setFontSize(9)
      doc.setTextColor(...GREY)
      for (const line of [
        data.billToEmail,
        data.billToAddress,
        data.billToPhone,
      ]) {
        if (line) {
          y += 4.5
          doc.text(line, L, y)
        }
      }

      // Items header
      y += 10
      doc.setDrawColor(...LINE)
      doc.setLineWidth(0.3)
      doc.line(L, y, R, y)
      y += 5
      doc.setFont("helvetica", "bold")
      doc.setFontSize(8)
      doc.setTextColor(...GREY)
      doc.text("ITEM", L, y)
      doc.text("QTY", 120, y, { align: "center" })
      doc.text("UNIT", 160, y, { align: "right" })
      doc.text("AMOUNT", R, y, { align: "right" })
      y += 3
      doc.line(L, y, R, y)
      y += 6

      // Items
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      for (const it of data.items) {
        if (y > 260) {
          doc.addPage()
          y = 22
        }
        doc.setTextColor(...INK)
        const nameLines = doc.splitTextToSize(it.name, 92) as string[]
        doc.text(nameLines[0], L, y)
        doc.setTextColor(...INK)
        doc.text(String(it.quantity), 120, y, { align: "center" })
        doc.text(formatCurrency(it.unitPrice, cur), 160, y, { align: "right" })
        doc.text(formatCurrency(it.totalPrice, cur), R, y, { align: "right" })
        if (it.sku) {
          y += 4
          doc.setTextColor(...GREY)
          doc.setFontSize(7.5)
          doc.text(it.sku, L, y)
          doc.setFontSize(9)
        }
        y += 6.5
        doc.setDrawColor(...LINE)
        doc.setLineWidth(0.1)
        doc.line(L, y - 3, R, y - 3)
      }

      // Totals
      y += 2
      const tx = 150
      const rows: [string, string][] = [
        ["Subtotal", formatCurrency(data.subtotal, cur)],
      ]
      if (data.discount > 0)
        rows.push(["Discount", `-${formatCurrency(data.discount, cur)}`])
      rows.push([
        "Delivery",
        data.deliveryFee > 0 ? formatCurrency(data.deliveryFee, cur) : "Free",
      ])
      if (data.tax > 0) rows.push(["Tax", formatCurrency(data.tax, cur)])

      doc.setFontSize(9)
      for (const [label, val] of rows) {
        doc.setTextColor(...GREY)
        doc.text(label, tx, y)
        doc.setTextColor(...INK)
        doc.text(val, R, y, { align: "right" })
        y += 5.5
      }
      doc.setDrawColor(...LINE)
      doc.setLineWidth(0.3)
      doc.line(tx, y - 2, R, y - 2)
      y += 3
      doc.setFont("helvetica", "bold")
      doc.setFontSize(11)
      doc.setTextColor(...INK)
      doc.text(data.totalLabel, tx, y)
      doc.text(formatCurrency(data.total, cur), R, y, { align: "right" })

      // Payment line: when and how it was paid, or that it isn't paid yet.
      y += 12
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      if (isReceipt) {
        doc.setTextColor(...PAID)
        doc.text(
          `Paid${data.paidOn ? ` on ${formatDate(data.paidOn)}` : ""}${
            data.paidVia ? ` via ${data.paidVia}` : ""
          }.`,
          L,
          y,
        )
      } else if (data.statusLabel === "Payment pending") {
        doc.setTextColor(...PENDING)
        doc.text(
          "Payment pending. This invoice is not proof of payment; a receipt is issued once payment is confirmed.",
          L,
          y,
          { maxWidth: R - L },
        )
      }

      // Footer
      y += 16
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(...GREY)
      doc.text("Thank you for your business.", 105, y, { align: "center" })
      if (data.storeEmail) {
        y += 4.5
        doc.text(`${data.storeName} · ${data.storeEmail}`, 105, y, {
          align: "center",
        })
      }

      doc.save(`${data.docType}-${data.orderNumber}.pdf`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={download}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
    >
      <Download className="h-4 w-4" />
      {busy
        ? "Preparing…"
        : data.docType === "receipt"
          ? "Download Receipt (PDF)"
          : "Download Invoice (PDF)"}
    </button>
  )
}
