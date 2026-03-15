"use client";

import React from "react";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export function DateTimePicker({
  value,
  onChange,
  isDateOnly = false,
  className,
}: {
  value: string; // ISO string like 2026-03-15T04:14 or 2026-03-15
  onChange: (dateStr: string) => void;
  isDateOnly?: boolean;
  className?: string;
}) {
  // Parse incoming value
  let date: Date | undefined = undefined;
  if (value) {
     date = new Date(value);
     // Validate it's a real date
     if (isNaN(date.getTime())) date = undefined;
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      onChange("");
      return;
    }
    
    // Preserve existing time if we already have a date
    if (date && !isDateOnly) {
      selectedDate.setHours(date.getHours());
      selectedDate.setMinutes(date.getMinutes());
    } else if (!isDateOnly) {
      // Default to picking noon
      selectedDate.setHours(12);
      selectedDate.setMinutes(0);
    }

    if (isDateOnly) {
      onChange(format(selectedDate, "yyyy-MM-dd"));
    } else {
      onChange(format(selectedDate, "yyyy-MM-dd'T'HH:mm"));
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!date) return;
    const timeStr = e.target.value; // HH:mm
    if (!timeStr) return;
    
    const [hours, minutes] = timeStr.split(":").map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    
    onChange(format(newDate, "yyyy-MM-dd'T'HH:mm"));
  };

  const timeValue = date ? format(date, "HH:mm") : "";

  return (
    <Popover>
      <PopoverTrigger render={
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal bg-white",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {date ? (
            isDateOnly ? (
              format(date, "dd/MM/yyyy")
            ) : (
              format(date, "dd/MM/yyyy hh:mm a")
            )
          ) : (
            <span>Pick a date</span>
          )}
        </Button>
      }/>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
        />
        {!isDateOnly && (
          <div className="p-3 border-t flex items-center gap-2 bg-gray-50/50">
            <span className="text-xs font-bold uppercase text-gray-500">Time</span>
            <Input
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              className="flex-1 bg-white"
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
