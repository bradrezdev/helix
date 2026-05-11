import { inputBase, inputStyle, Field } from '../../../auth/components/RegisterForm.tsx'

export interface ShippingAddress {
  country: string
  full_name: string
  street: string
  colonia?: string   // MX-specific: neighborhood/suburb
  city: string
  state: string
  zip: string
  phone: string
}

export interface ShippingAddressFormProps {
  value: ShippingAddress
  onChange: (address: ShippingAddress) => void
  defaultCountry?: string
}

const SHIPPING_COUNTRIES = [
  { value: 'MX', label: 'México' },
  { value: 'US', label: 'Estados Unidos' },
  { value: 'CO', label: 'Colombia' },
  { value: 'ES', label: 'España' },
]

const STATES_BY_COUNTRY: Record<string, { value: string; label: string }[]> = {
  MX: [
    { value: 'AGU', label: 'Aguascalientes' },
    { value: 'BCN', label: 'Baja California' },
    { value: 'BCS', label: 'Baja California Sur' },
    { value: 'CAM', label: 'Campeche' },
    { value: 'CHP', label: 'Chiapas' },
    { value: 'CHH', label: 'Chihuahua' },
    { value: 'CMX', label: 'Ciudad de México' },
    { value: 'COA', label: 'Coahuila' },
    { value: 'COL', label: 'Colima' },
    { value: 'DUR', label: 'Durango' },
    { value: 'GUA', label: 'Guanajuato' },
    { value: 'GRO', label: 'Guerrero' },
    { value: 'HID', label: 'Hidalgo' },
    { value: 'JAL', label: 'Jalisco' },
    { value: 'MEX', label: 'Estado de México' },
    { value: 'MIC', label: 'Michoacán' },
    { value: 'MOR', label: 'Morelos' },
    { value: 'NAY', label: 'Nayarit' },
    { value: 'NLE', label: 'Nuevo León' },
    { value: 'OAX', label: 'Oaxaca' },
    { value: 'PUE', label: 'Puebla' },
    { value: 'QUE', label: 'Querétaro' },
    { value: 'ROO', label: 'Quintana Roo' },
    { value: 'SLP', label: 'San Luis Potosí' },
    { value: 'SIN', label: 'Sinaloa' },
    { value: 'SON', label: 'Sonora' },
    { value: 'TAB', label: 'Tabasco' },
    { value: 'TAM', label: 'Tamaulipas' },
    { value: 'TLA', label: 'Tlaxcala' },
    { value: 'VER', label: 'Veracruz' },
    { value: 'YUC', label: 'Yucatán' },
    { value: 'ZAC', label: 'Zacatecas' },
  ],
  US: [
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'PR', label: 'Puerto Rico' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' },
  ],
  CO: [
    { value: 'ANT', label: 'Antioquia' },
    { value: 'ATL', label: 'Atlántico' },
    { value: 'BOG', label: 'Bogotá D.C.' },
    { value: 'BOL', label: 'Bolívar' },
    { value: 'BOY', label: 'Boyacá' },
    { value: 'CAL', label: 'Caldas' },
    { value: 'CAQ', label: 'Caquetá' },
    { value: 'CAU', label: 'Cauca' },
    { value: 'CES', label: 'Cesar' },
    { value: 'COR', label: 'Córdoba' },
    { value: 'CUN', label: 'Cundinamarca' },
    { value: 'CHO', label: 'Chocó' },
    { value: 'HUI', label: 'Huila' },
    { value: 'LAG', label: 'La Guajira' },
    { value: 'MAG', label: 'Magdalena' },
    { value: 'MET', label: 'Meta' },
    { value: 'NAR', label: 'Nariño' },
    { value: 'NSA', label: 'Norte de Santander' },
    { value: 'PUT', label: 'Putumayo' },
    { value: 'QUI', label: 'Quindío' },
    { value: 'RIS', label: 'Risaralda' },
    { value: 'SAN', label: 'Santander' },
    { value: 'SUC', label: 'Sucre' },
    { value: 'TOL', label: 'Tolima' },
    { value: 'VAC', label: 'Valle del Cauca' },
  ],
  ES: [
    { value: 'AN', label: 'Andalucía' },
    { value: 'AR', label: 'Aragón' },
    { value: 'AS', label: 'Asturias' },
    { value: 'IB', label: 'Islas Baleares' },
    { value: 'CN', label: 'Islas Canarias' },
    { value: 'CB', label: 'Cantabria' },
    { value: 'CM', label: 'Castilla-La Mancha' },
    { value: 'CL', label: 'Castilla y León' },
    { value: 'CT', label: 'Cataluña' },
    { value: 'EX', label: 'Extremadura' },
    { value: 'GA', label: 'Galicia' },
    { value: 'LR', label: 'La Rioja' },
    { value: 'MD', label: 'Madrid' },
    { value: 'MC', label: 'Murcia' },
    { value: 'NC', label: 'Navarra' },
    { value: 'PV', label: 'País Vasco' },
    { value: 'VC', label: 'Comunidad Valenciana' },
  ],
}

