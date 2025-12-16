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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          id: string
          item_id: string | null
          item_type: string | null
          metadata: Json | null
          team_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          id?: string
          item_id?: string | null
          item_type?: string | null
          metadata?: Json | null
          team_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          id?: string
          item_id?: string | null
          item_type?: string | null
          metadata?: Json | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          item_type: string
          quality: Json | null
          recommendations: Json | null
          summary: string | null
          tags: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          item_type: string
          quality?: Json | null
          recommendations?: Json | null
          summary?: string | null
          tags?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          item_type?: string
          quality?: Json | null
          recommendations?: Json | null
          summary?: string | null
          tags?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      collection_items: {
        Row: {
          collection_id: string
          created_at: string | null
          id: string
          item_id: string
          item_type: string
          sort_order: number | null
        }
        Insert: {
          collection_id: string
          created_at?: string | null
          id?: string
          item_id: string
          item_type: string
          sort_order?: number | null
        }
        Update: {
          collection_id?: string
          created_at?: string | null
          id?: string
          item_id?: string
          item_type?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          owner_id: string
          team_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          owner_id: string
          team_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          owner_id?: string
          team_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collections_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          edited: boolean | null
          id: string
          item_id: string
          item_type: string
          parent_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          edited?: boolean | null
          id?: string
          item_id: string
          item_type: string
          parent_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          edited?: boolean | null
          id?: string
          item_id?: string
          item_type?: string
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
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
          created_at: string | null
          display_name: string | null
          github: string | null
          github_branch: string | null
          github_folder: string | null
          github_repo: string | null
          github_sync_enabled: boolean | null
          id: string
          plan_source: string | null
          plan_type: string | null
          role: string | null
          twitter: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          github?: string | null
          github_branch?: string | null
          github_folder?: string | null
          github_repo?: string | null
          github_sync_enabled?: boolean | null
          id: string
          plan_source?: string | null
          plan_type?: string | null
          role?: string | null
          twitter?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          github?: string | null
          github_branch?: string | null
          github_folder?: string | null
          github_repo?: string | null
          github_sync_enabled?: boolean | null
          id?: string
          plan_source?: string | null
          plan_type?: string | null
          role?: string | null
          twitter?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      prompt_pins: {
        Row: {
          created_at: string | null
          id: string
          prompt_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          prompt_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          prompt_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_pins_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_pins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          prompt_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          prompt_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          prompt_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_reviews_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_versions: {
        Row: {
          change_notes: string | null
          content: string
          created_at: string
          id: string
          prompt_id: string
          short_description: string | null
          tags: string[] | null
          title: string
          version_number: number
        }
        Insert: {
          change_notes?: string | null
          content: string
          created_at?: string
          id?: string
          prompt_id: string
          short_description?: string | null
          tags?: string[] | null
          title: string
          version_number?: number
        }
        Update: {
          change_notes?: string | null
          content?: string
          created_at?: string
          id?: string
          prompt_id?: string
          short_description?: string | null
          tags?: string[] | null
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompt_versions_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          author_id: string | null
          category: string
          content: string
          copies_count: number | null
          created_at: string | null
          embedding: string | null
          example_output: string | null
          id: string
          is_public: boolean | null
          published_at: string | null
          rating_avg: number | null
          rating_count: number | null
          short_description: string
          summary: string | null
          tags: string[] | null
          team_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          category: string
          content: string
          copies_count?: number | null
          created_at?: string | null
          embedding?: string | null
          example_output?: string | null
          id?: string
          is_public?: boolean | null
          published_at?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          short_description: string
          summary?: string | null
          tags?: string[] | null
          team_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          category?: string
          content?: string
          copies_count?: number | null
          created_at?: string | null
          embedding?: string | null
          example_output?: string | null
          id?: string
          is_public?: boolean | null
          published_at?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          short_description?: string
          summary?: string | null
          tags?: string[] | null
          team_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          description: string | null
          embedding: string | null
          id: string
          published: boolean | null
          tags: string[] | null
          team_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          id?: string
          published?: boolean | null
          tags?: string[] | null
          team_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          id?: string
          published?: boolean | null
          tags?: string[] | null
          team_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skills_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestions: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          description: string | null
          id: string
          item_id: string
          item_type: string
          requested_changes: Json | null
          review_comment: string | null
          reviewer_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          description?: string | null
          id?: string
          item_id: string
          item_type: string
          requested_changes?: Json | null
          review_comment?: string | null
          reviewer_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          description?: string | null
          id?: string
          item_id?: string
          item_type?: string
          requested_changes?: Json | null
          review_comment?: string | null
          reviewer_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestions_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string | null
          id: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          github_branch: string | null
          github_folder: string | null
          github_repo: string | null
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string | null
          github_branch?: string | null
          github_folder?: string | null
          github_repo?: string | null
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string | null
          github_branch?: string | null
          github_folder?: string | null
          github_repo?: string | null
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_saved_prompts: {
        Row: {
          created_at: string | null
          id: string
          prompt_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          prompt_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          prompt_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_saved_prompts_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_saved_prompts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          author_id: string | null
          created_at: string | null
          description: string | null
          embedding: string | null
          id: string
          json: Json
          published: boolean | null
          tags: string[] | null
          team_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          id?: string
          json?: Json
          published?: boolean | null
          tags?: string[] | null
          team_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          id?: string
          json?: Json
          published?: boolean | null
          tags?: string[] | null
          team_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflows_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_similar_prompts: {
        Args: { match_limit?: number; target_id: string }
        Returns: {
          author_id: string
          category: string
          copies_count: number
          id: string
          rating_avg: number
          rating_count: number
          short_description: string
          similarity: number
          tags: string[]
          team_id: string
          title: string
        }[]
      }
      get_similar_skills: {
        Args: { match_limit?: number; target_id: string }
        Returns: {
          author_id: string
          description: string
          id: string
          similarity: number
          tags: string[]
          team_id: string
          title: string
        }[]
      }
      get_similar_workflows: {
        Args: { match_limit?: number; target_id: string }
        Returns: {
          author_id: string
          description: string
          id: string
          similarity: number
          tags: string[]
          team_id: string
          title: string
        }[]
      }
      is_item_owner: {
        Args: { p_item_id: string; p_item_type: string; p_user_id: string }
        Returns: boolean
      }
      is_item_public: {
        Args: { p_item_id: string; p_item_type: string }
        Returns: boolean
      }
      is_team_member_for_item: {
        Args: { p_item_id: string; p_item_type: string; p_user_id: string }
        Returns: boolean
      }
      search_prompts_semantic: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          author_id: string
          category: string
          content: string
          copies_count: number
          created_at: string
          id: string
          is_public: boolean
          rating_avg: number
          rating_count: number
          short_description: string
          similarity: number
          tags: string[]
          title: string
        }[]
      }
      search_skills_semantic: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          author_id: string
          content: string
          created_at: string
          description: string
          id: string
          published: boolean
          similarity: number
          tags: string[]
          title: string
        }[]
      }
      search_workflows_semantic: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          author_id: string
          created_at: string
          description: string
          id: string
          published: boolean
          similarity: number
          tags: string[]
          title: string
          workflow_json: Json
        }[]
      }
      update_embedding: {
        Args: { p_embedding: string; p_item_id: string; p_item_type: string }
        Returns: undefined
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
