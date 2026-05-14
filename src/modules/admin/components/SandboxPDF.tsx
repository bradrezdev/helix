import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SandboxResults {
  generatedAt: string
  config: {
    directosPorPersona: number
    nivelesProfundidad: number
    pvPorPersona: number
    cvPorPersona: number
  }
  network: number
  vgTotal: number
  rango: string
  patrocinio: { level1: number; level2: number; level3: number; total: number }
  infinitoPatrocinio: number
  unilevelTotal: number
  infinitoUnilevel: number
  matchTotal: number
  total: number
  unilevel: { level: number; personas: number; pv: number; cv: number; bono: number }[]
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 18,
    marginBottom: 6,
    color: '#062A63',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 9,
    marginBottom: 20,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 12,
    marginTop: 16,
    marginBottom: 8,
    color: '#062A63',
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
    paddingBottom: 4,
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
    paddingVertical: 4,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#062A63',
    paddingVertical: 4,
    backgroundColor: '#F2F4F9',
  },
  cell: {
    flex: 1,
    fontSize: 9,
    paddingHorizontal: 4,
  },
  cellRight: {
    flex: 1,
    fontSize: 9,
    paddingHorizontal: 4,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
    paddingVertical: 4,
    marginTop: 4,
  },
  totalLabel: {
    flex: 1,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#062A63',
  },
  totalValue: {
    flex: 1,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#059669',
    textAlign: 'right',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#374151',
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#062A63',
  },
  grandTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#062A63',
    textAlign: 'right',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#062A63',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EAECF0',
    paddingTop: 6,
  },
})

// ─── Formatting ──────────────────────────────────────────────────────────────

function fmt(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(val)
}

function fmtNum(val: number): string {
  return new Intl.NumberFormat('en-US').format(val)
}

// ─── PDF Document ────────────────────────────────────────────────────────────

function SandboxPdfDocument({ results }: { results: SandboxResults }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.header}>Simulador de Ganancias</Text>
        <Text style={styles.subtitle}>
          Generado: {results.generatedAt} | Config: {results.config.directosPorPersona} directos × {results.config.nivelesProfundidad} niveles
        </Text>

        {/* Network Summary */}
        <Text style={styles.sectionTitle}>Resumen de Red</Text>
        <View style={styles.table}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total personas en la red</Text>
            <Text style={styles.summaryValue}>{fmtNum(results.network)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>VG Total (Group Volume)</Text>
            <Text style={styles.summaryValue}>{fmtNum(results.vgTotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Rango alcanzado</Text>
            <Text style={styles.summaryValue}>{results.rango}</Text>
          </View>
        </View>

        {/* Per-Bono Breakdown */}
        <Text style={styles.sectionTitle}>Desglose de Bonos</Text>
        <View style={styles.table}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Bono Patrocinio</Text>
            <Text style={styles.summaryValue}>{fmt(results.patrocinio.total)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>  Nivel 1 (25%)</Text>
            <Text style={styles.summaryValue}>{fmt(results.patrocinio.level1)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>  Nivel 2 (15%)</Text>
            <Text style={styles.summaryValue}>{fmt(results.patrocinio.level2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>  Nivel 3 (5%)</Text>
            <Text style={styles.summaryValue}>{fmt(results.patrocinio.level3)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Bono Unilevel</Text>
            <Text style={styles.summaryValue}>{fmt(results.unilevelTotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Bono Match</Text>
            <Text style={styles.summaryValue}>{fmt(results.matchTotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Bono Infinito Patrocinio</Text>
            <Text style={styles.summaryValue}>{fmt(results.infinitoPatrocinio)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Bono Infinito Uninivel</Text>
            <Text style={styles.summaryValue}>{fmt(results.infinitoUnilevel)}</Text>
          </View>
        </View>

        {/* Grand Total */}
        <Text style={styles.grandTotal}>Total estimado: {fmt(results.total)}</Text>

        {/* Unilevel Detail Table */}
        {results.unilevel.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Detalle Bono Uninivel</Text>
            <View style={styles.table}>
              <View style={styles.headerRow}>
                <Text style={styles.cell}>Nivel</Text>
                <Text style={styles.cellRight}>Personas</Text>
                <Text style={styles.cellRight}>PV</Text>
                <Text style={styles.cellRight}>CV</Text>
                <Text style={styles.cellRight}>Bono</Text>
              </View>
              {results.unilevel.map((row) => (
                <View key={row.level} style={styles.row}>
                  <Text style={styles.cell}>{row.level}</Text>
                  <Text style={styles.cellRight}>{fmtNum(row.personas)}</Text>
                  <Text style={styles.cellRight}>{fmtNum(row.pv)}</Text>
                  <Text style={styles.cellRight}>{fmtNum(row.cv)}</Text>
                  <Text style={styles.cellRight}>{fmt(row.bono)}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Uninivel</Text>
                <Text style={styles.totalValue}>{fmt(results.unilevelTotal)}</Text>
              </View>
            </View>
          </>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Estimado ilustrativo. Los resultados reales dependen del desempeño de la red.
          Generado el {results.generatedAt} desde el Simulador de Ganancias ONANO.
        </Text>
      </Page>
    </Document>
  )
}

// ─── Export Wrapper ──────────────────────────────────────────────────────────

interface SandboxPDFProps {
  results: SandboxResults
  disabled?: boolean
}

export function SandboxPDF({ results, disabled = false }: SandboxPDFProps) {
  if (disabled) {
    return (
      <span
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold opacity-50 cursor-not-allowed"
        style={{ background: '#EAECF0', color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
      >
        Exportar PDF
      </span>
    )
  }

  return (
    <PDFDownloadLink
      document={<SandboxPdfDocument results={results} />}
      fileName={`simulador-ganancias-${Date.now()}.pdf`}
    >
      {({ loading }) => (
        <span
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all active:scale-95 cursor-pointer"
          style={{
            background: loading ? '#9CA3AF' : '#062A63',
            fontFamily: 'Poppins, sans-serif',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Generando PDF...' : 'Exportar PDF'}
        </span>
      )}
    </PDFDownloadLink>
  )
}
