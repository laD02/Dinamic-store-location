import { daysList, hourOpen, hourClose } from "app/utils/hourOfOperating";

type HourSchedule = {
  day: string;
  openTime: string;
  closeTime: string;
};

interface HoursOfOperationSectionProps {
  hourSchedules: HourSchedule[];
  hourErrors: Record<number, string>;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof HourSchedule, value: string) => void;
  onClearError: (index: number) => void;
}

export default function HoursOfOperationSection({
  hourSchedules,
  hourErrors,
  onAdd,
  onRemove,
  onUpdate,
  onClearError,
}: HoursOfOperationSectionProps) {
  return (
    <s-section>
      <s-stack direction="inline" justifyContent="space-between" alignItems="center">
        <s-heading>Hours of Operation</s-heading>
        <s-button icon="plus-circle" onClick={onAdd}>Add Hours</s-button>
      </s-stack>
      <s-stack paddingBlockStart="small-200" gap="small-400">
        {hourSchedules.map((schedule, index) => (
          <s-stack key={index}>
            <s-stack
              direction="inline"
              justifyContent="space-between"
              alignItems="center"
              gap="small-200"
            >
              <div style={{ width: "29%" }}>
                <s-select
                  value={schedule.day}
                  onChange={(e: any) => {
                    onUpdate(index, 'day', e.target.value);
                    onClearError(index);
                  }}
                >
                  {daysList.map((item) => (
                    <s-option key={item} value={item}>{item}</s-option>
                  ))}
                </s-select>
              </div>
              <div style={{ width: "29%" }}>
                <s-select
                  value={schedule.openTime}
                  onChange={(e: any) => {
                    const newValue = e.target.value;
                    onUpdate(index, 'openTime', newValue);
                    const updatedSchedule = { ...schedule, openTime: newValue };
                    if (updatedSchedule.openTime && updatedSchedule.closeTime &&
                      updatedSchedule.openTime !== "close" && updatedSchedule.closeTime !== "close") {
                      if (updatedSchedule.openTime < updatedSchedule.closeTime) {
                        onClearError(index);
                      }
                    }
                  }}
                >
                  {hourOpen.map((item) => (
                    <s-option key={item} value={item}>{item}</s-option>
                  ))}
                </s-select>
              </div>
              <span>to</span>
              <div style={{ width: "29%" }}>
                <s-select
                  value={schedule.closeTime}
                  onChange={(e: any) => {
                    const newValue = e.target.value;
                    onUpdate(index, 'closeTime', newValue);
                    const updatedSchedule = { ...schedule, closeTime: newValue };
                    if (updatedSchedule.openTime && updatedSchedule.closeTime &&
                      updatedSchedule.openTime !== "close" && updatedSchedule.closeTime !== "close") {
                      if (updatedSchedule.openTime < updatedSchedule.closeTime) {
                        onClearError(index);
                      }
                    }
                  }}
                >
                  {hourClose.map((item) => (
                    <s-option key={item} value={item}>{item}</s-option>
                  ))}
                </s-select>
              </div>
              <div style={{ marginTop: 2 }}>
                <s-button icon="delete" onClick={() => onRemove(index)} />
              </div>
            </s-stack>
            <div>
              {hourErrors[index] && (
                <s-text tone="critical">{hourErrors[index]}</s-text>
              )}
            </div>
          </s-stack>
        ))}
      </s-stack>
    </s-section>
  );
}
