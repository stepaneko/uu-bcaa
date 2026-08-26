const crypto = require("crypto");
const db = require("./db");

// Transformation attribute names from DB notation to JS
function mapToCamelCase(row) {
  if (!row) return null;
  return {
    id: row.id,
    taxPayerId: row.tax_payer_id,
    type: row.type,
    invoiceNumber: row.invoice_number,
    taxableDate: row.taxable_date,
    vatId: row.vat_id,
    name: row.name,
    description: row.description,
    price: row.price ? parseFloat(row.price) : 0, // NUMERIC z PG přijde jako string, parsujeme
    vatValue: row.vat_value ? parseFloat(row.vat_value) : 0,
    createdAt: row.created_at,
    lastModifiedAt: row.last_modified_at,
  };
}

// Duplicity check
async function isDuplicate(invoiceToCheck, ignoreId = null) {
  let query = "";
  const values = [invoiceToCheck.taxPayerId, invoiceToCheck.invoiceNumber];

  if (invoiceToCheck.type === "issued") {
    query = `SELECT id FROM app_data.invoice WHERE type = 'issued' AND tax_payer_id = $1 AND invoice_number = $2`;
  } else {
    query = `SELECT id FROM app_data.invoice WHERE type = 'received' AND tax_payer_id = $1 AND invoice_number = $2 AND vat_id = $3`;
    values.push(invoiceToCheck.vatId);
  }

  if (ignoreId) {
    values.push(ignoreId);
    query += ` AND id != $${values.length}`;
  }

  const result = await db.query(query, values);
  return result.rowCount > 0;
}

// Read an invoice from database
async function get(invoiceId) {
  try {
    const result = await db.query(
      "SELECT id, tax_payer_id, type, invoice_number, taxable_date, vat_id, name, description, price, vat_value FROM app_data.invoice WHERE id = $1",
      [invoiceId],
    );
    return mapToCamelCase(result.rows[0]);
  } catch (error) {
    throw { code: "failedToReadInvoice", message: error.message };
  }
}

// Write an invoice to database
async function create(invoice) {
  try {
    const isDup = await isDuplicate(invoice);
    if (isDup)
      throw {
        code: "duplicateInvoice",
        message: "Invoice with the given parameters already exists.",
        knownError: true,
      };

    invoice.id = crypto.randomBytes(16).toString("hex");

    const query = `
      INSERT INTO app_data.invoice 
      (id, tax_payer_id, type, invoice_number, taxable_date, vat_id, name, description, price, vat_value)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const values = [
      invoice.id,
      invoice.taxPayerId,
      invoice.type,
      invoice.invoiceNumber,
      invoice.taxableDate,
      invoice.vatId,
      invoice.name,
      invoice.description,
      invoice.price,
      invoice.vatValue,
    ];

    const result = await db.query(query, values);
    return mapToCamelCase(result.rows[0]);
  } catch (error) {
    if (error.knownError) throw error;
    throw { code: "failedToCreateInvoice", message: error.message };
  }
}

// Update invoice in database
async function update(invoice) {
  try {
    const isDup = await isDuplicate(invoice, invoice.id);
    if (isDup)
      throw {
        code: "duplicateInvoice",
        message: "Invoice update would result in a duplicate.",
        knownError: true,
      };

    const query = `
      UPDATE app_data.invoice 
      SET tax_payer_id = $2, type = $3, invoice_number = $4, taxable_date = $5, vat_id = $6, name = $7, description = $8, price = $9, vat_value = $10, last_modified_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const values = [
      invoice.id,
      invoice.taxPayerId,
      invoice.type,
      invoice.invoiceNumber,
      invoice.taxableDate,
      invoice.vatId,
      invoice.name,
      invoice.description,
      invoice.price,
      invoice.vatValue,
    ];

    const result = await db.query(query, values);
    if (result.rowCount === 0) return null;
    return mapToCamelCase(result.rows[0]);
  } catch (error) {
    if (error.knownError) throw error;
    throw { code: "failedToUpdateInvoice", message: error.message };
  }
}

// Remove an invoice from database
async function remove(invoiceId) {
  try {
    await db.query("DELETE FROM app_data.invoice WHERE id = $1", [invoiceId]);
    return {};
  } catch (error) {
    throw { code: "failedToRemoveInvoice", message: error.message };
  }
}

async function list(options = {}) {
  try {
    const { limit, offset = 0, search, taxPayerId, month, year } = options;
    let query =
      "SELECT COUNT(*) OVER() as total_count, id, tax_payer_id, type, invoice_number, taxable_date, vat_id, name, description, price, vat_value FROM app_data.invoice WHERE 1=1";
    const values = [];

    if (taxPayerId) {
      values.push(taxPayerId);
      query += ` AND tax_payer_id = $${values.length}`;
    }

    if (month && year) {
      values.push(parseInt(month, 10), parseInt(year, 10));
      query += ` AND EXTRACT(MONTH FROM taxable_date) = $${values.length - 1} AND EXTRACT(YEAR FROM taxable_date) = $${values.length}`;
    }

    if (search) {
      values.push(`%${search}%`);
      const searchParam = `$${values.length}`;
      query += ` AND (invoice_number ILIKE ${searchParam} OR name ILIKE ${searchParam} OR vat_id ILIKE ${searchParam} OR description ILIKE ${searchParam})`;
    }

    query += " ORDER BY taxable_date DESC";

    if (limit) {
      values.push(limit);
      query += ` LIMIT $${values.length}`;
    }

    values.push(offset);
    query += ` OFFSET $${values.length}`;

    const result = await db.query(query, values);
    const invoiceList = result.rows.map(mapToCamelCase);

    const totalItems =
      result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;
    const take = limit ? parseInt(limit, 10) : totalItems;
    const totalPages = take > 0 ? Math.ceil(totalItems / take) : 1;
    const currentPage = take > 0 ? Math.floor(offset / take) + 1 : 1;

    return {
      itemList: invoiceList,
      pageInfo: { totalItems, pageSize: take, totalPages, currentPage },
    };
  } catch (error) {
    throw { code: "failedToReadInvoices", message: error.message };
  }
}

module.exports = {
  get,
  create,
  update,
  remove,
  list,
};
