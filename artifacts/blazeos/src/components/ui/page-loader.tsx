import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-sm bg-white/[0.06]",
        className
      )}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 h-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-2 w-16" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>
          <Skeleton className="flex-1 min-h-[200px] rounded-lg" />
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 flex flex-col gap-3">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04]">
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-2.5 w-14" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TradingSkeleton() {
  return (
    <div className="flex gap-4 p-6 h-full">
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-32 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <div className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] min-h-[300px]">
          <div className="p-4 flex flex-col gap-2 h-full">
            <div className="flex gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-14 rounded" />
              ))}
            </div>
            <Skeleton className="flex-1 rounded-lg" />
          </div>
        </div>
      </div>
      <div className="w-72 flex flex-col gap-4">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 flex flex-col gap-3">
          <Skeleton className="h-4 w-28" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          ))}
          <Skeleton className="h-9 w-full rounded-md mt-2" />
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 flex flex-col gap-3">
          <Skeleton className="h-4 w-20" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/[0.04]">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 h-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      <div className="flex gap-3">
        <Skeleton className="h-9 w-48 rounded-md" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-md" />
        ))}
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
        <div className="border-b border-white/[0.06] px-4 py-3 grid grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-full" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="border-b border-white/[0.04] px-4 py-3.5 grid grid-cols-6 gap-4"
          >
            {Array.from({ length: 6 }).map((_, j) => (
              <Skeleton key={j} className={cn("h-4", j === 0 ? "w-3/4" : "w-full")} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function GenericSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 h-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3 w-30" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 flex flex-col gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 flex flex-col gap-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="flex-1 min-h-[200px] rounded-lg" />
        </div>
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 flex flex-col gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-28" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const VARIANT_MAP = {
  dashboard: DashboardSkeleton,
  trading: TradingSkeleton,
  table: TableSkeleton,
  default: GenericSkeleton,
} as const;

export type PageLoaderVariant = keyof typeof VARIANT_MAP;

interface PageLoaderProps {
  variant?: PageLoaderVariant;
}

export function PageLoader({ variant = "default" }: PageLoaderProps) {
  const Skeleton = VARIANT_MAP[variant] ?? GenericSkeleton;
  return (
    <div className="w-full h-full min-h-[400px] flex flex-col overflow-hidden">
      <Skeleton />
    </div>
  );
}
