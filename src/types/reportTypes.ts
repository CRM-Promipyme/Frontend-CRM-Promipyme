export interface ReportRow {
    user_id: number;
    username: string;
    full_name: string;
    total_tasks_assigned: number;
    total_tasks_completed: number;
    avg_task_completion_time: string | null;
    total_cases_created: number;
    total_cases_completed: number;
}

