export const pickFirst = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");

export const parseDateTime = (value) => {
  if (!value) return new Date();
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

export const toMysqlDateTime = (date) => {
  const pad = (num) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const getPeriodFromDate = (date) => ({
  period_year: date.getFullYear(),
  period_month: date.getMonth() + 1,
});

export const buildChargeStatus = (chargeAmount, paidAmount, dueDate) => {
  const now = new Date();
  const due = dueDate ? new Date(dueDate) : null;
  const overdue = due && !Number.isNaN(due.getTime()) && due < now;

  if (paidAmount >= chargeAmount) return "paid";
  if (paidAmount > 0) return overdue ? "overdue" : "partial";
  return overdue ? "overdue" : "pending";
};

export const getCurrentOrganizationId = (session) => {
  const organizationId = session?.user?.organization_id;
  return organizationId ? Number(organizationId) : null;
};
