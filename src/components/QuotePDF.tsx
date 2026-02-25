import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Cotizacion, PerfilEmpresa } from '../types';

// Registrar fuentes si es necesario, pero usaremos las estándar por simplicidad y peso
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottom: 2,
    borderBottomColor: '#1a1a1a',
    paddingBottom: 10,
  },
  logoSection: {
    width: '50%',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    objectFit: 'contain',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  companyDetails: {
    fontSize: 9,
    color: '#666',
    lineHeight: 1.4,
  },
  quoteInfo: {
    width: '40%',
    textAlign: 'right',
  },
  quoteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f27d26',
    marginBottom: 4,
  },
  clientSection: {
    marginBottom: 25,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    color: '#1a1a1a',
  },
  table: {
    display: 'flex',
    width: 'auto',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 6,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 6,
    alignItems: 'center',
  },
  colDesc: { width: '60%' },
  colDescFull: { width: '90%' },
  colQty: { width: '10%', textAlign: 'center' },
  colPrice: { width: '15%', textAlign: 'right' },
  colTotal: { width: '15%', textAlign: 'right' },
  
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  totalsBox: {
    width: '30%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  grandTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#1a1a1a',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    textAlign: 'center',
    color: '#999',
    fontSize: 8,
  },
  observations: {
    marginTop: 30,
    padding: 10,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 4,
  }
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(value);
};

export const QuotePDF = ({ quote, perfil, mostrarPrecios = true }: { quote: Cotizacion; perfil?: PerfilEmpresa; mostrarPrecios?: boolean }) => {
  const companyName = perfil?.nombre_empresa || 'CONSTRUCTOR INTEGRAL';
  const companyAddress = perfil?.direccion || 'Villarrica - Ñancul, Chile';
  const companyGiro = perfil?.giro || 'Construcción | Estructuras | Electricidad';
  const companyPhone = perfil?.telefono || '+56 9 XXXX XXXX';
  const companyRut = perfil?.rut_empresa;
  const logoUrl = perfil?.logo_url;

  return (
  <Document>
    <Page size="LETTER" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoSection}>
          {logoUrl && (
            <Image
              src={logoUrl}
              style={styles.logo}
            />
          )}
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{companyName.toUpperCase()}</Text>
            {companyRut && <Text style={styles.companyDetails}>RUT: {companyRut}</Text>}
            <Text style={styles.companyDetails}>{companyAddress}</Text>
            <Text style={styles.companyDetails}>{companyGiro}</Text>
            <Text style={styles.companyDetails}>Tel: {companyPhone}</Text>
          </View>
        </View>
        <View style={styles.quoteInfo}>
          <Text style={styles.quoteTitle}>COTIZACIÓN</Text>
          <Text>N°: {quote.numero_cotizacion || '---'}</Text>
          <Text>Fecha: {format(new Date(quote.fecha), 'dd/MM/yyyy')}</Text>
        </View>
      </View>

      {/* Client Info */}
      <View style={styles.clientSection}>
        <Text style={styles.sectionTitle}>Cliente</Text>
        <Text style={{ fontWeight: 'bold', fontSize: 12 }}>{quote.cliente?.nombre}</Text>
        {quote.cliente?.rut && <Text>RUT: {quote.cliente.rut}</Text>}
        {quote.cliente?.direccion && <Text>Dirección: {quote.cliente.direccion}</Text>}
        {quote.cliente?.telefono && <Text>Teléfono: {quote.cliente.telefono}</Text>}
      </View>

      {/* Project Name */}
      {quote.nombre && (
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sectionTitle}>Proyecto</Text>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#f27d26' }}>{quote.nombre}</Text>
        </View>
      )}

      {/* Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={mostrarPrecios ? styles.colDesc : styles.colDescFull}>Descripción</Text>
          {mostrarPrecios && (
            <>
              <Text style={styles.colQty}>Cant.</Text>
              <Text style={styles.colPrice}>Unitario</Text>
              <Text style={styles.colTotal}>Subtotal</Text>
            </>
          )}
          {!mostrarPrecios && <Text style={styles.colQty}>Cant.</Text>}
        </View>
        {quote.items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={mostrarPrecios ? styles.colDesc : styles.colDescFull}>{item.descripcion}</Text>
            {mostrarPrecios && (
              <>
                <Text style={styles.colQty}>{item.cantidad}</Text>
                <Text style={styles.colPrice}>{formatCurrency(item.precio_unitario)}</Text>
                <Text style={styles.colTotal}>{formatCurrency(item.subtotal)}</Text>
              </>
            )}
            {!mostrarPrecios && <Text style={styles.colQty}>{item.cantidad}</Text>}
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalsSection}>
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text>{formatCurrency(quote.total)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.totalLabel}>TOTAL:</Text>
            <Text>{formatCurrency(quote.total)}</Text>
          </View>
        </View>
      </View>

      {/* Observations */}
      {quote.observaciones && (
        <View style={styles.observations}>
          <Text style={styles.sectionTitle}>Observaciones y Condiciones</Text>
          <Text style={{ lineHeight: 1.4 }}>{quote.observaciones}</Text>
        </View>
      )}

      {/* Footer */}
      <Text style={styles.footer}>
        Esta cotización es un presupuesto estimativo. Los precios pueden variar según condiciones del mercado.
        Gracias por su confianza.
      </Text>
    </Page>
  </Document>
  );
};
