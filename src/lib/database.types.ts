export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      categorias: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          slug: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          slug: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          slug?: string
        }
        Relationships: []
      }
      cedis: {
        Row: {
          activo: boolean
          calle_numero: string
          codigo_postal: string
          colonia: string
          created_at: string
          encargado: string
          estado: string
          id: string
          municipio: string
          nombre: string
          pais: string
          telefono: string
        }
        Insert: {
          activo?: boolean
          calle_numero: string
          codigo_postal: string
          colonia: string
          created_at?: string
          encargado: string
          estado: string
          id?: string
          municipio: string
          nombre: string
          pais?: string
          telefono: string
        }
        Update: {
          activo?: boolean
          calle_numero?: string
          codigo_postal?: string
          colonia?: string
          created_at?: string
          encargado?: string
          estado?: string
          id?: string
          municipio?: string
          nombre?: string
          pais?: string
          telefono?: string
        }
        Relationships: []
      }
      commission_payout_batches: {
        Row: {
          executed_at: string
          executed_by: string | null
          id: string
          period_month: number
          period_year: number
          total_amount: number
          users_paid: number
        }
        Insert: {
          executed_at?: string
          executed_by?: string | null
          id?: string
          period_month: number
          period_year: number
          total_amount?: number
          users_paid?: number
        }
        Update: {
          executed_at?: string
          executed_by?: string | null
          id?: string
          period_month?: number
          period_year?: number
          total_amount?: number
          users_paid?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_payout_batches_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount: number
          bono_type: string
          calculated_at: string | null
          currency: string | null
          exchange_rate: number | null
          id: string
          level: number | null
          metadata: Json | null
          original_amount: number | null
          paid_at: string | null
          period_half: number
          period_month: number
          period_year: number
          process_verified: boolean | null
          source_order_id: string | null
          source_user_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          bono_type: string
          calculated_at?: string | null
          currency?: string | null
          exchange_rate?: number | null
          id?: string
          level?: number | null
          metadata?: Json | null
          original_amount?: number | null
          paid_at?: string | null
          period_half?: number
          period_month: number
          period_year: number
          process_verified?: boolean | null
          source_order_id?: string | null
          source_user_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          bono_type?: string
          calculated_at?: string | null
          currency?: string | null
          exchange_rate?: number | null
          id?: string
          level?: number | null
          metadata?: Json | null
          original_amount?: number | null
          paid_at?: string | null
          period_half?: number
          period_month?: number
          period_year?: number
          process_verified?: boolean | null
          source_order_id?: string | null
          source_user_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_source_order_id_fkey"
            columns: ["source_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_source_order_id_fkey"
            columns: ["source_order_id"]
            isOneToOne: false
            referencedRelation: "orders_with_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_source_user_id_fkey"
            columns: ["source_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      direcciones: {
        Row: {
          calle_numero: string
          codigo_postal: string
          colonia: string
          created_at: string
          estado: string
          id: string
          is_default: boolean
          municipio: string
          nombre_completo: string
          pais: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          calle_numero: string
          codigo_postal: string
          colonia: string
          created_at?: string
          estado: string
          id?: string
          is_default?: boolean
          municipio: string
          nombre_completo: string
          pais?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          calle_numero?: string
          codigo_postal?: string
          colonia?: string
          created_at?: string
          estado?: string
          id?: string
          is_default?: boolean
          municipio?: string
          nombre_completo?: string
          pais?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          from_currency: string
          id: string
          rate: number
          to_currency: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          from_currency: string
          id?: string
          rate: number
          to_currency: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          from_currency?: string
          id?: string
          rate?: number
          to_currency?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exchange_rates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      fidelity_ledger: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          order_id: string | null
          period_month: number | null
          period_year: number | null
          points: number
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          period_month?: number | null
          period_year?: number | null
          points: number
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          period_month?: number | null
          period_year?: number | null
          points?: number
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fidelity_ledger_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fidelity_ledger_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_with_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fidelity_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      holding_tank: {
        Row: {
          entered_at: string
          id: string
          member_id: string
          sponsor_id: string
        }
        Insert: {
          entered_at?: string
          id?: string
          member_id: string
          sponsor_id: string
        }
        Update: {
          entered_at?: string
          id?: string
          member_id?: string
          sponsor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "holding_tank_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holding_tank_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      holding_tank_reset_config: {
        Row: {
          created_at: string
          created_by: string | null
          executed: boolean
          executed_at: string | null
          id: number
          reset_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          executed?: boolean
          executed_at?: string | null
          id?: number
          reset_at: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          executed?: boolean
          executed_at?: string | null
          id?: number
          reset_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "holding_tank_reset_config_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_transfers: {
        Row: {
          created_at: string | null
          exchange_rate: number
          from_amount: number
          from_currency: string
          from_user_id: string
          id: string
          note: string | null
          status: string
          to_amount: number
          to_currency: string
          to_user_id: string
        }
        Insert: {
          created_at?: string | null
          exchange_rate?: number
          from_amount: number
          from_currency: string
          from_user_id: string
          id?: string
          note?: string | null
          status?: string
          to_amount: number
          to_currency: string
          to_user_id: string
        }
        Update: {
          created_at?: string | null
          exchange_rate?: number
          from_amount?: number
          from_currency?: string
          from_user_id?: string
          id?: string
          note?: string | null
          status?: string
          to_amount?: number
          to_currency?: string
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_transfers_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_transfers_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ltp_entries: {
        Row: {
          created_at: string | null
          id: string
          period_month: number | null
          period_year: number | null
          points: number
          reason: string | null
          source_user_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          period_month?: number | null
          period_year?: number | null
          points: number
          reason?: string | null
          source_user_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          period_month?: number | null
          period_year?: number | null
          points?: number
          reason?: string | null
          source_user_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ltp_entries_source_user_id_fkey"
            columns: ["source_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ltp_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ltp_semester_rewards: {
        Row: {
          created_at: string
          id: string
          ltp_points: number
          reward_level: string | null
          semester: string
          semester_half: number
          semester_year: number
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ltp_points: number
          reward_level?: string | null
          semester: string
          semester_half: number
          semester_year: number
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ltp_points?: number
          reward_level?: string | null
          semester?: string
          semester_half?: number
          semester_year?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ltp_semester_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          cv: number
          id: string
          is_kit: boolean
          metadata: Json | null
          order_id: string
          product_code: string
          product_name: string | null
          pv: number
          quantity: number
          total_amount: number
          unit_price: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          cv?: number
          id?: string
          is_kit?: boolean
          metadata?: Json | null
          order_id: string
          product_code: string
          product_name?: string | null
          pv?: number
          quantity: number
          total_amount: number
          unit_price: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          cv?: number
          id?: string
          is_kit?: boolean
          metadata?: Json | null
          order_id?: string
          product_code?: string
          product_name?: string | null
          pv?: number
          quantity?: number
          total_amount?: number
          unit_price?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_with_items"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          commission_locked: boolean | null
          country: Database["public"]["Enums"]["country_type"] | null
          created_at: string | null
          cv: number
          id: string
          is_from_preferred_client: boolean | null
          is_kit: boolean | null
          kit_type: Database["public"]["Enums"]["kit_type"] | null
          metadata: Json | null
          order_id: string | null
          paid_at: string | null
          payment_method: string | null
          preferred_sponsor_id: string | null
          price_type: Database["public"]["Enums"]["price_type"] | null
          process_verified: boolean | null
          product_code: string | null
          pv: number
          quantity: number | null
          shipping_cost: number | null
          shipping_data: Json | null
          status: Database["public"]["Enums"]["order_status"] | null
          tax_amount: number | null
          total_amount: number | null
          user_id: string
        }
        Insert: {
          commission_locked?: boolean | null
          country?: Database["public"]["Enums"]["country_type"] | null
          created_at?: string | null
          cv: number
          id?: string
          is_from_preferred_client?: boolean | null
          is_kit?: boolean | null
          kit_type?: Database["public"]["Enums"]["kit_type"] | null
          metadata?: Json | null
          order_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          preferred_sponsor_id?: string | null
          price_type?: Database["public"]["Enums"]["price_type"] | null
          process_verified?: boolean | null
          product_code?: string | null
          pv: number
          quantity?: number | null
          shipping_cost?: number | null
          shipping_data?: Json | null
          status?: Database["public"]["Enums"]["order_status"] | null
          tax_amount?: number | null
          total_amount?: number | null
          user_id: string
        }
        Update: {
          commission_locked?: boolean | null
          country?: Database["public"]["Enums"]["country_type"] | null
          created_at?: string | null
          cv?: number
          id?: string
          is_from_preferred_client?: boolean | null
          is_kit?: boolean | null
          kit_type?: Database["public"]["Enums"]["kit_type"] | null
          metadata?: Json | null
          order_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          preferred_sponsor_id?: string | null
          price_type?: Database["public"]["Enums"]["price_type"] | null
          process_verified?: boolean | null
          product_code?: string | null
          pv?: number
          quantity?: number | null
          shipping_cost?: number | null
          shipping_data?: Json | null
          status?: Database["public"]["Enums"]["order_status"] | null
          tax_amount?: number | null
          total_amount?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_preferred_sponsor_id_fkey"
            columns: ["preferred_sponsor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      periodos: {
        Row: {
          closed_at: string | null
          created_at: string | null
          end_date: string
          id: string
          name: string
          period_month: number
          period_year: number
          start_date: string
          status: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string | null
          end_date: string
          id?: string
          name: string
          period_month: number
          period_year: number
          start_date: string
          status?: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string | null
          end_date?: string
          id?: string
          name?: string
          period_month?: number
          period_year?: number
          start_date?: string
          status?: string
        }
        Relationships: []
      }
      product_private_access: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_private_access_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "product_private_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          activos: string | null
          cantidad: string | null
          categoria_id: string | null
          code: string
          created_at: string | null
          cv: number
          description: string | null
          image_url: string | null
          is_kit: boolean
          is_recommended: boolean
          kit_type: string | null
          launched_at: string | null
          name: string
          price_promotor_cop: number | null
          price_promotor_eur: number | null
          price_promotor_mxn: number | null
          price_promotor_usd: number | null
          price_public_cop: number | null
          price_public_eur: number | null
          price_public_mxn: number | null
          price_public_usd: number | null
          price_socio_cop: number | null
          price_socio_eur: number | null
          price_socio_mxn: number | null
          price_socio_usd: number | null
          product_status: Database["public"]["Enums"]["product_status"]
          protected_password: string | null
          pv: number
          short_description: string | null
          stock: number
        }
        Insert: {
          active?: boolean
          activos?: string | null
          cantidad?: string | null
          categoria_id?: string | null
          code: string
          created_at?: string | null
          cv: number
          description?: string | null
          image_url?: string | null
          is_kit?: boolean
          is_recommended?: boolean
          kit_type?: string | null
          launched_at?: string | null
          name: string
          price_promotor_cop?: number | null
          price_promotor_eur?: number | null
          price_promotor_mxn?: number | null
          price_promotor_usd?: number | null
          price_public_cop?: number | null
          price_public_eur?: number | null
          price_public_mxn?: number | null
          price_public_usd?: number | null
          price_socio_cop?: number | null
          price_socio_eur?: number | null
          price_socio_mxn?: number | null
          price_socio_usd?: number | null
          product_status?: Database["public"]["Enums"]["product_status"]
          protected_password?: string | null
          pv: number
          short_description?: string | null
          stock?: number
        }
        Update: {
          active?: boolean
          activos?: string | null
          cantidad?: string | null
          categoria_id?: string | null
          code?: string
          created_at?: string | null
          cv?: number
          description?: string | null
          image_url?: string | null
          is_kit?: boolean
          is_recommended?: boolean
          kit_type?: string | null
          launched_at?: string | null
          name?: string
          price_promotor_cop?: number | null
          price_promotor_eur?: number | null
          price_promotor_mxn?: number | null
          price_promotor_usd?: number | null
          price_public_cop?: number | null
          price_public_eur?: number | null
          price_public_mxn?: number | null
          price_public_usd?: number | null
          price_socio_cop?: number | null
          price_socio_eur?: number | null
          price_socio_mxn?: number | null
          price_socio_usd?: number | null
          product_status?: Database["public"]["Enums"]["product_status"]
          protected_password?: string | null
          pv?: number
          short_description?: string | null
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      promotor_bonus_tracking: {
        Row: {
          created_at: string | null
          cv_accumulated: number | null
          earned: number
          expires_at: string
          id: string
          period_month: number
          period_year: number
          updated_at: string | null
          used: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          cv_accumulated?: number | null
          earned: number
          expires_at: string
          id?: string
          period_month: number
          period_year: number
          updated_at?: string | null
          used?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          cv_accumulated?: number | null
          earned?: number
          expires_at?: string
          id?: string
          period_month?: number
          period_year?: number
          updated_at?: string | null
          used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotor_bonus_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_advance_bonus_claims: {
        Row: {
          bonus_amount: number
          claimed_at: string | null
          id: string
          period_month: number
          period_year: number
          rank_name: string
          user_id: string
        }
        Insert: {
          bonus_amount?: number
          claimed_at?: string | null
          id?: string
          period_month: number
          period_year: number
          rank_name: string
          user_id: string
        }
        Update: {
          bonus_amount?: number
          claimed_at?: string | null
          id?: string
          period_month?: number
          period_year?: number
          rank_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rank_advance_bonus_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ranks: {
        Row: {
          bonus_amount: number
          created_at: string | null
          description: string | null
          id: number
          image_url: string | null
          is_bronze_time_window: boolean
          level: number
          min_group_vg: number | null
          min_longest_leg: number | null
          min_other_legs: number | null
          min_pv: number
          name: string
          slug: string
        }
        Insert: {
          bonus_amount?: number
          created_at?: string | null
          description?: string | null
          id?: never
          image_url?: string | null
          is_bronze_time_window?: boolean
          level: number
          min_group_vg?: number | null
          min_longest_leg?: number | null
          min_other_legs?: number | null
          min_pv?: number
          name: string
          slug: string
        }
        Update: {
          bonus_amount?: number
          created_at?: string | null
          description?: string | null
          id?: never
          image_url?: string | null
          is_bronze_time_window?: boolean
          level?: number
          min_group_vg?: number | null
          min_longest_leg?: number | null
          min_other_legs?: number | null
          min_pv?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
      shipments: {
        Row: {
          carrier: string | null
          created_at: string
          guia_rastreo: string | null
          id: string
          order_id: string
          updated_at: string
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          guia_rastreo?: string | null
          id?: string
          order_id: string
          updated_at?: string
        }
        Update: {
          carrier?: string | null
          created_at?: string
          guia_rastreo?: string | null
          id?: string
          order_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_with_items"
            referencedColumns: ["id"]
          },
        ]
      }
      taxes: {
        Row: {
          country: string
          created_at: string | null
          id: string
          label: string
          rate: number
          state: string | null
        }
        Insert: {
          country: string
          created_at?: string | null
          id?: string
          label: string
          rate: number
          state?: string | null
        }
        Update: {
          country?: string
          created_at?: string | null
          id?: string
          label?: string
          rate?: number
          state?: string | null
        }
        Relationships: []
      }
      unilevel_tree: {
        Row: {
          level: number | null
          path: unknown
          user_id: string
        }
        Insert: {
          level?: number | null
          path: unknown
          user_id: string
        }
        Update: {
          level?: number | null
          path?: unknown
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unilevel_tree_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          achieved_ranks: string[] | null
          apellidos: string | null
          bank_account: string | null
          country: string | null
          created_at: string | null
          email: string | null
          enrollment_date: string | null
          fidelity_points: number | null
          group_vg: number | null
          id: string
          is_active: boolean | null
          is_admin: boolean
          kit_type: Database["public"]["Enums"]["kit_type"] | null
          link_referido: string | null
          ltp_points: number | null
          ltp_rank_bonuses_received: string[] | null
          membership: Database["public"]["Enums"]["membership_type"]
          name: string
          personal_cv: number | null
          personal_pv: number | null
          promotor_bonos: number | null
          rank: Database["public"]["Enums"]["rank_type"] | null
          sponsor_id: number | null
          unilevel_parent_id: string | null
          updated_at: string | null
          user_id: number
          wallet_address: string | null
        }
        Insert: {
          achieved_ranks?: string[] | null
          apellidos?: string | null
          bank_account?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          enrollment_date?: string | null
          fidelity_points?: number | null
          group_vg?: number | null
          id?: string
          is_active?: boolean | null
          is_admin?: boolean
          kit_type?: Database["public"]["Enums"]["kit_type"] | null
          link_referido?: string | null
          ltp_points?: number | null
          ltp_rank_bonuses_received?: string[] | null
          membership: Database["public"]["Enums"]["membership_type"]
          name: string
          personal_cv?: number | null
          personal_pv?: number | null
          promotor_bonos?: number | null
          rank?: Database["public"]["Enums"]["rank_type"] | null
          sponsor_id?: number | null
          unilevel_parent_id?: string | null
          updated_at?: string | null
          user_id?: number
          wallet_address?: string | null
        }
        Update: {
          achieved_ranks?: string[] | null
          apellidos?: string | null
          bank_account?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          enrollment_date?: string | null
          fidelity_points?: number | null
          group_vg?: number | null
          id?: string
          is_active?: boolean | null
          is_admin?: boolean
          kit_type?: Database["public"]["Enums"]["kit_type"] | null
          link_referido?: string | null
          ltp_points?: number | null
          ltp_rank_bonuses_received?: string[] | null
          membership?: Database["public"]["Enums"]["membership_type"]
          name?: string
          personal_cv?: number | null
          personal_pv?: number | null
          promotor_bonos?: number | null
          rank?: Database["public"]["Enums"]["rank_type"] | null
          sponsor_id?: number | null
          unilevel_parent_id?: string | null
          updated_at?: string | null
          user_id?: number
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "users_unilevel_parent_id_fkey"
            columns: ["unilevel_parent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          currency: string
          id: string
          updated_at: string
          user_id: string
          wallet_type: string
        }
        Insert: {
          balance?: number
          currency?: string
          id?: string
          updated_at?: string
          user_id: string
          wallet_type?: string
        }
        Update: {
          balance?: number
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string
          wallet_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      orders_with_items: {
        Row: {
          commission_locked: boolean | null
          country: Database["public"]["Enums"]["country_type"] | null
          created_at: string | null
          cv: number | null
          id: string | null
          is_from_preferred_client: boolean | null
          is_kit: boolean | null
          items: Json | null
          kit_type: Database["public"]["Enums"]["kit_type"] | null
          metadata: Json | null
          order_id: string | null
          paid_at: string | null
          preferred_sponsor_id: string | null
          price_type: Database["public"]["Enums"]["price_type"] | null
          product_code: string | null
          pv: number | null
          quantity: number | null
          status: Database["public"]["Enums"]["order_status"] | null
          total_amount: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_preferred_sponsor_id_fkey"
            columns: ["preferred_sponsor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_register_user: {
        Args: {
          p_apellidos?: string
          p_country?: string
          p_email: string
          p_name: string
          p_password: string
          p_sponsor_user_id?: number
          p_username?: string
        }
        Returns: Json
      }
      auth_is_admin: { Args: never; Returns: boolean }
      calculate_diferencial_patrocinio: {
        Args: { p_period_month: number; p_period_year: number }
        Returns: undefined
      }
      calculate_fidelity_points: {
        Args: { p_month: number; p_user_id: string; p_year: number }
        Returns: number
      }
      calculate_group_vg: {
        Args: { p_month: number; p_user_id: string; p_year: number }
        Returns: number
      }
      calculate_infinito_patrocinio: {
        Args: { p_month: number; p_user_id: string; p_year: number }
        Returns: undefined
      }
      calculate_infinito_unilevel_bonus: {
        Args: { p_month: number; p_user_id: string; p_year: number }
        Returns: number
      }
      calculate_match_bonus: {
        Args: { p_month: number; p_user_id: string; p_year: number }
        Returns: number
      }
      calculate_promotor_bonus: {
        Args: {
          p_period_month: number
          p_period_year: number
          p_user_id: string
        }
        Returns: undefined
      }
      calculate_rank_advance_bonus: {
        Args: {
          p_month: number
          p_new_rank: Database["public"]["Enums"]["rank_type"]
          p_user_id: string
          p_year: number
        }
        Returns: number
      }
      calculate_unilevel_bonus: {
        Args: {
          p_is_midmonth?: boolean
          p_month: number
          p_user_id: string
          p_year: number
        }
        Returns: number
      }
      cancel_holding_tank_reset: { Args: never; Returns: Json }
      create_network: {
        Args: {
          p_depth: number
          p_direct_count: number
          p_matrix: number
          p_root_user_id: string
        }
        Returns: Json
      }
      determine_rank: {
        Args: { p_month: number; p_user_id: string; p_year: number }
        Returns: Database["public"]["Enums"]["rank_type"]
      }
      ensure_acumulado_wallet: {
        Args: { p_currency: string; p_user_id: string }
        Returns: string
      }
      evaluate_ltp_semester: {
        Args: { p_semester_half: number; p_semester_year: number }
        Returns: number
      }
      expire_fidelity_points: { Args: never; Returns: number }
      fsm_evaluate_activation_rules: {
        Args: { p_user_id: string }
        Returns: Json
      }
      fsm_process_commissions: { Args: { p_order_id: string }; Returns: Json }
      get_comisiones_nivel: {
        Args: { p_month?: number; p_user_id?: string; p_year?: number }
        Returns: {
          level: number
          total_amount: number
          total_cv: number
          total_pv: number
          total_socios: number
        }[]
      }
      get_comisiones_nivel_all: {
        Args: { p_month?: number; p_user_id?: string; p_year?: number }
        Returns: {
          level: number
          total_amount: number
          total_cv: number
          total_pv: number
          total_socios: number
        }[]
      }
      get_diferencial_patrocinio_pct: {
        Args: { p_rank: Database["public"]["Enums"]["rank_type"] }
        Returns: number
      }
      get_holding_tank_reset_config: { Args: never; Returns: Json }
      get_leg_volumes: {
        Args: { p_user_id: string }
        Returns: {
          direct_id: string
          direct_name: string
          leg_volume: number
        }[]
      }
      get_my_sponsor_id: { Args: never; Returns: string }
      get_network_orders: {
        Args: {
          p_date_from?: string
          p_date_to?: string
          p_page?: number
          p_page_size?: number
          p_root_id?: string
          p_status?: string
        }
        Returns: {
          buyer_apellidos: string
          buyer_name: string
          buyer_user_id: number
          created_at: string
          currency: string
          order_id: string
          status: string
          total_amount: number
          total_count: number
          total_cv: number
          total_pv: number
          tree_level: number
        }[]
      }
      get_network_stats: {
        Args: { p_user_id: string }
        Returns: {
          active_count: number
          rank_distribution: Json
          sponsor_directs: number
          sponsor_total: number
          unilevel_directs: number
          unilevel_total: number
        }[]
      }
      get_order_with_items: { Args: { p_order_id: string }; Returns: Json }
      get_periodos_volumen: {
        Args: { p_user_id?: string }
        Returns: {
          end_date: string
          group_vg: number
          period_id: string
          period_month: number
          period_name: string
          period_year: number
          personal_cv: number
          personal_pv: number
          start_date: string
          status: string
        }[]
      }
      get_socios_nivel: {
        Args: {
          p_level?: number
          p_month?: number
          p_user_id?: string
          p_year?: number
        }
        Returns: {
          amount: number
          apellidos: string
          cv: number
          name: string
          pv: number
          source_user_id: string
          user_id: number
        }[]
      }
      get_socios_nivel_all: {
        Args: {
          p_level?: number
          p_month?: number
          p_user_id?: string
          p_year?: number
        }
        Returns: {
          amount: number
          apellidos: string
          cv: number
          name: string
          pv: number
          source_user_id: string
          user_id: number
        }[]
      }
      get_sponsor_ancestors: {
        Args: { p_max_level?: number; p_user_id: string }
        Returns: {
          level: number
          sponsor_id: string
        }[]
      }
      get_sponsor_tree: {
        Args: { p_max_depth?: number; p_user_id: string }
        Returns: {
          group_vg: number
          id: string
          is_active: boolean
          kit_type: Database["public"]["Enums"]["kit_type"]
          level_depth: number
          name: string
          parent_id: string
          personal_cv: number
          personal_pv: number
          rank: Database["public"]["Enums"]["rank_type"]
        }[]
      }
      get_unilevel_downline: {
        Args: { max_depth?: number; root_id: string }
        Returns: {
          apellidos: string
          depth: number
          name: string
          user_id: string
        }[]
      }
      get_unilevel_tree: {
        Args: { p_max_depth?: number; p_user_id: string }
        Returns: {
          group_vg: number
          id: string
          is_active: boolean
          kit_type: Database["public"]["Enums"]["kit_type"]
          level_depth: number
          name: string
          parent_id: string
          personal_cv: number
          personal_pv: number
          rank: Database["public"]["Enums"]["rank_type"]
        }[]
      }
      get_user_dashboard: { Args: { p_user_id: string }; Returns: Json }
      get_wallet: { Args: { p_user_id: string }; Returns: Json }
      internal_transfer: {
        Args: {
          p_amount: number
          p_from_user_id: string
          p_note?: string
          p_to_user_id: string
        }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      is_user_active_this_month: {
        Args: { p_month: number; p_user_id: string; p_year: number }
        Returns: boolean
      }
      map_reduce_volume: {
        Args: { p_month?: number; p_year?: number }
        Returns: {
          level: number
          recompra_cv: number
          recompra_pv: number
          starter_kit_cv: number
          starter_kit_pv: number
          user_id: string
          user_name: string
        }[]
      }
      payout_monthly_commissions: {
        Args: { p_month: number; p_year: number }
        Returns: number
      }
      place_order: {
        Args: {
          p_items: Json
          p_payment_method: string
          p_payment_ref?: string
          p_shipping_data?: Json
          p_tax_amount?: number
          p_total_amount: number
          p_user_id: string
        }
        Returns: Json
      }
      place_order_with_membership: {
        Args: {
          p_items: Json
          p_payment_method: string
          p_payment_ref?: string
          p_shipping_data?: Json
          p_tax_amount?: number
          p_total_amount: number
          p_user_id: string
          p_with_membership?: boolean
        }
        Returns: Json
      }
      place_user_from_tank: {
        Args: { p_member_id: string; p_parent_id: string }
        Returns: Json
      }
      process_monthly_closure: {
        Args: { p_month: number; p_year: number }
        Returns: undefined
      }
      process_sponsorship_inactive_reassignment: {
        Args: { p_month: number; p_year: number }
        Returns: undefined
      }
      rebuild_unilevel_subtree: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      recalc_group_vg: { Args: { p_user_id: string }; Returns: undefined }
      recalc_rank: { Args: { p_user_id: string }; Returns: undefined }
      redeem_fidelity_points: {
        Args: { p_order_id: string; p_user_id: string }
        Returns: Json
      }
      reset_holding_tank: { Args: never; Returns: Json }
      run_midmonth_unilevel: {
        Args: { p_month: number; p_year: number }
        Returns: undefined
      }
      schedule_holding_tank_reset: {
        Args: { p_reset_at: string }
        Returns: Json
      }
      text2ltree: { Args: { "": string }; Returns: unknown }
      transfer_sponsorship: {
        Args: { p_member_id: string; p_new_sponsor_id: string }
        Returns: Json
      }
      update_order_status: {
        Args: {
          p_admin_user_id?: string
          p_new_status: Database["public"]["Enums"]["order_status"]
          p_order_id: string
        }
        Returns: Json
      }
      validate_sponsor_exists: {
        Args: { p_sponsor_user_id: number }
        Returns: Json
      }
    }
    Enums: {
      country_type: "USD" | "MXN" | "COP" | "EUR"
      kit_type: "basico" | "intermedio" | "superior"
      membership_type: "socio" | "cliente_preferente"
      order_status:
        | "pending"
        | "paid"
        | "cancelled"
        | "en_proceso"
        | "reembolsado"
      price_type: "public" | "socio" | "promotor"
      product_status:
        | "disponible"
        | "proximamente"
        | "no_disponible"
        | "agotado"
        | "privado"
        | "protegido"
      rank_type:
        | "Socio"
        | "Ejecutivo"
        | "Bronce"
        | "Plata"
        | "Oro"
        | "Platino"
        | "Diamante"
        | "Doble Diamante"
        | "Triple Diamante"
        | "Diamante Embajador"
        | "Doble Diamante Embajador"
        | "Triple Diamante Embajador"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      country_type: ["USD", "MXN", "COP", "EUR"],
      kit_type: ["basico", "intermedio", "superior"],
      membership_type: ["socio", "cliente_preferente"],
      order_status: [
        "pending",
        "paid",
        "cancelled",
        "en_proceso",
        "reembolsado",
      ],
      price_type: ["public", "socio", "promotor"],
      product_status: [
        "disponible",
        "proximamente",
        "no_disponible",
        "agotado",
        "privado",
        "protegido",
      ],
      rank_type: [
        "Socio",
        "Ejecutivo",
        "Bronce",
        "Plata",
        "Oro",
        "Platino",
        "Diamante",
        "Doble Diamante",
        "Triple Diamante",
        "Diamante Embajador",
        "Doble Diamante Embajador",
        "Triple Diamante Embajador",
      ],
    },
  },
} as const
