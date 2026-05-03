import { supabase } from "@/lib/supabase";

export type ActionType = 'task_created' | 'task_status_changed' | 'seo_update_sent' | 'other';

interface LogActivityParams {
  userName: string;
  clientId?: string;
  actionType: ActionType;
  content: string;
}

export async function logActivity({ userName, clientId, actionType, content }: LogActivityParams) {
  try {
    const payload: any = {
      user_name: userName || 'Unknown User',
      action_type: actionType,
      content,
    };

    if (clientId) {
      payload.client_id = clientId;
    }

    const { error } = await supabase.from('activity_logs').insert([payload]);

    if (error) {
      console.error("Failed to log activity:", error);
    }
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
