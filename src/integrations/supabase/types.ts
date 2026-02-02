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
      ai_allowance_periods: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          period_end: string
          period_start: string
          source: string | null
          tokens_granted: number
          tokens_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          period_end: string
          period_start: string
          source?: string | null
          tokens_granted?: number
          tokens_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          period_end?: string
          period_start?: string
          source?: string | null
          tokens_granted?: number
          tokens_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_credit_settings: {
        Row: {
          description: string | null
          key: string
          value_int: number
        }
        Insert: {
          description?: string | null
          key: string
          value_int: number
        }
        Update: {
          description?: string | null
          key?: string
          value_int?: number
        }
        Relationships: []
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
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_media: {
        Row: {
          alt_text: string | null
          created_at: string
          file_size: number | null
          height: number | null
          id: string
          mime_type: string | null
          uploaded_by: string | null
          url: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          file_size?: number | null
          height?: number | null
          id?: string
          mime_type?: string | null
          uploaded_by?: string | null
          url: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          file_size?: number | null
          height?: number | null
          id?: string
          mime_type?: string | null
          uploaded_by?: string | null
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_revisions: {
        Row: {
          content: string | null
          created_at: string
          created_by: string | null
          excerpt: string | null
          id: string
          post_id: string
          revision_number: number
          title: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          id?: string
          post_id: string
          revision_number?: number
          title: string
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          id?: string
          post_id?: string
          revision_number?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_revisions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_revisions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_tags: {
        Row: {
          created_at: string
          id: string
          post_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          featured_image_id: string | null
          id: string
          og_image_url: string | null
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image_id?: string | null
          id?: string
          og_image_url?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image_id?: string | null
          id?: string
          og_image_url?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_featured_image_id_fkey"
            columns: ["featured_image_id"]
            isOneToOne: false
            referencedRelation: "blog_media"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      claw_reviews: {
        Row: {
          claw_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          claw_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          claw_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claw_reviews_claw_id_fkey"
            columns: ["claw_id"]
            isOneToOne: false
            referencedRelation: "claws"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claw_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      claws: {
        Row: {
          author_id: string | null
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          embedding: string | null
          id: string
          published: boolean | null
          rating_avg: number | null
          rating_count: number | null
          slug: string | null
          source: string | null
          tags: string[] | null
          team_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          id?: string
          published?: boolean | null
          rating_avg?: number | null
          rating_count?: number | null
          slug?: string | null
          source?: string | null
          tags?: string[] | null
          team_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          id?: string
          published?: boolean | null
          rating_avg?: number | null
          rating_count?: number | null
          slug?: string | null
          source?: string | null
          tags?: string[] | null
          team_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claws_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claws_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
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
      llm_usage_events: {
        Row: {
          completion_tokens: number
          created_at: string
          credits_charged: number
          feature: string | null
          id: string
          idempotency_key: string
          metadata: Json
          model: string | null
          n8n_execution_id: string | null
          prompt_tokens: number
          provider: string | null
          total_tokens: number
          user_id: string
          workflow_id: string | null
          workflow_name: string | null
        }
        Insert: {
          completion_tokens?: number
          created_at?: string
          credits_charged?: number
          feature?: string | null
          id?: string
          idempotency_key: string
          metadata?: Json
          model?: string | null
          n8n_execution_id?: string | null
          prompt_tokens?: number
          provider?: string | null
          total_tokens?: number
          user_id: string
          workflow_id?: string | null
          workflow_name?: string | null
        }
        Update: {
          completion_tokens?: number
          created_at?: string
          credits_charged?: number
          feature?: string | null
          id?: string
          idempotency_key?: string
          metadata?: Json
          model?: string | null
          n8n_execution_id?: string | null
          prompt_tokens?: number
          provider?: string | null
          total_tokens?: number
          user_id?: string
          workflow_id?: string | null
          workflow_name?: string | null
        }
        Relationships: []
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
          github_last_synced_at: string | null
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
          github_last_synced_at?: string | null
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
          github_last_synced_at?: string | null
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
          description: string | null
          id: string
          prompt_id: string
          tags: string[] | null
          title: string
          version_number: number
        }
        Insert: {
          change_notes?: string | null
          content: string
          created_at?: string
          description?: string | null
          id?: string
          prompt_id: string
          tags?: string[] | null
          title: string
          version_number?: number
        }
        Update: {
          change_notes?: string | null
          content?: string
          created_at?: string
          description?: string | null
          id?: string
          prompt_id?: string
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
          description: string
          embedding: string | null
          example_output: string | null
          id: string
          is_public: boolean | null
          published_at: string | null
          rating_avg: number | null
          rating_count: number | null
          slug: string | null
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
          description: string
          embedding?: string | null
          example_output?: string | null
          id?: string
          is_public?: boolean | null
          published_at?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          slug?: string | null
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
          description?: string
          embedding?: string | null
          example_output?: string | null
          id?: string
          is_public?: boolean | null
          published_at?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          slug?: string | null
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
      skill_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          skill_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          skill_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          skill_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_reviews_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          author_id: string | null
          category: string | null
          content: string
          created_at: string | null
          description: string | null
          embedding: string | null
          id: string
          published: boolean | null
          rating_avg: number | null
          rating_count: number | null
          slug: string | null
          tags: string[] | null
          team_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content: string
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          id?: string
          published?: boolean | null
          rating_avg?: number | null
          rating_count?: number | null
          slug?: string | null
          tags?: string[] | null
          team_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          id?: string
          published?: boolean | null
          rating_avg?: number | null
          rating_count?: number | null
          slug?: string | null
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
          github_last_synced_at: string | null
          github_repo: string | null
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string | null
          github_branch?: string | null
          github_folder?: string | null
          github_last_synced_at?: string | null
          github_repo?: string | null
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string | null
          github_branch?: string | null
          github_folder?: string | null
          github_last_synced_at?: string | null
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
      user_credentials: {
        Row: {
          created_at: string
          credential_type: string
          credential_value: string
          id: string
          team_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_type: string
          credential_value: string
          id?: string
          team_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credential_type?: string
          credential_value?: string
          id?: string
          team_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_credentials_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
      workflow_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          updated_at: string
          user_id: string
          workflow_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
          workflow_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_reviews_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          author_id: string | null
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          embedding: string | null
          filename: string | null
          id: string
          json: Json
          published: boolean | null
          rating_avg: number | null
          rating_count: number | null
          scope: string | null
          slug: string | null
          tags: string[] | null
          team_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          filename?: string | null
          id?: string
          json?: Json
          published?: boolean | null
          rating_avg?: number | null
          rating_count?: number | null
          scope?: string | null
          slug?: string | null
          tags?: string[] | null
          team_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          filename?: string | null
          id?: string
          json?: Json
          published?: boolean | null
          rating_avg?: number | null
          rating_count?: number | null
          scope?: string | null
          slug?: string | null
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
      v_ai_allowance_current: {
        Row: {
          created_at: string | null
          credits_granted: number | null
          credits_used: number | null
          id: string | null
          metadata: Json | null
          period_end: string | null
          period_start: string | null
          remaining_credits: number | null
          remaining_tokens: number | null
          source: string | null
          tokens_granted: number | null
          tokens_per_credit: number | null
          tokens_used: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          credits_granted?: never
          credits_used?: never
          id?: string | null
          metadata?: Json | null
          period_end?: string | null
          period_start?: string | null
          remaining_credits?: never
          remaining_tokens?: never
          source?: string | null
          tokens_granted?: number | null
          tokens_per_credit?: never
          tokens_used?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          credits_granted?: never
          credits_used?: never
          id?: string | null
          metadata?: Json | null
          period_end?: string | null
          period_start?: string | null
          remaining_credits?: never
          remaining_tokens?: never
          source?: string | null
          tokens_granted?: number | null
          tokens_per_credit?: never
          tokens_used?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      active_creators_last_7_days: { Args: never; Returns: number }
      generate_slug: { Args: { title: string }; Returns: string }
      generate_unique_slug: {
        Args: { p_exclude_id?: string; p_table: string; p_title: string }
        Returns: string
      }
      get_similar_claws: {
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
      get_similar_prompts: {
        Args: { match_limit?: number; target_id: string }
        Returns: {
          author_id: string
          category: string
          copies_count: number
          description: string
          id: string
          rating_avg: number
          rating_count: number
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
      is_item_owner: {
        Args: { p_item_id: string; p_item_type: string; p_user_id: string }
        Returns: boolean
      }
      is_item_public: {
        Args: { p_item_id: string; p_item_type: string }
        Returns: boolean
      }
      is_premium_user: { Args: { _user_id: string }; Returns: boolean }
      is_team_admin_or_owner: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      is_team_member_for_item: {
        Args: { p_item_id: string; p_item_type: string; p_user_id: string }
        Returns: boolean
      }
      is_team_owner: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      search_claws_semantic: {
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
          description: string
          id: string
          is_public: boolean
          rating_avg: number
          rating_count: number
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
      app_role: "free" | "premium" | "premium_gift" | "admin"
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
      app_role: ["free", "premium", "premium_gift", "admin"],
    },
  },
} as const
