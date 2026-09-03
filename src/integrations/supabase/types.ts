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
      configuracoes_pagamento: {
        Row: {
          chave: string
          updated_at: string
          valor: string | null
        }
        Insert: {
          chave: string
          updated_at?: string
          valor?: string | null
        }
        Update: {
          chave?: string
          updated_at?: string
          valor?: string | null
        }
        Relationships: []
      }
      estoque: {
        Row: {
          custo_unitario: number
          id: string
          nome: string
          produto_id: string | null
          saldo_atual: number
          saldo_minimo: number
          tipo: string
          unidade: string
          updated_at: string
        }
        Insert: {
          custo_unitario?: number
          id?: string
          nome: string
          produto_id?: string | null
          saldo_atual?: number
          saldo_minimo?: number
          tipo: string
          unidade?: string
          updated_at?: string
        }
        Update: {
          custo_unitario?: number
          id?: string
          nome?: string
          produto_id?: string | null
          saldo_atual?: number
          saldo_minimo?: number
          tipo?: string
          unidade?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      ficha_tecnica_itens: {
        Row: {
          created_at: string
          fee_kind: string | null
          fee_value: number | null
          id: string
          nome: string
          produto_id: string
          quantidade: number | null
          tipo: string
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          fee_kind?: string | null
          fee_value?: number | null
          id?: string
          nome: string
          produto_id: string
          quantidade?: number | null
          tipo: string
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          fee_kind?: string | null
          fee_value?: number | null
          id?: string
          nome?: string
          produto_id?: string
          quantidade?: number | null
          tipo?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ficha_tecnica_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      fluxo_caixa: {
        Row: {
          categoria: string
          created_at: string
          descricao: string
          id: string
          tipo: string
          usuario: string
          valor: number
          venda_id: string | null
        }
        Insert: {
          categoria: string
          created_at?: string
          descricao: string
          id?: string
          tipo: string
          usuario: string
          valor: number
          venda_id?: string | null
        }
        Update: {
          categoria?: string
          created_at?: string
          descricao?: string
          id?: string
          tipo?: string
          usuario?: string
          valor?: number
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fluxo_caixa_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_auditoria: {
        Row: {
          antes: string | null
          campo: string
          created_at: string
          depois: string | null
          id: string
          motivo: string | null
          produto_id: string | null
          tipo: string
          usuario: string
        }
        Insert: {
          antes?: string | null
          campo: string
          created_at?: string
          depois?: string | null
          id?: string
          motivo?: string | null
          produto_id?: string | null
          tipo: string
          usuario: string
        }
        Update: {
          antes?: string | null
          campo?: string
          created_at?: string
          depois?: string | null
          id?: string
          motivo?: string | null
          produto_id?: string | null
          tipo?: string
          usuario?: string
        }
        Relationships: []
      }
      itens_venda: {
        Row: {
          custo_unitario: number
          id: string
          nome: string
          preco_unitario: number
          produto_id: string | null
          quantidade: number
          subtotal: number
          venda_id: string
        }
        Insert: {
          custo_unitario: number
          id?: string
          nome: string
          preco_unitario: number
          produto_id?: string | null
          quantidade: number
          subtotal: number
          venda_id: string
        }
        Update: {
          custo_unitario?: number
          id?: string
          nome?: string
          preco_unitario?: number
          produto_id?: string | null
          quantidade?: number
          subtotal?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_venda_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      maquininhas: {
        Row: {
          adquirente: string | null
          apelido: string
          created_at: string
          id: string
          modelo: string | null
          numero_serie: string | null
          status: string
          updated_at: string
        }
        Insert: {
          adquirente?: string | null
          apelido: string
          created_at?: string
          id?: string
          modelo?: string | null
          numero_serie?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          adquirente?: string | null
          apelido?: string
          created_at?: string
          id?: string
          modelo?: string | null
          numero_serie?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      movimentacoes_estoque: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_nome: string
          motivo: string | null
          quantidade: number
          saldo_apos: number
          tipo: string
          usuario: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_nome: string
          motivo?: string | null
          quantidade: number
          saldo_apos: number
          tipo: string
          usuario: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_nome?: string
          motivo?: string | null
          quantidade?: number
          saldo_apos?: number
          tipo?: string
          usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "estoque"
            referencedColumns: ["id"]
          },
        ]
      }
      permissoes_modulo: {
        Row: {
          created_at: string
          id: string
          modulo: string
          permitido: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          modulo: string
          permitido?: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          modulo?: string
          permitido?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      produtos: {
        Row: {
          card_fee_pct: number | null
          created_at: string
          freight: number | null
          id: string
          labor_cost_per_minute: number | null
          labor_minutes: number | null
          logistics_cost: number | null
          manual_price: number | null
          margin_pct: number | null
          nome: string
          purchase_tax: number | null
          supplier_price: number | null
          tipo: string
          updated_at: string
        }
        Insert: {
          card_fee_pct?: number | null
          created_at?: string
          freight?: number | null
          id?: string
          labor_cost_per_minute?: number | null
          labor_minutes?: number | null
          logistics_cost?: number | null
          manual_price?: number | null
          margin_pct?: number | null
          nome: string
          purchase_tax?: number | null
          supplier_price?: number | null
          tipo: string
          updated_at?: string
        }
        Update: {
          card_fee_pct?: number | null
          created_at?: string
          freight?: number | null
          id?: string
          labor_cost_per_minute?: number | null
          labor_minutes?: number | null
          logistics_cost?: number | null
          manual_price?: number | null
          margin_pct?: number | null
          nome?: string
          purchase_tax?: number | null
          supplier_price?: number | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string
          role: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nome: string
          role: string
          status: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string
          role?: string
          status?: string
        }
        Relationships: []
      }
      vendas: {
        Row: {
          codigo: string
          created_at: string
          custo_total: number
          desconto: number
          forma_pagamento: string
          id: string
          lucro_bruto: number
          margem_realizada_pct: number
          mp_link_pagamento: string | null
          mp_payment_id: string | null
          mp_preference_id: string | null
          receita_liquida: number
          status_pagamento: string | null
          subtotal: number
          taxa_cartao_pct: number
          total: number
          usuario: string
          valor_taxa_cartao: number
        }
        Insert: {
          codigo: string
          created_at?: string
          custo_total?: number
          desconto?: number
          forma_pagamento: string
          id?: string
          lucro_bruto?: number
          margem_realizada_pct?: number
          mp_link_pagamento?: string | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          receita_liquida: number
          status_pagamento?: string | null
          subtotal: number
          taxa_cartao_pct?: number
          total: number
          usuario: string
          valor_taxa_cartao?: number
        }
        Update: {
          codigo?: string
          created_at?: string
          custo_total?: number
          desconto?: number
          forma_pagamento?: string
          id?: string
          lucro_bruto?: number
          margem_realizada_pct?: number
          mp_link_pagamento?: string | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          receita_liquida?: number
          status_pagamento?: string | null
          subtotal?: number
          taxa_cartao_pct?: number
          total?: number
          usuario?: string
          valor_taxa_cartao?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_initial_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      sincronizar_meu_papel: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
    }
    Enums: {
      app_role: "admin" | "operacional"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "operacional"],
    },
  },
} as const
