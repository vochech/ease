export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  auth: {
    Tables: {
      audit_log_entries: {
        Row: {
          created_at: string | null;
          id: string;
          instance_id: string | null;
          ip_address: string;
          payload: Json | null;
        };
        Insert: {
          created_at?: string | null;
          id: string;
          instance_id?: string | null;
          ip_address?: string;
          payload?: Json | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          instance_id?: string | null;
          ip_address?: string;
          payload?: Json | null;
        };
        Relationships: [];
      };
      flow_state: {
        Row: {
          auth_code: string;
          auth_code_issued_at: string | null;
          authentication_method: string;
          code_challenge: string;
          code_challenge_method: Database["auth"]["Enums"]["code_challenge_method"];
          created_at: string | null;
          id: string;
          provider_access_token: string | null;
          provider_refresh_token: string | null;
          provider_type: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          auth_code: string;
          auth_code_issued_at?: string | null;
          authentication_method: string;
          code_challenge: string;
          code_challenge_method: Database["auth"]["Enums"]["code_challenge_method"];
          created_at?: string | null;
          id: string;
          provider_access_token?: string | null;
          provider_refresh_token?: string | null;
          provider_type: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          auth_code?: string;
          auth_code_issued_at?: string | null;
          authentication_method?: string;
          code_challenge?: string;
          code_challenge_method?: Database["auth"]["Enums"]["code_challenge_method"];
          created_at?: string | null;
          id?: string;
          provider_access_token?: string | null;
          provider_refresh_token?: string | null;
          provider_type?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      identities: {
        Row: {
          created_at: string | null;
          email: string | null;
          id: string;
          identity_data: Json;
          last_sign_in_at: string | null;
          provider: string;
          provider_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          email?: string | null;
          id?: string;
          identity_data: Json;
          last_sign_in_at?: string | null;
          provider: string;
          provider_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          email?: string | null;
          id?: string;
          identity_data?: Json;
          last_sign_in_at?: string | null;
          provider?: string;
          provider_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "identities_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      instances: {
        Row: {
          created_at: string | null;
          id: string;
          raw_base_config: string | null;
          updated_at: string | null;
          uuid: string | null;
        };
        Insert: {
          created_at?: string | null;
          id: string;
          raw_base_config?: string | null;
          updated_at?: string | null;
          uuid?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          raw_base_config?: string | null;
          updated_at?: string | null;
          uuid?: string | null;
        };
        Relationships: [];
      };
      mfa_amr_claims: {
        Row: {
          authentication_method: string;
          created_at: string;
          id: string;
          session_id: string;
          updated_at: string;
        };
        Insert: {
          authentication_method: string;
          created_at: string;
          id: string;
          session_id: string;
          updated_at: string;
        };
        Update: {
          authentication_method?: string;
          created_at?: string;
          id?: string;
          session_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mfa_amr_claims_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      mfa_challenges: {
        Row: {
          created_at: string;
          factor_id: string;
          id: string;
          ip_address: unknown;
          otp_code: string | null;
          verified_at: string | null;
          web_authn_session_data: Json | null;
        };
        Insert: {
          created_at: string;
          factor_id: string;
          id: string;
          ip_address: unknown;
          otp_code?: string | null;
          verified_at?: string | null;
          web_authn_session_data?: Json | null;
        };
        Update: {
          created_at?: string;
          factor_id?: string;
          id?: string;
          ip_address?: unknown;
          otp_code?: string | null;
          verified_at?: string | null;
          web_authn_session_data?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "mfa_challenges_auth_factor_id_fkey";
            columns: ["factor_id"];
            isOneToOne: false;
            referencedRelation: "mfa_factors";
            referencedColumns: ["id"];
          },
        ];
      };
      mfa_factors: {
        Row: {
          created_at: string;
          factor_type: Database["auth"]["Enums"]["factor_type"];
          friendly_name: string | null;
          id: string;
          last_challenged_at: string | null;
          phone: string | null;
          secret: string | null;
          status: Database["auth"]["Enums"]["factor_status"];
          updated_at: string;
          user_id: string;
          web_authn_aaguid: string | null;
          web_authn_credential: Json | null;
        };
        Insert: {
          created_at: string;
          factor_type: Database["auth"]["Enums"]["factor_type"];
          friendly_name?: string | null;
          id: string;
          last_challenged_at?: string | null;
          phone?: string | null;
          secret?: string | null;
          status: Database["auth"]["Enums"]["factor_status"];
          updated_at: string;
          user_id: string;
          web_authn_aaguid?: string | null;
          web_authn_credential?: Json | null;
        };
        Update: {
          created_at?: string;
          factor_type?: Database["auth"]["Enums"]["factor_type"];
          friendly_name?: string | null;
          id?: string;
          last_challenged_at?: string | null;
          phone?: string | null;
          secret?: string | null;
          status?: Database["auth"]["Enums"]["factor_status"];
          updated_at?: string;
          user_id?: string;
          web_authn_aaguid?: string | null;
          web_authn_credential?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "mfa_factors_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      oauth_authorizations: {
        Row: {
          approved_at: string | null;
          authorization_code: string | null;
          authorization_id: string;
          client_id: string;
          code_challenge: string | null;
          code_challenge_method:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null;
          created_at: string;
          expires_at: string;
          id: string;
          redirect_uri: string;
          resource: string | null;
          response_type: Database["auth"]["Enums"]["oauth_response_type"];
          scope: string;
          state: string | null;
          status: Database["auth"]["Enums"]["oauth_authorization_status"];
          user_id: string | null;
        };
        Insert: {
          approved_at?: string | null;
          authorization_code?: string | null;
          authorization_id: string;
          client_id: string;
          code_challenge?: string | null;
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null;
          created_at?: string;
          expires_at?: string;
          id: string;
          redirect_uri: string;
          resource?: string | null;
          response_type?: Database["auth"]["Enums"]["oauth_response_type"];
          scope: string;
          state?: string | null;
          status?: Database["auth"]["Enums"]["oauth_authorization_status"];
          user_id?: string | null;
        };
        Update: {
          approved_at?: string | null;
          authorization_code?: string | null;
          authorization_id?: string;
          client_id?: string;
          code_challenge?: string | null;
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          redirect_uri?: string;
          resource?: string | null;
          response_type?: Database["auth"]["Enums"]["oauth_response_type"];
          scope?: string;
          state?: string | null;
          status?: Database["auth"]["Enums"]["oauth_authorization_status"];
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "oauth_authorizations_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "oauth_clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "oauth_authorizations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      oauth_clients: {
        Row: {
          client_name: string | null;
          client_secret_hash: string | null;
          client_type: Database["auth"]["Enums"]["oauth_client_type"];
          client_uri: string | null;
          created_at: string;
          deleted_at: string | null;
          grant_types: string;
          id: string;
          logo_uri: string | null;
          redirect_uris: string;
          registration_type: Database["auth"]["Enums"]["oauth_registration_type"];
          updated_at: string;
        };
        Insert: {
          client_name?: string | null;
          client_secret_hash?: string | null;
          client_type?: Database["auth"]["Enums"]["oauth_client_type"];
          client_uri?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          grant_types: string;
          id: string;
          logo_uri?: string | null;
          redirect_uris: string;
          registration_type: Database["auth"]["Enums"]["oauth_registration_type"];
          updated_at?: string;
        };
        Update: {
          client_name?: string | null;
          client_secret_hash?: string | null;
          client_type?: Database["auth"]["Enums"]["oauth_client_type"];
          client_uri?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          grant_types?: string;
          id?: string;
          logo_uri?: string | null;
          redirect_uris?: string;
          registration_type?: Database["auth"]["Enums"]["oauth_registration_type"];
          updated_at?: string;
        };
        Relationships: [];
      };
      oauth_consents: {
        Row: {
          client_id: string;
          granted_at: string;
          id: string;
          revoked_at: string | null;
          scopes: string;
          user_id: string;
        };
        Insert: {
          client_id: string;
          granted_at?: string;
          id: string;
          revoked_at?: string | null;
          scopes: string;
          user_id: string;
        };
        Update: {
          client_id?: string;
          granted_at?: string;
          id?: string;
          revoked_at?: string | null;
          scopes?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "oauth_consents_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "oauth_clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "oauth_consents_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      one_time_tokens: {
        Row: {
          created_at: string;
          id: string;
          relates_to: string;
          token_hash: string;
          token_type: Database["auth"]["Enums"]["one_time_token_type"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          relates_to: string;
          token_hash: string;
          token_type: Database["auth"]["Enums"]["one_time_token_type"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          relates_to?: string;
          token_hash?: string;
          token_type?: Database["auth"]["Enums"]["one_time_token_type"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "one_time_tokens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      refresh_tokens: {
        Row: {
          created_at: string | null;
          id: number;
          instance_id: string | null;
          parent: string | null;
          revoked: boolean | null;
          session_id: string | null;
          token: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          instance_id?: string | null;
          parent?: string | null;
          revoked?: boolean | null;
          session_id?: string | null;
          token?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          instance_id?: string | null;
          parent?: string | null;
          revoked?: boolean | null;
          session_id?: string | null;
          token?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "refresh_tokens_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      saml_providers: {
        Row: {
          attribute_mapping: Json | null;
          created_at: string | null;
          entity_id: string;
          id: string;
          metadata_url: string | null;
          metadata_xml: string;
          name_id_format: string | null;
          sso_provider_id: string;
          updated_at: string | null;
        };
        Insert: {
          attribute_mapping?: Json | null;
          created_at?: string | null;
          entity_id: string;
          id: string;
          metadata_url?: string | null;
          metadata_xml: string;
          name_id_format?: string | null;
          sso_provider_id: string;
          updated_at?: string | null;
        };
        Update: {
          attribute_mapping?: Json | null;
          created_at?: string | null;
          entity_id?: string;
          id?: string;
          metadata_url?: string | null;
          metadata_xml?: string;
          name_id_format?: string | null;
          sso_provider_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "saml_providers_sso_provider_id_fkey";
            columns: ["sso_provider_id"];
            isOneToOne: false;
            referencedRelation: "sso_providers";
            referencedColumns: ["id"];
          },
        ];
      };
      saml_relay_states: {
        Row: {
          created_at: string | null;
          flow_state_id: string | null;
          for_email: string | null;
          id: string;
          redirect_to: string | null;
          request_id: string;
          sso_provider_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          flow_state_id?: string | null;
          for_email?: string | null;
          id: string;
          redirect_to?: string | null;
          request_id: string;
          sso_provider_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          flow_state_id?: string | null;
          for_email?: string | null;
          id?: string;
          redirect_to?: string | null;
          request_id?: string;
          sso_provider_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "saml_relay_states_flow_state_id_fkey";
            columns: ["flow_state_id"];
            isOneToOne: false;
            referencedRelation: "flow_state";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saml_relay_states_sso_provider_id_fkey";
            columns: ["sso_provider_id"];
            isOneToOne: false;
            referencedRelation: "sso_providers";
            referencedColumns: ["id"];
          },
        ];
      };
      schema_migrations: {
        Row: {
          version: string;
        };
        Insert: {
          version: string;
        };
        Update: {
          version?: string;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          aal: Database["auth"]["Enums"]["aal_level"] | null;
          created_at: string | null;
          factor_id: string | null;
          id: string;
          ip: unknown;
          not_after: string | null;
          oauth_client_id: string | null;
          refreshed_at: string | null;
          tag: string | null;
          updated_at: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          aal?: Database["auth"]["Enums"]["aal_level"] | null;
          created_at?: string | null;
          factor_id?: string | null;
          id: string;
          ip?: unknown;
          not_after?: string | null;
          oauth_client_id?: string | null;
          refreshed_at?: string | null;
          tag?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          aal?: Database["auth"]["Enums"]["aal_level"] | null;
          created_at?: string | null;
          factor_id?: string | null;
          id?: string;
          ip?: unknown;
          not_after?: string | null;
          oauth_client_id?: string | null;
          refreshed_at?: string | null;
          tag?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_oauth_client_id_fkey";
            columns: ["oauth_client_id"];
            isOneToOne: false;
            referencedRelation: "oauth_clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      sso_domains: {
        Row: {
          created_at: string | null;
          domain: string;
          id: string;
          sso_provider_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          domain: string;
          id: string;
          sso_provider_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          domain?: string;
          id?: string;
          sso_provider_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sso_domains_sso_provider_id_fkey";
            columns: ["sso_provider_id"];
            isOneToOne: false;
            referencedRelation: "sso_providers";
            referencedColumns: ["id"];
          },
        ];
      };
      sso_providers: {
        Row: {
          created_at: string | null;
          disabled: boolean | null;
          id: string;
          resource_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          disabled?: boolean | null;
          id: string;
          resource_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          disabled?: boolean | null;
          id?: string;
          resource_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      users: {
        Row: {
          aud: string | null;
          banned_until: string | null;
          confirmation_sent_at: string | null;
          confirmation_token: string | null;
          confirmed_at: string | null;
          created_at: string | null;
          deleted_at: string | null;
          email: string | null;
          email_change: string | null;
          email_change_confirm_status: number | null;
          email_change_sent_at: string | null;
          email_change_token_current: string | null;
          email_change_token_new: string | null;
          email_confirmed_at: string | null;
          encrypted_password: string | null;
          id: string;
          instance_id: string | null;
          invited_at: string | null;
          is_anonymous: boolean;
          is_sso_user: boolean;
          is_super_admin: boolean | null;
          last_sign_in_at: string | null;
          phone: string | null;
          phone_change: string | null;
          phone_change_sent_at: string | null;
          phone_change_token: string | null;
          phone_confirmed_at: string | null;
          raw_app_meta_data: Json | null;
          raw_user_meta_data: Json | null;
          reauthentication_sent_at: string | null;
          reauthentication_token: string | null;
          recovery_sent_at: string | null;
          recovery_token: string | null;
          role: string | null;
          updated_at: string | null;
        };
        Insert: {
          aud?: string | null;
          banned_until?: string | null;
          confirmation_sent_at?: string | null;
          confirmation_token?: string | null;
          confirmed_at?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          email?: string | null;
          email_change?: string | null;
          email_change_confirm_status?: number | null;
          email_change_sent_at?: string | null;
          email_change_token_current?: string | null;
          email_change_token_new?: string | null;
          email_confirmed_at?: string | null;
          encrypted_password?: string | null;
          id: string;
          instance_id?: string | null;
          invited_at?: string | null;
          is_anonymous?: boolean;
          is_sso_user?: boolean;
          is_super_admin?: boolean | null;
          last_sign_in_at?: string | null;
          phone?: string | null;
          phone_change?: string | null;
          phone_change_sent_at?: string | null;
          phone_change_token?: string | null;
          phone_confirmed_at?: string | null;
          raw_app_meta_data?: Json | null;
          raw_user_meta_data?: Json | null;
          reauthentication_sent_at?: string | null;
          reauthentication_token?: string | null;
          recovery_sent_at?: string | null;
          recovery_token?: string | null;
          role?: string | null;
          updated_at?: string | null;
        };
        Update: {
          aud?: string | null;
          banned_until?: string | null;
          confirmation_sent_at?: string | null;
          confirmation_token?: string | null;
          confirmed_at?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          email?: string | null;
          email_change?: string | null;
          email_change_confirm_status?: number | null;
          email_change_sent_at?: string | null;
          email_change_token_current?: string | null;
          email_change_token_new?: string | null;
          email_confirmed_at?: string | null;
          encrypted_password?: string | null;
          id?: string;
          instance_id?: string | null;
          invited_at?: string | null;
          is_anonymous?: boolean;
          is_sso_user?: boolean;
          is_super_admin?: boolean | null;
          last_sign_in_at?: string | null;
          phone?: string | null;
          phone_change?: string | null;
          phone_change_sent_at?: string | null;
          phone_change_token?: string | null;
          phone_confirmed_at?: string | null;
          raw_app_meta_data?: Json | null;
          raw_user_meta_data?: Json | null;
          reauthentication_sent_at?: string | null;
          reauthentication_token?: string | null;
          recovery_sent_at?: string | null;
          recovery_token?: string | null;
          role?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      email: { Args: never; Returns: string };
      jwt: { Args: never; Returns: Json };
      role: { Args: never; Returns: string };
      uid: { Args: never; Returns: string };
    };
    Enums: {
      aal_level: "aal1" | "aal2" | "aal3";
      code_challenge_method: "s256" | "plain";
      factor_status: "unverified" | "verified";
      factor_type: "totp" | "webauthn" | "phone";
      oauth_authorization_status: "pending" | "approved" | "denied" | "expired";
      oauth_client_type: "public" | "confidential";
      oauth_registration_type: "dynamic" | "manual";
      oauth_response_type: "code";
      one_time_token_type:
        | "confirmation_token"
        | "reauthentication_token"
        | "recovery_token"
        | "email_change_token_new"
        | "email_change_token_current"
        | "phone_change_token";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      activity_log: {
        Row: {
          activity_type: string;
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          metadata: Json | null;
          org_id: string;
          user_id: string;
        };
        Insert: {
          activity_type: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          metadata?: Json | null;
          org_id: string;
          user_id: string;
        };
        Update: {
          activity_type?: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          metadata?: Json | null;
          org_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_log_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_insights: {
        Row: {
          ai_performance_score: number | null;
          behavior_patterns: string | null;
          burnout_risk: number | null;
          calculated_at: string;
          development_recommendations: string | null;
          growth_prediction: number | null;
          id: string;
          model: string | null;
          org_id: string;
          period_end: string;
          period_start: string;
          user_id: string;
        };
        Insert: {
          ai_performance_score?: number | null;
          behavior_patterns?: string | null;
          burnout_risk?: number | null;
          calculated_at?: string;
          development_recommendations?: string | null;
          growth_prediction?: number | null;
          id?: string;
          model?: string | null;
          org_id: string;
          period_end: string;
          period_start: string;
          user_id: string;
        };
        Update: {
          ai_performance_score?: number | null;
          behavior_patterns?: string | null;
          burnout_risk?: number | null;
          calculated_at?: string;
          development_recommendations?: string | null;
          growth_prediction?: number | null;
          id?: string;
          model?: string | null;
          org_id?: string;
          period_end?: string;
          period_start?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_insights_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      behavioral_profiles: {
        Row: {
          autonomy_level: number | null;
          big_five: Json | null;
          collaboration_score: number | null;
          communication_style: string | null;
          created_at: string;
          dominance: string | null;
          emotional_stability: number | null;
          feedback_openness: number | null;
          id: string;
          motivators: Json | null;
          org_id: string;
          personality_type: string | null;
          updated_at: string;
          user_id: string;
          work_tempo: string | null;
        };
        Insert: {
          autonomy_level?: number | null;
          big_five?: Json | null;
          collaboration_score?: number | null;
          communication_style?: string | null;
          created_at?: string;
          dominance?: string | null;
          emotional_stability?: number | null;
          feedback_openness?: number | null;
          id?: string;
          motivators?: Json | null;
          org_id: string;
          personality_type?: string | null;
          updated_at?: string;
          user_id: string;
          work_tempo?: string | null;
        };
        Update: {
          autonomy_level?: number | null;
          big_five?: Json | null;
          collaboration_score?: number | null;
          communication_style?: string | null;
          created_at?: string;
          dominance?: string | null;
          emotional_stability?: number | null;
          feedback_openness?: number | null;
          id?: string;
          motivators?: Json | null;
          org_id?: string;
          personality_type?: string | null;
          updated_at?: string;
          user_id?: string;
          work_tempo?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "behavioral_profiles_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      career_history: {
        Row: {
          created_at: string;
          department: string | null;
          end_date: string | null;
          id: string;
          level: string | null;
          org_id: string;
          position_title: string | null;
          reason: string | null;
          start_date: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          department?: string | null;
          end_date?: string | null;
          id?: string;
          level?: string | null;
          org_id: string;
          position_title?: string | null;
          reason?: string | null;
          start_date?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          department?: string | null;
          end_date?: string | null;
          id?: string;
          level?: string | null;
          org_id?: string;
          position_title?: string | null;
          reason?: string | null;
          start_date?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "career_history_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      compensation_records: {
        Row: {
          base_salary: number;
          bonus_structure: Json | null;
          created_at: string;
          currency: string | null;
          effective_from: string;
          id: string;
          note: string | null;
          org_id: string;
          user_id: string;
        };
        Insert: {
          base_salary: number;
          bonus_structure?: Json | null;
          created_at?: string;
          currency?: string | null;
          effective_from: string;
          id?: string;
          note?: string | null;
          org_id: string;
          user_id: string;
        };
        Update: {
          base_salary?: number;
          bonus_structure?: Json | null;
          created_at?: string;
          currency?: string | null;
          effective_from?: string;
          id?: string;
          note?: string | null;
          org_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "compensation_records_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      context_snapshots: {
        Row: {
          chronotype: string | null;
          company_context: Json | null;
          health_note: string | null;
          id: string;
          on_sick_leave: boolean | null;
          on_vacation: boolean | null;
          org_id: string;
          project_context: Json | null;
          sleep_hours: number | null;
          snapshot_at: string;
          user_id: string;
          weekly_capacity_hours: number | null;
          work_mode: string | null;
        };
        Insert: {
          chronotype?: string | null;
          company_context?: Json | null;
          health_note?: string | null;
          id?: string;
          on_sick_leave?: boolean | null;
          on_vacation?: boolean | null;
          org_id: string;
          project_context?: Json | null;
          sleep_hours?: number | null;
          snapshot_at?: string;
          user_id: string;
          weekly_capacity_hours?: number | null;
          work_mode?: string | null;
        };
        Update: {
          chronotype?: string | null;
          company_context?: Json | null;
          health_note?: string | null;
          id?: string;
          on_sick_leave?: boolean | null;
          on_vacation?: boolean | null;
          org_id?: string;
          project_context?: Json | null;
          sleep_hours?: number | null;
          snapshot_at?: string;
          user_id?: string;
          weekly_capacity_hours?: number | null;
          work_mode?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "context_snapshots_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      device_sessions: {
        Row: {
          device_type: string | null;
          duration_seconds: number | null;
          id: string;
          ip_hash: string | null;
          org_id: string;
          os: string | null;
          session_ended_at: string | null;
          session_started_at: string;
          timezone: string | null;
          user_id: string;
        };
        Insert: {
          device_type?: string | null;
          duration_seconds?: number | null;
          id?: string;
          ip_hash?: string | null;
          org_id: string;
          os?: string | null;
          session_ended_at?: string | null;
          session_started_at: string;
          timezone?: string | null;
          user_id: string;
        };
        Update: {
          device_type?: string | null;
          duration_seconds?: number | null;
          id?: string;
          ip_hash?: string | null;
          org_id?: string;
          os?: string | null;
          session_ended_at?: string | null;
          session_started_at?: string;
          timezone?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "device_sessions_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_accounts: {
        Row: {
          connected_at: string;
          external_user_id: string | null;
          id: string;
          metadata: Json | null;
          org_id: string;
          scopes: string[] | null;
          service: string;
          user_id: string;
        };
        Insert: {
          connected_at?: string;
          external_user_id?: string | null;
          id?: string;
          metadata?: Json | null;
          org_id: string;
          scopes?: string[] | null;
          service: string;
          user_id: string;
        };
        Update: {
          connected_at?: string;
          external_user_id?: string | null;
          id?: string;
          metadata?: Json | null;
          org_id?: string;
          scopes?: string[] | null;
          service?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integration_accounts_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      meeting_notes: {
        Row: {
          content: string;
          created_at: string | null;
          created_by: string | null;
          id: string;
          meeting_id: string;
          updated_at: string | null;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          meeting_id: string;
          updated_at?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          meeting_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "meeting_notes_meeting_id_fkey";
            columns: ["meeting_id"];
            isOneToOne: false;
            referencedRelation: "meetings";
            referencedColumns: ["id"];
          },
        ];
      };
      meeting_participants: {
        Row: {
          created_at: string | null;
          id: string;
          meeting_id: string;
          status: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          meeting_id: string;
          status?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          meeting_id?: string;
          status?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey";
            columns: ["meeting_id"];
            isOneToOne: false;
            referencedRelation: "meetings";
            referencedColumns: ["id"];
          },
        ];
      };
      meeting_recordings: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          duration_seconds: number | null;
          file_size: number | null;
          id: string;
          meeting_id: string;
          storage_path: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          duration_seconds?: number | null;
          file_size?: number | null;
          id?: string;
          meeting_id: string;
          storage_path: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          duration_seconds?: number | null;
          file_size?: number | null;
          id?: string;
          meeting_id?: string;
          storage_path?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "meeting_recordings_meeting_id_fkey";
            columns: ["meeting_id"];
            isOneToOne: false;
            referencedRelation: "meetings";
            referencedColumns: ["id"];
          },
        ];
      };
      meetings: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          end_time: string | null;
          id: string;
          location: string | null;
          meeting_link: string | null;
          org_id: string;
          project_id: string | null;
          start_time: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          end_time?: string | null;
          id?: string;
          location?: string | null;
          meeting_link?: string | null;
          org_id: string;
          project_id?: string | null;
          start_time?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          end_time?: string | null;
          id?: string;
          location?: string | null;
          meeting_link?: string | null;
          org_id?: string;
          project_id?: string | null;
          start_time?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "meetings_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meetings_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      mentoring_relations: {
        Row: {
          ended_at: string | null;
          id: string;
          mentee_user_id: string;
          mentor_user_id: string;
          org_id: string;
          started_at: string;
          status: string | null;
        };
        Insert: {
          ended_at?: string | null;
          id?: string;
          mentee_user_id: string;
          mentor_user_id: string;
          org_id: string;
          started_at?: string;
          status?: string | null;
        };
        Update: {
          ended_at?: string | null;
          id?: string;
          mentee_user_id?: string;
          mentor_user_id?: string;
          org_id?: string;
          started_at?: string;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mentoring_relations_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      org_members: {
        Row: {
          created_at: string | null;
          department: string | null;
          id: string;
          invited_at: string | null;
          invited_by: string | null;
          joined_at: string | null;
          manager_id: string | null;
          org_id: string;
          permissions: Json | null;
          role: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          department?: string | null;
          id?: string;
          invited_at?: string | null;
          invited_by?: string | null;
          joined_at?: string | null;
          manager_id?: string | null;
          org_id: string;
          permissions?: Json | null;
          role: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          department?: string | null;
          id?: string;
          invited_at?: string | null;
          invited_by?: string | null;
          joined_at?: string | null;
          manager_id?: string | null;
          org_id?: string;
          permissions?: Json | null;
          role?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          slug: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          slug?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          slug?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      performance_reviews: {
        Row: {
          acknowledged_at: string | null;
          areas_for_improvement: string | null;
          collaboration_rating: number | null;
          comments: string | null;
          communication_rating: number | null;
          created_at: string;
          goals_set: string | null;
          id: string;
          initiative_rating: number | null;
          org_id: string;
          overall_rating: number | null;
          productivity_rating: number | null;
          quality_rating: number | null;
          review_period_end: string | null;
          review_period_start: string | null;
          review_type: string;
          reviewer_id: string;
          status: string | null;
          strengths: string | null;
          submitted_at: string | null;
          technical_skills_rating: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          acknowledged_at?: string | null;
          areas_for_improvement?: string | null;
          collaboration_rating?: number | null;
          comments?: string | null;
          communication_rating?: number | null;
          created_at?: string;
          goals_set?: string | null;
          id?: string;
          initiative_rating?: number | null;
          org_id: string;
          overall_rating?: number | null;
          productivity_rating?: number | null;
          quality_rating?: number | null;
          review_period_end?: string | null;
          review_period_start?: string | null;
          review_type: string;
          reviewer_id: string;
          status?: string | null;
          strengths?: string | null;
          submitted_at?: string | null;
          technical_skills_rating?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          acknowledged_at?: string | null;
          areas_for_improvement?: string | null;
          collaboration_rating?: number | null;
          comments?: string | null;
          communication_rating?: number | null;
          created_at?: string;
          goals_set?: string | null;
          id?: string;
          initiative_rating?: number | null;
          org_id?: string;
          overall_rating?: number | null;
          productivity_rating?: number | null;
          quality_rating?: number | null;
          review_period_end?: string | null;
          review_period_start?: string | null;
          review_type?: string;
          reviewer_id?: string;
          status?: string | null;
          strengths?: string | null;
          submitted_at?: string | null;
          technical_skills_rating?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "performance_reviews_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      privacy_consents: {
        Row: {
          anonymize_metrics: boolean | null;
          consent_text_version: string | null;
          gdpr_consent: boolean | null;
          granted_at: string | null;
          id: string;
          org_id: string;
          revoked_at: string | null;
          tracking_opt_in: boolean | null;
          user_id: string;
        };
        Insert: {
          anonymize_metrics?: boolean | null;
          consent_text_version?: string | null;
          gdpr_consent?: boolean | null;
          granted_at?: string | null;
          id?: string;
          org_id: string;
          revoked_at?: string | null;
          tracking_opt_in?: boolean | null;
          user_id: string;
        };
        Update: {
          anonymize_metrics?: boolean | null;
          consent_text_version?: string | null;
          gdpr_consent?: boolean | null;
          granted_at?: string | null;
          id?: string;
          org_id?: string;
          revoked_at?: string | null;
          tracking_opt_in?: boolean | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "privacy_consents_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          name: string;
          org_id: string;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          org_id: string;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          org_id?: string;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "projects_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      promotion_candidates: {
        Row: {
          created_at: string;
          decided_at: string | null;
          decided_by: string | null;
          id: string;
          org_id: string;
          recommendation: string | null;
          status: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          id?: string;
          org_id: string;
          recommendation?: string | null;
          status: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          id?: string;
          org_id?: string;
          recommendation?: string | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "promotion_candidates_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      social_feedback: {
        Row: {
          comment: string | null;
          created_at: string;
          feedback_type: string | null;
          from_user_id: string;
          id: string;
          org_id: string;
          score: number | null;
          to_user_id: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          feedback_type?: string | null;
          from_user_id: string;
          id?: string;
          org_id: string;
          score?: number | null;
          to_user_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          feedback_type?: string | null;
          from_user_id?: string;
          id?: string;
          org_id?: string;
          score?: number | null;
          to_user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "social_feedback_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      social_interactions: {
        Row: {
          created_at: string;
          from_user_id: string;
          id: string;
          interaction_type: string;
          metadata: Json | null;
          org_id: string;
          to_user_id: string;
          weight: number | null;
        };
        Insert: {
          created_at?: string;
          from_user_id: string;
          id?: string;
          interaction_type: string;
          metadata?: Json | null;
          org_id: string;
          to_user_id: string;
          weight?: number | null;
        };
        Update: {
          created_at?: string;
          from_user_id?: string;
          id?: string;
          interaction_type?: string;
          metadata?: Json | null;
          org_id?: string;
          to_user_id?: string;
          weight?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "social_interactions_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      subjective_checkins: {
        Row: {
          checkin_at: string;
          comment: string | null;
          id: string;
          metadata: Json | null;
          metric: string;
          mood_emoji: string | null;
          org_id: string;
          score: number | null;
          user_id: string;
        };
        Insert: {
          checkin_at?: string;
          comment?: string | null;
          id?: string;
          metadata?: Json | null;
          metric: string;
          mood_emoji?: string | null;
          org_id: string;
          score?: number | null;
          user_id: string;
        };
        Update: {
          checkin_at?: string;
          comment?: string | null;
          id?: string;
          metadata?: Json | null;
          metric?: string;
          mood_emoji?: string | null;
          org_id?: string;
          score?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subjective_checkins_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          completed: boolean | null;
          created_at: string | null;
          id: string;
          project_id: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          completed?: boolean | null;
          created_at?: string | null;
          id?: string;
          project_id?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          completed?: boolean | null;
          created_at?: string | null;
          id?: string;
          project_id?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      user_performance_metrics: {
        Row: {
          active_projects_count: number | null;
          average_task_completion_days: number | null;
          bugs_reported: number | null;
          comments_posted: number | null;
          commits_count: number | null;
          completion_rate: number | null;
          created_at: string;
          documents_created: number | null;
          estimated_vs_actual_ratio: number | null;
          feedback_requests_received: number | null;
          help_requests_fulfilled: number | null;
          id: string;
          ideas_submitted: number | null;
          last_calculated_at: string | null;
          manager_rating: number | null;
          meetings_attended: number | null;
          meetings_created: number | null;
          org_id: string;
          peer_rating: number | null;
          period_end: string;
          period_start: string;
          period_type: string | null;
          projects_led_count: number | null;
          projects_member_count: number | null;
          proposals_created: number | null;
          reactions_given: number | null;
          reports_submitted: number | null;
          tasks_completed_count: number | null;
          tasks_completed_late: number | null;
          tasks_completed_on_time: number | null;
          tasks_requiring_rework: number | null;
          total_logins: number | null;
          updated_at: string;
          user_id: string;
          voluntary_tasks_taken: number | null;
        };
        Insert: {
          active_projects_count?: number | null;
          average_task_completion_days?: number | null;
          bugs_reported?: number | null;
          comments_posted?: number | null;
          commits_count?: number | null;
          completion_rate?: number | null;
          created_at?: string;
          documents_created?: number | null;
          estimated_vs_actual_ratio?: number | null;
          feedback_requests_received?: number | null;
          help_requests_fulfilled?: number | null;
          id?: string;
          ideas_submitted?: number | null;
          last_calculated_at?: string | null;
          manager_rating?: number | null;
          meetings_attended?: number | null;
          meetings_created?: number | null;
          org_id: string;
          peer_rating?: number | null;
          period_end: string;
          period_start: string;
          period_type?: string | null;
          projects_led_count?: number | null;
          projects_member_count?: number | null;
          proposals_created?: number | null;
          reactions_given?: number | null;
          reports_submitted?: number | null;
          tasks_completed_count?: number | null;
          tasks_completed_late?: number | null;
          tasks_completed_on_time?: number | null;
          tasks_requiring_rework?: number | null;
          total_logins?: number | null;
          updated_at?: string;
          user_id: string;
          voluntary_tasks_taken?: number | null;
        };
        Update: {
          active_projects_count?: number | null;
          average_task_completion_days?: number | null;
          bugs_reported?: number | null;
          comments_posted?: number | null;
          commits_count?: number | null;
          completion_rate?: number | null;
          created_at?: string;
          documents_created?: number | null;
          estimated_vs_actual_ratio?: number | null;
          feedback_requests_received?: number | null;
          help_requests_fulfilled?: number | null;
          id?: string;
          ideas_submitted?: number | null;
          last_calculated_at?: string | null;
          manager_rating?: number | null;
          meetings_attended?: number | null;
          meetings_created?: number | null;
          org_id?: string;
          peer_rating?: number | null;
          period_end?: string;
          period_start?: string;
          period_type?: string | null;
          projects_led_count?: number | null;
          projects_member_count?: number | null;
          proposals_created?: number | null;
          reactions_given?: number | null;
          reports_submitted?: number | null;
          tasks_completed_count?: number | null;
          tasks_completed_late?: number | null;
          tasks_completed_on_time?: number | null;
          tasks_requiring_rework?: number | null;
          total_logins?: number | null;
          updated_at?: string;
          user_id?: string;
          voluntary_tasks_taken?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_performance_metrics_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      user_profiles: {
        Row: {
          bio: string | null;
          certifications: string[] | null;
          contract_type: string | null;
          created_at: string;
          current_capacity_percentage: number | null;
          department: string | null;
          display_name: string | null;
          employment_status: string | null;
          full_name: string | null;
          id: string;
          is_available_for_tasks: boolean | null;
          languages: string[] | null;
          last_profile_update_at: string | null;
          office_location: string | null;
          phone_number: string | null;
          position_title: string | null;
          preferred_work_style: string | null;
          profile_photo_url: string | null;
          role_level: string | null;
          shift_pattern: string | null;
          skills: string[] | null;
          specialization: string | null;
          start_date: string | null;
          team: string | null;
          timezone: string | null;
          updated_at: string;
          updated_by: string | null;
          user_id: string;
          working_hours_per_week: number | null;
          years_of_experience: number | null;
        };
        Insert: {
          bio?: string | null;
          certifications?: string[] | null;
          contract_type?: string | null;
          created_at?: string;
          current_capacity_percentage?: number | null;
          department?: string | null;
          display_name?: string | null;
          employment_status?: string | null;
          full_name?: string | null;
          id?: string;
          is_available_for_tasks?: boolean | null;
          languages?: string[] | null;
          last_profile_update_at?: string | null;
          office_location?: string | null;
          phone_number?: string | null;
          position_title?: string | null;
          preferred_work_style?: string | null;
          profile_photo_url?: string | null;
          role_level?: string | null;
          shift_pattern?: string | null;
          skills?: string[] | null;
          specialization?: string | null;
          start_date?: string | null;
          team?: string | null;
          timezone?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          user_id: string;
          working_hours_per_week?: number | null;
          years_of_experience?: number | null;
        };
        Update: {
          bio?: string | null;
          certifications?: string[] | null;
          contract_type?: string | null;
          created_at?: string;
          current_capacity_percentage?: number | null;
          department?: string | null;
          display_name?: string | null;
          employment_status?: string | null;
          full_name?: string | null;
          id?: string;
          is_available_for_tasks?: boolean | null;
          languages?: string[] | null;
          last_profile_update_at?: string | null;
          office_location?: string | null;
          phone_number?: string | null;
          position_title?: string | null;
          preferred_work_style?: string | null;
          profile_photo_url?: string | null;
          role_level?: string | null;
          shift_pattern?: string | null;
          skills?: string[] | null;
          specialization?: string | null;
          start_date?: string | null;
          team?: string | null;
          timezone?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          user_id?: string;
          working_hours_per_week?: number | null;
          years_of_experience?: number | null;
        };
        Relationships: [];
      };
    };
    Views: {
      ai_risk_dashboard: {
        Row: {
          ai_performance_score: number | null;
          burnout_risk: number | null;
          calculated_at: string | null;
          growth_prediction: number | null;
          org_id: string | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_insights_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      current_month_performance: {
        Row: {
          active_projects_count: number | null;
          average_task_completion_days: number | null;
          bugs_reported: number | null;
          comments_posted: number | null;
          commits_count: number | null;
          completion_rate: number | null;
          created_at: string | null;
          department: string | null;
          documents_created: number | null;
          estimated_vs_actual_ratio: number | null;
          feedback_requests_received: number | null;
          full_name: string | null;
          help_requests_fulfilled: number | null;
          id: string | null;
          ideas_submitted: number | null;
          last_calculated_at: string | null;
          manager_rating: number | null;
          meetings_attended: number | null;
          meetings_created: number | null;
          org_id: string | null;
          org_role: string | null;
          peer_rating: number | null;
          period_end: string | null;
          period_start: string | null;
          period_type: string | null;
          position_title: string | null;
          projects_led_count: number | null;
          projects_member_count: number | null;
          proposals_created: number | null;
          reactions_given: number | null;
          reports_submitted: number | null;
          role_level: string | null;
          tasks_completed_count: number | null;
          tasks_completed_late: number | null;
          tasks_completed_on_time: number | null;
          tasks_requiring_rework: number | null;
          total_logins: number | null;
          updated_at: string | null;
          user_id: string | null;
          voluntary_tasks_taken: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_performance_metrics_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      current_subjective_state: {
        Row: {
          checkin_at: string | null;
          comment: string | null;
          metric: string | null;
          mood_emoji: string | null;
          org_id: string | null;
          score: number | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "subjective_checkins_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      social_network_overview: {
        Row: {
          conflicts_received: number | null;
          kudos_received: number | null;
          org_id: string | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "social_feedback_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      team_members_overview: {
        Row: {
          current_capacity_percentage: number | null;
          display_name: string | null;
          email: string | null;
          employment_start_date: string | null;
          employment_status: string | null;
          full_name: string | null;
          is_available_for_tasks: boolean | null;
          joined_org_at: string | null;
          manager_id: string | null;
          org_department: string | null;
          org_id: string | null;
          org_member_id: string | null;
          org_role: string | null;
          position_title: string | null;
          profile_department: string | null;
          profile_photo_url: string | null;
          role_level: string | null;
          skills: string[] | null;
          specialization: string | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      user_context_current: {
        Row: {
          chronotype: string | null;
          on_vacation: boolean | null;
          org_id: string | null;
          snapshot_at: string | null;
          user_id: string | null;
          weekly_capacity_hours: number | null;
          work_mode: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "context_snapshots_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      user_performance_summary: {
        Row: {
          active_projects_count: number | null;
          avg_rating_last_year: number | null;
          completion_rank: number | null;
          completion_rate: number | null;
          department: string | null;
          full_name: string | null;
          last_calculated_at: string | null;
          meetings_attended: number | null;
          org_id: string | null;
          period_end: string | null;
          period_start: string | null;
          position_title: string | null;
          productivity_rank: number | null;
          tasks_completed_count: number | null;
          tasks_completed_on_time: number | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_performance_metrics_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      calculate_user_metrics: {
        Args: {
          p_org_id: string;
          p_period_end: string;
          p_period_start: string;
          p_user_id: string;
        };
        Returns: undefined;
      };
      get_user_workload: {
        Args: { p_user_id: string };
        Returns: {
          high_priority_tasks: number;
          overdue_tasks: number;
          total_tasks: number;
          workload_score: number;
        }[];
      };
      log_user_activity: {
        Args: {
          p_activity_type: string;
          p_entity_id?: string;
          p_entity_type?: string;
          p_metadata?: Json;
          p_org_id: string;
          p_user_id: string;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null;
          avif_autodetection: boolean | null;
          created_at: string | null;
          file_size_limit: number | null;
          id: string;
          name: string;
          owner: string | null;
          owner_id: string | null;
          public: boolean | null;
          type: Database["storage"]["Enums"]["buckettype"];
          updated_at: string | null;
        };
        Insert: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id: string;
          name: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          type?: Database["storage"]["Enums"]["buckettype"];
          updated_at?: string | null;
        };
        Update: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id?: string;
          name?: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          type?: Database["storage"]["Enums"]["buckettype"];
          updated_at?: string | null;
        };
        Relationships: [];
      };
      buckets_analytics: {
        Row: {
          created_at: string;
          format: string;
          id: string;
          type: Database["storage"]["Enums"]["buckettype"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          format?: string;
          id: string;
          type?: Database["storage"]["Enums"]["buckettype"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          format?: string;
          id?: string;
          type?: Database["storage"]["Enums"]["buckettype"];
          updated_at?: string;
        };
        Relationships: [];
      };
      migrations: {
        Row: {
          executed_at: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Insert: {
          executed_at?: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Update: {
          executed_at?: string | null;
          hash?: string;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      objects: {
        Row: {
          bucket_id: string | null;
          created_at: string | null;
          id: string;
          last_accessed_at: string | null;
          level: number | null;
          metadata: Json | null;
          name: string | null;
          owner: string | null;
          owner_id: string | null;
          path_tokens: string[] | null;
          updated_at: string | null;
          user_metadata: Json | null;
          version: string | null;
        };
        Insert: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          level?: number | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          user_metadata?: Json | null;
          version?: string | null;
        };
        Update: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          level?: number | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          user_metadata?: Json | null;
          version?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey";
            columns: ["bucket_id"];
            isOneToOne: false;
            referencedRelation: "buckets";
            referencedColumns: ["id"];
          },
        ];
      };
      prefixes: {
        Row: {
          bucket_id: string;
          created_at: string | null;
          level: number;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          bucket_id: string;
          created_at?: string | null;
          level?: number;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          bucket_id?: string;
          created_at?: string | null;
          level?: number;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "prefixes_bucketId_fkey";
            columns: ["bucket_id"];
            isOneToOne: false;
            referencedRelation: "buckets";
            referencedColumns: ["id"];
          },
        ];
      };
      s3_multipart_uploads: {
        Row: {
          bucket_id: string;
          created_at: string;
          id: string;
          in_progress_size: number;
          key: string;
          owner_id: string | null;
          upload_signature: string;
          user_metadata: Json | null;
          version: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          id: string;
          in_progress_size?: number;
          key: string;
          owner_id?: string | null;
          upload_signature: string;
          user_metadata?: Json | null;
          version: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          id?: string;
          in_progress_size?: number;
          key?: string;
          owner_id?: string | null;
          upload_signature?: string;
          user_metadata?: Json | null;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey";
            columns: ["bucket_id"];
            isOneToOne: false;
            referencedRelation: "buckets";
            referencedColumns: ["id"];
          },
        ];
      };
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string;
          created_at: string;
          etag: string;
          id: string;
          key: string;
          owner_id: string | null;
          part_number: number;
          size: number;
          upload_id: string;
          version: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          etag: string;
          id?: string;
          key: string;
          owner_id?: string | null;
          part_number: number;
          size?: number;
          upload_id: string;
          version: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          etag?: string;
          id?: string;
          key?: string;
          owner_id?: string | null;
          part_number?: number;
          size?: number;
          upload_id?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey";
            columns: ["bucket_id"];
            isOneToOne: false;
            referencedRelation: "buckets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey";
            columns: ["upload_id"];
            isOneToOne: false;
            referencedRelation: "s3_multipart_uploads";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_prefixes: {
        Args: { _bucket_id: string; _name: string };
        Returns: undefined;
      };
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string };
        Returns: undefined;
      };
      delete_leaf_prefixes: {
        Args: { bucket_ids: string[]; names: string[] };
        Returns: undefined;
      };
      delete_prefix: {
        Args: { _bucket_id: string; _name: string };
        Returns: boolean;
      };
      extension: { Args: { name: string }; Returns: string };
      filename: { Args: { name: string }; Returns: string };
      foldername: { Args: { name: string }; Returns: string[] };
      get_level: { Args: { name: string }; Returns: number };
      get_prefix: { Args: { name: string }; Returns: string };
      get_prefixes: { Args: { name: string }; Returns: string[] };
      get_size_by_bucket: {
        Args: never;
        Returns: {
          bucket_id: string;
          size: number;
        }[];
      };
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string;
          delimiter_param: string;
          max_keys?: number;
          next_key_token?: string;
          next_upload_token?: string;
          prefix_param: string;
        };
        Returns: {
          created_at: string;
          id: string;
          key: string;
        }[];
      };
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string;
          delimiter_param: string;
          max_keys?: number;
          next_token?: string;
          prefix_param: string;
          start_after?: string;
        };
        Returns: {
          id: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
      lock_top_prefixes: {
        Args: { bucket_ids: string[]; names: string[] };
        Returns: undefined;
      };
      operation: { Args: never; Returns: string };
      search: {
        Args: {
          bucketname: string;
          levels?: number;
          limits?: number;
          offsets?: number;
          prefix: string;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          created_at: string;
          id: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
      search_legacy_v1: {
        Args: {
          bucketname: string;
          levels?: number;
          limits?: number;
          offsets?: number;
          prefix: string;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          created_at: string;
          id: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
      search_v1_optimised: {
        Args: {
          bucketname: string;
          levels?: number;
          limits?: number;
          offsets?: number;
          prefix: string;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          created_at: string;
          id: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
      search_v2: {
        Args: {
          bucket_name: string;
          levels?: number;
          limits?: number;
          prefix: string;
          sort_column?: string;
          sort_column_after?: string;
          sort_order?: string;
          start_after?: string;
        };
        Returns: {
          created_at: string;
          id: string;
          key: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
    };
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  auth: {
    Enums: {
      aal_level: ["aal1", "aal2", "aal3"],
      code_challenge_method: ["s256", "plain"],
      factor_status: ["unverified", "verified"],
      factor_type: ["totp", "webauthn", "phone"],
      oauth_authorization_status: ["pending", "approved", "denied", "expired"],
      oauth_client_type: ["public", "confidential"],
      oauth_registration_type: ["dynamic", "manual"],
      oauth_response_type: ["code"],
      one_time_token_type: [
        "confirmation_token",
        "reauthentication_token",
        "recovery_token",
        "email_change_token_new",
        "email_change_token_current",
        "phone_change_token",
      ],
    },
  },
  public: {
    Enums: {},
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS"],
    },
  },
} as const;
