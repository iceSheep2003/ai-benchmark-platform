import { create } from 'zustand';
import type { BenchmarkTask } from '../types';

interface TaskListState {
  tasks: BenchmarkTask[];
  selectedTask: BenchmarkTask | null;
  setSelectedTask: (task: BenchmarkTask | null) => void;
  updateTaskStatus: (taskId: string, status: BenchmarkTask['status']) => void;
  addTask: (task: BenchmarkTask) => void;
}

export const useTaskListStore = create<TaskListState>((set) => ({
  tasks: [],
  selectedTask: null,
  setSelectedTask: (task) => set({ selectedTask: task }),
  updateTaskStatus: (taskId, status) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, status } : task
      ),
      selectedTask:
        state.selectedTask?.id === taskId
          ? { ...state.selectedTask, status }
          : state.selectedTask,
    })),
  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, task],
    })),
}));
