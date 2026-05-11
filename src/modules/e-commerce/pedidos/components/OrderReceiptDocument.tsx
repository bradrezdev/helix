import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { formatOrderStatus, formatPaymentMethod, formatShippingMethod } from '../../../../lib/formatters.ts'
import type { OrderReceiptPDFProps } from './OrderReceiptPDF.tsx'

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#383A3F',
    padding: 40,
    backgroundColor: '#FFFFFF',
  },
  // Header
  header: {
    marginBottom: 24,
    borderBottom: '2px solid #062A63',
    paddingBottom: 12,
  },
  brandName: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#062A63',
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#0CBCE5',
    marginTop: 2,
  },
  // Section
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#062A63',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    borderBottom: '1px solid #EAECF0',
    paddingBottom: 3,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  labelCol: {
    width: 120,
    color: '#9CA3AF',
  },
  valueCol: {
    flex: 1,
    color: '#383A3F',
  },
  // Table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#062A63',
    padding: '5 6',
    borderRadius: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    padding: '4 6',
    borderBottom: '1px solid #F1F5F9',
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: '4 6',
    borderBottom: '1px solid #F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  tableHeaderText: {
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    fontSize: 9,
  },
  // Totals
  totalsBox: {
    marginTop: 8,
    backgroundColor: '#F8FAFC',
    padding: '8 10',
    borderRadius: 6,
    border: '1px solid #EAECF0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  totalLabel: {
    color: '#9CA3AF',
    fontSize: 9,
  },
  totalValue: {
    fontFamily: 'Helvetica-Bold',
    color: '#062A63',
  },
  grandTotalLabel: {
    fontFamily: 'Helvetica-Bold',
    color: '#062A63',
    fontSize: 11,
  },
  grandTotalValue: {
    fontFamily: 'Helvetica-Bold',
    color: '#062A63',
    fontSize: 11,
  },
  accentValue: {
    fontFamily: 'Helvetica-Bold',
    color: '#0CBCE5',
  },
  // Footer
  footer: {
    marginTop: 32,
    borderTop: '1px solid #EAECF0',
    paddingTop: 12,
    alignItems: 'center',
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 9,
    textAlign: 'center',
  },
  footerBrand: {
    color: '#062A63',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    marginTop: 2,
  },
  emptyRow: {
    padding: '8 6',
    color: '#9CA3AF',
    textAlign: 'center',
  },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMXN(amount: number | null | undefined): string {
  if (amount == null) return '$—'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

// ─── OrderReceiptDocument ─────────────────────────────────────────────────────

export function OrderReceiptDocument({
  order,
  items,
  user,
  cediName,
}: OrderReceiptPDFProps) {
  const shippingData = order.shipping_data as Parameters<typeof formatShippingMethod>[0]
  const shippingLabel = formatShippingMethod(shippingData, cediName)
  const fullName = [user.name, user.apellidos].filter(Boolean).join(' ')

  const colWidths = { product: '50%', qty: '12%', unitPrice: '19%', total: '19%' }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandName}>ONANO</Text>
          <Text style={styles.brandSubtitle}>Nota de Recibo</Text>
        </View>

        {/* Order info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de la Orden</Text>
          <View style={styles.row}>
            <Text style={styles.labelCol}>Orden #</Text>
            <Text style={styles.valueCol}>{order.order_id ?? '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCol}>Fecha</Text>
            <Text style={styles.valueCol}>{formatDateShort(order.created_at)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCol}>Estado</Text>
            <Text style={styles.valueCol}>{formatOrderStatus(order.status)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCol}>Método de pago</Text>
            <Text style={styles.valueCol}>{formatPaymentMethod(order.payment_method)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCol}>Envío</Text>
            <Text style={styles.valueCol}>{shippingLabel}</Text>
          </View>
        </View>

        {/* Customer info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <View style={styles.row}>
            <Text style={styles.labelCol}>Nombre</Text>
            <Text style={styles.valueCol}>{fullName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCol}>Socio ID</Text>
            <Text style={styles.valueCol}>{user.user_id}</Text>
          </View>
        </View>

        {/* Products table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Productos</Text>
          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { width: colWidths.product }]}>Producto</Text>
            <Text style={[styles.tableHeaderText, { width: colWidths.qty, textAlign: 'center' }]}>Cant.</Text>
            <Text style={[styles.tableHeaderText, { width: colWidths.unitPrice, textAlign: 'right' }]}>P. Unit.</Text>
            <Text style={[styles.tableHeaderText, { width: colWidths.total, textAlign: 'right' }]}>Subtotal</Text>
          </View>

          {/* Rows */}
          {items.length === 0 ? (
            <Text style={styles.emptyRow}>Sin productos</Text>
          ) : (
            items.map((item, idx) => (
              <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={{ width: colWidths.product, fontSize: 9 }}>
                  {item.product_name ?? item.product_code}
                </Text>
                <Text style={{ width: colWidths.qty, fontSize: 9, textAlign: 'center' }}>
                  {item.quantity}
                </Text>
                <Text style={{ width: colWidths.unitPrice, fontSize: 9, textAlign: 'right' }}>
                  {formatMXN(item.unit_price)}
                </Text>
                <Text style={{ width: colWidths.total, fontSize: 9, textAlign: 'right' }}>
                  {formatMXN(item.total_amount)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Totals */}
        <View style={styles.totalsBox}>
          {(order.shipping_cost != null && order.shipping_cost > 0) && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Envío</Text>
              <Text style={styles.totalValue}>{formatMXN(order.shipping_cost)}</Text>
            </View>
          )}
          {(order.tax_amount != null && order.tax_amount > 0) && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                {order.tax_label ?? 'Tax'}
                {order.tax_rate != null ? ` (${(order.tax_rate * 100).toFixed(0)}%)` : ''}
              </Text>
              <Text style={styles.totalValue}>{formatMXN(order.tax_amount)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatMXN(order.total_amount)}</Text>
          </View>
          {order.pv != null && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>PV Total</Text>
              <Text style={styles.accentValue}>{order.pv} PV</Text>
            </View>
          )}
          {order.cv != null && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>CV Total</Text>
              <Text style={styles.accentValue}>{order.cv} CV</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Gracias por tu compra</Text>
          <Text style={styles.footerBrand}>ONANO — {formatDateShort(order.created_at)}</Text>
        </View>
      </Page>
    </Document>
  )
}