function getStateLabel(country: string): string {
  if (country === 'CO') return 'Departamento'
  if (country === 'ES') return 'Comunidad Autónoma'
  return 'Estado'
}

function getZipLabel(country: string): string {
  if (country === 'US') return 'ZIP Code'
  return 'Código Postal'
}

function useDropdown(country: string): boolean {
  return country === 'MX' || country === 'US' || country === 'ES'
}

export function ShippingAddressForm({ value, onChange, defaultCountry = 'MX' }: ShippingAddressFormProps) {
  const effectiveCountry = value.country || defaultCountry
  const showDropdown = useDropdown(effectiveCountry)
  const stateOptions = STATES_BY_COUNTRY[effectiveCountry] ?? []

  function set<K extends keyof ShippingAddress>(field: K, val: ShippingAddress[K]) {
    onChange({ ...value, [field]: val })
  }

  function handleCountryChange(newCountry: string) {
    onChange({ ...value, country: newCountry, state: '' })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Country */}
      <Field label="País">
        <select
          value={effectiveCountry}
          onChange={(e) => handleCountryChange(e.target.value)}
          className={`${inputBase} appearance-none`}
          style={{ ...inputStyle, color: effectiveCountry ? '#383A3F' : '#9CA3AF', background: '#fff' }}
        >
          {SHIPPING_COUNTRIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </Field>

      {/* Full name */}
      <Field label="Nombre completo">
        <input
          type="text"
          value={value.full_name}
          onChange={(e) => set('full_name', e.target.value)}
          placeholder="María García López"
          className={inputBase}
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#0CBCE5')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#EAECF0')}
        />
      </Field>

      {/* Street */}
      <Field label="Calle y número">
        <input
          type="text"
          value={value.street}
          onChange={(e) => set('street', e.target.value)}
          placeholder="Ej. Insurgentes Sur 1234"
          className={inputBase}
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#0CBCE5')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#EAECF0')}
        />
      </Field>

      {/* Colonia (MX only) */}
      {effectiveCountry === 'MX' && (
        <Field label="Colonia">
          <input
            type="text"
            value={value.colonia ?? ''}
            onChange={(e) => set('colonia', e.target.value)}
            placeholder="Col. Centro"
            className={inputBase}
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#0CBCE5')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#EAECF0')}
          />
        </Field>
      )}

      {/* City */}
      <Field label="Ciudad">
        <input
          type="text"
          value={value.city}
          onChange={(e) => set('city', e.target.value)}
          placeholder="Ej. Ciudad de México"
          className={inputBase}
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#0CBCE5')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#EAECF0')}
        />
      </Field>

      {/* State / Province */}
      <Field label={getStateLabel(effectiveCountry)}>
        {showDropdown ? (
          <select
            value={value.state}
            onChange={(e) => set('state', e.target.value)}
            className={`${inputBase} appearance-none`}
            style={{ ...inputStyle, color: value.state ? '#383A3F' : '#9CA3AF', background: '#fff' }}
          >
            <option value="" disabled>Selecciona</option>
            {stateOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={value.state}
            onChange={(e) => set('state', e.target.value)}
            placeholder={effectiveCountry === 'CO' ? 'Ej. Antioquia' : 'Ej. Cataluña'}
            className={inputBase}
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#0CBCE5')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#EAECF0')}
          />
        )}
      </Field>

      {/* ZIP */}
      <Field label={getZipLabel(effectiveCountry)}>
        <input
          type="text"
          value={value.zip}
          onChange={(e) => set('zip', e.target.value)}
          placeholder={effectiveCountry === 'US' ? 'Ej. 90210' : 'Ej. 03100'}
          className={inputBase}
          style={inputStyle}
          inputMode="numeric"
          onFocus={(e) => (e.currentTarget.style.borderColor = '#0CBCE5')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#EAECF0')}
        />
      </Field>

      {/* Phone */}
      <Field label="Teléfono / Phone">
        <input
          type="tel"
          value={value.phone}
          onChange={(e) => set('phone', e.target.value.replace(/\D/g, ''))}
          placeholder="+52 55 1234 5678"
          className={inputBase}
          style={inputStyle}
          inputMode="tel"
          onFocus={(e) => (e.currentTarget.style.borderColor = '#0CBCE5')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#EAECF0')}
        />
      </Field>
    </div>
  )
}
