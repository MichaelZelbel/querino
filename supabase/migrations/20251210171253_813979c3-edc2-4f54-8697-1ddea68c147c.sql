-- Create collections table
CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create collection_items table
CREATE TABLE public.collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('prompt', 'skill', 'workflow')),
  item_id UUID NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(collection_id, item_type, item_id)
);

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

-- Collections RLS policies
CREATE POLICY "Public collections are viewable by everyone"
ON public.collections FOR SELECT
USING (is_public = true);

CREATE POLICY "Users can view their own collections"
ON public.collections FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own collections"
ON public.collections FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own collections"
ON public.collections FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own collections"
ON public.collections FOR DELETE
USING (auth.uid() = owner_id);

-- Collection items RLS policies
CREATE POLICY "Items in public collections are viewable by everyone"
ON public.collection_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.collections
  WHERE collections.id = collection_items.collection_id
  AND collections.is_public = true
));

CREATE POLICY "Users can view items in their own collections"
ON public.collection_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.collections
  WHERE collections.id = collection_items.collection_id
  AND collections.owner_id = auth.uid()
));

CREATE POLICY "Users can add items to their own collections"
ON public.collection_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.collections
  WHERE collections.id = collection_items.collection_id
  AND collections.owner_id = auth.uid()
));

CREATE POLICY "Users can update items in their own collections"
ON public.collection_items FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.collections
  WHERE collections.id = collection_items.collection_id
  AND collections.owner_id = auth.uid()
));

CREATE POLICY "Users can remove items from their own collections"
ON public.collection_items FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.collections
  WHERE collections.id = collection_items.collection_id
  AND collections.owner_id = auth.uid()
));

-- Create indexes
CREATE INDEX idx_collections_owner_id ON public.collections(owner_id);
CREATE INDEX idx_collections_is_public ON public.collections(is_public);
CREATE INDEX idx_collection_items_collection_id ON public.collection_items(collection_id);
CREATE INDEX idx_collection_items_item_type_id ON public.collection_items(item_type, item_id);

-- Trigger for updated_at
CREATE TRIGGER update_collections_updated_at
BEFORE UPDATE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();