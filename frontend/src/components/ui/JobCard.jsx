import { useRef, useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { Card, CardHeader, CardFooter } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";

function HoverScrollingText({ text, className, as: Component = "div" }) {
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);

  useEffect(() => {
    if (isHovered && containerRef.current) {
      const el = containerRef.current;
      const overflow = el.scrollWidth - el.clientWidth;
      if (overflow > 0) {
        setScrollDistance(overflow);
      } else {
        setScrollDistance(0);
      }
    } else {
      setScrollDistance(0);
    }
  }, [isHovered, text]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="overflow-hidden w-full relative"
    >
      <Component
        ref={containerRef}
        className={className}
        style={{
          whiteSpace: "nowrap",
          textOverflow: isHovered && scrollDistance > 0 ? "clip" : "ellipsis",
          overflow: isHovered && scrollDistance > 0 ? "visible" : "hidden",
          display: "block",
          transform: `translateX(-${scrollDistance}px)`,
          transition:
            isHovered && scrollDistance > 0
              ? `transform ${scrollDistance * 0.015}s linear`
              : "transform 0.3s ease-out",
        }}
      >
        {text}
      </Component>
    </div>
  );
}

function formatTitle(title) {
  if (!title) return "";
  const t = String(title).trim();
  if (t.length === 0) return "";
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

function formatCompany(company) {
  if (!company) return "";
  return String(company).trim().toUpperCase();
}

export function JobCard({ job, onApply }) {
  return (
    <Card
      className="relative flex flex-col justify-between overflow-hidden hover:border-text/30 hover:shadow-sm"
      style={{ maxWidth: "280px", width: "100%" }}
    >
      <CardHeader className="p-4 pb-3 flex flex-col space-y-3">
        <div className="flex items-start justify-between gap-2 w-full">
          <div className="flex gap-3 items-center min-w-0 flex-1">
            <div
              className={`h-10 w-10 rounded-xl bg-gradient-to-br ${job.logoBg} flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0`}
              aria-hidden="true"
            >
              {job.company.split(" ")[0].substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <HoverScrollingText
                as="h3"
                text={formatTitle(job.title)}
                className="text-xs font-bold text-text-h m-0 text-left leading-snug"
              />
              <HoverScrollingText
                text={formatCompany(job.company)}
                className="text-[11px] font-semibold text-text text-left mt-0.5"
              />
            </div>
          </div>
        </div>

        {/* Location and Tags */}
        <div className="flex items-center justify-between gap-3 text-[11px] font-medium text-text w-full overflow-hidden">
          {job.location && (
            <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
              <MapPin className="w-3 h-3 text-text/70 shrink-0" />
              <HoverScrollingText
                text={job.location}
                className="text-[11px] font-medium text-text text-left"
              />
            </div>
          )}
          <div
            className="flex items-center gap-1 shrink-0 ml-auto"
            aria-label="Tehnologii și competențe"
          >
            {((job.f_tag || []).length > 2
              ? [...(job.f_tag || []).slice(0, 2), "..."]
              : job.f_tag || []
            ).map((tag, idx) => (
              <Badge
                key={`${tag}-${idx}`}
                variant="secondary"
                className="text-[10px] px-1.5 py-0.5 whitespace-nowrap"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardFooter className="pb-0 px-0 pt-0 flex items-center">
        <Button
          onClick={() => onApply(job)}
          className="w-full text-xs rounded-none py-0 h-8"
          aria-label={`Aplică la jobul ${job.title} de la ${job.company}`}
        >
          Aplică
        </Button>
      </CardFooter>
    </Card>
  );
}
