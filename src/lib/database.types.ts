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
      cedis: {
        Row: {
          id: string
          nombre: string
          encargado: string | null
          telefono: string | null
          calle_numero: string
          colonia: string
          municipio: string
          estado: string
          codigo_postal: string
          pais: string
          activo: boolean
        }
        Insert: {
          id?: string
          nombre: string
          encargado?: string | null
          telefono?: string | null
          calle_numero: string
          colonia: string
          municipio: string
          estado: string
          codigo_postal: string
          pais?: string
          activo?: boolean
        }
        Update: {
          id?: string
          nombre?: string
          encargado?: string | null
          telefono?: string | null
          calle_numero?: string
          colonia?: string
          municipio?: string
          estado?: string
          codigo_postal?: string
          pais?: string
          activo?: boolean
        }
        Relationships: []
      }
      direcciones: {
        Row: {
          id: string
          user_id: string
          nombre_completo: string
          calle_numero: string
          colonia: string
          municipio: string
          estado: string
          codigo_postal: string
          pais: string
          is_default: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          nombre_completo: string
          calle_numero: string
          colonia: string
          municipio: string
          estado: string
          codigo_postal: string
          pais?: string
          is_default?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          nombre_completo?: string
          calle_numero?: string
          colonia?: string
          municipio?: string
          estado?: string
          codigo_postal?: string
          pais?: string
          is_default?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "direcciones_user_id_fkey"
            columns: ["user_id"]
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
          id: string
          level: number | null
          metadata: Json | null
          paid_at: string | null
          period_month: number
          period_year: number
          source_order_id: string | null
          source_user_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          bono_type: string
          calculated_at?: string | null
          id?: string
          level?: number | null
          metadata?: Json | null
          paid_at?: string | null
          period_month: number
          period_year: number
          source_order_id?: string | null
          source_user_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          bono_type?: string
          calculated_at?: string | null
          id?: string
          level?: number | null
          metadata?: Json | null
          paid_at?: string | null
          period_month?: number
          period_year?: number
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
          order_id: string | null
          id: string
          is_from_preferred_client: boolean | null
          is_kit: boolean | null
          kit_type: Database["public"]["Enums"]["kit_type"] | null
          metadata: Json | null
          paid_at: string | null
          preferred_sponsor_id: string | null
          price_type: Database["public"]["Enums"]["price_type"] | null
          product_code: string | null
          pv: number
          quantity: number | null
          status: Database["public"]["Enums"]["order_status"] | null
          total_amount: number | null
          user_id: string
        }
        Insert: {
          commission_locked?: boolean | null
          country?: Database["public"]["Enums"]["country_type"] | null
          created_at?: string | null
          cv: number
          order_id?: string | null
          id?: string
          is_from_preferred_client?: boolean | null
          is_kit?: boolean | null
          kit_type?: Database["public"]["Enums"]["kit_type"] | null
          metadata?: Json | null
          paid_at?: string | null
          preferred_sponsor_id?: string | null
          price_type?: Database["public"]["Enums"]["price_type"] | null
          product_code?: string | null
          pv: number
          quantity?: number | null
          status?: Database["public"]["Enums"]["order_status"] | null
          total_amount?: number | null
          user_id: string
        }
        Update: {
          commission_locked?: boolean | null
          country?: Database["public"]["Enums"]["country_type"] | null
          created_at?: string | null
          cv?: number
          order_id?: string | null
          id?: string
          is_from_preferred_client?: boolean | null
          is_kit?: boolean | null
          kit_type?: Database["public"]["Enums"]["kit_type"] | null
          metadata?: Json | null
          paid_at?: string | null
          preferred_sponsor_id?: string | null
          price_type?: Database["public"]["Enums"]["price_type"] | null
          product_code?: string | null
          pv?: number
          quantity?: number | null
          status?: Database["public"]["Enums"]["order_status"] | null
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
      products: {
        Row: {
          active: boolean
          activos: string | null
          cantidad: string | null
          code: string
          created_at: string | null
          cv: number
          description: string | null
          image_url: string | null
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
          pv: number
          short_description: string | null
          stock: number
        }
        Insert: {
          active?: boolean
          activos?: string | null
          cantidad?: string | null
          code: string
          created_at?: string | null
          cv: number
          description?: string | null
          image_url?: string | null
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
          pv: number
          short_description?: string | null
          stock?: number
        }
        Update: {
          active?: boolean
          activos?: string | null
          cantidad?: string | null
          code?: string
          created_at?: string | null
          cv?: number
          description?: string | null
          image_url?: string | null
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
          pv?: number
          short_description?: string | null
          stock?: number
        }
        Relationships: []
      }
      promotor_bonus_tracking: {
        Row: {
          created_at: string | null
          earned: number
          expires_at: string
          id: string
          period_month: number
          period_year: number
          used: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          earned: number
          expires_at: string
          id?: string
          period_month: number
          period_year: number
          used?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          earned?: number
          expires_at?: string
          id?: string
          period_month?: number
          period_year?: number
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
          created_at: string | null
          email: string | null
          enrollment_date: string | null
          fidelity_points: number | null
          group_vg: number | null
          id: string
          is_active: boolean | null
          is_admin: boolean | null
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
          sponsor_id: string | null
          unilevel_parent_id: string | null
          updated_at: string | null
          user_id: number
        }
        Insert: {
          achieved_ranks?: string[] | null
          apellidos?: string | null
          created_at?: string | null
          email?: string | null
          enrollment_date?: string | null
          fidelity_points?: number | null
          group_vg?: number | null
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
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
          sponsor_id?: string | null
          unilevel_parent_id?: string | null
          updated_at?: string | null
          user_id?: number
        }
        Update: {
          achieved_ranks?: string[] | null
          apellidos?: string | null
          created_at?: string | null
          email?: string | null
          enrollment_date?: string | null
          fidelity_points?: number | null
          group_vg?: number | null
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
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
          sponsor_id?: string | null
          unilevel_parent_id?: string | null
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "users_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
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
      wallets: {
        Row: {
          balance: number
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          currency?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string
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
          order_id: string | null
          id: string | null
          is_from_preferred_client: boolean | null
          is_kit: boolean | null
          items: Json | null
          kit_type: Database["public"]["Enums"]["kit_type"] | null
          metadata: Json | null
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
        Args: { p_month: number; p_user_id: string; p_year: number }
        Returns: number
      }
      determine_rank: {
        Args: { p_month: number; p_user_id: string; p_year: number }
        Returns: Database["public"]["Enums"]["rank_type"]
      }
      get_my_sponsor_id: { Args: never; Returns: string }
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
          id: string
          is_active: boolean
          kit_type: Database["public"]["Enums"]["kit_type"]
          level_depth: number
          name: string
          parent_id: string
          personal_cv: number
          rank: Database["public"]["Enums"]["rank_type"]
        }[]
      }
      get_unilevel_downline: {
        Args: { max_depth?: number; root_id: string }
        Returns: {
          depth: number
          user_id: string
        }[]
      }
      get_unilevel_tree: {
        Args: { p_max_depth?: number; p_user_id: string }
        Returns: {
          id: string
          is_active: boolean
          kit_type: Database["public"]["Enums"]["kit_type"]
          level_depth: number
          name: string
          parent_id: string
          personal_cv: number
          rank: Database["public"]["Enums"]["rank_type"]
        }[]
      }
      get_user_dashboard: { Args: { p_user_id: string }; Returns: Json }
      get_wallet: { Args: { p_user_id: string }; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      place_order: {
        Args: {
          p_items: Json
          p_payment_method: string
          p_payment_ref?: string
          p_shipping_data?: Json
          p_total_amount: number
          p_user_id: string
        }
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
      text2ltree: { Args: { "": string }; Returns: unknown }
    }
    Enums: {
      country_type: "USD" | "MXN" | "COP" | "EUR"
      kit_type: "basico" | "intermedio" | "superior"
      membership_type: "socio" | "cliente_preferente"
      order_status: "pending" | "paid" | "cancelled"
      price_type: "public" | "socio" | "promotor"
      rank_type:
        | "Socio"
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
      order_status: ["pending", "paid", "cancelled"],
      price_type: ["public", "socio", "promotor"],
      rank_type: [
        "Socio",
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
