"use client";

import { useState, useEffect } from "react";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableTaskItem } from "./sortable-task-item";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function SortableTaskList({ title, initialTasks, onRefresh, autoOpenTaskId }: { title: string, initialTasks: any[], onRefresh?: () => void, autoOpenTaskId?: string | null }) {
  const [tasks, setTasks] = useState(initialTasks);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex(i => i.id === active.id);
      const newIndex = tasks.findIndex(i => i.id === over.id);
      
      const newItems = arrayMove(tasks, oldIndex, newIndex);
      setTasks(newItems);

      // Save the new order to the database
      try {
        const updates = newItems.map((task, index) => ({
          id: task.id,
          position: index
        }));

        // Run updates in parallel for better performance
        await Promise.all(updates.map(update => 
          supabase
            .from('tasks')
            .update({ position: update.position })
            .eq('id', update.id)
        ));
        
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error("Failed to save task order:", error);
        toast.error("Failed to save new order");
      }
    }
  }

  if (tasks.length === 0) return null;

  return (
    <Card className="overflow-hidden shadow-sm border-gray-200">
      <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-900">
        {title} ({tasks.length})
      </div>
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col bg-white">
          <SortableContext 
            items={tasks.map(t => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map(task => (
              <SortableTaskItem 
                key={task.id} 
                task={task} 
                onDelete={() => setTasks(t => t.filter(x => x.id !== task.id))}
                onUpdate={onRefresh}
                autoOpenTaskId={autoOpenTaskId}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>
    </Card>
  );
}
