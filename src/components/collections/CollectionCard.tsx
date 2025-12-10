import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Folder, Lock, Globe } from "lucide-react";
import type { CollectionWithOwner } from "@/types/collection";

interface CollectionCardProps {
  collection: CollectionWithOwner;
  showOwner?: boolean;
}

export function CollectionCard({ collection, showOwner = true }: CollectionCardProps) {
  const ownerName = collection.owner?.display_name || "Anonymous";
  const ownerInitial = ownerName.charAt(0).toUpperCase();

  return (
    <Link to={`/collections/${collection.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg line-clamp-1">{collection.title}</h3>
            </div>
            {collection.is_public ? (
              <Globe className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {collection.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {collection.description}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <Badge variant="secondary">
              {collection.item_count || 0} items
            </Badge>
            
            {showOwner && collection.owner && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={collection.owner.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{ownerInitial}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">{ownerName}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
