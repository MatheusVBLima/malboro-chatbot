import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

interface ImageSkeletonProps {
  className?: string;
}

export function ImageSkeleton({ className }: ImageSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Texto de loading */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Skeleton da imagem */}
      <div className="relative max-w-full h-80 rounded-lg border overflow-hidden">
        <Skeleton className="absolute inset-0" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            {/* Ícone de imagem */}
            <div className="w-16 h-16 rounded-lg flex items-center justify-center">
              <Skeleton className="w-8 h-8 rounded" />
            </div>
            <div className="space-y-2 text-center">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24 mx-auto" />
            </div>
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
        <div
          className="w-2 h-2 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: "0.1s" }}
        />
        <div
          className="w-2 h-2 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        />
        <span className="text-sm text-muted-foreground ml-2">
          Gerando imagem...
        </span>
      </div>
    </div>
  );
}
