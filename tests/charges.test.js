import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import {
  pickFirst,
  parseDateTime,
  toMysqlDateTime,
  getPeriodFromDate,
  buildChargeStatus,
  getCurrentOrganizationId,
} from "@/utils/charges";

describe("pickFirst", () => {
  it("devuelve el primer valor no vacio", () => {
    expect(pickFirst(undefined, null, "", "hola", "mundo")).toBe("hola");
  });

  it("devuelve undefined si todos son vacios", () => {
    expect(pickFirst(undefined, null, "")).toBeUndefined();
  });

  it("funciona con numeros", () => {
    expect(pickFirst(undefined, null, 0, 42)).toBe(0);
  });
});

describe("parseDateTime", () => {
  it("parsea formato YYYY-MM-DD", () => {
    const d = parseDateTime("2026-06-15");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5); // 0-indexed
    expect(d.getDate()).toBe(15);
    expect(d.getHours()).toBe(12);
  });

  it("devuelve nueva fecha si el value es null", () => {
    const d = parseDateTime(null);
    expect(d instanceof Date).toBe(true);
    expect(isNaN(d.getTime())).toBe(false);
  });

  it("devuelve nueva fecha si el value es undefined", () => {
    const d = parseDateTime(undefined);
    expect(d instanceof Date).toBe(true);
  });

  it("parsea ISO string", () => {
    const d = parseDateTime("2026-06-15T10:00:00.000Z");
    expect(d.getFullYear()).toBe(2026);
  });
});

describe("toMysqlDateTime", () => {
  it("formatea fecha a MySQL datetime", () => {
    const d = new Date(2026, 5, 15, 10, 30, 45);
    expect(toMysqlDateTime(d)).toBe("2026-06-15 10:30:45");
  });

  it("formatea con padding de 2 digitos", () => {
    const d = new Date(2026, 0, 5, 8, 5, 3);
    expect(toMysqlDateTime(d)).toMatch(/^2026-01-05 08:05:0[3-9]$/);
  });
});

describe("getPeriodFromDate", () => {
  it("extrae year y month de una fecha", () => {
    const d = new Date(2026, 5, 15);
    expect(getPeriodFromDate(d)).toEqual({ period_year: 2026, period_month: 6 });
  });

  it("enero devuelve month 1", () => {
    const d = new Date(2026, 0, 1);
    expect(getPeriodFromDate(d).period_month).toBe(1);
  });

  it("diciembre devuelve month 12", () => {
    const d = new Date(2026, 11, 1);
    expect(getPeriodFromDate(d).period_month).toBe(12);
  });
});

describe("buildChargeStatus", () => {
  const futuro = new Date(Date.now() + 86400000 * 30).toISOString();
  const pasado = new Date(Date.now() - 86400000 * 30).toISOString();

  it("paid cuando paidAmount >= chargeAmount", () => {
    expect(buildChargeStatus(100, 100, futuro)).toBe("paid");
    expect(buildChargeStatus(100, 150, futuro)).toBe("paid");
  });

  it("pending cuando paidAmount es 0 y no esta vencido", () => {
    expect(buildChargeStatus(100, 0, futuro)).toBe("pending");
  });

  it("overdue cuando paidAmount es 0 y esta vencido", () => {
    expect(buildChargeStatus(100, 0, pasado)).toBe("overdue");
  });

  it("partial cuando paidAmount > 0 y no esta vencido", () => {
    expect(buildChargeStatus(100, 50, futuro)).toBe("partial");
  });

  it("overdue cuando paidAmount > 0 y esta vencido", () => {
    expect(buildChargeStatus(100, 50, pasado)).toBe("overdue");
  });

  it("pending cuando no hay dueDate", () => {
    expect(buildChargeStatus(100, 0, null)).toBe("pending");
    expect(buildChargeStatus(100, 0, undefined)).toBe("pending");
  });

  it("paid con monto 0 si no hay deuda", () => {
    expect(buildChargeStatus(0, 0, futuro)).toBe("paid");
  });
});

describe("getCurrentOrganizationId", () => {
  it("devuelve el organization_id como numero", () => {
    const session = { user: { organization_id: "5" } };
    expect(getCurrentOrganizationId(session)).toBe(5);
  });

  it("devuelve null si no hay session", () => {
    expect(getCurrentOrganizationId(null)).toBeNull();
  });

  it("devuelve null si no hay user", () => {
    expect(getCurrentOrganizationId({})).toBeNull();
  });

  it("devuelve null si no hay organization_id", () => {
    expect(getCurrentOrganizationId({ user: { role: "admin" } })).toBeNull();
  });
});
