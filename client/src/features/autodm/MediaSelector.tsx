import { Film, Image as ImageIcon, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import apiClient from "@/utils/apiClient";
import { useAutoDM } from "./AutoDMContext";

export function MediaSelector({ open, onOpenChange, onSelect }) {
  const { activeAccount } = useAutoDM();
  const [media, setMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadMedia = async () => {
    if (!activeAccount?.id) return;
    setIsLoading(true);
    try {
      const response = await apiClient.get("/api/autodm/instagram-media", {
        params: { limit: 30 },
      });
      if (!response.data?.success) throw new Error(response.data?.error || "Failed to load media");
      setMedia(response.data.media || []);
    } catch (error) {
      console.error("[AutoDM] Failed to load media:", error);
      toast.error(error.response?.data?.error || error.message || "Failed to load Instagram media");
      setMedia([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && activeAccount?.id) {
      loadMedia();
    }
  }, [open, activeAccount?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] max-w-3xl flex-col overflow-hidden bg-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Select Post or Reel</DialogTitle>
            <DialogDescription className="sr-only">Choose a post or reel from Instagram.</DialogDescription>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setIsRefreshing(true);
                await loadMedia();
                setIsRefreshing(false);
              }}
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : media.length === 0 ? (
            <div className="py-12 text-center">
              <ImageIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No media found yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {media.map((item) => (
                <button key={item.id} className="group relative aspect-square overflow-hidden rounded-lg hover:ring-2 hover:ring-primary" onClick={() => onSelect(item)}>
                  <img src={item.thumbnail_url || item.media_url} alt={item.caption || "Instagram media"} className="h-full w-full object-cover" />
                  <div className="absolute top-2 right-2">
                    {item.media_type === "VIDEO" || item.media_type === "REELS" ? (
                      <div className="rounded bg-black/70 p-1">
                        <Film className="h-4 w-4 text-white" />
                      </div>
                    ) : null}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="font-medium text-white">Select</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
