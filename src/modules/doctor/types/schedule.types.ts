export type AvailabilityRule = {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
};

export type ScheduleException = {
  id: number;
  date: string;
  startTime: string | null;
  endTime: string | null;
  type: "UNAVAILABLE" | "EXTRA_AVAILABILITY";
  reason: string | null;
};

export type ApiResponse<T> = { success: boolean; message: string; data: T };

export type AvailabilityInput = Pick<AvailabilityRule, "dayOfWeek" | "startTime" | "endTime" | "slotDuration">;

export type ExceptionInput = {
  date: string;
  startTime?: string;
  endTime?: string;
  type: ScheduleException["type"];
  reason?: string;
};
