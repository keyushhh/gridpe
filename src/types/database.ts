// AUTO-GENERATED FILE — DO NOT EDIT MANUALLY
// Run: npx supabase gen types typescript --project-id xxvbmvnrggsgetqswmjs > src/types/database.ts
// Manual types and constants live in src/types/chat.ts

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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_type: string
          earned_at: string
          id: string
          points_awarded: number
          user_id: string
        }
        Insert: {
          achievement_type: string
          earned_at?: string
          id?: string
          points_awarded?: number
          user_id: string
        }
        Update: {
          achievement_type?: string
          earned_at?: string
          id?: string
          points_awarded?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      addresses: {
        Row: {
          apartment: string | null
          area: string | null
          city: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          label: string | null
          landmark: string | null
          latitude: number
          longitude: number
          plus_code: string | null
          state: string | null
          user_id: string
        }
        Insert: {
          apartment?: string | null
          area?: string | null
          city?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          label?: string | null
          landmark?: string | null
          latitude: number
          longitude: number
          plus_code?: string | null
          state?: string | null
          user_id: string
        }
        Update: {
          apartment?: string | null
          area?: string | null
          city?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          label?: string | null
          landmark?: string | null
          latitude?: number
          longitude?: number
          plus_code?: string | null
          state?: string | null
          user_id?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          created_at: string
          criteria_type: string
          criteria_value: number
          description: string
          icon_name: string
          id: string
          name: string
          points_reward: number
          slug: string
          tier: string
        }
        Insert: {
          created_at?: string
          criteria_type: string
          criteria_value: number
          description: string
          icon_name: string
          id?: string
          name: string
          points_reward?: number
          slug: string
          tier?: string
        }
        Update: {
          created_at?: string
          criteria_type?: string
          criteria_value?: number
          description?: string
          icon_name?: string
          id?: string
          name?: string
          points_reward?: number
          slug?: string
          tier?: string
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_holder_name: string
          account_number: string | null
          account_type: string | null
          bank_name: string
          branch_name: string | null
          created_at: string
          id: string
          ifsc_code: string
          is_default: boolean | null
          is_verified: boolean
          user_id: string
        }
        Insert: {
          account_holder_name: string
          account_number?: string | null
          account_type?: string | null
          bank_name: string
          branch_name?: string | null
          created_at?: string
          id?: string
          ifsc_code: string
          is_default?: boolean | null
          is_verified?: boolean
          user_id: string
        }
        Update: {
          account_holder_name?: string
          account_number?: string | null
          account_type?: string | null
          bank_name?: string
          branch_name?: string | null
          created_at?: string
          id?: string
          ifsc_code?: string
          is_default?: boolean | null
          is_verified?: boolean
          user_id?: string
        }
        Relationships: []
      }
      bank_accounts_backup: {
        Row: {
          account_holder_name: string | null
          account_number: string | null
          account_type: string | null
          bank_name: string | null
          branch_name: string | null
          created_at: string | null
          id: string | null
          ifsc_code: string | null
          is_default: boolean | null
          is_verified: boolean | null
          user_id: string | null
        }
        Insert: {
          account_holder_name?: string | null
          account_number?: string | null
          account_type?: string | null
          bank_name?: string | null
          branch_name?: string | null
          created_at?: string | null
          id?: string | null
          ifsc_code?: string | null
          is_default?: boolean | null
          is_verified?: boolean | null
          user_id?: string | null
        }
        Update: {
          account_holder_name?: string | null
          account_number?: string | null
          account_type?: string | null
          bank_name?: string | null
          branch_name?: string | null
          created_at?: string | null
          id?: string | null
          ifsc_code?: string | null
          is_default?: boolean | null
          is_verified?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      bank_cards: {
        Row: {
          card_holder_name: string | null
          card_token: string | null
          card_type: string | null
          cashfree_customer_id: string | null
          cashfree_instrument_id: string | null
          created_at: string | null
          expiry_date: string | null
          expiry_month: string | null
          expiry_year: string | null
          gateway: string | null
          gateway_token_id: string | null
          id: string
          is_default: boolean | null
          last_four: string | null
          user_id: string | null
        }
        Insert: {
          card_holder_name?: string | null
          card_token?: string | null
          card_type?: string | null
          cashfree_customer_id?: string | null
          cashfree_instrument_id?: string | null
          created_at?: string | null
          expiry_date?: string | null
          expiry_month?: string | null
          expiry_year?: string | null
          gateway?: string | null
          gateway_token_id?: string | null
          id?: string
          is_default?: boolean | null
          last_four?: string | null
          user_id?: string | null
        }
        Update: {
          card_holder_name?: string | null
          card_token?: string | null
          card_type?: string | null
          cashfree_customer_id?: string | null
          cashfree_instrument_id?: string | null
          created_at?: string | null
          expiry_date?: string | null
          expiry_month?: string | null
          expiry_year?: string | null
          gateway?: string | null
          gateway_token_id?: string | null
          id?: string
          is_default?: boolean | null
          last_four?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cash_orders: {
        Row: {
          address_id: string | null
          delivery_fee: number | null
          delivery_tip: number | null
          gst: number | null
          id: string
          item_value: number | null
          metadata: Json | null
          payment_mode: string | null
          platform_fee: number | null
          rider_id: string | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address_id?: string | null
          delivery_fee?: number | null
          delivery_tip?: number | null
          gst?: number | null
          id?: string
          item_value?: number | null
          metadata?: Json | null
          payment_mode?: string | null
          platform_fee?: number | null
          rider_id?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address_id?: string | null
          delivery_fee?: number | null
          delivery_tip?: number | null
          gst?: number | null
          id?: string
          item_value?: number | null
          metadata?: Json | null
          payment_mode?: string | null
          platform_fee?: number | null
          rider_id?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_orders_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "assigned_rider_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_orders_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_slabs: {
        Row: {
          delivery_fee: number
          gst_rate: number
          id: string
          is_active: boolean | null
          max_amount: number | null
          min_amount: number
          order_type: string
          plan_tier: string
          platform_fee: number
          updated_at: string | null
        }
        Insert: {
          delivery_fee: number
          gst_rate?: number
          id?: string
          is_active?: boolean | null
          max_amount?: number | null
          min_amount: number
          order_type: string
          plan_tier?: string
          platform_fee: number
          updated_at?: string | null
        }
        Update: {
          delivery_fee?: number
          gst_rate?: number
          id?: string
          is_active?: boolean | null
          max_amount?: number | null
          min_amount?: number
          order_type?: string
          plan_tier?: string
          platform_fee?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      fx_orders: {
        Row: {
          address_id: string | null
          amount_total: number | null
          delivery_fee: number | null
          delivery_tip: number | null
          exchange_rate: number | null
          gst: number | null
          id: string
          metadata: Json | null
          payment_mode: string | null
          platform_fee: number | null
          rider_id: string | null
          service_fee: number | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address_id?: string | null
          amount_total?: number | null
          delivery_fee?: number | null
          delivery_tip?: number | null
          exchange_rate?: number | null
          gst?: number | null
          id?: string
          metadata?: Json | null
          payment_mode?: string | null
          platform_fee?: number | null
          rider_id?: string | null
          service_fee?: number | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address_id?: string | null
          amount_total?: number | null
          delivery_fee?: number | null
          delivery_tip?: number | null
          exchange_rate?: number | null
          gst?: number | null
          id?: string
          metadata?: Json | null
          payment_mode?: string | null
          platform_fee?: number | null
          rider_id?: string | null
          service_fee?: number | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fx_orders_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "assigned_rider_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fx_orders_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      hubs: {
        Row: {
          address: string | null
          city: string | null
          id: string
          location: unknown
          location_name: string
          service_zone_id: string | null
          zone_id: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          id?: string
          location?: unknown
          location_name: string
          service_zone_id?: string | null
          zone_id?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          id?: string
          location?: unknown
          location_name?: string
          service_zone_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hubs_service_zone_id_fkey"
            columns: ["service_zone_id"]
            isOneToOne: false
            referencedRelation: "active_cities"
            referencedColumns: ["zone_id"]
          },
          {
            foreignKeyName: "hubs_service_zone_id_fkey"
            columns: ["service_zone_id"]
            isOneToOne: false
            referencedRelation: "available_orders"
            referencedColumns: ["zone_id"]
          },
          {
            foreignKeyName: "hubs_service_zone_id_fkey"
            columns: ["service_zone_id"]
            isOneToOne: false
            referencedRelation: "service_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_submissions: {
        Row: {
          address_proof_url: string | null
          back_image_url: string | null
          created_at: string | null
          dob: string | null
          document_number: string | null
          document_type: string
          front_image_url: string | null
          full_name: string | null
          id: string
          is_fx_eligible: boolean | null
          selfie_url: string | null
          status: string | null
          user_id: string | null
          verification_tier: string | null
        }
        Insert: {
          address_proof_url?: string | null
          back_image_url?: string | null
          created_at?: string | null
          dob?: string | null
          document_number?: string | null
          document_type: string
          front_image_url?: string | null
          full_name?: string | null
          id?: string
          is_fx_eligible?: boolean | null
          selfie_url?: string | null
          status?: string | null
          user_id?: string | null
          verification_tier?: string | null
        }
        Update: {
          address_proof_url?: string | null
          back_image_url?: string | null
          created_at?: string | null
          dob?: string | null
          document_number?: string | null
          document_type?: string
          front_image_url?: string | null
          full_name?: string | null
          id?: string
          is_fx_eligible?: boolean | null
          selfie_url?: string | null
          status?: string | null
          user_id?: string | null
          verification_tier?: string | null
        }
        Relationships: []
      }
      login_activity: {
        Row: {
          created_at: string | null
          device_name: string | null
          id: string
          ip_address: string | null
          is_current_session: boolean | null
          location: string | null
          rider_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_name?: string | null
          id?: string
          ip_address?: string | null
          is_current_session?: boolean | null
          location?: string | null
          rider_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_name?: string | null
          id?: string
          ip_address?: string | null
          is_current_session?: boolean | null
          location?: string | null
          rider_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "login_activity_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "assigned_rider_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "login_activity_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          rider_id: string
          title: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          rider_id: string
          title: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          rider_id?: string
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      order_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          order_id: string
          read_at: string | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          order_id: string
          read_at?: string | null
          sender_id: string
          sender_type: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          order_id?: string
          read_at?: string | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "active_order_customer_info"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "assigned_rider_location"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "available_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_security_audit"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_ratings: {
        Row: {
          created_at: string | null
          feedback: string | null
          id: string
          order_id: string
          recommend_solo: boolean | null
          rider_id: string
          stars: number
          tip_amount: number | null
          user_id: string
          would_order_again: boolean | null
        }
        Insert: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          order_id: string
          recommend_solo?: boolean | null
          rider_id: string
          stars: number
          tip_amount?: number | null
          user_id: string
          would_order_again?: boolean | null
        }
        Update: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          order_id?: string
          recommend_solo?: boolean | null
          rider_id?: string
          stars?: number
          tip_amount?: number | null
          user_id?: string
          would_order_again?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "order_ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "active_order_customer_info"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "assigned_rider_location"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "available_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "order_security_audit"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_ratings_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "assigned_rider_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_ratings_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          accepted_at: string | null
          address_id: string | null
          amount: number
          cancel_reason_text: string | null
          cancel_reason_type: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          city: string | null
          coupon_code: string | null
          created_at: string
          currency: string
          customer_phone_number: string | null
          delivered_at: string | null
          delivery_address_text: string | null
          delivery_fee: number | null
          delivery_lat: number | null
          delivery_lng: number | null
          delivery_location: unknown
          delivery_selfie_url: string | null
          delivery_tip: number | null
          delivery_verified_at: string | null
          discount_amount: number
          dist_km: number | null
          distance_km: number | null
          face_match_passed: boolean | null
          face_match_score: number | null
          failure_message: string | null
          failure_type: string | null
          gateway_order_id: string | null
          gateway_payment_id: string | null
          gst: number | null
          hub_id: string | null
          id: string
          is_scheduled: boolean
          meta_data: Json | null
          metadata: Json
          order_type: string | null
          otp_code: string | null
          partner_name: string | null
          partner_rating: number | null
          payment_mode: string
          picked_up_at: string | null
          pickup_location: string | null
          pickup_selfie_url: string | null
          pickup_verified_at: string | null
          reward_points: number | null
          reward_points_earned: number
          reward_points_redeemed: number
          reward_points_used: number
          rider_earnings: number | null
          rider_id: string | null
          safety_preference: string | null
          scheduled_at: string | null
          service_fee: number | null
          status: string
          total_amount: number | null
          transaction_number: string | null
          type: string | null
          updated_at: string
          user_id: string
          zone_id: string
        }
        Insert: {
          accepted_at?: string | null
          address_id?: string | null
          amount: number
          cancel_reason_text?: string | null
          cancel_reason_type?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          city?: string | null
          coupon_code?: string | null
          created_at?: string
          currency?: string
          customer_phone_number?: string | null
          delivered_at?: string | null
          delivery_address_text?: string | null
          delivery_fee?: number | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          delivery_location?: unknown
          delivery_selfie_url?: string | null
          delivery_tip?: number | null
          delivery_verified_at?: string | null
          discount_amount?: number
          dist_km?: number | null
          distance_km?: number | null
          face_match_passed?: boolean | null
          face_match_score?: number | null
          failure_message?: string | null
          failure_type?: string | null
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          gst?: number | null
          hub_id?: string | null
          id?: string
          is_scheduled?: boolean
          meta_data?: Json | null
          metadata?: Json
          order_type?: string | null
          otp_code?: string | null
          partner_name?: string | null
          partner_rating?: number | null
          payment_mode: string
          picked_up_at?: string | null
          pickup_location?: string | null
          pickup_selfie_url?: string | null
          pickup_verified_at?: string | null
          reward_points?: number | null
          reward_points_earned?: number
          reward_points_redeemed?: number
          reward_points_used?: number
          rider_earnings?: number | null
          rider_id?: string | null
          safety_preference?: string | null
          scheduled_at?: string | null
          service_fee?: number | null
          status: string
          total_amount?: number | null
          transaction_number?: string | null
          type?: string | null
          updated_at?: string
          user_id: string
          zone_id: string
        }
        Update: {
          accepted_at?: string | null
          address_id?: string | null
          amount?: number
          cancel_reason_text?: string | null
          cancel_reason_type?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          city?: string | null
          coupon_code?: string | null
          created_at?: string
          currency?: string
          customer_phone_number?: string | null
          delivered_at?: string | null
          delivery_address_text?: string | null
          delivery_fee?: number | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          delivery_location?: unknown
          delivery_selfie_url?: string | null
          delivery_tip?: number | null
          delivery_verified_at?: string | null
          discount_amount?: number
          dist_km?: number | null
          distance_km?: number | null
          face_match_passed?: boolean | null
          face_match_score?: number | null
          failure_message?: string | null
          failure_type?: string | null
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          gst?: number | null
          hub_id?: string | null
          id?: string
          is_scheduled?: boolean
          meta_data?: Json | null
          metadata?: Json
          order_type?: string | null
          otp_code?: string | null
          partner_name?: string | null
          partner_rating?: number | null
          payment_mode?: string
          picked_up_at?: string | null
          pickup_location?: string | null
          pickup_selfie_url?: string | null
          pickup_verified_at?: string | null
          reward_points?: number | null
          reward_points_earned?: number
          reward_points_redeemed?: number
          reward_points_used?: number
          rider_earnings?: number | null
          rider_id?: string | null
          safety_preference?: string | null
          scheduled_at?: string | null
          service_fee?: number | null
          status?: string
          total_amount?: number | null
          transaction_number?: string | null
          type?: string | null
          updated_at?: string
          user_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_order_zone"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "active_cities"
            referencedColumns: ["zone_id"]
          },
          {
            foreignKeyName: "fk_order_zone"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "available_orders"
            referencedColumns: ["zone_id"]
          },
          {
            foreignKeyName: "fk_order_zone"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "service_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_orders_address"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "assigned_rider_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "active_cities"
            referencedColumns: ["zone_id"]
          },
          {
            foreignKeyName: "orders_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "available_orders"
            referencedColumns: ["zone_id"]
          },
          {
            foreignKeyName: "orders_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "service_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          bank_account_id: string | null
          created_at: string
          currency: string | null
          description: string | null
          destination_vpa: string | null
          id: string
          payout_method: string | null
          status: string
          transaction_id: string | null
          upi_id: string | null
          user_id: string
          vpa: string | null
          wallet_name: string | null
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          destination_vpa?: string | null
          id?: string
          payout_method?: string | null
          status?: string
          transaction_id?: string | null
          upi_id?: string | null
          user_id: string
          vpa?: string | null
          wallet_name?: string | null
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          destination_vpa?: string | null
          id?: string
          payout_method?: string | null
          status?: string
          transaction_id?: string | null
          upi_id?: string | null
          user_id?: string
          vpa?: string | null
          wallet_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "view_bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_payments: {
        Row: {
          amount: number
          created_at: string | null
          gateway_order_id: string | null
          id: string
          metadata: Json | null
          payment_type: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          gateway_order_id?: string | null
          id?: string
          metadata?: Json | null
          payment_type?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          gateway_order_id?: string | null
          id?: string
          metadata?: Json | null
          payment_type?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      privacy_policies: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          id: string
          is_published: boolean
          metadata: Json
          published_at: string | null
          slug: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_published?: boolean
          metadata?: Json
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean
          metadata?: Json
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          biometric_on: boolean | null
          created_at: string
          email: string | null
          id: string
          is_fx_enabled: boolean | null
          is_onboarded: boolean | null
          is_passport_verified: boolean | null
          kyc_status: string | null
          last_order_date: string | null
          mpin_created_at: string | null
          mpin_hash: string | null
          mpin_set: boolean | null
          name: string | null
          next_billing_date: string | null
          payment_status: string | null
          phone: string | null
          plan_tier: string
          push_token: string | null
          referral_code: string | null
          referred_by: string | null
          reward_points: number | null
          streak_days: number
          subscription_status: string | null
          terms_accepted_at: string | null
          terms_version: string | null
          tier_change_date: string | null
          wallet_balance: number | null
        }
        Insert: {
          avatar_url?: string | null
          biometric_on?: boolean | null
          created_at?: string
          email?: string | null
          id?: string
          is_fx_enabled?: boolean | null
          is_onboarded?: boolean | null
          is_passport_verified?: boolean | null
          kyc_status?: string | null
          last_order_date?: string | null
          mpin_created_at?: string | null
          mpin_hash?: string | null
          mpin_set?: boolean | null
          name?: string | null
          next_billing_date?: string | null
          payment_status?: string | null
          phone?: string | null
          plan_tier?: string
          push_token?: string | null
          referral_code?: string | null
          referred_by?: string | null
          reward_points?: number | null
          streak_days?: number
          subscription_status?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          tier_change_date?: string | null
          wallet_balance?: number | null
        }
        Update: {
          avatar_url?: string | null
          biometric_on?: boolean | null
          created_at?: string
          email?: string | null
          id?: string
          is_fx_enabled?: boolean | null
          is_onboarded?: boolean | null
          is_passport_verified?: boolean | null
          kyc_status?: string | null
          last_order_date?: string | null
          mpin_created_at?: string | null
          mpin_hash?: string | null
          mpin_set?: boolean | null
          name?: string | null
          next_billing_date?: string | null
          payment_status?: string | null
          phone?: string | null
          plan_tier?: string
          push_token?: string | null
          referral_code?: string | null
          referred_by?: string | null
          reward_points?: number | null
          streak_days?: number
          subscription_status?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          tier_change_date?: string | null
          wallet_balance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          referred_id: string | null
          referrer_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referred_id?: string | null
          referrer_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referred_id?: string | null
          referrer_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reward_transactions: {
        Row: {
          activity_type: string
          amount: number | null
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          points: number | null
          points_amount: number
          reference_id: string | null
          reference_type: string | null
          transaction_type: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          amount?: number | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          points?: number | null
          points_amount: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          amount?: number | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          points?: number | null
          points_amount?: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rider_bank_accounts: {
        Row: {
          account_holder_name: string | null
          account_number_masked: string
          bank_name: string
          bank_verified_name: string | null
          created_at: string | null
          id: string
          ifsc_code: string
          is_primary: boolean | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          rider_id: string | null
          rzp_payment_id: string | null
          verification_status: string | null
          verified_at: string | null
        }
        Insert: {
          account_holder_name?: string | null
          account_number_masked: string
          bank_name: string
          bank_verified_name?: string | null
          created_at?: string | null
          id?: string
          ifsc_code: string
          is_primary?: boolean | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          rider_id?: string | null
          rzp_payment_id?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Update: {
          account_holder_name?: string | null
          account_number_masked?: string
          bank_name?: string
          bank_verified_name?: string | null
          created_at?: string | null
          id?: string
          ifsc_code?: string
          is_primary?: boolean | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          rider_id?: string | null
          rzp_payment_id?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rider_bank_accounts_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "assigned_rider_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rider_bank_accounts_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_device_tokens: {
        Row: {
          fcm_token: string
          id: string
          platform: string | null
          rider_id: string | null
          updated_at: string | null
        }
        Insert: {
          fcm_token: string
          id?: string
          platform?: string | null
          rider_id?: string | null
          updated_at?: string | null
        }
        Update: {
          fcm_token?: string
          id?: string
          platform?: string | null
          rider_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rider_device_tokens_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: true
            referencedRelation: "assigned_rider_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rider_device_tokens_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: true
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_interactions: {
        Row: {
          created_at: string | null
          hub_name: string | null
          id: string
          interaction_type: string | null
          rider_id: string | null
          time_slot_end: string | null
          time_slot_start: number | null
        }
        Insert: {
          created_at?: string | null
          hub_name?: string | null
          id?: string
          interaction_type?: string | null
          rider_id?: string | null
          time_slot_end?: string | null
          time_slot_start?: number | null
        }
        Update: {
          created_at?: string | null
          hub_name?: string | null
          id?: string
          interaction_type?: string | null
          rider_id?: string | null
          time_slot_end?: string | null
          time_slot_start?: number | null
        }
        Relationships: []
      }
      rider_interest: {
        Row: {
          city: string
          created_at: string | null
          full_name: string
          id: string
          phone: string
        }
        Insert: {
          city: string
          created_at?: string | null
          full_name: string
          id?: string
          phone: string
        }
        Update: {
          city?: string
          created_at?: string | null
          full_name?: string
          id?: string
          phone?: string
        }
        Relationships: []
      }
      rider_legal_content: {
        Row: {
          content_body: string
          content_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          version_label: string
        }
        Insert: {
          content_body: string
          content_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          version_label: string
        }
        Update: {
          content_body?: string
          content_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          version_label?: string
        }
        Relationships: []
      }
      rider_locations: {
        Row: {
          accuracy: number | null
          heading: number | null
          id: string
          is_online: boolean | null
          lat: number
          lng: number
          rider_id: string
          speed: number | null
          updated_at: string | null
        }
        Insert: {
          accuracy?: number | null
          heading?: number | null
          id?: string
          is_online?: boolean | null
          lat: number
          lng: number
          rider_id: string
          speed?: number | null
          updated_at?: string | null
        }
        Update: {
          accuracy?: number | null
          heading?: number | null
          id?: string
          is_online?: boolean | null
          lat?: number
          lng?: number
          rider_id?: string
          speed?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rider_locations_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: true
            referencedRelation: "assigned_rider_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rider_locations_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: true
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_payout_settings: {
        Row: {
          auto_payout_enabled: boolean | null
          created_at: string | null
          id: string
          minimum_balance: number | null
          payout_schedule: string | null
          primary_bank_account_id: string | null
          rider_id: string
          rider_uuid: string
          updated_at: string | null
        }
        Insert: {
          auto_payout_enabled?: boolean | null
          created_at?: string | null
          id?: string
          minimum_balance?: number | null
          payout_schedule?: string | null
          primary_bank_account_id?: string | null
          rider_id: string
          rider_uuid: string
          updated_at?: string | null
        }
        Update: {
          auto_payout_enabled?: boolean | null
          created_at?: string | null
          id?: string
          minimum_balance?: number | null
          payout_schedule?: string | null
          primary_bank_account_id?: string | null
          rider_id?: string
          rider_uuid?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rider_security_logs: {
        Row: {
          created_at: string | null
          event_type: string | null
          id: string
          metadata: Json | null
          rider_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          metadata?: Json | null
          rider_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          metadata?: Json | null
          rider_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rider_security_logs_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "assigned_rider_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rider_security_logs_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_sessions: {
        Row: {
          created_at: string | null
          device_name: string | null
          id: string
          ip_address: string | null
          is_current: boolean | null
          last_login_at: string | null
          location: string | null
          rider_id: string
        }
        Insert: {
          created_at?: string | null
          device_name?: string | null
          id?: string
          ip_address?: string | null
          is_current?: boolean | null
          last_login_at?: string | null
          location?: string | null
          rider_id: string
        }
        Update: {
          created_at?: string | null
          device_name?: string | null
          id?: string
          ip_address?: string | null
          is_current?: boolean | null
          last_login_at?: string | null
          location?: string | null
          rider_id?: string
        }
        Relationships: []
      }
      rider_shift_preferences: {
        Row: {
          bonus_amount: number | null
          bonus_time_slot: string | null
          consistency_days_completed: number | null
          consistency_days_target: number | null
          id: string
          inferred_end_hour: number | null
          inferred_start_hour: number | null
          last_learning_update: string | null
          preferred_end_hour: number | null
          preferred_start_hour: number | null
          reliability_score: number | null
          rider_id: string
          updated_at: string | null
        }
        Insert: {
          bonus_amount?: number | null
          bonus_time_slot?: string | null
          consistency_days_completed?: number | null
          consistency_days_target?: number | null
          id?: string
          inferred_end_hour?: number | null
          inferred_start_hour?: number | null
          last_learning_update?: string | null
          preferred_end_hour?: number | null
          preferred_start_hour?: number | null
          reliability_score?: number | null
          rider_id: string
          updated_at?: string | null
        }
        Update: {
          bonus_amount?: number | null
          bonus_time_slot?: string | null
          consistency_days_completed?: number | null
          consistency_days_target?: number | null
          id?: string
          inferred_end_hour?: number | null
          inferred_start_hour?: number | null
          last_learning_update?: string | null
          preferred_end_hour?: number | null
          preferred_start_hour?: number | null
          reliability_score?: number | null
          rider_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rider_shifts: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          earnings: number | null
          ended_at: string | null
          hub_name: string | null
          id: string
          is_active: boolean | null
          orders_completed: number | null
          rider_id: string
          started_at: string
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          earnings?: number | null
          ended_at?: string | null
          hub_name?: string | null
          id?: string
          is_active?: boolean | null
          orders_completed?: number | null
          rider_id: string
          started_at?: string
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          earnings?: number | null
          ended_at?: string | null
          hub_name?: string | null
          id?: string
          is_active?: boolean | null
          orders_completed?: number | null
          rider_id?: string
          started_at?: string
        }
        Relationships: []
      }
      rider_transactions: {
        Row: {
          amount: number
          bank_account_id: string | null
          created_at: string | null
          description: string | null
          fee: number | null
          final_amount: number
          id: string
          reference_id: string | null
          rider_id: string
          rider_uuid: string
          status: string | null
          tds: number | null
          type: string
          wallet_balance_snapshot: number | null
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          created_at?: string | null
          description?: string | null
          fee?: number | null
          final_amount: number
          id?: string
          reference_id?: string | null
          rider_id: string
          rider_uuid: string
          status?: string | null
          tds?: number | null
          type: string
          wallet_balance_snapshot?: number | null
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          created_at?: string | null
          description?: string | null
          fee?: number | null
          final_amount?: number
          id?: string
          reference_id?: string | null
          rider_id?: string
          rider_uuid?: string
          status?: string | null
          tds?: number | null
          type?: string
          wallet_balance_snapshot?: number | null
        }
        Relationships: []
      }
      riders: {
        Row: {
          average_stars: number | null
          backup_codes: Json | null
          corbado_user_id: string | null
          created_at: string | null
          current_lat: number | null
          current_lng: number | null
          dob: string | null
          document_type: string | null
          document_urls: Json | null
          email: string | null
          full_name: string | null
          has_2fa: boolean | null
          has_passkeys: boolean | null
          hub_id: string | null
          id: string
          is_onboarded: boolean | null
          is_online: boolean | null
          kyc_dob: string | null
          kyc_docs_url: string[] | null
          kyc_gender: string | null
          kyc_id_url: string | null
          kyc_number: string | null
          kyc_photo: string | null
          kyc_status: string | null
          kyc_type: string | null
          last_active_at: string | null
          last_location_point: unknown
          phone_2fa: string | null
          phone_number: string | null
          profile_url: string | null
          rating: number | null
          rider_id: string | null
          selected_city: string | null
          selected_hub: string | null
          solo_delivery_score: number | null
          total_earnings: number | null
          total_ratings: number | null
          totp_enabled: boolean | null
          totp_secret: string | null
          totp_verified: boolean | null
          two_fa_enabled: boolean | null
          two_fa_method: string | null
          updated_at: string | null
          vehicle_model: string | null
          vehicle_number: string | null
          wallet_balance: number | null
          work_city: string | null
          zone_id: string | null
        }
        Insert: {
          average_stars?: number | null
          backup_codes?: Json | null
          corbado_user_id?: string | null
          created_at?: string | null
          current_lat?: number | null
          current_lng?: number | null
          dob?: string | null
          document_type?: string | null
          document_urls?: Json | null
          email?: string | null
          full_name?: string | null
          has_2fa?: boolean | null
          has_passkeys?: boolean | null
          hub_id?: string | null
          id?: string
          is_onboarded?: boolean | null
          is_online?: boolean | null
          kyc_dob?: string | null
          kyc_docs_url?: string[] | null
          kyc_gender?: string | null
          kyc_id_url?: string | null
          kyc_number?: string | null
          kyc_photo?: string | null
          kyc_status?: string | null
          kyc_type?: string | null
          last_active_at?: string | null
          last_location_point?: unknown
          phone_2fa?: string | null
          phone_number?: string | null
          profile_url?: string | null
          rating?: number | null
          rider_id?: string | null
          selected_city?: string | null
          selected_hub?: string | null
          solo_delivery_score?: number | null
          total_earnings?: number | null
          total_ratings?: number | null
          totp_enabled?: boolean | null
          totp_secret?: string | null
          totp_verified?: boolean | null
          two_fa_enabled?: boolean | null
          two_fa_method?: string | null
          updated_at?: string | null
          vehicle_model?: string | null
          vehicle_number?: string | null
          wallet_balance?: number | null
          work_city?: string | null
          zone_id?: string | null
        }
        Update: {
          average_stars?: number | null
          backup_codes?: Json | null
          corbado_user_id?: string | null
          created_at?: string | null
          current_lat?: number | null
          current_lng?: number | null
          dob?: string | null
          document_type?: string | null
          document_urls?: Json | null
          email?: string | null
          full_name?: string | null
          has_2fa?: boolean | null
          has_passkeys?: boolean | null
          hub_id?: string | null
          id?: string
          is_onboarded?: boolean | null
          is_online?: boolean | null
          kyc_dob?: string | null
          kyc_docs_url?: string[] | null
          kyc_gender?: string | null
          kyc_id_url?: string | null
          kyc_number?: string | null
          kyc_photo?: string | null
          kyc_status?: string | null
          kyc_type?: string | null
          last_active_at?: string | null
          last_location_point?: unknown
          phone_2fa?: string | null
          phone_number?: string | null
          profile_url?: string | null
          rating?: number | null
          rider_id?: string | null
          selected_city?: string | null
          selected_hub?: string | null
          solo_delivery_score?: number | null
          total_earnings?: number | null
          total_ratings?: number | null
          totp_enabled?: boolean | null
          totp_secret?: string | null
          totp_verified?: boolean | null
          two_fa_enabled?: boolean | null
          two_fa_method?: string | null
          updated_at?: string | null
          vehicle_model?: string | null
          vehicle_number?: string | null
          wallet_balance?: number | null
          work_city?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "riders_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riders_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "active_cities"
            referencedColumns: ["zone_id"]
          },
          {
            foreignKeyName: "riders_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "available_orders"
            referencedColumns: ["zone_id"]
          },
          {
            foreignKeyName: "riders_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "service_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      service_zones: {
        Row: {
          boundary: unknown
          id: string
          name: string
        }
        Insert: {
          boundary?: unknown
          id?: string
          name: string
        }
        Update: {
          boundary?: unknown
          id?: string
          name?: string
        }
        Relationships: []
      }
      support_ticket_steps: {
        Row: {
          description: string | null
          id: string
          label: string
          status: string | null
          ticket_id: string
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          label: string
          status?: string | null
          ticket_id: string
          updated_at?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          label?: string
          status?: string | null
          ticket_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_steps_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string | null
          id: string
          priority: string | null
          rider_id: string
          status: string | null
          title: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          priority?: string | null
          rider_id: string
          status?: string | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          priority?: string | null
          rider_id?: string
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      terms_and_conditions: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          id: string
          is_published: boolean
          metadata: Json
          published_at: string | null
          slug: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_published?: boolean
          metadata?: Json
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean
          metadata?: Json
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      transaction_history: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          rider_id: string
          status: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          rider_id: string
          status?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          rider_id?: string
          status?: string | null
          transaction_type?: string
        }
        Relationships: []
      }
      user_addresses: {
        Row: {
          address_line_1: string | null
          address_name: string | null
          full_address: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_name?: string | null
          full_address?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_name?: string | null
          full_address?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_legal_consents: {
        Row: {
          accepted_at: string | null
          document_id: string
          document_type: string
          id: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          document_id: string
          document_type: string
          id?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          document_id?: string
          document_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          amount_paid: number | null
          billing_cycle: string | null
          created_at: string | null
          expires_at: string | null
          gateway_order_id: string | null
          gateway_payment_id: string | null
          id: string
          plan_tier: string
          started_at: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          billing_cycle?: string | null
          created_at?: string | null
          expires_at?: string | null
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          id?: string
          plan_tier?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          billing_cycle?: string | null
          created_at?: string | null
          expires_at?: string | null
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          id?: string
          plan_tier?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_tiers: {
        Row: {
          created_at: string | null
          daily_topup_limit: number | null
          daily_withdraw_limit: number | null
          id: string
          max_add_per_txn: number
          max_wallet_balance: number
          name: string
          subscription_price: number
        }
        Insert: {
          created_at?: string | null
          daily_topup_limit?: number | null
          daily_withdraw_limit?: number | null
          id?: string
          max_add_per_txn: number
          max_wallet_balance: number
          name: string
          subscription_price?: number
        }
        Update: {
          created_at?: string | null
          daily_topup_limit?: number | null
          daily_withdraw_limit?: number | null
          id?: string
          max_add_per_txn?: number
          max_wallet_balance?: number
          name?: string
          subscription_price?: number
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          order_id: string | null
          payout_id: string | null
          reference_id: string | null
          status: string | null
          transaction_type: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          payout_id?: string | null
          reference_id?: string | null
          status?: string | null
          transaction_type?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          payout_id?: string | null
          reference_id?: string | null
          status?: string | null
          transaction_type?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          available_balance: number
          created_at: string | null
          held_balance: number
          id: string
          tier_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          available_balance?: number
          created_at?: string | null
          held_balance?: number
          id?: string
          tier_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          available_balance?: number
          created_at?: string | null
          held_balance?: number
          id?: string
          tier_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "wallet_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          payload: Json | null
          status_code: number | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          payload?: Json | null
          status_code?: number | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          payload?: Json | null
          status_code?: number | null
        }
        Relationships: []
      }
      withdrawal_limits: {
        Row: {
          created_at: string | null
          daily_limit: number
          id: string
          is_active: boolean | null
          monthly_limit: number
          plan_tier: string
        }
        Insert: {
          created_at?: string | null
          daily_limit: number
          id?: string
          is_active?: boolean | null
          monthly_limit: number
          plan_tier: string
        }
        Update: {
          created_at?: string | null
          daily_limit?: number
          id?: string
          is_active?: boolean | null
          monthly_limit?: number
          plan_tier?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      zing_chats: {
        Row: {
          created_at: string | null
          id: string
          is_from_ai: boolean | null
          message: string
          rider_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_from_ai?: boolean | null
          message: string
          rider_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_from_ai?: boolean | null
          message?: string
          rider_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      active_cities: {
        Row: {
          city_name: string | null
          lat: number | null
          lng: number | null
          zone_id: string | null
        }
        Insert: {
          city_name?: string | null
          lat?: never
          lng?: never
          zone_id?: string | null
        }
        Update: {
          city_name?: string | null
          lat?: never
          lng?: never
          zone_id?: string | null
        }
        Relationships: []
      }
      active_order_customer_info: {
        Row: {
          customer_name: string | null
          customer_phone: string | null
          order_id: string | null
          rider_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "assigned_rider_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      assigned_rider_location: {
        Row: {
          current_lat: number | null
          current_lng: number | null
          customer_id: string | null
          full_name: string | null
          id: string | null
          last_active_at: string | null
          order_id: string | null
        }
        Relationships: []
      }
      available_orders: {
        Row: {
          accepted_at: string | null
          address_id: string | null
          amount: number | null
          cancel_reason_text: string | null
          cancel_reason_type: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          city: string | null
          coupon_code: string | null
          created_at: string | null
          currency: string | null
          customer_phone_number: string | null
          delivered_at: string | null
          delivery_address_text: string | null
          delivery_fee: number | null
          delivery_location: unknown
          delivery_selfie_url: string | null
          delivery_tip: number | null
          delivery_verified_at: string | null
          discount_amount: number | null
          dist_km: number | null
          distance_km: number | null
          face_match_passed: boolean | null
          face_match_score: number | null
          failure_message: string | null
          failure_type: string | null
          gst: number | null
          hub_id: string | null
          id: string | null
          is_scheduled: boolean | null
          meta_data: Json | null
          metadata: Json | null
          order_type: string | null
          otp_code: string | null
          partner_name: string | null
          partner_rating: number | null
          payment_mode: string | null
          picked_up_at: string | null
          pickup_location: string | null
          pickup_selfie_url: string | null
          pickup_verified_at: string | null
          reward_points: number | null
          reward_points_used: number | null
          rider_earnings: number | null
          rider_id: string | null
          scheduled_at: string | null
          service_fee: number | null
          status: string | null
          total_amount: number | null
          transaction_number: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
          zone_id: string | null
          zone_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_orders_address"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "assigned_rider_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_verification_status: {
        Row: {
          bank_name: string | null
          id: string | null
          rider_id: string | null
          status: string | null
        }
        Insert: {
          bank_name?: string | null
          id?: string | null
          rider_id?: string | null
          status?: string | null
        }
        Update: {
          bank_name?: string | null
          id?: string | null
          rider_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rider_bank_accounts_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "assigned_rider_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rider_bank_accounts_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_security_audit: {
        Row: {
          has_delivery_proof: boolean | null
          has_pickup_proof: boolean | null
          order_id: string | null
          rider_id: string | null
          status: string | null
        }
        Insert: {
          has_delivery_proof?: never
          has_pickup_proof?: never
          order_id?: string | null
          rider_id?: string | null
          status?: string | null
        }
        Update: {
          has_delivery_proof?: never
          has_pickup_proof?: never
          order_id?: string | null
          rider_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "assigned_rider_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      view_bank_accounts: {
        Row: {
          account_holder_name: string | null
          account_type: string | null
          bank_name: string | null
          branch_name: string | null
          created_at: string | null
          id: string | null
          ifsc_code: string | null
          is_default: boolean | null
          masked_number: string | null
          raw_account_number: string | null
          user_id: string | null
        }
        Insert: {
          account_holder_name?: string | null
          account_type?: string | null
          bank_name?: string | null
          branch_name?: string | null
          created_at?: string | null
          id?: string | null
          ifsc_code?: string | null
          is_default?: boolean | null
          masked_number?: never
          raw_account_number?: string | null
          user_id?: string | null
        }
        Update: {
          account_holder_name?: string | null
          account_type?: string | null
          bank_name?: string | null
          branch_name?: string | null
          created_at?: string | null
          id?: string | null
          ifsc_code?: string | null
          is_default?: boolean | null
          masked_number?: never
          raw_account_number?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_order: { Args: { order_uuid: string }; Returns: undefined }
      apply_tier_forfeiture: {
        Args: {
          p_current_balance: number
          p_new_limit: number
          p_new_tier_id: string
          p_user_id: string
        }
        Returns: Json
      }
      calculate_rider_earning:
        | { Args: { dist_km: number }; Returns: number }
        | { Args: { cash_amount: number; dist_km: number }; Returns: number }
      cancel_order:
        | {
            Args: {
              p_cancel_reason_text: string
              p_cancel_reason_type: string
              p_order_id: string
              p_user_id: string
            }
            Returns: Json
          }
        | {
            Args: { p_order_id: string; p_reason?: string; p_user_id: string }
            Returns: Json
          }
      check_service_availability: {
        Args: { p_lat: number; p_lng: number }
        Returns: string
      }
      check_withdrawal_limits: {
        Args: { p_amount: number; p_user_id: string }
        Returns: Json
      }
      complete_cash_order: {
        Args: { p_order_id: string; p_user_id: string }
        Returns: Json
      }
      complete_fx_order: {
        Args: { p_order_id: string; p_user_id: string }
        Returns: Json
      }
      complete_grid_delivery: {
        Args: { input_otp: string; order_uuid: string }
        Returns: boolean
      }
      complete_order: {
        Args: {
          p_delivery_selfie_url: string
          p_order_id: string
          p_otp: string
          p_rider_uuid: string
        }
        Returns: Json
      }
      confirm_delivery: {
        Args: {
          delivery_selfie_url: string
          input_otp: string
          order_uuid: string
        }
        Returns: boolean
      }
      create_cash_order: {
        Args: {
          p_address_id: string
          p_amount: number
          p_delivery_fee?: number
          p_delivery_tip?: number
          p_gst?: number
          p_meta_data?: Json
          p_order_type: string
          p_platform_fee?: number
          p_total_amount?: number
          p_user_id: string
        }
        Returns: Json
      }
      create_fx_order:
        | {
            Args: {
              p_address_id: string
              p_amount: number
              p_delivery_fee?: number
              p_delivery_tip?: number
              p_gst?: number
              p_meta_data?: Json
              p_order_type: string
              p_platform_fee?: number
              p_total_amount?: number
              p_user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_address_id: string
              p_amount: number
              p_delivery_fee?: number
              p_meta_data?: Json
              p_order_type: string
              p_platform_fee?: number
              p_user_id: string
            }
            Returns: Json
          }
      decrypt_account_number_safe: {
        Args: { encrypted_base64: string }
        Returns: string
      }
      encrypt_account_number: { Args: { plain_text: string }; Returns: string }
      exec_totp_update: {
        Args: { p_rider_id: string; p_secret: string }
        Returns: undefined
      }
      exec_totp_verify: { Args: { p_rider_id: string }; Returns: undefined }
      generate_otp: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      get_account_number_for_display: {
        Args: { p_id: string }
        Returns: string
      }
      get_account_number_for_display_v2: {
        Args: { p_id: string }
        Returns: string
      }
      get_encryption_key: { Args: never; Returns: string }
      get_masked_account_number: { Args: { acct_id: string }; Returns: string }
      get_nearby_hubs: {
        Args: { selected_city: string; user_lat: number; user_lng: number }
        Returns: {
          dist_meters: number
          id: string
          name: string
        }[]
      }
      get_order_quote:
        | {
            Args: {
              p_amount: number
              p_distance_km?: number
              p_order_type: string
              p_service_amount?: number
              p_user_id?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_amount: number
              p_distance_km?: number
              p_order_type: string
              p_service_amount?: number
            }
            Returns: Json
          }
      get_rider_daily_earnings: {
        Args: { p_rider_uuid: string; p_week_end: string; p_week_start: string }
        Returns: {
          day: string
          delivery_count: number
          order_earnings: number
          total_earnings: number
          total_tips: number
        }[]
      }
      get_rider_weekly_earnings: {
        Args: { p_rider_uuid: string; p_week_end: string; p_week_start: string }
        Returns: {
          delivery_count: number
          order_earnings: number
          total_earnings: number
          total_hours: number
          total_tips: number
        }[]
      }
      get_rider_weeks_summary: {
        Args: { p_rider_uuid: string; p_weeks?: number }
        Returns: {
          delivery_count: number
          total_earnings: number
          week_end: string
          week_start: string
        }[]
      }
      get_user_id_by_email: {
        Args: { email: string }
        Returns: {
          id: string
        }[]
      }
      get_user_plan_tier: { Args: { p_user_id: string }; Returns: string }
      mark_picked_up:
        | { Args: { order_uuid: string }; Returns: undefined }
        | {
            Args: {
              order_uuid: string
              pickup_selfie_url: string
              pickup_verified_at: string
            }
            Returns: undefined
          }
      mask_account_number: { Args: { decrypted_text: string }; Returns: string }
      normalize_city: { Args: { input: string }; Returns: string }
      process_new_referral: {
        Args: { p_referral_code: string; p_referred_id: string }
        Returns: Json
      }
      process_referral_reward: {
        Args: { p_order_id: string; p_user_id: string }
        Returns: undefined
      }
      process_reward_expirations: { Args: never; Returns: undefined }
      redeem_reward_points: {
        Args: {
          p_description?: string
          p_points_amount: number
          p_reference_id: string
          p_user_id: string
        }
        Returns: Json
      }
      reveal_full_account_number: {
        Args: { encrypted_base64: string }
        Returns: string
      }
      schedule_downgrade: {
        Args: {
          p_tier_change_date: string
          p_tier_name: string
          p_user_id: string
        }
        Returns: Json
      }
      update_rider_location: {
        Args: { lat: number; lng: number }
        Returns: undefined
      }
      wallet_deposit: {
        Args: {
          p_amount: number
          p_description: string
          p_reference_id?: string
          p_user_id: string
        }
        Returns: undefined
      }
      wallet_hold: {
        Args: {
          p_amount: number
          p_description?: string
          p_order_id: string
          p_user_id: string
        }
        Returns: number
      }
      wallet_withdraw: {
        Args: {
          p_amount: number
          p_description?: string
          p_payout_method?: string
          p_user_id: string
          p_vpa?: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
