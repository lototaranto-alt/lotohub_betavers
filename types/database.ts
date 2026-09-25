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
      app_telemetry_events: {
        Row: {
          app_version: string | null
          created_at: string
          event_name: string
          id: string
          os_name: string | null
          payload: unknown | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          event_name: string
          id?: string
          os_name?: string | null
          payload?: unknown | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          created_at?: string
          event_name?: string
          id?: string
          os_name?: string | null
          payload?: unknown | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_telemetry_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_feedbacks: {
        Row: {
          category: string | null
          comment: string | null
          created_at: string | null
          id: string
          is_premium_unlocked: boolean | null
          poi_id: string | null
          profile_id: string | null
          rating: number | null
          tenant_id: string
        }
        Insert: {
          category?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          is_premium_unlocked?: boolean | null
          poi_id?: string | null
          profile_id?: string | null
          rating?: number | null
          tenant_id: string
        }
        Update: {
          category?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          is_premium_unlocked?: boolean | null
          poi_id?: string | null
          profile_id?: string | null
          rating?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "b2b_feedbacks_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "pois"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2b_feedbacks_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_checkins_analytics"
            referencedColumns: ["poi_id"]
          },
          {
            foreignKeyName: "b2b_feedbacks_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_pois"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2b_feedbacks_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "vw_pois_frontend"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2b_feedbacks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badge_templates: {
        Row: {
          condition_type: string | null
          condition_value: number | null
          description: string | null
          icon_url: string | null
          id: string
          name: string
          xp_bonus: number | null
        }
        Insert: {
          condition_type?: string | null
          condition_value?: number | null
          description?: string | null
          icon_url?: string | null
          id: string
          name: string
          xp_bonus?: number | null
        }
        Update: {
          condition_type?: string | null
          condition_value?: number | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          xp_bonus?: number | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          req_poi_category: string | null
          req_xp: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id: string
          name: string
          req_poi_category?: string | null
          req_xp?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          req_poi_category?: string | null
          req_xp?: number | null
        }
        Relationships: []
      }
      civic_reports: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          grid_cell: string | null
          id: string
          latitude: number | null
          longitude: number | null
          matched_report_id: string | null
          status: string | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          grid_cell?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          matched_report_id?: string | null
          status?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          grid_cell?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          matched_report_id?: string | null
          status?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "civic_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crowd_predictions: {
        Row: {
          certified_count: number | null
          confidence_score: number | null
          created_at: string | null
          id: string
          poi_id: string | null
          raw_count: number
          reporter_id: string | null
        }
        Insert: {
          certified_count?: number | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          poi_id?: string | null
          raw_count: number
          reporter_id?: string | null
        }
        Update: {
          certified_count?: number | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          poi_id?: string | null
          raw_count?: number
          reporter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crowd_predictions_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "pois"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crowd_predictions_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_checkins_analytics"
            referencedColumns: ["poi_id"]
          },
          {
            foreignKeyName: "crowd_predictions_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_pois"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crowd_predictions_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "vw_pois_frontend"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crowd_predictions_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string | null
          event_date: string | null
          event_type: string | null
          id: string
          image_url: string | null
          is_premium: boolean | null
          poi_id: string | null
          start_time: string | null
          tenant_id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string | null
          event_type?: string | null
          id: string
          image_url?: string | null
          is_premium?: boolean | null
          poi_id?: string | null
          start_time?: string | null
          tenant_id: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string | null
          event_type?: string | null
          id?: string
          image_url?: string | null
          is_premium?: boolean | null
          poi_id?: string | null
          start_time?: string | null
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "pois"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_checkins_analytics"
            referencedColumns: ["poi_id"]
          },
          {
            foreignKeyName: "events_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_pois"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "vw_pois_frontend"
            referencedColumns: ["id"]
          },
        ]
      }
      impact_transactions: {
        Row: {
          action_type: string | null
          co2_saved: number
          created_at: string | null
          id: string
          liters_saved: number
          profile_id: string | null
          tenant_id: string | null
          tokens_earned: number
          xp_earned: number
        }
        Insert: {
          action_type?: string | null
          co2_saved: number
          created_at?: string | null
          id?: string
          liters_saved: number
          profile_id?: string | null
          tenant_id?: string | null
          tokens_earned: number
          xp_earned: number
        }
        Update: {
          action_type?: string | null
          co2_saved?: number
          created_at?: string | null
          id?: string
          liters_saved?: number
          profile_id?: string | null
          tenant_id?: string | null
          tokens_earned?: number
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "impact_transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loto_squads: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          leader_id: string | null
          member_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          leader_id?: string | null
          member_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          leader_id?: string | null
          member_id?: string | null
        }
        Relationships: []
      }
      media_vault: {
        Row: {
          created_at: string | null
          id: string
          is_premium_only: boolean | null
          media_path: string
          media_type: string | null
          poi_id: string | null
          required_level: number | null
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_premium_only?: boolean | null
          media_path: string
          media_type?: string | null
          poi_id?: string | null
          required_level?: number | null
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_premium_only?: boolean | null
          media_path?: string
          media_type?: string | null
          poi_id?: string | null
          required_level?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_vault_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "pois"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_vault_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_checkins_analytics"
            referencedColumns: ["poi_id"]
          },
          {
            foreignKeyName: "media_vault_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_pois"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_vault_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "vw_pois_frontend"
            referencedColumns: ["id"]
          },
        ]
      }
      poi_ble_fingerprints: {
        Row: {
          id: string
          is_trusted_anchor: boolean | null
          last_seen_at: string | null
          poi_id: string | null
          scanned_mac_address: string
          times_seen: number | null
        }
        Insert: {
          id?: string
          is_trusted_anchor?: boolean | null
          last_seen_at?: string | null
          poi_id?: string | null
          scanned_mac_address: string
          times_seen?: number | null
        }
        Update: {
          id?: string
          is_trusted_anchor?: boolean | null
          last_seen_at?: string | null
          poi_id?: string | null
          scanned_mac_address?: string
          times_seen?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "poi_ble_fingerprints_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "pois"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poi_ble_fingerprints_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_checkins_analytics"
            referencedColumns: ["poi_id"]
          },
          {
            foreignKeyName: "poi_ble_fingerprints_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_pois"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poi_ble_fingerprints_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "vw_pois_frontend"
            referencedColumns: ["id"]
          },
        ]
      }
      pois: {
        Row: {
          base_co2: number | null
          base_xp: number | null
          category: string
          checkin_radius: number | null
          coords: unknown
          created_at: string | null
          crowd_level: string | null
          description: string | null
          has_water: boolean | null
          id: string
          image_url: string | null
          is_accessible: boolean | null
          is_active: boolean | null
          is_recommended: boolean | null
          layer_name: string | null
          loto_quota_max: number | null
          name: string
          p_iva: string | null
          pec: string | null
          tenant_id: string | null
          updated_at: string | null
          xp_reward: number | null
        }
        Insert: {
          base_co2?: number | null
          base_xp?: number | null
          category: string
          checkin_radius?: number | null
          coords: unknown
          created_at?: string | null
          crowd_level?: string | null
          description?: string | null
          has_water?: boolean | null
          id?: string
          image_url?: string | null
          is_accessible?: boolean | null
          is_active?: boolean | null
          is_recommended?: boolean | null
          layer_name?: string | null
          loto_quota_max?: number | null
          name: string
          p_iva?: string | null
          pec?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          xp_reward?: number | null
        }
        Update: {
          base_co2?: number | null
          base_xp?: number | null
          category?: string
          checkin_radius?: number | null
          coords?: unknown
          created_at?: string | null
          crowd_level?: string | null
          description?: string | null
          has_water?: boolean | null
          id?: string
          image_url?: string | null
          is_accessible?: boolean | null
          is_active?: boolean | null
          is_recommended?: boolean | null
          layer_name?: string | null
          loto_quota_max?: number | null
          name?: string
          p_iva?: string | null
          pec?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          xp_reward?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admin_role: string | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          expo_push_token: string | null
          full_name: string | null
          id: string
          is_banned: boolean | null
          is_premium: boolean | null
          nickname: string | null
          onboarding_completed: boolean | null
          party_size: number | null
          pois_discovered: number | null
          premium_until: string | null
          profile_completed: boolean | null
          total_co2: number | null
          total_distance_meters: number | null
          total_liters: number | null
          total_tokens: number | null
          total_xp: number | null
          updated_at: string | null
        }
        Insert: {
          admin_role?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          expo_push_token?: string | null
          full_name?: string | null
          id: string
          is_banned?: boolean | null
          is_premium?: boolean | null
          nickname?: string | null
          onboarding_completed?: boolean | null
          party_size?: number | null
          pois_discovered?: number | null
          premium_until?: string | null
          profile_completed?: boolean | null
          total_co2?: number | null
          total_distance_meters?: number | null
          total_liters?: number | null
          total_tokens?: number | null
          total_xp?: number | null
          updated_at?: string | null
        }
        Update: {
          admin_role?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          expo_push_token?: string | null
          full_name?: string | null
          id?: string
          is_banned?: boolean | null
          is_premium?: boolean | null
          nickname?: string | null
          onboarding_completed?: boolean | null
          party_size?: number | null
          pois_discovered?: number | null
          premium_until?: string | null
          profile_completed?: boolean | null
          total_co2?: number | null
          total_distance_meters?: number | null
          total_liters?: number | null
          total_tokens?: number | null
          total_xp?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scans: {
        Row: {
          created_at: string | null
          id: string
          poi_id: string | null
          scan_type: string | null
          user_id: string | null
          xp_awarded: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          poi_id?: string | null
          scan_type?: string | null
          user_id?: string | null
          xp_awarded?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          poi_id?: string | null
          scan_type?: string | null
          user_id?: string | null
          xp_awarded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scans_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "pois"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scans_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_checkins_analytics"
            referencedColumns: ["poi_id"]
          },
          {
            foreignKeyName: "scans_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_pois"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scans_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "vw_pois_frontend"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          created_at: string | null
          error_level: string | null
          error_message: string | null
          id: string
          source_segment: string | null
          user_id_involved: string | null
        }
        Insert: {
          created_at?: string | null
          error_level?: string | null
          error_message?: string | null
          id?: string
          source_segment?: string | null
          user_id_involved?: string | null
        }
        Update: {
          created_at?: string | null
          error_level?: string | null
          error_message?: string | null
          id?: string
          source_segment?: string | null
          user_id_involved?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_logs_user_id_involved_fkey"
            columns: ["user_id_involved"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_events: {
        Row: {
          created_at: string | null
          description: string | null
          event_date: string | null
          id: string
          is_premium: boolean | null
          poi_id: string | null
          tenant_id: string | null
          title: string
          xp_reward: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          is_premium?: boolean | null
          poi_id?: string | null
          tenant_id?: string | null
          title: string
          xp_reward?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          is_premium?: boolean | null
          poi_id?: string | null
          tenant_id?: string | null
          title?: string
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_events_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "pois"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_events_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_checkins_analytics"
            referencedColumns: ["poi_id"]
          },
          {
            foreignKeyName: "tenant_events_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_pois"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_events_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "vw_pois_frontend"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_localizations: {
        Row: {
          civic_module_name: string | null
          civic_submit_button: string | null
          civic_success_message: string | null
          events_empty_state: string | null
          events_tab_name: string | null
          id: string
          locale: string | null
          onboarding_cta: string | null
          onboarding_subtitle: string | null
          onboarding_title: string | null
          points_name: string | null
          points_name_plural: string | null
          tenant_id: string | null
        }
        Insert: {
          civic_module_name?: string | null
          civic_submit_button?: string | null
          civic_success_message?: string | null
          events_empty_state?: string | null
          events_tab_name?: string | null
          id?: string
          locale?: string | null
          onboarding_cta?: string | null
          onboarding_subtitle?: string | null
          onboarding_title?: string | null
          points_name?: string | null
          points_name_plural?: string | null
          tenant_id?: string | null
        }
        Update: {
          civic_module_name?: string | null
          civic_submit_button?: string | null
          civic_success_message?: string | null
          events_empty_state?: string | null
          events_tab_name?: string | null
          id?: string
          locale?: string | null
          onboarding_cta?: string | null
          onboarding_subtitle?: string | null
          onboarding_title?: string | null
          points_name?: string | null
          points_name_plural?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_localizations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          center_lat: number | null
          center_lng: number | null
          city_name: string
          default_zoom: number | null
          display_name: string
          favicon_url: string | null
          features: Json | null
          id: string
          logo_url: string | null
          primary_color: string | null
          region: string | null
          secondary_color: string | null
          slug: string
          status: string | null
        }
        Insert: {
          center_lat?: number | null
          center_lng?: number | null
          city_name: string
          default_zoom?: number | null
          display_name: string
          favicon_url?: string | null
          features?: Json | null
          id: string
          logo_url?: string | null
          primary_color?: string | null
          region?: string | null
          secondary_color?: string | null
          slug: string
          status?: string | null
        }
        Update: {
          center_lat?: number | null
          center_lng?: number | null
          city_name?: string
          default_zoom?: number | null
          display_name?: string
          favicon_url?: string | null
          features?: Json | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          region?: string | null
          secondary_color?: string | null
          slug?: string
          status?: string | null
        }
        Relationships: []
      }
      territories: {
        Row: {
          assets: Json
          boundaries: unknown
          colors: Json
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          assets: Json
          boundaries: unknown
          colors: Json
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          assets?: Json
          boundaries?: unknown
          colors?: Json
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          awarded_at: string | null
          badge_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          awarded_at?: string | null
          badge_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          awarded_at?: string | null
          badge_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badge_templates"
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
      user_pois: {
        Row: {
          calculated_speed_kmh: number | null
          co2_saved: number | null
          id: string
          is_shadowbanned: boolean | null
          lat: number | null
          lng: number | null
          poi_id: string
          profile_id: string
          visited_at: string | null
          xp_awarded: number | null
        }
        Insert: {
          calculated_speed_kmh?: number | null
          co2_saved?: number | null
          id?: string
          is_shadowbanned?: boolean | null
          lat?: number | null
          lng?: number | null
          poi_id: string
          profile_id: string
          visited_at?: string | null
          xp_awarded?: number | null
        }
        Update: {
          calculated_speed_kmh?: number | null
          co2_saved?: number | null
          id?: string
          is_shadowbanned?: boolean | null
          lat?: number | null
          lng?: number | null
          poi_id?: string
          profile_id?: string
          visited_at?: string | null
          xp_awarded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_pois_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "pois"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_pois_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_checkins_analytics"
            referencedColumns: ["poi_id"]
          },
          {
            foreignKeyName: "user_pois_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_pois"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_pois_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "vw_pois_frontend"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_pois_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_unlocked_media: {
        Row: {
          media_id: string | null
          profile_id: string
          territory_id: string | null
          unlocked_at: string | null
        }
        Insert: {
          media_id?: string | null
          profile_id: string
          territory_id?: string | null
          unlocked_at?: string | null
        }
        Update: {
          media_id?: string | null
          profile_id?: string
          territory_id?: string | null
          unlocked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_unlocked_media_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_vault"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_unlocked_media_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_unlocked_media_territory_id_fkey"
            columns: ["territory_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id"]
          },
        ]
      }
      whispers: {
        Row: {
          audio_url: string | null
          content: string | null
          created_at: string | null
          id: string
          poi_id: string
          rarity: number | null
          tenant_id: string
          title: string
          unlock_condition: string | null
        }
        Insert: {
          audio_url?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          poi_id: string
          rarity?: number | null
          tenant_id: string
          title: string
          unlock_condition?: string | null
        }
        Update: {
          audio_url?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          poi_id?: string
          rarity?: number | null
          tenant_id?: string
          title?: string
          unlock_condition?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whispers_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "pois"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whispers_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_checkins_analytics"
            referencedColumns: ["poi_id"]
          },
          {
            foreignKeyName: "whispers_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_pois"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whispers_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "vw_pois_frontend"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whispers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      vw_admin_checkins_analytics: {
        Row: {
          category: string | null
          is_recommended: boolean | null
          last_checkin: string | null
          poi_id: string | null
          poi_name: string | null
          total_checkins: number | null
        }
        Relationships: []
      }
      vw_admin_pois: {
        Row: {
          category: string | null
          created_at: string | null
          id: string | null
          is_accessible: boolean | null
          is_active: boolean | null
          is_recommended: boolean | null
          latitude: number | null
          layer_name: string | null
          longitude: number | null
          loto_quota_max: number | null
          name: string | null
          tenant_id: string | null
          xp_reward: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string | null
          is_accessible?: boolean | null
          is_active?: boolean | null
          is_recommended?: boolean | null
          latitude?: never
          layer_name?: string | null
          longitude?: never
          loto_quota_max?: number | null
          name?: string | null
          tenant_id?: string | null
          xp_reward?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string | null
          is_accessible?: boolean | null
          is_active?: boolean | null
          is_recommended?: boolean | null
          latitude?: never
          layer_name?: string | null
          longitude?: never
          loto_quota_max?: number | null
          name?: string | null
          tenant_id?: string | null
          xp_reward?: number | null
        }
        Relationships: []
      }
      vw_collective_impact: {
        Row: {
          total_checkins: number | null
          total_co2_saved: number | null
          total_explorers_today: number | null
          total_pti_generated: number | null
          total_water_saved: number | null
        }
        Relationships: []
      }
      vw_daas_esg_monthly: {
        Row: {
          active_users: number | null
          checkins: number | null
          civic_actions: number | null
          civic_co2_saved: number | null
          civic_pti_generated: number | null
          co2_saved: number | null
          confirmed_reports: number | null
          liters_saved: number | null
          month: string | null
          pending_reports: number | null
          pti_generated: number | null
          tenant_id: string | null
          tourist_co2_saved: number | null
          tourist_xp_earned: number | null
          unclassified_transactions: number | null
          xp_earned: number | null
        }
        Relationships: []
      }
      vw_daas_event_attendance: {
        Row: {
          checkins: number | null
          co2_saved: number | null
          event_date: string | null
          event_id: string | null
          event_title: string | null
          k_anonymity_threshold: number | null
          participants: number | null
          poi_id: string | null
          tenant_id: string | null
        }
        Relationships: []
      }
      vw_daas_heatmap_15min: {
        Row: {
          checkins: number | null
          co2_saved_kg: number | null
          grid_lat: number | null
          grid_lng: number | null
          k_anonymity_threshold: number | null
          poi_id: string | null
          tenant_id: string | null
          time_block: string | null
          unique_visitors: number | null
        }
        Relationships: []
      }
      vw_dev_telemetry_daily: {
        Row: {
          affected_users: number | null
          app_version: string | null
          day: string | null
          event_name: string | null
          events: number | null
          os_name: string | null
          tenant_id: string | null
        }
        Relationships: []
      }
      vw_pois_frontend: {
        Row: {
          base_co2: number | null
          base_xp: number | null
          category: string | null
          checkin_radius: number | null
          coords: unknown
          created_at: string | null
          crowd_level: string | null
          description: string | null
          has_water: boolean | null
          id: string | null
          image_url: string | null
          is_accessible: boolean | null
          is_active: boolean | null
          is_recommended: boolean | null
          lat: number | null
          latitude: number | null
          layer_name: string | null
          lng: number | null
          longitude: number | null
          loto_quota_max: number | null
          name: string | null
          p_iva: string | null
          pec: string | null
          tenant_id: string | null
          updated_at: string | null
          xp_reward: number | null
        }
        Insert: {
          base_co2?: number | null
          base_xp?: number | null
          category?: string | null
          checkin_radius?: number | null
          coords?: unknown
          created_at?: string | null
          crowd_level?: string | null
          description?: string | null
          has_water?: boolean | null
          id?: string | null
          image_url?: string | null
          is_accessible?: boolean | null
          is_active?: boolean | null
          is_recommended?: boolean | null
          lat?: never
          latitude?: never
          layer_name?: string | null
          lng?: never
          longitude?: never
          loto_quota_max?: number | null
          name?: string | null
          p_iva?: string | null
          pec?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          xp_reward?: number | null
        }
        Update: {
          base_co2?: number | null
          base_xp?: number | null
          category?: string | null
          checkin_radius?: number | null
          coords?: unknown
          created_at?: string | null
          crowd_level?: string | null
          description?: string | null
          has_water?: boolean | null
          id?: string | null
          image_url?: string | null
          is_accessible?: boolean | null
          is_active?: boolean | null
          is_recommended?: boolean | null
          lat?: never
          latitude?: never
          layer_name?: string | null
          lng?: never
          longitude?: never
          loto_quota_max?: number | null
          name?: string | null
          p_iva?: string | null
          pec?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          xp_reward?: number | null
        }
        Relationships: []
      }
      vw_user_dashboard_metrics: {
        Row: {
          badges_count: number | null
          checkins_today: number | null
          co2_saved: number | null
          last_activity_at: string | null
          liters_saved: number | null
          nickname: string | null
          pois_discovered: number | null
          profile_id: string | null
          tokens: number | null
          total_xp: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      calculate_level_from_xp: { Args: { total_xp: number }; Returns: number }
      calculate_user_level: { Args: { xp: number }; Returns: number }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_poi_vetrina: {
        Args: { p_poi_id: string; p_user_id: string }
        Returns: {
          id: string
          is_premium_only: boolean
          is_unlocked: boolean
          media_type: string
          media_url: string
          poi_id: string
          required_level: number
          title: string
        }[]
      }
      get_pois: {
        Args: never
        Returns: {
          alternative_poi_id: string
          category: string
          checkin_radius: number
          crowd_level: number
          description: string
          has_water: boolean
          id: string
          image_url: string
          is_accessible: boolean
          is_recommended: boolean
          lat: number
          latitude: number
          layer_name: string
          lng: number
          longitude: number
          name: string
          p_iva: string
          xp_reward: number
        }[]
      }
      get_pois_with_status: {
        Args: { p_profile_id: string }
        Returns: {
          alternative_poi_id: string
          category: string
          checkin_radius: number
          crowd_level: number
          description: string
          has_water: boolean
          id: string
          image_url: string
          is_accessible: boolean
          is_recommended: boolean
          is_visited: boolean
          latitude: number
          layer_name: string
          longitude: number
          name: string
          xp_reward: number
        }[]
      }
      gettransactionid: { Args: never; Returns: unknown }
      join_squad: { Args: { p_leader_id: string }; Returns: Json }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      process_crowd_radar: {
        Args: { p_poi_id: string; p_raw_count: number; p_reporter_id: string }
        Returns: number
      }
      recover_loto_pass: { Args: { recovery_code: string }; Returns: Json }
      rpc_sync_adventure: {
        Args: { is_wheelchair: boolean; steps_count: number; user_id: string }
        Returns: undefined
      }
      rpc_sync_adventure_distance: {
        Args: { meters_count: number; user_id: string }
        Returns: undefined
      }
      rpc_validate_checkin: {
        Args: {
          p_current_lat: number
          p_current_lng: number
          p_poi_id: string
          p_profile_id: string
        }
        Returns: Json
      }
      scan_poi: { Args: { p_poi_id: string }; Returns: Json }
      scan_poi_gps: {
        Args: { p_lat: number; p_lng: number; p_poi_id: string }
        Returns: Json
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
    Enums: {},
  },
} as const
