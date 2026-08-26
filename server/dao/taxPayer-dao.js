const crypto = require("crypto");
const db = require("./db");

// Transformation attribute names from DB notation to JS
function mapToCamelCase(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    firstName: row.first_name,
    lastName: row.last_name,
    companyName: row.company_name,
    vatId: row.vat_id,
    street: row.street,
    descriptiveNumber: row.descriptive_number,
    referenceNumber: row.reference_number,
    city: row.city,
    postalCode: row.postal_code,
    email: row.email,
    phoneNumber: row.phone_number,
    createdAt: row.created_at,
    lastModifiedAt: row.last_modified_at,
  };
}

// Validations based on type
function validateTaxPayer(taxPayer) {
  if (taxPayer.type === "individual" && !taxPayer.firstName) {
    return {
      code: "individualFirstNameMissing",
      message: "First name is missing for individual tax payer",
      knownError: true,
    };
  }
  if (taxPayer.type === "individual" && !taxPayer.lastName) {
    return {
      code: "individualLastNameMissing",
      message: "Last name is missing for individual tax payer",
      knownError: true,
    };
  }
  if (taxPayer.type === "individual" && taxPayer.companyName) {
    return {
      code: "individualCompanyNameNotAllowed",
      message: "Company name is not allowed for individual tax payer",
      knownError: true,
    };
  }
  if (taxPayer.type === "company" && !taxPayer.companyName) {
    return {
      code: "companyNameMissing",
      message: "Company name is missing for company tax payer",
      knownError: true,
    };
  }
  if (taxPayer.type === "company" && taxPayer.firstName) {
    return {
      code: "companyFirstNameNotAllowed",
      message: "First name is not allowed for company tax payer",
      knownError: true,
    };
  }
  if (taxPayer.type === "company" && taxPayer.lastName) {
    return {
      code: "companyLastNameNotAllowed",
      message: "Last name is not allowed for company tax payer",
      knownError: true,
    };
  }

  // No error, null is returned
  return null;
}

// Read a tax payer from database
async function get(taxPayerId) {
  try {
    const result = await db.query(
      "SELECT * FROM app_data.tax_payer WHERE id = $1",
      [taxPayerId],
    );
    return mapToCamelCase(result.rows[0]);
  } catch (error) {
    throw { code: "failedToReadTaxPayer", message: error.message };
  }
}

// Write a tax payer to database
async function create(taxPayer) {
  try {
    const validationError = validateTaxPayer(taxPayer);
    if (validationError)
      throw { code: validationError.code, message: validationError.message };

    taxPayer.id = crypto.randomBytes(16).toString("hex");

    const query = `
      INSERT INTO app_data.tax_payer 
      (id, type, title, first_name, last_name, company_name, vat_id, street, descriptive_number, reference_number, city, postal_code, email, phone_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    const values = [
      taxPayer.id,
      taxPayer.type,
      taxPayer.title,
      taxPayer.firstName,
      taxPayer.lastName,
      taxPayer.companyName,
      taxPayer.vatId,
      taxPayer.street,
      taxPayer.descriptiveNumber,
      taxPayer.referenceNumber,
      taxPayer.city,
      taxPayer.postalCode,
      taxPayer.email,
      taxPayer.phoneNumber,
    ];

    const result = await db.query(query, values);
    return mapToCamelCase(result.rows[0]);
  } catch (error) {
    if (error.code === "23505")
      throw {
        code: "duplicateVatId",
        message: "Tax payer with the given vatId already exists",
        knownError: true,
      }; // 23505 je Postgres unique_violation
    if (error.knownError) throw error;
    throw { code: "failedToCreateTaxPayer", message: error.message };
  }
}

// Update a tax payer in database
async function update(taxPayer) {
  try {
    const validationError = validateTaxPayer(taxPayer);
    if (validationError)
      throw { code: validationError.code, message: validationError.message };

    const query = `
      UPDATE app_data.tax_payer 
      SET type = $2, title = $3, first_name = $4, last_name = $5, company_name = $6, vat_id = $7, street = $8, descriptive_number = $9, reference_number = $10, city = $11, postal_code = $12, email = $13, phone_number = $14, last_modified_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const values = [
      taxPayer.id,
      taxPayer.type,
      taxPayer.title,
      taxPayer.firstName,
      taxPayer.lastName,
      taxPayer.companyName,
      taxPayer.vatId,
      taxPayer.street,
      taxPayer.descriptiveNumber,
      taxPayer.referenceNumber,
      taxPayer.city,
      taxPayer.postalCode,
      taxPayer.email,
      taxPayer.phoneNumber,
    ];

    const result = await db.query(query, values);
    if (result.rowCount === 0) return null;
    return mapToCamelCase(result.rows[0]);
  } catch (error) {
    if (error.code === "23505")
      throw {
        code: "duplicateVatId",
        message: "TaxPayer with the given vatId already exists",
        knownError: true,
      };
    if (error.knownError) throw error;
    throw { code: "failedToUpdateTaxPayer", message: error.message };
  }
}

// Remove a tax payer from database
async function remove(taxPayerId) {
  try {
    await db.query("DELETE FROM app_data.tax_payer WHERE id = $1", [
      taxPayerId,
    ]);
    return {};
  } catch (error) {
    throw { code: "failedToRemoveTaxPayer", message: error.message };
  }
}

// List tax payers from database
async function list(options = {}) {
  try {
    const { limit, offset = 0, search } = options;
    let query =
      "SELECT COUNT(*) OVER() as total_count, * FROM app_data.tax_payer";
    const values = [];

    if (search) {
      query += ` WHERE (first_name ILIKE $1 OR last_name ILIKE $1 OR company_name ILIKE $1 OR vat_id ILIKE $1)`;
      values.push(`%${search}%`);
    }

    // Stránkování - pokud je zadaný limit, aplikujeme jej
    if (limit) {
      values.push(limit);
      query += ` LIMIT $${values.length}`;
    }
    values.push(offset);
    query += ` OFFSET $${values.length}`;

    const result = await db.query(query, values);

    const taxPayerList = result.rows.map(mapToCamelCase);
    const totalItems =
      result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;

    const take = limit ? parseInt(limit, 10) : totalItems;
    const totalPages = take > 0 ? Math.ceil(totalItems / take) : 1;
    const currentPage = take > 0 ? Math.floor(offset / take) + 1 : 1;

    return {
      itemList: taxPayerList,
      pageInfo: { totalItems, pageSize: take, totalPages, currentPage },
    };
  } catch (error) {
    throw { code: "failedToListTaxPayers", message: error.message };
  }
}

// Get tax payer map
async function getTaxPayerMap() {
  const result = await db.query("SELECT * FROM app_data.tax_payer");
  const taxPayerMap = {};
  result.rows.forEach((row) => {
    taxPayerMap[row.id] = mapToCamelCase(row);
  });
  return taxPayerMap;
}

module.exports = {
  get,
  create,
  update,
  remove,
  list,
  getTaxPayerMap,
};
