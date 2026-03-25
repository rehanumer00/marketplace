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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_state: Json | null
          previous_state: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_state?: Json | null
          previous_state?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_state?: Json | null
          previous_state?: Json | null
        }
        Relationships: []
      }
      disputes: {
        Row: {
          created_at: string
          id: string
          initiated_by: string
          order_id: string
          reason: string
          resolution: string | null
          resolution_type: string | null
          resolved_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          initiated_by: string
          order_id: string
          reason: string
          resolution?: string | null
          resolution_type?: string | null
          resolved_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          initiated_by?: string
          order_id?: string
          reason?: string
          resolution?: string | null
          resolution_type?: string | null
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          order_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          order_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          order_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          anchor_text: string | null
          article_content: string | null
          auto_approve_at: string | null
          buyer_id: string
          completed_at: string | null
          created_at: string
          delivered_at: string | null
          description: string | null
          id: string
          price: number
          proof_url: string | null
          publisher_id: string
          status: Database["public"]["Enums"]["order_status"]
          target_url: string | null
          title: string
          updated_at: string
          website_id: string
        }
        Insert: {
          anchor_text?: string | null
          article_content?: string | null
          auto_approve_at?: string | null
          buyer_id: string
          completed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          description?: string | null
          id?: string
          price: number
          proof_url?: string | null
          publisher_id: string
          status?: Database["public"]["Enums"]["order_status"]
          target_url?: string | null
          title: string
          updated_at?: string
          website_id: string
        }
        Update: {
          anchor_text?: string | null
          article_content?: string | null
          auto_approve_at?: string | null
          buyer_id?: string
          completed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          description?: string | null
          id?: string
          price?: number
          proof_url?: string | null
          publisher_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          target_url?: string | null
          title?: string
          updated_at?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          processed_at: string | null
          publisher_id: string
          status: Database["public"]["Enums"]["payout_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          publisher_id: string
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          publisher_id?: string
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      publisher_wallets: {
        Row: {
          available_balance: number
          created_at: string
          id: string
          pending_balance: number
          publisher_id: string
          updated_at: string
          withdrawn_balance: number
        }
        Insert: {
          available_balance?: number
          created_at?: string
          id?: string
          pending_balance?: number
          publisher_id: string
          updated_at?: string
          withdrawn_balance?: number
        }
        Update: {
          available_balance?: number
          created_at?: string
          id?: string
          pending_balance?: number
          publisher_id?: string
          updated_at?: string
          withdrawn_balance?: number
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          order_id: string
          publisher_id: string
          rating: number
          reviewer_id: string
          website_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id: string
          publisher_id: string
          rating: number
          reviewer_id: string
          website_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string
          publisher_id?: string
          rating?: number
          reviewer_id?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          buyer_id: string
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          order_id: string
          publisher_amount: number
          publisher_id: string
          refund_reason: string | null
          refunded_at: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          buyer_id: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          order_id: string
          publisher_amount?: number
          publisher_id: string
          refund_reason?: string | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          buyer_id?: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          order_id?: string
          publisher_amount?: number
          publisher_id?: string
          refund_reason?: string | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          order_id: string | null
          payout_id: string | null
          transaction_id: string | null
          type: Database["public"]["Enums"]["wallet_tx_type"]
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          payout_id?: string | null
          transaction_id?: string | null
          type: Database["public"]["Enums"]["wallet_tx_type"]
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          payout_id?: string | null
          transaction_id?: string | null
          type?: Database["public"]["Enums"]["wallet_tx_type"]
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "publisher_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      websites: {
        Row: {
          avg_rating: number | null
          content_guidelines: string | null
          country: string | null
          created_at: string
          da: number | null
          description: string | null
          domain: string
          dr: number | null
          id: string
          is_verified: boolean | null
          niche: string
          price: number
          publisher_id: string
          status: Database["public"]["Enums"]["website_status"]
          total_orders: number | null
          traffic: string | null
          turnaround_days: number | null
          updated_at: string
          url: string
        }
        Insert: {
          avg_rating?: number | null
          content_guidelines?: string | null
          country?: string | null
          created_at?: string
          da?: number | null
          description?: string | null
          domain: string
          dr?: number | null
          id?: string
          is_verified?: boolean | null
          niche: string
          price?: number
          publisher_id: string
          status?: Database["public"]["Enums"]["website_status"]
          total_orders?: number | null
          traffic?: string | null
          turnaround_days?: number | null
          updated_at?: string
          url: string
        }
        Update: {
          avg_rating?: number | null
          content_guidelines?: string | null
          country?: string | null
          created_at?: string
          da?: number | null
          description?: string | null
          domain?: string
          dr?: number | null
          id?: string
          is_verified?: boolean | null
          niche?: string
          price?: number
          publisher_id?: string
          status?: Database["public"]["Enums"]["website_status"]
          total_orders?: number | null
          traffic?: string | null
          turnaround_days?: number | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "websites_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_escrow: {
        Args: {
          _amount: number
          _buyer_id: string
          _order_id: string
          _publisher_id: string
        }
        Returns: string
      }
      dispute_escrow: { Args: { _order_id: string }; Returns: undefined }
      ensure_publisher_wallet: {
        Args: { _publisher_id: string }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      process_payout_debit: { Args: { _payout_id: string }; Returns: undefined }
      refund_escrow: {
        Args: { _order_id: string; _reason?: string }
        Returns: undefined
      }
      release_escrow: { Args: { _order_id: string }; Returns: undefined }
      run_reconciliation: { Args: never; Returns: Json }
      write_audit_log: {
        Args: {
          _action: string
          _actor_id: string
          _actor_type: string
          _entity_id: string
          _entity_type: string
          _metadata?: Json
          _new_state?: Json
          _previous_state?: Json
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "publisher" | "buyer"
      notification_type:
        | "order"
        | "message"
        | "payment"
        | "review"
        | "system"
        | "dispute"
      order_status:
        | "pending"
        | "in_progress"
        | "delivered"
        | "revision"
        | "completed"
        | "cancelled"
        | "disputed"
      payout_status:
        | "pending"
        | "processing"
        | "completed"
        | "rejected"
        | "approved"
        | "failed"
        | "paid"
      transaction_status:
        | "pending"
        | "escrow"
        | "released"
        | "refunded"
        | "disputed"
        | "failed"
      wallet_tx_type:
        | "escrow_hold"
        | "escrow_release"
        | "commission_deduct"
        | "refund_buyer"
        | "refund_publisher"
        | "payout_debit"
        | "payout_reversal"
      website_status: "pending" | "approved" | "rejected" | "suspended"
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
      app_role: ["admin", "publisher", "buyer"],
      notification_type: [
        "order",
        "message",
        "payment",
        "review",
        "system",
        "dispute",
      ],
      order_status: [
        "pending",
        "in_progress",
        "delivered",
        "revision",
        "completed",
        "cancelled",
        "disputed",
      ],
      payout_status: [
        "pending",
        "processing",
        "completed",
        "rejected",
        "approved",
        "failed",
        "paid",
      ],
      transaction_status: [
        "pending",
        "escrow",
        "released",
        "refunded",
        "disputed",
        "failed",
      ],
      wallet_tx_type: [
        "escrow_hold",
        "escrow_release",
        "commission_deduct",
        "refund_buyer",
        "refund_publisher",
        "payout_debit",
        "payout_reversal",
      ],
      website_status: ["pending", "approved", "rejected", "suspended"],
    },
  },
} as const
