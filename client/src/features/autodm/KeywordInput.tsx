import { Info, Plus, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function KeywordInput({
  keywords,
  onChange,
  caseSensitive,
  onCaseSensitiveChange,
}) {
  const [inputValue, setInputValue] = useState("");

  const addKeyword = () => {
    const trimmed = inputValue.trim().split(' ')[0];
    if (trimmed) {
      onChange([trimmed]);
      setInputValue("");
    }
  };

  const suggestedKeywords = ["link", "info", "price", "send", "yes", "interested", "pdf", "free"];

  return (
    <div className="space-y-4">
      {keywords.length === 0 && (
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value.replace(/\s/g, ''))} // prevent spaces
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addKeyword();
              }
            }}
            placeholder="Enter a single keyword..."
            className="flex-1"
          />
          <Button type="button" onClick={addKeyword} disabled={!inputValue.trim()}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
      )}

      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <Badge key={keyword} variant="secondary" className="flex items-center gap-1 pl-3 pr-1 py-1 text-sm">
              {keyword}
              <button onClick={() => onChange(keywords.filter((item) => item !== keyword))} className="rounded-full p-0.5 hover:bg-gray-300">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div>
        <p className="mb-2 text-sm text-[var(--slate)]">Suggested keywords:</p>
        <div className="flex flex-wrap gap-2">
          {suggestedKeywords
            .filter((keyword) => !keywords.includes(keyword))
            .slice(0, 5)
            .map((keyword) => (
              <button
                key={keyword}
                type="button"
                onClick={() => onChange([keyword])}
                className="rounded-full border border-dashed border-black/15 bg-white px-3 py-1 text-sm transition-colors hover:border-[var(--arc)] hover:text-[var(--arc)]"
              >
                + {keyword}
              </button>
            ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-[14px] bg-black/[0.035] p-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="case-sensitive" className="text-sm font-normal">
            Case sensitive matching
          </Label>
          <div className="group relative">
            <Info className="h-4 w-4 cursor-help text-[var(--slate)]" />
            <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
              When off, "LINK" and "link" are treated the same
            </div>
          </div>
        </div>
        <Switch id="case-sensitive" checked={caseSensitive} onCheckedChange={onCaseSensitiveChange} />
      </div>
    </div>
  );
}
