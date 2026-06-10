import { db } from "@/utils/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const getCurrentOrganizationId = (session) => {
  const organizationId = session?.user?.organization_id;
  return organizationId ? Number(organizationId) : null;
};

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("No autorizado", { status: 401 });
  }

  const organizationId = getCurrentOrganizationId(session);
  if (!organizationId) {
    return new Response("La sesion no tiene organization_id", { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const query = (searchParams.get("query") || "").trim();
  const familyId = searchParams.get("family_id");
  const limit = Number.parseInt(searchParams.get("limit"), 10) || 20;

  try {
    if (type === "families") {
      const params = [organizationId];
      let where = "WHERE organization_id = ?";

      if (query) {
        where += " AND (guardian_name LIKE ? OR dni LIKE ? OR email LIKE ?)";
        const like = `%${query}%`;
        params.push(like, like, like);
      }

      const [rows] = await db.query(
        `
          SELECT
            id,
            guardian_name,
            dni,
            email,
            phone,
            locality
          FROM families
          ${where}
          ORDER BY guardian_name ASC
          LIMIT ?
        `,
        [...params, limit]
      );

      return new Response(JSON.stringify(rows), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (type === "students") {
      const params = [organizationId];
      let where = "WHERE s.organization_id = ?";

      if (familyId) {
        where += " AND s.family_id = ?";
        params.push(Number(familyId));
      }

      if (query) {
        where += " AND s.full_name LIKE ?";
        params.push(`%${query}%`);
      }

      const [rows] = await db.query(
        `
          SELECT
            s.id,
            s.family_id,
            s.full_name,
            s.active,
            f.guardian_name,
            f.dni
          FROM students s
          INNER JOIN families f ON f.id = s.family_id
          ${where}
          ORDER BY s.full_name ASC
          LIMIT ?
        `,
        [...params, limit]
      );

      return new Response(JSON.stringify(rows), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (type === "courses") {
      const params = [organizationId];
      let where = "WHERE organization_id = ?";

      if (query) {
        where += " AND (name LIKE ? OR level LIKE ?)";
        const like = `%${query}%`;
        params.push(like, like);
      }

      const [rows] = await db.query(
        `
          SELECT
            id,
            name,
            level,
            monthly_fee,
            billing_day,
            active
          FROM courses
          ${where}
          ORDER BY name ASC
          LIMIT ?
        `,
        [...params, limit]
      );

      return new Response(JSON.stringify(rows), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Tipo de catalogo invalido", { status: 400 });
  } catch (error) {
    console.error("Error al obtener catalogos:", error);
    return new Response("Error al obtener catalogos", { status: 500 });
  }
}
