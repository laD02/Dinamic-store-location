
export interface StoreTime {
  [key: string]: string | undefined;
}

export interface OpenStatus {
  isOpen: boolean;
  message: string;
  color: string;
}

export function getOpenStatus(time: StoreTime | null | any): OpenStatus {
  if (!time) {
    return { isOpen: false, message: "Hours not set", color: "#6d7175" };
  }

  const now = new Date();
  const dayName = now.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
  
  const openTimeStr = time[`${dayName}Open`];
  const closeTimeStr = time[`${dayName}Close`];

  if (!openTimeStr || !closeTimeStr || openTimeStr === "close" || closeTimeStr === "close") {
    return { isOpen: false, message: "Closed", color: "#f44336" };
  }

  // Parse HH:mm
  const [openH, openM] = openTimeStr.split(':').map(Number);
  const [closeH, closeM] = closeTimeStr.split(':').map(Number);

  const currentH = now.getHours();
  const currentM = now.getMinutes();

  const openTotalMinutes = openH * 60 + openM;
  const closeTotalMinutes = closeH * 60 + closeM;
  const currentTotalMinutes = currentH * 60 + currentM;

  // Handle overnight hours (e.g., 22:00 to 02:00)
  if (closeTotalMinutes < openTotalMinutes) {
    if (currentTotalMinutes >= openTotalMinutes || currentTotalMinutes < closeTotalMinutes) {
      return { isOpen: true, message: "Open Now", color: "#4caf50" };
    }
  } else {
    if (currentTotalMinutes >= openTotalMinutes && currentTotalMinutes < closeTotalMinutes) {
      // Check if closing soon (within 30 mins)
      if (closeTotalMinutes - currentTotalMinutes <= 30) {
        return { isOpen: true, message: "Closing Soon", color: "#ff9800" };
      }
      return { isOpen: true, message: "Open Now", color: "#4caf50" };
    }
  }

  return { isOpen: false, message: "Closed", color: "#f44336" };
}
